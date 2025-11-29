# Process Matching Cloud Function

Firebase Cloud Function that processes caregiver-senior matching requests triggered by Firestore document creation.

## Overview

- **Trigger**: Firestore `onCreate` on `/matching_queue/{queueId}`
- **Runtime**: Python 3.11
- **Memory**: 2GB
- **Timeout**: 540s (9 minutes)
- **Processing**: Synchronous (with async fallback via Cloud Tasks)

## Architecture

1. **Trigger**: Firestore document created in `/matching_queue/{queueId}`
2. **Extract**: Senior ID from queue document
3. **Load**: Senior embedding from Firestore
4. **Query**: Cloud SQL PostgreSQL with pgvector for similar caregivers
5. **Enrich**: Calculate additional features (location, availability, etc.)
6. **Rank**: Apply ML model or heuristic scoring
7. **Store**: Top 10 matches in Firestore
8. **Notify**: Send push notification to senior/family

## Features

### Similarity Search
- Uses pgvector extension for efficient embedding similarity search
- Threshold: 0.6 (configurable)
- Returns top 50 candidates

### Feature Calculation
- **Location Distance**: Google Maps Distance Matrix API
- **Availability Overlap**: Calculates schedule overlap
- **Specialization Match**: Counts overlapping conditions/specializations
- **Price Compatibility**: Compares rates to budget

### Ranking
- **ML Model** (if available): LightGBM model from Cloud Storage
- **Heuristic** (fallback):
  - 35% similarity
  - 30% critical skills match
  - 20% location score
  - 10% availability score
  - 5% experience score

### Async Processing
- If processing takes > 30s, creates Cloud Task for async processing
- Prevents function timeout

## Prerequisites

### Cloud SQL Setup
1. Create PostgreSQL instance with pgvector extension
2. Create database and table:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE caregiver_embeddings (
    id VARCHAR(255) PRIMARY KEY,
    embedding vector(384),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON caregiver_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### Secrets & Environment Variables
- `DB_PASSWORD`: PostgreSQL password (Secret Manager)
- `GOOGLE_MAPS_API_KEY`: Google Maps API key (Secret Manager)
- `CLOUD_SQL_CONNECTION_NAME`: Cloud SQL connection string
- `DB_NAME`: Database name (default: `caregiving_db`)
- `DB_USER`: Database user (default: `postgres`)
- `ML_MODEL_BUCKET`: GCS bucket for ML model
- `ML_MODEL_PATH`: Path to LightGBM model in bucket

### Permissions
Service account needs:
- Cloud SQL Client
- Cloud Storage Object Viewer (for ML model)
- Firestore Read/Write
- Cloud Tasks Creator (for async processing)
- Secret Manager Secret Accessor

## Deployment

### 1. Create Secrets
```bash
echo -n "your-db-password" | gcloud secrets create DB_PASSWORD --data-file=-
echo -n "your-api-key" | gcloud secrets create GOOGLE_MAPS_API_KEY --data-file=-
```

### 2. Update deploy.sh
Edit `deploy.sh` with your configuration:
- Service account email
- Cloud SQL connection name
- Other environment variables

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

Or manually:
```bash
gcloud functions deploy process_matching \
  --gen2 \
  --region=us-central1 \
  --runtime=python311 \
  --source=. \
  --entry-point=process_matching \
  --trigger-event-filters="type=google.cloud.firestore.document.v1.written" \
  --trigger-event-filters="database=(default)" \
  --trigger-resource-ids="projects/YOUR_PROJECT/databases/(default)/documents/matching_queue/{queueId}" \
  --memory=2Gi \
  --timeout=540s \
  --service-account="YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com" \
  --set-env-vars="CLOUD_SQL_CONNECTION_NAME=YOUR_PROJECT:REGION:INSTANCE_NAME" \
  --set-secrets="DB_PASSWORD=DB_PASSWORD:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest"
```

## Queue Document Structure

Create a document in `/matching_queue/{queueId}`:

```json
{
  "seniorId": "senior_123",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Output Structure

### Matches Stored In
`/seniors/{seniorId}/matches/{matchId}`

```json
{
  "caregiver_id": "caregiver_456",
  "rank": 1,
  "score": 0.85,
  "score_type": "ml",
  "similarity": 0.78,
  "features": {
    "similarity": 0.78,
    "location_score": 0.92,
    "availability_score": 0.75,
    "specialization_score": 0.90,
    "price_score": 0.88,
    "years_experience": 8,
    "certification_count": 3
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Senior Document Updated
```json
{
  "match_status": "ready",
  "match_count": 10,
  "matches_updated_at": "2024-01-01T00:00:00Z"
}
```

## Error Handling

- **Missing seniorId**: Logs error, returns early
- **No embedding**: Updates senior with `match_status: 'no_matches'`
- **Database errors**: Logs error, updates queue with error status
- **API failures**: Uses default scores, continues processing
- **Timeout**: Creates Cloud Task for async processing

## Monitoring

View logs:
```bash
gcloud functions logs read process_matching --region=us-central1
```

Key metrics to monitor:
- Function invocations
- Execution time
- Error rate
- Match generation success rate
- Database query performance

## Cost Optimization

- **Min instances**: 0 (scale to zero when not in use)
- **Max instances**: 10 (adjust based on load)
- **Memory**: 2GB sufficient for model loading and processing
- **Timeout**: 540s allows for full processing without async task overhead

## Troubleshooting

### Model Loading Issues
- Verify ML model exists in Cloud Storage
- Check service account has Storage Object Viewer role
- Model will gracefully fallback to heuristic if not found

### Database Connection Issues
- Verify Cloud SQL connection name format: `PROJECT:REGION:INSTANCE`
- Check service account has Cloud SQL Client role
- Ensure Cloud SQL instance allows connections from Cloud Functions

### Google Maps API Errors
- Verify API key is valid and has Distance Matrix API enabled
- Check quota limits
- Function will use default score (0.5) if API fails

## Future Enhancements

- [ ] Implement actual FCM push notifications
- [ ] Add retry logic with exponential backoff
- [ ] Cache frequently accessed data
- [ ] Add batch processing for multiple seniors
- [ ] Implement A/B testing for ranking algorithms

