import { httpsCallable } from "firebase/functions";
import { getFunctions, Functions } from "firebase/functions";
import { app } from "./config";

export interface EmbeddingRequest {
  text: string;
  userId: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  success: boolean;
  message?: string;
}

// Initialize functions only on client side
let functions: Functions | null = null;

if (typeof window !== "undefined") {
  try {
    functions = getFunctions(app);
  } catch (error) {
    console.warn("Firebase Functions not available:", error);
  }
}

/**
 * Generates an embedding for caregiver profile text using Firebase Function
 */
export async function generateCaregiverEmbedding(
  text: string,
  userId: string
): Promise<number[]> {
  if (!functions) {
    throw new Error("Firebase Functions not initialized");
  }

  try {
    const generateEmbedding = httpsCallable<EmbeddingRequest, EmbeddingResponse>(
      functions,
      "generateCaregiverEmbedding"
    );

    const result = await generateEmbedding({
      text,
      userId,
    });

    if (result.data.success && result.data.embedding) {
      return result.data.embedding;
    } else {
      throw new Error(result.data.message || "Failed to generate embedding");
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
