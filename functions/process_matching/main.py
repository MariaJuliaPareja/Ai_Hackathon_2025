
import os
import json
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

import functions_framework
from google.cloud import firestore
from google.cloud import tasks_v2
from google.cloud.firestore_v1 import DocumentSnapshot
import psycopg2
from psycopg2.extras import RealDictCursor
import googlemaps
import lightgbm as lgb
from google.cloud import storage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize clients
db = firestore.Client()
tasks_client = tasks_v2.CloudTasksClient()
storage_client = storage.Client()

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT")
LOCATION = os.environ.get("FUNCTION_REGION", "us-central1")
CLOUD_SQL_CONNECTION_NAME = os.environ.get("CLOUD_SQL_CONNECTION_NAME")
DB_NAME = os.environ.get("DB_NAME", "caregiving_db")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
ML_MODEL_BUCKET = os.environ.get("ML_MODEL_BUCKET", "caregiving-ml")
ML_MODEL_PATH = os.environ.get("ML_MODEL_PATH", "models/matching-model-v1.txt")
SIMILARITY_THRESHOLD = float(os.environ.get("SIMILARITY_THRESHOLD", "0.6"))
MAX_MATCHES = 10
PROCESSING_TIMEOUT = 30  # seconds

# Global model cache
ml_model: Optional[lgb.Booster] = None


def load_ml_model() -> Optional[lgb.Booster]:
    """Load LightGBM model from Cloud Storage."""
    global ml_model
    if ml_model is None:
        try:
            bucket = storage_client.bucket(ML_MODEL_BUCKET)
            blob = bucket.blob(ML_MODEL_PATH)
            
            if blob.exists():
                model_content = blob.download_as_text()
                ml_model = lgb.Booster(model_str=model_content)
                logger.info("ML model loaded successfully")
            else:
                logger.warning(f"ML model not found at {ML_MODEL_BUCKET}/{ML_MODEL_PATH}, using heuristic")
        except Exception as e:
            logger.error(f"Error loading ML model: {e}")
            ml_model = None
    return ml_model


def get_db_connection():
    """Create connection to Cloud SQL PostgreSQL."""
    try:
        conn = psycopg2.connect(
            host=f"/cloudsql/{CLOUD_SQL_CONNECTION_NAME}",
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
        )
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        raise


def query_similar_caregivers(senior_embedding: List[float], threshold: float = 0.6) -> List[Dict]:
    """Query Cloud SQL for similar caregivers using pgvector."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Convert embedding to PostgreSQL array format
        embedding_str = "[" + ",".join(map(str, senior_embedding)) + "]"
        
        query = """
            SELECT 
                id,
                metadata,
                1 - (embedding <=> %s::vector) as similarity
            FROM caregiver_embeddings
            WHERE 1 - (embedding <=> %s::vector) > %s
            ORDER BY similarity DESC
            LIMIT 50;
        """
        
        cursor.execute(query, (embedding_str, embedding_str, threshold))
        results = cursor.fetchall()
        
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"Error querying similar caregivers: {e}")
        raise
    finally:
        if conn:
            conn.close()


def calculate_location_distance(
    senior_location: Dict[str, float],
    caregiver_location: Dict[str, float],
    gmaps_client: googlemaps.Client
) -> float:
    """Calculate distance between senior and caregiver using Google Maps Distance Matrix API."""
    try:
        origin = f"{senior_location['lat']},{senior_location['lng']}"
        destination = f"{caregiver_location['lat']},{caregiver_location['lng']}"
        
        result = gmaps_client.distance_matrix(
            origins=[origin],
            destinations=[destination],
            mode="driving",
            units="metric"
        )
        
        if result['status'] == 'OK' and result['rows'][0]['elements'][0]['status'] == 'OK':
            distance_km = result['rows'][0]['elements'][0]['distance']['value'] / 1000
            # Normalize to 0-1 score (0km = 1.0, 50km+ = 0.0)
            location_score = max(0, 1 - (distance_km / 50))
            return location_score
        else:
            logger.warning("Distance Matrix API returned error, using default score")
            return 0.5
    except Exception as e:
        logger.error(f"Error calculating location distance: {e}")
        return 0.5


def calculate_availability_overlap(
    senior_availability: Dict,
    caregiver_availability: Dict
) -> float:
    """Calculate availability overlap score between senior and caregiver schedules."""
    try:
        total_slots = 0
        matching_slots = 0
        
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        time_slots = ['morning', 'afternoon', 'evening']
        
        for day in days:
            for slot in time_slots:
                senior_slot = senior_availability.get(day, {}).get(slot, {})
                caregiver_slot = caregiver_availability.get(day, {}).get(slot, {})
                
                if senior_slot.get('available') and caregiver_slot.get('available'):
                    # Check time overlap
                    senior_start = senior_slot.get('start', '00:00')
                    senior_end = senior_slot.get('end', '23:59')
                    caregiver_start = caregiver_slot.get('start', '00:00')
                    caregiver_end = caregiver_slot.get('end', '23:59')
                    
                    # Simple overlap check (can be improved)
                    if senior_start <= caregiver_end and caregiver_start <= senior_end:
                        matching_slots += 1
                    total_slots += 1
                elif senior_slot.get('available'):
                    total_slots += 1
        
        return matching_slots / total_slots if total_slots > 0 else 0.0
    except Exception as e:
        logger.error(f"Error calculating availability overlap: {e}")
        return 0.0


def calculate_specialization_match(
    senior_conditions: List[str],
    caregiver_specializations: List[str]
) -> float:
    """Calculate specialization match score."""
    try:
        if not senior_conditions or not caregiver_specializations:
            return 0.0
        
        # Count overlapping conditions/specializations
        matches = len(set(senior_conditions) & set(caregiver_specializations))
        total = len(senior_conditions)
        
        return matches / total if total > 0 else 0.0
    except Exception as e:
        logger.error(f"Error calculating specialization match: {e}")
        return 0.0


def calculate_price_compatibility(
    senior_budget: float,
    caregiver_rate: float
) -> float:
    """Calculate price compatibility score."""
    try:
        if not senior_budget or not caregiver_rate:
            return 0.5
        
        if caregiver_rate <= senior_budget:
            # Within budget - score based on how close to budget
            return 1.0 - (caregiver_rate / senior_budget) * 0.3  # 0.7 to 1.0
        else:
            # Over budget - penalize
            overage = (caregiver_rate - senior_budget) / senior_budget
            return max(0, 1.0 - overage)
    except Exception as e:
        logger.error(f"Error calculating price compatibility: {e}")
        return 0.5


def calculate_heuristic_score(
    similarity: float,
    location_score: float,
    availability_score: float,
    specialization_score: float,
    price_score: float,
    years_experience: int
) -> float:
    """Calculate heuristic matching score."""
    # Normalize experience (0-20 years -> 0-1)
    experience_score = min(1.0, years_experience / 20.0)
    
    # Critical skills match (weighted specialization)
    critical_skills_match = specialization_score
    
    score = (
        0.35 * similarity +
        0.30 * critical_skills_match +
        0.20 * location_score +
        0.10 * availability_score +
        0.05 * experience_score
    )
    
    return score


def calculate_ml_score(features: Dict) -> float:
    """Calculate ML-based matching score using LightGBM."""
    model = load_ml_model()
    if model is None:
        return None
    
    try:
        # Prepare feature vector (order must match training)
        feature_vector = [
            features['similarity'],
            features['location_score'],
            features['availability_score'],
            features['specialization_score'],
            features['price_score'],
            features['years_experience'],
            features['certification_count'],
        ]
        
        score = model.predict([feature_vector])[0]
        return float(score)
    except Exception as e:
        logger.error(f"Error calculating ML score: {e}")
        return None


def enrich_candidate(
    candidate: Dict,
    senior_data: Dict,
    gmaps_client: googlemaps.Client
) -> Dict:
    """Enrich candidate with additional features."""
    caregiver_metadata = candidate.get('metadata', {})
    
    # Location distance
    senior_location = senior_data.get('location', {})
    caregiver_location = caregiver_metadata.get('location', {})
    location_score = calculate_location_distance(
        senior_location, caregiver_location, gmaps_client
    ) if senior_location and caregiver_location else 0.5
    
    # Availability overlap
    senior_availability = senior_data.get('availability', {})
    caregiver_availability = caregiver_metadata.get('availability', {})
    availability_score = calculate_availability_overlap(
        senior_availability, caregiver_availability
    )
    
    # Specialization match
    senior_conditions = senior_data.get('conditions', [])
    caregiver_specializations = caregiver_metadata.get('specializations', [])
    specialization_score = calculate_specialization_match(
        senior_conditions, caregiver_specializations
    )
    
    # Price compatibility
    senior_budget = senior_data.get('budget', 0)
    caregiver_rate = caregiver_metadata.get('hourly_rate', 0)
    price_score = calculate_price_compatibility(senior_budget, caregiver_rate)
    
    # Additional features
    years_experience = caregiver_metadata.get('years_of_experience', 0)
    certification_count = len(caregiver_metadata.get('certifications', []))
    
    # Calculate scores
    features = {
        'similarity': candidate['similarity'],
        'location_score': location_score,
        'availability_score': availability_score,
        'specialization_score': specialization_score,
        'price_score': price_score,
        'years_experience': years_experience,
        'certification_count': certification_count,
    }
    
    # Try ML model first, fallback to heuristic
    ml_score = calculate_ml_score(features)
    if ml_score is not None:
        final_score = ml_score
        score_type = 'ml'
    else:
        final_score = calculate_heuristic_score(
            features['similarity'],
            features['location_score'],
            features['availability_score'],
            features['specialization_score'],
            features['price_score'],
            years_experience
        )
        score_type = 'heuristic'
    
    return {
        'caregiver_id': candidate['id'],
        'similarity': candidate['similarity'],
        'final_score': final_score,
        'score_type': score_type,
        'features': features,
        'metadata': caregiver_metadata,
    }


def store_matches(senior_id: str, matches: List[Dict]):
    """Store top matches in Firestore."""
    try:
        matches_ref = db.collection('seniors').document(senior_id).collection('matches')
        
        # Delete old matches
        old_matches = matches_ref.stream()
        for match in old_matches:
            match.reference.delete()
        
        # Store new matches
        for idx, match in enumerate(matches[:MAX_MATCHES]):
            match_doc = {
                'caregiver_id': match['caregiver_id'],
                'rank': idx + 1,
                'score': match['final_score'],
                'score_type': match['score_type'],
                'similarity': match['similarity'],
                'features': match['features'],
                'created_at': firestore.SERVER_TIMESTAMP,
            }
            matches_ref.add(match_doc)
        
        # Update senior document
        senior_ref = db.collection('seniors').document(senior_id)
        senior_ref.update({
            'match_status': 'ready',
            'match_count': len(matches[:MAX_MATCHES]),
            'matches_updated_at': firestore.SERVER_TIMESTAMP,
        })
        
        logger.info(f"Stored {len(matches[:MAX_MATCHES])} matches for senior {senior_id}")
    except Exception as e:
        logger.error(f"Error storing matches: {e}")
        raise


def send_push_notification(senior_id: str, match_count: int):
    """Send push notification to senior/family."""
    try:
        # Get senior document to find associated family members
        senior_ref = db.collection('seniors').document(senior_id)
        senior_doc = senior_ref.get()
        
        if not senior_doc.exists:
            logger.warning(f"Senior {senior_id} not found")
            return
        
        senior_data = senior_doc.to_dict()
        family_member_ids = senior_data.get('family_member_ids', [])
        
        # Send notification to senior and family members
        # This is a placeholder - implement actual FCM push notification
        logger.info(f"Sending push notification: {match_count} matches found for senior {senior_id}")
        
        # TODO: Implement FCM push notification
        # from firebase_admin import messaging
        # message = messaging.Message(...)
        # messaging.send(message)
        
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        # Don't raise - notification failure shouldn't fail the function


def create_async_task(queue_id: str, senior_id: str):
    """Create Cloud Task for async processing if needed."""
    try:
        queue_path = tasks_client.queue_path(PROJECT_ID, LOCATION, "matching-queue")
        
        task = {
            'http_request': {
                'http_method': tasks_v2.HttpMethod.POST,
                'url': f'https://{LOCATION}-{PROJECT_ID}.cloudfunctions.net/process_matching_async',
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'queue_id': queue_id,
                    'senior_id': senior_id,
                }).encode(),
            }
        }
        
        response = tasks_client.create_task(request={'parent': queue_path, 'task': task})
        logger.info(f"Created async task: {response.name}")
        return response
    except Exception as e:
        logger.error(f"Error creating async task: {e}")
        raise


@functions_framework.cloud_event
def process_matching(cloud_event):
    """Main function triggered by Firestore onCreate."""
    start_time = time.time()
    queue_id = None
    
    try:
        # Parse event data
        event_data = cloud_event.data
        
        # Extract document path from event
        if 'value' in event_data:
            resource = event_data.get('value', {})
            queue_id = resource.get('name', '').split('/')[-1]
            queue_doc = resource.get('fields', {})
        else:
            # Alternative event structure
            resource = event_data
            queue_id = resource.get('name', '').split('/')[-1] if 'name' in resource else None
            queue_doc = resource.get('fields', {})
        
        if not queue_id:
            logger.error("Could not extract queue_id from event")
            return
        
        logger.info(f"Processing matching queue: {queue_id}")
        
        # Extract senior ID
        senior_id = None
        if 'seniorId' in queue_doc:
            senior_id_field = queue_doc.get('seniorId', {})
            if isinstance(senior_id_field, dict):
                senior_id = senior_id_field.get('stringValue') or senior_id_field.get('value')
            else:
                senior_id = senior_id_field
        
        if not senior_id:
            logger.error("No seniorId found in queue document")
            return
        
        # Check if we should use async processing
        elapsed = time.time() - start_time
        if elapsed > PROCESSING_TIMEOUT:
            logger.info("Processing taking too long, creating async task")
            create_async_task(queue_id, senior_id)
            return
        
        # Load senior data
        senior_ref = db.collection('seniors').document(senior_id)
        senior_doc = senior_ref.get()
        
        if not senior_doc.exists:
            logger.error(f"Senior {senior_id} not found")
            return
        
        senior_data = senior_doc.to_dict()
        senior_embedding = senior_data.get('embedding')
        
        if not senior_embedding:
            logger.error(f"No embedding found for senior {senior_id}")
            return
        
        # Query similar caregivers
        candidates = query_similar_caregivers(senior_embedding, SIMILARITY_THRESHOLD)
        
        if not candidates:
            logger.info(f"No candidates found for senior {senior_id}")
            senior_ref.update({
                'match_status': 'no_matches',
                'match_count': 0,
            })
            return
        
        # Initialize Google Maps client
        gmaps_client = googlemaps.Client(key=GOOGLE_MAPS_API_KEY) if GOOGLE_MAPS_API_KEY else None
        
        # Enrich candidates
        enriched_candidates = []
        for candidate in candidates:
            try:
                enriched = enrich_candidate(candidate, senior_data, gmaps_client)
                enriched_candidates.append(enriched)
            except Exception as e:
                logger.error(f"Error enriching candidate {candidate.get('id')}: {e}")
                continue
        
        # Sort by final score
        enriched_candidates.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Store matches
        store_matches(senior_id, enriched_candidates)
        
        # Send notification
        send_push_notification(senior_id, len(enriched_candidates))
        
        # Delete queue document
        queue_ref = db.collection('matching_queue').document(queue_id)
        queue_ref.delete()
        
        logger.info(f"Successfully processed matching for senior {senior_id}")
        
    except Exception as e:
        logger.error(f"Error processing matching: {e}", exc_info=True)
        # Update queue document with error
        try:
            queue_ref = db.collection('matching_queue').document(queue_id)
            queue_ref.update({
                'status': 'error',
                'error_message': str(e),
                'updated_at': firestore.SERVER_TIMESTAMP,
            })
        except:
            pass
        raise

