/**
 * Optimized Firestore queries for caregivers
 * Excludes large Base64 images from list queries to improve performance
 */

import { collection, query, QueryConstraint, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./config";

export interface CaregiverListItem {
  userId: string;
  name: string;
  location: string;
  profilePhotoThumbnailBase64?: string; // Only thumbnail for list views
  yearsOfExperience: number;
  specializations: string[];
  // Excludes: profilePhotoBase64 (full size), description, embedding, etc.
}

export interface CaregiverFullProfile {
  userId: string;
  name: string;
  location: string;
  profilePhotoBase64?: string; // Full size photo
  profilePhotoThumbnailBase64?: string;
  yearsOfExperience: number;
  specializations: string[];
  certifications?: Array<{ name: string; fileUrl?: string }>;
  experienceDescription?: string;
  availability?: any;
  preferences?: any;
  // All fields included
}

/**
 * Fetch caregiver list with optimized fields (excludes full photo)
 * Use this for list views, match cards, etc.
 */
export async function getCaregiverList(
  constraints: QueryConstraint[] = []
): Promise<CaregiverListItem[]> {
  const caregiversRef = collection(db, "caregivers");
  const q = query(caregiversRef, ...constraints);
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      userId: doc.id,
      name: data.personalInfo?.name || "",
      location: data.personalInfo?.location || "",
      profilePhotoThumbnailBase64: data.personalInfo?.profilePhotoThumbnailBase64,
      yearsOfExperience: data.professionalInfo?.yearsOfExperience || 0,
      specializations: data.professionalInfo?.specializations || [],
    };
  });
}

/**
 * Fetch full caregiver profile including full-size photo
 * Use this when viewing individual caregiver profile page
 */
export async function getCaregiverFullProfile(
  caregiverId: string
): Promise<CaregiverFullProfile | null> {
  const caregiverRef = doc(db, "caregivers", caregiverId);
  const caregiverSnap = await getDoc(caregiverRef);

  if (!caregiverSnap.exists()) {
    return null;
  }

  const data = caregiverSnap.data();
  return {
    userId: caregiverSnap.id,
    name: data.personalInfo?.name || "",
    location: data.personalInfo?.location || "",
    profilePhotoBase64: data.personalInfo?.profilePhotoBase64,
    profilePhotoThumbnailBase64: data.personalInfo?.profilePhotoThumbnailBase64,
    yearsOfExperience: data.professionalInfo?.yearsOfExperience || 0,
    specializations: data.professionalInfo?.specializations || [],
    certifications: data.professionalInfo?.certifications,
    experienceDescription: data.experienceDescription?.experienceDescription,
    availability: data.availability,
    preferences: data.preferences,
  };
}

/**
 * Fetch only the full-size photo for a caregiver
 * Use this for lazy loading photos in list views
 */
export async function getCaregiverPhoto(caregiverId: string): Promise<string | undefined> {
  const caregiverRef = doc(db, "caregivers", caregiverId);
  const caregiverSnap = await getDoc(caregiverRef);

  if (!caregiverSnap.exists()) {
    return undefined;
  }

  const data = caregiverSnap.data();
  return data.personalInfo?.profilePhotoBase64;
}

