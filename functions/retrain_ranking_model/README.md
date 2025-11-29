# Retrain Ranking Model Cloud Function

Cloud Function that retrains the caregiver-senior matching ranking model daily using Vertex AI.

## Overview

- **Trigger**: Cloud Scheduler (daily at 2 AM UTC)
- **Runtime**: Python 3.11
- **Memory**: 4GB
- **Timeout**: 540s (9 minutes)
- **Algorithm**: LightGBM LambdaRank

## Architecture

1. **Query Data**: Firestore for completed matches with ratings (last 30 days)
2. **Validate**: Check if >= 50 samples available
3. **Export**: Training data to CSV in Cloud Storage
4. **Train**: Vertex AI Training job with LightGBM LambdaRank
5. **Evaluate**: Calculate NDCG@10 on validation set
6. **Deploy**: If improvement > 0.02, deploy new model
7. **Monitor**: Log metrics to Cloud Monitoring

## Features

### Data Requirements
- Minimum 50 samples from last 30 days
- Matches must have ratings (1-5 stars)
- Features: similarity, location, availability, specialization, experience, past_rating

### Model Training
- **Algorithm**: LightGBM LambdaRank (learning-to-rank)
- **Features**: 8 features per candidate
- **Target**: Rating (1-5 stars)
- **Grouping**: By senior_id (for ranking evaluation)

### Evaluation Metrics
- **NDCG@10**: Normalized Discounted Cumulative Gain at 10
- **MSE**: Mean Squared Error
- **MAE**: Mean Absolute Error

### Deployment Criteria
- New model NDCG@10 must be > current model + 0.02
- If improved, deploys to production
- Updates Firestore config to enable ML mode

## Prerequisites

### Cloud Storage Buckets
1. **Training Data Bucket**: `caregiving-ml-training`
   - Stores CSV exports of training/validation data
   
2. **Model Bucket**: `caregiving-ml`
   - Stores trained models
   - Path: `models/matching-model-v1.txt`

3. **Vertex AI Staging**: `{PROJECT_ID}-vertex-ai-staging`
   - For Vertex AI job artifacts

### Firestore Structure

**Matches with ratings**:
```
/seniors/{seniorId}/matches/{matchId}
{
  "caregiver_id": "...",
  "rating": 4,  // 1-5 stars
  "rated_at": Timestamp,
  "features": {
    "similarity": 0.78,
    "location_score": 0.92,
    ...
  }
}
```

**Config document**:
```
/config/matching_model
{
  "model_path": "models/matching-model-v1.txt",
  "model_version": "20240101_020000",
  "ndcg@10": 0.85,
  "ml_enabled": true,
  "deployed_at": Timestamp
}
```

### Permissions
Service account needs:
- Firestore Read/Write
- Cloud Storage Read/Write
- Vertex AI Training Admin
- Cloud Monitoring Write
- Cloud Scheduler Invoker

## Deployment

### 1. Deploy Function
```bash
cd functions/retrain_ranking_model
chmod +x deploy.sh
./deploy.sh
```

### 2. Setup Cloud Scheduler
```bash
chmod +x setup_scheduler.sh
./setup_scheduler.sh
```

Or manually:
```bash
gcloud scheduler jobs create http daily-model-retraining \
  --location=us-central1 \
  --schedule="0 2 * * *" \
  --time-zone="UTC" \
  --uri="https://us-central1-YOUR_PROJECT.cloudfunctions.net/retrainRankingModel" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"trigger": "scheduler"}'
```

## Training Data Format

CSV with columns:
- `senior_id`: Grouping variable
- `caregiver_id`: Candidate identifier
- `rating`: Target (1-5 stars)
- `similarity`: Embedding similarity score
- `location_score`: Location compatibility (0-1)
- `availability_score`: Schedule overlap (0-1)
- `specialization_score`: Skills match (0-1)
- `price_score`: Budget compatibility (0-1)
- `years_experience`: Caregiver experience
- `certification_count`: Number of certifications
- `past_rating`: Average past rating

## Model Training

### LightGBM LambdaRank Parameters
```python
{
    'objective': 'lambdarank',
    'metric': 'ndcg',
    'boosting_type': 'gbdt',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.9,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
}
```

### Training Process
1. Split data: 80% train, 20% validation
2. Train with early stopping (10 rounds patience)
3. Evaluate on validation set
4. Compare NDCG@10 with current model

## Monitoring

### Cloud Monitoring Metrics
- `custom.googleapis.com/matching_model/ndcg@10`
- `custom.googleapis.com/matching_model/mse`
- `custom.googleapis.com/matching_model/mae`

### Logs
View function logs:
```bash
gcloud functions logs read retrainRankingModel --region=us-central1
```

## Response Format

**Success (deployed)**:
```json
{
  "status": "success",
  "model_deployed": true,
  "improvement": 0.03,
  "metrics": {
    "ndcg@10": 0.88,
    "mse": 0.45,
    "mae": 0.32
  },
  "current_ndcg": 0.85,
  "new_ndcg": 0.88
}
```

**Success (not deployed)**:
```json
{
  "status": "success",
  "model_deployed": false,
  "improvement": 0.01,
  "message": "New model did not improve performance"
}
```

**Insufficient data**:
```json
{
  "status": "insufficient_data",
  "sample_count": 35,
  "min_required": 50
}
```

## Cold Start Strategy

The system gradually transitions from heuristics to ML:

1. **Initial**: Uses heuristic scoring (no ML model)
2. **Data Collection**: Collects match ratings
3. **First Training**: After 50+ samples, trains first model
4. **Continuous Improvement**: Daily retraining improves model
5. **Production**: ML model becomes primary ranking method

## Troubleshooting

### Insufficient Data
- Check if matches are being rated
- Verify Firestore queries are correct
- May need to wait for more data

### Training Failures
- Check Vertex AI quotas
- Verify Cloud Storage permissions
- Check training data format

### Model Not Improving
- May need more data
- Consider feature engineering
- Check for data quality issues

## Cost Optimization

- **Min instances**: 0 (scale to zero)
- **Max instances**: 1 (only one training job at a time)
- **Schedule**: Daily at low-traffic time (2 AM UTC)
- **Timeout**: 540s prevents runaway jobs

## Future Enhancements

- [ ] A/B testing framework for model comparison
- [ ] Online learning (incremental updates)
- [ ] Feature importance analysis
- [ ] Automated hyperparameter tuning
- [ ] Multi-objective optimization (rating + engagement)

