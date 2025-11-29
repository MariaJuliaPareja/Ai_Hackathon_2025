#!/bin/bash

# Setup Cloud Tasks queue for async processing

set -e

QUEUE_NAME="matching-queue"
REGION="us-central1"
PROJECT_ID=$(gcloud config get-value project)

echo "Creating Cloud Tasks queue: ${QUEUE_NAME}"

gcloud tasks queues create ${QUEUE_NAME} \
  --location=${REGION} \
  --max-attempts=3 \
  --max-retry-duration=3600s \
  --max-concurrent-dispatches=10 \
  --max-dispatches-per-second=5

echo "Queue created successfully!"
echo "Queue name: projects/${PROJECT_ID}/locations/${REGION}/queues/${QUEUE_NAME}"

