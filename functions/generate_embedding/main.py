"""
Cloud Function Gen2 for generating caregiver embeddings using fine-tuned sentence-transformer model.
"""
import os
import json
import logging
from typing import Dict, Any

import functions_framework
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration
MODEL_PATH = "gs://caregiving-ml/models/caregiving-embeddings-v1"
MODEL_VERSION = "v1"
EMBEDDING_DIMENSIONS = 384

# Global model variable (loaded once at function start)
model: SentenceTransformer = None


def load_model():
    """Load the sentence-transformer model from Cloud Storage."""
    global model
    if model is None:
        logger.info(f"Loading model from {MODEL_PATH}")
        try:
            model = SentenceTransformer(MODEL_PATH)
            logger.info(f"Model loaded successfully. Embedding dimensions: {model.get_sentence_embedding_dimension()}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    return model


@functions_framework.http
def generate_embedding(request):
    """
    HTTP Cloud Function to generate embeddings for caregiver text.
    
    Expected request body:
    {
        "text": "Cuidador con 5 años de experiencia en demencia vascular..."
    }
    
    Returns:
    {
        "embedding": [0.123, 0.456, ...],  # 384-dim vector
        "model_version": "v1",
        "dimensions": 384,
        "success": true
    }
    """
    # Set CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    # Handle CORS preflight
    if request.method == "OPTIONS":
        return ("", 204, headers)

    # Only allow POST
    if request.method != "POST":
        return (
            json.dumps({"error": "Method not allowed. Use POST."}),
            405,
            headers,
        )

    try:
        # Parse request JSON
        request_json = request.get_json(silent=True)
        if not request_json:
            return (
                json.dumps({"error": "Invalid JSON in request body"}),
                400,
                headers,
            )

        # Extract text
        text = request_json.get("text")
        if not text:
            return (
                json.dumps({"error": "Missing 'text' field in request body"}),
                400,
                headers,
            )

        if not isinstance(text, str) or len(text.strip()) == 0:
            return (
                json.dumps({"error": "'text' must be a non-empty string"}),
                400,
                headers,
            )

        # Load model (if not already loaded)
        model = load_model()

        # Generate embedding
        logger.info(f"Generating embedding for text (length: {len(text)})")
        embedding = model.encode(text, normalize_embeddings=True)
        embedding_list = embedding.tolist()

        # Validate embedding dimensions
        if len(embedding_list) != EMBEDDING_DIMENSIONS:
            logger.warning(
                f"Expected {EMBEDDING_DIMENSIONS} dimensions, got {len(embedding_list)}"
            )

        # Return response
        response = {
            "embedding": embedding_list,
            "model_version": MODEL_VERSION,
            "dimensions": len(embedding_list),
            "success": True,
        }

        logger.info(f"Successfully generated embedding with {len(embedding_list)} dimensions")
        return (json.dumps(response), 200, headers)

    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}", exc_info=True)
        error_response = {
            "error": "Failed to generate embedding",
            "message": str(e),
            "success": False,
        }
        return (json.dumps(error_response), 500, headers)

