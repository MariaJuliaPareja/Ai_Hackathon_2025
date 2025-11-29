#!/bin/bash

# Setup Cloud Scheduler job to trigger retrain_ranking_model daily

set -e

# Configuration
JOB_NAME="daily-model-retraining"
FUNCTION_NAME="retrainRankingModel"
REGION="us-central1"
PROJECT_ID=$(gcloud config get-value project)
SCHEDULE="0 2 * * *"  # Daily at 2 AM UTC
TIMEZONE="UTC"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Creating Cloud Scheduler job: ${JOB_NAME}${NC}"

# Get function URL
FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} \
  --gen2 \
  --region=${REGION} \
  --format="value(serviceConfig.uri)")

if [ -z "$FUNCTION_URL" ]; then
  echo -e "${YELLOW}Warning: Could not get function URL. Please set FUNCTION_URL manually.${NC}"
  FUNCTION_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"
fi

echo -e "${GREEN}Function URL: ${FUNCTION_URL}${NC}"

# Create scheduler job
gcloud scheduler jobs create http ${JOB_NAME} \
  --location=${REGION} \
  --schedule="${SCHEDULE}" \
  --time-zone="${TIMEZONE}" \
  --uri="${FUNCTION_URL}" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body='{"trigger": "scheduler"}' \
  --description="Daily retraining of caregiver-senior matching ranking model" \
  --attempt-deadline=600s

echo -e "${GREEN}Scheduler job created successfully!${NC}"
echo -e "${YELLOW}Job will run daily at 2 AM UTC${NC}"

# List the job
echo -e "${GREEN}Job details:${NC}"
gcloud scheduler jobs describe ${JOB_NAME} --location=${REGION}

