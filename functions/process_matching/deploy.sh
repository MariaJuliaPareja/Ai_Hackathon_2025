#!/bin/bash

# Deploy script for process_matching Cloud Function

set -e

# Configuration
FUNCTION_NAME="process_matching"
REGION="us-central1"
RUNTIME="python311"
MEMORY="2Gi"
TIMEOUT="540s"  # 9 minutes max
ENTRY_POINT="process_matching"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Cloud Function: ${FUNCTION_NAME}${NC}"

# Deploy the function
gcloud functions deploy ${FUNCTION_NAME} \
  --gen2 \
  --region=${REGION} \
  --runtime=${RUNTIME} \
  --source=. \
  --entry-point=${ENTRY_POINT} \
  --trigger-event-filters="type=google.cloud.firestore.document.v1.written" \
  --trigger-event-filters="database=(default)" \
  --trigger-event-filters="document=matching_queue/{queueId}" \
  --memory=${MEMORY} \
  --timeout=${TIMEOUT} \
  --service-account=${SERVICE_ACCOUNT} \
  --set-env-vars="CLOUD_SQL_CONNECTION_NAME=${CLOUD_SQL_CONNECTION_NAME:-YOUR_PROJECT:REGION:INSTANCE_NAME}" \
  --set-env-vars="DB_NAME=${DB_NAME:-caregiving_db}" \
  --set-env-vars="DB_USER=${DB_USER:-postgres}" \
  --set-secrets="DB_PASSWORD=DB_PASSWORD:latest" \
  --set-secrets="GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest" \
  --set-env-vars="ML_MODEL_BUCKET=${ML_MODEL_BUCKET:-caregiving-ml}" \
  --set-env-vars="ML_MODEL_PATH=${ML_MODEL_PATH:-models/matching-model-v1.txt}" \
  --set-env-vars="SIMILARITY_THRESHOLD=${SIMILARITY_THRESHOLD:-0.6}" \
  --max-instances=10 \
  --min-instances=0

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Note: Update environment variables and secrets before deploying.${NC}"

