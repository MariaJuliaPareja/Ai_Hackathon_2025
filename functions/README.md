# Cloud Functions

This directory contains Cloud Functions for the Care Connect application.

## Functions

### `generate_embedding`

Generates embeddings for caregiver profiles using a fine-tuned sentence-transformer model.

**Location**: `functions/generate_embedding/`

**Documentation**: See [generate_embedding/README.md](./generate_embedding/README.md)

## Deployment

Each function has its own deployment script. Navigate to the function directory and follow its README for deployment instructions.

## Prerequisites

- Google Cloud SDK installed and configured
- Python 3.11+
- Access to required Cloud Storage buckets
- Service account with appropriate permissions

