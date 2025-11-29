#!/bin/bash

# Deploy script for generate_embedding Cloud Function Gen2

set -e

# Configuration
FUNCTION_NAME="generate_embedding"
REGION="us-central1"
RUNTIME="python311"
MEMORY="2Gi"
TIMEOUT="60s"
MIN_INSTANCES=1
MAX_INSTANCES=10
ENTRY_POINT="generate_embedding"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Cloud Function Gen2: ${FUNCTION_NAME}${NC}"

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
  --min-instances=${MIN_INSTANCES} \
  --max-instances=${MAX_INSTANCES} \
  --set-env-vars="MODEL_PATH=gs://caregiving-ml/models/caregiving-embeddings-v1" \
  --service-account="YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com"

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Note: Update the service account email in this script before deploying.${NC}"

