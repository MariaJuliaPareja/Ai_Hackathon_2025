import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "./config";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateCaregiverEmbedding, constructCaregiverDescription } from "./embeddings";

export interface CaregiverData {
  personalInfo: {
    name: string;
    location: string;
    photoUrl?: string;
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
  let photoUrl: string | undefined;

  // Upload photo if provided
  if (formData.personalInfo.photo instanceof File) {
    const photoRef = ref(storage, `caregivers/${userId}/photo`);
    await uploadBytes(photoRef, formData.personalInfo.photo);
    photoUrl = await getDownloadURL(photoRef);
  } else if (typeof formData.personalInfo.photo === "string") {
    photoUrl = formData.personalInfo.photo;
  }

  // Upload certification files
  const certificationsWithUrls: Array<{ name: string; fileUrl?: string }> = [];
  if (formData.professionalInfo.certifications) {
    for (const cert of formData.professionalInfo.certifications) {
      let fileUrl: string | undefined;
      if (cert.file instanceof File) {
        const certRef = ref(storage, `caregivers/${userId}/certifications/${cert.name}`);
        await uploadBytes(certRef, cert.file);
        fileUrl = await getDownloadURL(certRef);
      } else if (typeof cert.file === "string") {
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
      photoUrl,
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
