"""
Cloud Function to retrain the ranking model using Vertex AI.
Triggered by Cloud Scheduler daily.
"""
import os
import json
import logging
import csv
import io
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import functions_framework
from google.cloud import firestore
from google.cloud import storage
from google.cloud import aiplatform
from google.cloud import monitoring_v3

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize clients
db = firestore.Client()
storage_client = storage.Client()
monitoring_client = monitoring_v3.MetricServiceClient()

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT")
LOCATION = os.environ.get("LOCATION", "us-central1")
BUCKET_NAME = os.environ.get("TRAINING_DATA_BUCKET", "caregiving-ml-training")
MODEL_BUCKET = os.environ.get("ML_MODEL_BUCKET", "caregiving-ml")
MODEL_PATH = os.environ.get("ML_MODEL_PATH", "models/matching-model-v1.txt")
MIN_SAMPLES = int(os.environ.get("MIN_SAMPLES", "50"))
IMPROVEMENT_THRESHOLD = float(os.environ.get("IMPROVEMENT_THRESHOLD", "0.02"))
VERTEX_AI_STAGING_BUCKET = os.environ.get("VERTEX_AI_STAGING_BUCKET", f"{PROJECT_ID}-vertex-ai-staging")

# Initialize Vertex AI
aiplatform.init(project=PROJECT_ID, location=LOCATION)


def query_training_data(days: int = 30) -> List[Dict]:
    """
    Query Firestore for completed matches with ratings from last N days.
    
    Expected structure:
    - /seniors/{seniorId}/matches/{matchId} with rating field
    - /matches/{matchId} with rating and completed_at fields
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        training_data = []
        
        # Query all seniors
        seniors_ref = db.collection('seniors')
        seniors = seniors_ref.stream()
        
        for senior_doc in seniors:
            senior_id = senior_doc.id
            matches_ref = senior_doc.reference.collection('matches')
            
            # Query matches with ratings from last 30 days
            matches = matches_ref.where('rating', '>', 0).where('rated_at', '>=', cutoff_date).stream()
            
            for match_doc in matches:
                match_data = match_doc.to_dict()
                
                # Get match features
                features = match_data.get('features', {})
                
                # Get senior data for grouping
                senior_data = senior_doc.to_dict()
                
                training_sample = {
                    'senior_id': senior_id,
                    'caregiver_id': match_data.get('caregiver_id'),
                    'rating': match_data.get('rating', 0),
                    'similarity': features.get('similarity', 0),
                    'location_score': features.get('location_score', 0),
                    'availability_score': features.get('availability_score', 0),
                    'specialization_score': features.get('specialization_score', 0),
                    'price_score': features.get('price_score', 0),
                    'years_experience': features.get('years_experience', 0),
                    'certification_count': features.get('certification_count', 0),
                    'past_rating': match_data.get('past_rating', 0),  # Average past rating
                    'rated_at': match_data.get('rated_at'),
                }
                
                training_data.append(training_sample)
        
        logger.info(f"Found {len(training_data)} training samples from last {days} days")
        return training_data
        
    except Exception as e:
        logger.error(f"Error querying training data: {e}", exc_info=True)
        raise


def export_to_csv(data: List[Dict], filename: str) -> str:
    """Export training data to CSV in Cloud Storage."""
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)
        
        # Create CSV in memory
        output = io.StringIO()
        
        if not data:
            raise ValueError("No data to export")
        
        fieldnames = data[0].keys()
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
        
        # Upload to Cloud Storage
        blob.upload_from_string(output.getvalue(), content_type='text/csv')
        
        gcs_path = f"gs://{BUCKET_NAME}/{filename}"
        logger.info(f"Exported {len(data)} samples to {gcs_path}")
        
        return gcs_path
        
    except Exception as e:
        logger.error(f"Error exporting to CSV: {e}", exc_info=True)
        raise


def create_vertex_ai_training_job(
    training_data_path: str,
    job_name: str
) -> str:
    """Create and start Vertex AI Training job for LightGBM LambdaRank."""
    try:
        from google.cloud.aiplatform import CustomTrainingJob
        from google.cloud.aiplatform import hyperparameter_tuning as hpt
        
        # Define training script!!!!!!!
        # For now, we'll use a container-based approach!!!!!!!!
        
        training_job = aiplatform.CustomTrainingJob(
            display_name=job_name,
            script_path="train_lambdarank.py",  # Training script in container
            container_uri=f"gcr.io/{PROJECT_ID}/lambdarank-trainer:latest",
            requirements=["lightgbm==4.1.0", "pandas==2.0.3", "numpy==1.24.3"],
            model_serving_container_image_uri=None,  # Not needed for ranking
        )
        
        # Start training
        model = training_job.run(
            dataset=training_data_path,
            replica_count=1,
            machine_type="n1-standard-4",
            accelerator_type="NVIDIA_TESLA_T4",
            accelerator_count=1,
        )
        
        logger.info(f"Training job started: {model.resource_name}")
        return model.resource_name
        
    except Exception as e:
        logger.error(f"Error creating Vertex AI training job: {e}", exc_info=True)
        # Fallback: Use simpler approach with direct LightGBM training
        return train_lambdarank_local(training_data_path)


def train_lambdarank_local(training_data_path: str) -> str:
    """
    Fallback: Train LightGBM LambdaRank model locally and upload to Cloud Storage.
    This is used if Vertex AI job creation fails.
    """
    try:
        import pandas as pd
        import lightgbm as lgb
        
        # Download training data
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(training_data_path.split('/')[-1])
        data_content = blob.download_as_text()
        
        # Parse CSV
        df = pd.read_csv(io.StringIO(data_content))
        
        # Prepare features
        feature_cols = [
            'similarity', 'location_score', 'availability_score',
            'specialization_score', 'price_score', 'years_experience',
            'certification_count', 'past_rating'
        ]
        
        X = df[feature_cols]
        y = df['rating']
        group = df.groupby('senior_id').size().values
        
        # Create LightGBM dataset
        train_data = lgb.Dataset(X, label=y, group=group)
        
        # Train LambdaRank model
        params = {
            'objective': 'lambdarank',
            'metric': 'ndcg',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': 0,
        }
        
        model = lgb.train(
            params,
            train_data,
            num_boost_round=100,
            valid_sets=[train_data],
            callbacks=[lgb.early_stopping(10), lgb.log_evaluation(10)]
        )
        
        # Save model to Cloud Storage
        model_bucket = storage_client.bucket(MODEL_BUCKET)
        model_blob = model_bucket.blob(f"{MODEL_PATH}.new")
        
        # Save model as text (LightGBM format)
        model_str = model.model_to_string()
        model_blob.upload_from_string(model_str, content_type='text/plain')
        
        logger.info(f"Model trained and saved to gs://{MODEL_BUCKET}/{MODEL_PATH}.new")
        return f"gs://{MODEL_BUCKET}/{MODEL_PATH}.new"
        
    except Exception as e:
        logger.error(f"Error in local training: {e}", exc_info=True)
        raise


def evaluate_model(model_path: str, validation_data_path: str) -> Dict[str, float]:
    """Evaluate model on validation set and return metrics."""
    try:
        import pandas as pd
        import lightgbm as lgb
        import numpy as np
        
        # Download validation data
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(validation_data_path.split('/')[-1])
        data_content = blob.download_as_text()
        
        df = pd.read_csv(io.StringIO(data_content))
        
        # Prepare features
        feature_cols = [
            'similarity', 'location_score', 'availability_score',
            'specialization_score', 'price_score', 'years_experience',
            'certification_count', 'past_rating'
        ]
        
        X = df[feature_cols]
        y = df['rating']
        groups = df.groupby('senior_id').size().values
        
        # Load model
        model_bucket = storage_client.bucket(MODEL_BUCKET)
        model_blob = model_bucket.blob(model_path.split('/')[-1])
        model_str = model_blob.download_as_text()
        model = lgb.Booster(model_str=model_str)
        
        # Predict
        predictions = model.predict(X)
        
        # Calculate NDCG@10
        ndcg_10 = calculate_ndcg_at_k(y, predictions, groups, k=10)
        
        # Calculate other metrics
        mse = np.mean((predictions - y) ** 2)
        mae = np.mean(np.abs(predictions - y))
        
        metrics = {
            'ndcg@10': ndcg_10,
            'mse': float(mse),
            'mae': float(mae),
        }
        
        logger.info(f"Model evaluation metrics: {metrics}")
        return metrics
        
    except Exception as e:
        logger.error(f"Error evaluating model: {e}", exc_info=True)
        raise


def calculate_ndcg_at_k(y_true: List[float], y_pred: List[float], groups: List[int], k: int = 10) -> float:
    """Calculate NDCG@k for ranking."""
    try:
        import numpy as np
        
        ndcg_scores = []
        start_idx = 0
        
        for group_size in groups:
            end_idx = start_idx + group_size
            
            group_true = np.array(y_true[start_idx:end_idx])
            group_pred = np.array(y_pred[start_idx:end_idx])
            
            # Get top k indices
            top_k_indices = np.argsort(group_pred)[::-1][:k]
            top_k_true = group_true[top_k_indices]
            
            # Calculate DCG
            dcg = np.sum(top_k_true / np.log2(np.arange(2, len(top_k_true) + 2)))
            
            # Calculate IDCG (ideal DCG)
            ideal_order = np.sort(group_true)[::-1][:k]
            idcg = np.sum(ideal_order / np.log2(np.arange(2, len(ideal_order) + 2)))
            
            # NDCG
            ndcg = dcg / idcg if idcg > 0 else 0.0
            ndcg_scores.append(ndcg)
            
            start_idx = end_idx
        
        return float(np.mean(ndcg_scores))
        
    except Exception as e:
        logger.error(f"Error calculating NDCG: {e}", exc_info=True)
        return 0.0


def get_current_model_metrics() -> float:
    """Get current production model's NDCG@10 from Firestore config."""
    try:
        config_ref = db.collection('config').document('matching_model')
        config_doc = config_ref.get()
        
        if config_doc.exists:
            config = config_doc.to_dict()
            return config.get('ndcg@10', 0.0)
        else:
            return 0.0
            
    except Exception as e:
        logger.error(f"Error getting current model metrics: {e}")
        return 0.0


def deploy_model(model_path: str, metrics: Dict[str, float]):
    """Deploy new model to production."""
    try:
        # Copy new model to production path
        model_bucket = storage_client.bucket(MODEL_BUCKET)
        new_model_blob = model_bucket.blob(model_path.split('/')[-1])
        prod_model_blob = model_bucket.blob(MODEL_PATH)
        
        # Copy to production
        model_bucket.copy_blob(new_model_blob, model_bucket, MODEL_PATH)
        
        # Update Firestore config
        config_ref = db.collection('config').document('matching_model')
        config_ref.set({
            'model_path': MODEL_PATH,
            'model_version': datetime.utcnow().strftime('%Y%m%d_%H%M%S'),
            'ndcg@10': metrics['ndcg@10'],
            'mse': metrics['mse'],
            'mae': metrics['mae'],
            'ml_enabled': True,
            'deployed_at': firestore.SERVER_TIMESTAMP,
        }, merge=True)
        
        logger.info(f"Model deployed to production: {MODEL_PATH}")
        
    except Exception as e:
        logger.error(f"Error deploying model: {e}", exc_info=True)
        raise


def log_metrics_to_monitoring(metrics: Dict[str, float], model_version: str):
    """Log metrics to Cloud Monitoring."""
    try:
        project_name = f"projects/{PROJECT_ID}"
        
        series = []
        for metric_name, metric_value in metrics.items():
            series.append({
                'metric': {
                    'type': f'custom.googleapis.com/matching_model/{metric_name}',
                    'labels': {
                        'model_version': model_version,
                    }
                },
                'points': [{
                    'interval': {
                        'end_time': {
                            'seconds': int(datetime.utcnow().timestamp())
                        }
                    },
                    'value': {
                        'double_value': metric_value
                    }
                }]
            })
        
        monitoring_client.create_time_series(
            name=project_name,
            time_series=series
        )
        
        logger.info(f"Metrics logged to Cloud Monitoring: {metrics}")
        
    except Exception as e:
        logger.error(f"Error logging metrics to monitoring: {e}")
        # Don't raise - monitoring failure shouldn't fail the function


@functions_framework.http
def retrain_ranking_model(request):
    """
    HTTP Cloud Function to retrain the ranking model.
    Triggered by Cloud Scheduler daily.
    """
    try:
        logger.info("Starting model retraining process")
        
        # Step 1: Query training data
        training_data = query_training_data(days=30)
        
        # Step 2: Check if we have enough data
        if len(training_data) < MIN_SAMPLES:
            logger.warning(f"Insufficient data for retraining: {len(training_data)} < {MIN_SAMPLES}")
            return {
                'status': 'insufficient_data',
                'sample_count': len(training_data),
                'min_required': MIN_SAMPLES,
            }, 200
        
        # Step 3: Split into train/validation (80/20)
        split_idx = int(len(training_data) * 0.8)
        train_data = training_data[:split_idx]
        val_data = training_data[split_idx:]
        
        # Step 4: Export to CSV
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        train_filename = f"training_data_{timestamp}.csv"
        val_filename = f"validation_data_{timestamp}.csv"
        
        train_path = export_to_csv(train_data, train_filename)
        val_path = export_to_csv(val_data, val_filename)
        
        # Step 5: Train model
        job_name = f"lambdarank-training-{timestamp}"
        model_path = create_vertex_ai_training_job(train_path, job_name)
        
        # If Vertex AI job was created, wait for completion
        # For now, we'll use the local training fallback
        if not model_path.startswith('gs://'):
            # Local training already completed
            pass
        else:
            # Wait for Vertex AI job to complete (in production, use async polling)
            logger.info("Waiting for Vertex AI training job to complete...")
            # This would be implemented with async polling in production
        
        # Step 6: Evaluate model
        metrics = evaluate_model(model_path, val_path)
        current_ndcg = get_current_model_metrics()
        
        # Step 7: Compare and deploy if improved
        improvement = metrics['ndcg@10'] - current_ndcg
        
        if improvement > IMPROVEMENT_THRESHOLD:
            # Deploy new model
            deploy_model(model_path, metrics)
            
            # Log metrics
            model_version = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            log_metrics_to_monitoring(metrics, model_version)
            
            return {
                'status': 'success',
                'model_deployed': True,
                'improvement': improvement,
                'metrics': metrics,
                'current_ndcg': current_ndcg,
                'new_ndcg': metrics['ndcg@10'],
            }, 200
        else:
            logger.info(f"New model did not improve performance: {improvement} <= {IMPROVEMENT_THRESHOLD}")
            
            # Log metrics anyway
            model_version = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            log_metrics_to_monitoring(metrics, model_version)
            
            return {
                'status': 'success',
                'model_deployed': False,
                'improvement': improvement,
                'metrics': metrics,
                'current_ndcg': current_ndcg,
                'new_ndcg': metrics['ndcg@10'],
                'message': 'New model did not improve performance',
            }, 200
            
    except Exception as e:
        logger.error(f"Error in retrain_ranking_model: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e),
        }, 500

