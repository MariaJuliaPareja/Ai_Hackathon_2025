import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { generateCaregiverEmbedding, constructCaregiverDescription } from "./embeddings";
// NOTE: Storage removed - profile photos are stored as Base64 strings in Firestore
// Certification files still use Storage (if needed, can be converted later)

export interface CaregiverData {
  personalInfo: {
    name: string;
    location: string;
    profilePhotoBase64?: string; // Full size Base64-encoded image string (800x800, ~200KB)
    profilePhotoThumbnailBase64?: string; // Thumbnail Base64-encoded image string (100x100, ~20KB)
    photoUploadedAt?: any; // Timestamp
  };
  professionalInfo: {
    yearsOfExperience: number;
    specializations: string[];
    certifications?: Array<{
      name: string;
      fileUrl?: string;
    }>;
  };
  experienceDescription: {
    experienceDescription: string;
  };
  availability: CaregiverOnboardingFormData["availability"];
  preferences: CaregiverOnboardingFormData["preferences"];
  userId: string;
  embedding?: number[];
  description?: string;
  createdAt: any;
  updatedAt: any;
}

export async function saveCaregiverProfile(
  userId: string,
  formData: CaregiverOnboardingFormData
): Promise<void> {
  // Extract Base64 photos (already compressed and encoded in the form)
  let profilePhotoBase64: string | undefined;
  let profilePhotoThumbnailBase64: string | undefined;

  if (formData.personalInfo.photo) {
    if (typeof formData.personalInfo.photo === "string") {
      // Legacy format: single string (use as full, generate thumbnail later if needed)
      profilePhotoBase64 = formData.personalInfo.photo;
    } else if (typeof formData.personalInfo.photo === "object" && formData.personalInfo.photo.full) {
      // New format: object with full and thumbnail
      profilePhotoBase64 = formData.personalInfo.photo.full;
      profilePhotoThumbnailBase64 = formData.personalInfo.photo.thumbnail;
    }
  }

  // Note: Certification files still use Storage for now
  // If needed, these can also be converted to Base64 later
  const certificationsWithUrls: Array<{ name: string; fileUrl?: string }> = [];
  if (formData.professionalInfo.certifications) {
    for (const cert of formData.professionalInfo.certifications) {
      // For now, certifications still use file URLs
      // In the future, these could also be Base64
      let fileUrl: string | undefined;
      if (typeof cert.file === "string") {
        fileUrl = cert.file;
      }
      certificationsWithUrls.push({
        name: cert.name,
        fileUrl,
      });
    }
  }

  // Construct rich text description
  const description = constructCaregiverDescription(formData);

  // Generate embedding
  let embedding: number[] | undefined;
  try {
    embedding = await generateCaregiverEmbedding(description, userId);
  } catch (error) {
    console.error("Error generating embedding, continuing without it:", error);
    // Continue without embedding - the function might not be deployed yet
  }

  // Prepare caregiver data
  const caregiverData: CaregiverData = {
    personalInfo: {
      name: formData.personalInfo.name,
      location: formData.personalInfo.location,
      profilePhotoBase64,
      profilePhotoThumbnailBase64,
      photoUploadedAt: profilePhotoBase64 ? serverTimestamp() : undefined,
    },
    professionalInfo: {
      yearsOfExperience: formData.professionalInfo.yearsOfExperience,
      specializations: formData.professionalInfo.specializations,
      certifications: certificationsWithUrls.length > 0 ? certificationsWithUrls : undefined,
    },
    experienceDescription: formData.experienceDescription,
    availability: formData.availability,
    preferences: formData.preferences,
    userId,
    embedding,
    description,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Save to Firestore
  await setDoc(doc(db, "caregivers", userId), caregiverData);
}
