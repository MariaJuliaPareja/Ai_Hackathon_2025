#!/bin/bash

# Deploy script for retrain_ranking_model Cloud Function

set -e

# Configuration
FUNCTION_NAME="retrainRankingModel"
REGION="us-central1"
RUNTIME="python311"
MEMORY="4Gi"
TIMEOUT="540s"  # 9 minutes max
ENTRY_POINT="retrain_ranking_model"
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
  --trigger-http \
  --allow-unauthenticated \
  --memory=${MEMORY} \
  --timeout=${TIMEOUT} \
  --service-account=${SERVICE_ACCOUNT} \
  --set-env-vars="LOCATION=${REGION}" \
  --set-env-vars="TRAINING_DATA_BUCKET=${TRAINING_DATA_BUCKET:-caregiving-ml-training}" \
  --set-env-vars="ML_MODEL_BUCKET=${ML_MODEL_BUCKET:-caregiving-ml}" \
  --set-env-vars="ML_MODEL_PATH=${ML_MODEL_PATH:-models/matching-model-v1.txt}" \
  --set-env-vars="MIN_SAMPLES=${MIN_SAMPLES:-50}" \
  --set-env-vars="IMPROVEMENT_THRESHOLD=${IMPROVEMENT_THRESHOLD:-0.02}" \
  --set-env-vars="VERTEX_AI_STAGING_BUCKET=${VERTEX_AI_STAGING_BUCKET:-YOUR_PROJECT-vertex-ai-staging}" \
  --max-instances=1 \
  --min-instances=0

echo -e "${GREEN}Function deployed successfully!${NC}"
echo -e "${YELLOW}Next step: Create Cloud Scheduler job to trigger this function daily${NC}"

