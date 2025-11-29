import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";
import { SeniorOnboardingFormData } from "@/lib/schemas/senior-onboarding";
import { SeniorProfile } from "@/lib/types/firestore";
// NOTE: All files stored as Base64 in Firestore
// Profile photos: in main document
// No subcollections needed for seniors

export async function saveSeniorProfile(
  userId: string,
  formData: SeniorOnboardingFormData
): Promise<void> {
  // Extract Base64 photos (already compressed and encoded in the form)
  let profilePhotoBase64: string | undefined;
  let profilePhotoThumbnailBase64: string | undefined;

  if (formData.basicInfo.photo) {
    if (typeof formData.basicInfo.photo === "string") {
      profilePhotoBase64 = formData.basicInfo.photo;
    } else if (typeof formData.basicInfo.photo === "object" && formData.basicInfo.photo.full) {
      profilePhotoBase64 = formData.basicInfo.photo.full;
      profilePhotoThumbnailBase64 = formData.basicInfo.photo.thumbnail;
    }
  }

  // Prepare senior data
  const seniorData: Omit<SeniorProfile, "id"> = {
    userId,
    personalInfo: {
      name: formData.basicInfo.name,
      email: undefined, // Can be added later
      location: formData.basicInfo.location,
      profilePhotoBase64,
      profilePhotoThumbnailBase64,
    },
    careRequirements: {
      requiredSpecializations: formData.medicalProfile.conditions,
      conditions: formData.medicalProfile.conditions,
      age: formData.basicInfo.age,
      budgetRange: formData.seniorNeeds.budgetRange,
    },
    // Store detailed needs for ML matching
    medicalProfile: {
      conditions: formData.medicalProfile.conditions,
      medications: formData.medicalProfile.medications,
      allergies: formData.medicalProfile.allergies,
      mobilityLevel: formData.medicalProfile.mobilityLevel,
      cognitiveLevel: formData.medicalProfile.cognitiveLevel,
      requiresMedicalEquipment: formData.medicalProfile.requiresMedicalEquipment,
      medicalEquipment: formData.medicalProfile.medicalEquipment,
    },
    seniorNeeds: {
      dailyRoutine: formData.seniorNeeds.dailyRoutine,
      careNeeds: formData.seniorNeeds.careNeeds,
      availabilityNeeded: formData.seniorNeeds.availabilityNeeded,
      preferredLanguages: formData.seniorNeeds.preferredLanguages,
      preferredGender: formData.seniorNeeds.preferredGender,
      specialRequirements: formData.seniorNeeds.specialRequirements,
    },
    familyContact: formData.familyContact,
    matchStatus: "pending",
    matchCount: 0,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  // Save to Firestore
  await setDoc(doc(db, "seniors", userId), seniorData);
}

