import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";

export interface EmbeddingRequest {
  text: string;
  userId: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  success: boolean;
  model_version?: string;
  dimensions?: number;
  message?: string;
}

/**
 * Generates an embedding for caregiver profile text using Cloud Function HTTP endpoint
 */
export async function generateCaregiverEmbedding(
  text: string,
  userId: string
): Promise<number[]> {
  // Get the Cloud Function URL from environment or use default
  const functionUrl =
    process.env.NEXT_PUBLIC_EMBEDDING_FUNCTION_URL ||
    `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/generate_embedding`;

  try {
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        userId, // Include userId for logging/tracking if needed
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data: EmbeddingResponse = await response.json();

    if (data.success && data.embedding) {
      return data.embedding;
    } else {
      throw new Error(data.message || "Failed to generate embedding");
    }
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Re-throw to let caller handle it
    throw error;
  }
}

/**
 * Constructs rich text description from caregiver form data
 */
export function constructCaregiverDescription(formData: {
  professionalInfo: {
    yearsOfExperience: number;
    specializations: string[];
    certifications?: Array<{ name: string }>;
  };
  experienceDescription: {
    experienceDescription: string;
  };
}): string {
  const parts: string[] = [];

  // Years of experience
  parts.push(`Cuidador con ${formData.professionalInfo.yearsOfExperience} años de experiencia`);

  // Specializations
  if (formData.professionalInfo.specializations.length > 0) {
    parts.push(
      `Especializado en: ${formData.professionalInfo.specializations.join(", ")}`
    );
  }

  // Experience description
  if (formData.experienceDescription.experienceDescription) {
    parts.push(
      `Experiencia detallada: ${formData.experienceDescription.experienceDescription}`
    );
  }

  // Certifications
  if (formData.professionalInfo.certifications && formData.professionalInfo.certifications.length > 0) {
    const certNames = formData.professionalInfo.certifications.map((c) => c.name).join(", ");
    parts.push(`Certificaciones: ${certNames}`);
  }

  return parts.join("\n\n");
}
