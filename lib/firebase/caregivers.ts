import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { generateCaregiverEmbedding, constructCaregiverDescription } from "./embeddings";
import { Certificate } from "@/lib/types/firestore";
// NOTE: Storage removed - all files stored as Base64 in Firestore
// Profile photos: in main document
// Certificates: in subcollection /certificates

// Remove undefined values from object (Firestore doesn't allow them)
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(removeUndefined);
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const value = removeUndefined(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return obj;
}

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
    certificationCount?: number; // Number of certificates in subcollection
    certifications?: Array<{
      name: string;
      fileUrl?: string;
    }>; // @deprecated - use /certificates subcollection
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

  // Save certificates to subcollection as Base64
  let certificationCount = 0;
  if (formData.professionalInfo.certifications) {
    const certificatesRef = collection(db, "caregivers", userId, "certificates");
    
    for (const cert of formData.professionalInfo.certifications) {
      // Only save if file is provided and in Base64 format
      if (cert.file && typeof cert.file === "object" && "base64" in cert.file) {
        const certDoc: Omit<Certificate, "id"> = {
          name: cert.name,
          type: "professional", // Default type, can be enhanced later
          file: {
            base64: cert.file.base64,
            originalName: cert.file.originalName,
            mimeType: cert.file.mimeType,
            sizeKB: cert.file.sizeKB,
          },
          verified: false,
          uploadedAt: serverTimestamp() as any, // Firestore Timestamp
        };
        
        // Create document with name as ID for easy lookup
        const certId = cert.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        await setDoc(doc(certificatesRef, certId), certDoc);
        certificationCount++;
      }
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
      certificationCount: certificationCount > 0 ? certificationCount : undefined,
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

  // Clean the data - remove all undefined fields before saving
  const cleanedData = removeUndefined(caregiverData);

  // Save to Firestore
  await setDoc(doc(db, "caregivers", userId), cleanedData);
}
