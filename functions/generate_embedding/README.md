# Generate Embedding Cloud Function

This Cloud Function Gen2 generates embeddings for caregiver profiles using a fine-tuned sentence-transformer model.

## Overview

- **Function Name**: `generate_embedding`
- **Runtime**: Python 3.11
- **Model**: Fine-tuned sentence-transformer from `gs://caregiving-ml/models/caregiving-embeddings-v1`
- **Embedding Dimensions**: 384
- **Memory**: 2GB
- **Timeout**: 60s
- **Min Instances**: 1 (to avoid cold start)

## API Endpoint

### Request

**Method**: `POST`

**URL**: `https://REGION-PROJECT_ID.cloudfunctions.net/generate_embedding`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "text": "Cuidador con 5 años de experiencia en demencia vascular..."
}
```

### Response

**Success (200)**:
```json
{
  "embedding": [0.123, 0.456, ...],  // 384-dim array
  "model_version": "v1",
  "dimensions": 384,
  "success": true
}
```

**Error (400/500)**:
```json
{
  "error": "Error message",
  "message": "Detailed error message",
  "success": false
}
```

## Local Development

### Prerequisites

- Python 3.11+
- Google Cloud SDK
- Access to the model in Cloud Storage

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

3. Run locally:
```bash
functions-framework --target=generate_embedding --port=8080
```

4. Test the function:
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"text": "Cuidador con 5 años de experiencia"}'
```

## Deployment

### Prerequisites

1. Enable required APIs:
```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

2. Ensure you have:
   - Access to the model bucket: `gs://caregiving-ml/models/caregiving-embeddings-v1`
   - Service account with Cloud Storage read permissions
   - Billing enabled for your project

### Deploy

1. Update the service account in `deploy.sh`:
```bash
# Edit deploy.sh and replace YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com
```

2. Make deploy script executable:
```bash
chmod +x deploy.sh
```

3. Run deployment:
```bash
./deploy.sh
```

Or deploy manually:
```bash
gcloud functions deploy generate_embedding \
  --gen2 \
  --region=us-central1 \
  --runtime=python311 \
  --source=. \
  --entry-point=generate_embedding \
  --trigger-http \
  --allow-unauthenticated \
  --memory=2Gi \
  --timeout=60s \
  --min-instances=1 \
  --max-instances=10 \
  --service-account="YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com"
```

## Model Loading

The model is loaded once when the function starts (thanks to min-instances=1). The model is stored in Cloud Storage and accessed via GCS paths.

**Important**: Ensure your service account has read access to:
- `gs://caregiving-ml/models/caregiving-embeddings-v1`

## Monitoring

View logs:
```bash
gcloud functions logs read generate_embedding --region=us-central1
```

View metrics in Cloud Console:
- Function invocations
- Execution time
- Memory usage
- Error rates

## Cost Optimization

- **Min instances**: Set to 1 to avoid cold starts (costs ~$0.40/month per instance)
- **Max instances**: Adjust based on expected load
- **Memory**: 2GB is sufficient for sentence-transformers

## Troubleshooting

### Model Loading Errors

If you see errors loading the model:
1. Verify service account has Cloud Storage read permissions
2. Check that the model path is correct
3. Ensure the model files are accessible

### Memory Issues

If you encounter memory errors:
1. Increase memory allocation: `--memory=4Gi`
2. Check model size and optimize if needed

### Cold Starts

To avoid cold starts:
1. Keep `min-instances=1`
2. Use Cloud Scheduler to ping the function periodically

## Integration with Frontend

Update your Firebase Functions call in `lib/firebase/embeddings.ts`:

```typescript
const functions = getFunctions(app, "us-central1");
const generateEmbedding = httpsCallable<EmbeddingRequest, EmbeddingResponse>(
  functions,
  "generate_embedding"  // Note: this is the HTTP endpoint, not a callable
);
```

For HTTP endpoints, use `fetch` instead:

```typescript
const response = await fetch(
  "https://us-central1-YOUR_PROJECT.cloudfunctions.net/generate_embedding",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }
);
```

