# Cloud Functions

This directory contains Cloud Functions for the Care Connect application.

## Functions

### `generate_embedding`

Generates embeddings for caregiver profiles using a fine-tuned sentence-transformer model.

**Location**: `functions/generate_embedding/`

**Documentation**: See [generate_embedding/README.md](./generate_embedding/README.md)

### `process_matching`

Processes caregiver-senior matching requests triggered by Firestore document creation. Queries similar caregivers, calculates features, applies ranking, and stores matches.

**Location**: `functions/process_matching/`

**Documentation**: See [process_matching/README.md](./process_matching/README.md)

## Deployment

Each function has its own deployment script. Navigate to the function directory and follow its README for deployment instructions.

## Prerequisites

- Google Cloud SDK installed and configured
- Python 3.11+
- Access to required Cloud Storage buckets
- Cloud SQL PostgreSQL instance with pgvector extension
- Service account with appropriate permissions

