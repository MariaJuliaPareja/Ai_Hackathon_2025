/**
 * Firestore data models for Base64 storage
 * 
 * This file defines the TypeScript interfaces for all Firestore documents
 * using Base64 inline storage instead of Firebase Storage.
 * 
 * @see STORAGE_MIGRATION_AUDIT.md for migration details
 */

import { Timestamp } from "firebase/firestore";

/**
 * Profile photo stored as Base64 in Firestore
 * Includes both full-size and thumbnail versions for optimized loading
 */
export interface ProfilePhoto {
  /** Full-size Base64-encoded image (800x800px, ~200KB) */
  base64: string;
  /** Thumbnail Base64-encoded image (100x100px, ~20KB) for list views */
  thumbnail: string;
  /** Original filename */
  originalName: string;
  /** MIME type (e.g., 'image/jpeg') */
  mimeType: string;
  /** Size in KB after compression */
  sizeKB: number;
  /** Upload timestamp */
  uploadedAt: Timestamp;
}

/**
 * Certificate file stored as Base64 in Firestore subcollection
 */
export interface CertificateFile {
  /** Base64-encoded file (PDF or image) */
  base64: string;
  /** Original filename */
  originalName: string;
  /** MIME type (e.g., 'application/pdf', 'image/jpeg') */
  mimeType: string;
  /** Size in KB */
  sizeKB: number;
}

/**
 * Caregiver profile document
 * 
 * Firestore path: /caregivers/{userId}
 * 
 * @note This interface represents the NEW schema with structured ProfilePhoto.
 * The existing CaregiverData interface in lib/firebase/caregivers.ts uses
 * flat fields (profilePhotoBase64, profilePhotoThumbnailBase64) for backward compatibility.
 * 
 * Migration path: Gradually migrate from flat fields to structured ProfilePhoto object.
 */
export interface CaregiverProfile {
  /** Document ID (same as userId) */
  id: string;
  /** User ID from Firebase Auth */
  userId: string;
  
  // Personal Information
  personalInfo: {
    /** Full name */
    name: string;
    /** Email address */
    email?: string;
    /** Location (city, state) */
    location: string;
    /** Profile photo stored as Base64 (NEW structured format) */
    profilePhoto?: ProfilePhoto;
    /** @deprecated Old Storage URL (for backwards compatibility during migration) */
    profilePhotoURL?: string;
    /** @deprecated Legacy Base64 field - use profilePhoto.base64 instead */
    profilePhotoBase64?: string;
    /** @deprecated Legacy thumbnail field - use profilePhoto.thumbnail instead */
    profilePhotoThumbnailBase64?: string;
    /** @deprecated Legacy timestamp - use profilePhoto.uploadedAt instead */
    photoUploadedAt?: Timestamp;
  };
  
  // Professional Information
  professionalInfo: {
    /** Years of experience */
    yearsOfExperience: number;
    /** Specializations (medical terms in Spanish) */
    specializations: string[];
    /** Certification count (for quick reference, updated when certs change) */
    certificationCount?: number;
    /** @deprecated Legacy certifications array - use /certificates subcollection */
    certifications?: Array<{
      name: string;
      fileUrl?: string; // Old Storage URL
    }>;
  };
  
  // Experience Description
  experienceDescription?: {
    /** Detailed experience description */
    experienceDescription: string;
  };
  
  // Availability
  availability?: {
    [key: string]: {
      morning: { start: string; end: string; available: boolean };
      afternoon: { start: string; end: string; available: boolean };
      evening: { start: string; end: string; available: boolean };
    };
  };
  
  // Preferences
  preferences?: {
    preferredAgeRange?: { min: number; max: number };
    conditionsComfortableWith?: string[];
  };
  
  // ML/AI Fields
  /** Embedding vector for similarity matching (384 dimensions) */
  embedding?: number[];
  /** Rich text description for embedding generation */
  description?: string;
  
  // Metadata
  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Certificate document (stored in subcollection)
 * 
 * Firestore path: /caregivers/{userId}/certificates/{certId}
 */
export interface Certificate {
  /** Document ID */
  id: string;
  /** Certificate name (e.g., "CNA", "CPR/First Aid") */
  name: string;
  /** Certificate type */
  type: 'professional' | 'training' | 'background_check' | 'other';
  
  /** File stored as Base64 */
  file: CertificateFile;
  
  /** Issuing organization */
  issuedBy?: string;
  /** Issue date */
  issuedDate?: Timestamp;
  /** Expiry date (if applicable) */
  expiryDate?: Timestamp;
  /** Whether certificate has been verified by admin */
  verified: boolean;
  /** Upload timestamp */
  uploadedAt: Timestamp;
  
  /** @deprecated Old Storage URL (for backwards compatibility) */
  fileUrl?: string;
}

/**
 * Senior profile document
 * 
 * Firestore path: /seniors/{userId}
 * 
 * @note This interface matches the simplified structure used in the onboarding form.
 * All ML-critical fields are stored at the top level for easy access by matching algorithms.
 */
export interface SeniorProfile {
  userId: string;
  email: string;
  role: 'senior';
  
  // Basic Info
  name: string;
  age: number;
  gender: 'M' | 'F' | 'other';
  location: string;
  profilePhoto?: {
    base64: string;
    thumbnail: string;
  };
  
  // Medical Profile - ML CRITICAL
  medical_comorbidities: string;
  mobility_score: number; // 1-4
  cognitive_status: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  
  // Care Needs - ML CRITICAL
  routine_medication_times: string;
  routine_assistance_tasks: string[];
  care_intensity: 'light' | 'moderate' | 'intensive' | '24_7';
  special_requirements?: string;
  
  // Family Contact
  family_name: string;
  family_relationship: string;
  family_phone: string;
  family_email: string;
  family_password?: string; // Password for creating family account (temporary, should be used immediately)
  
  // System
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Matching (populated by backend)
  embedding?: number[]; // 384-dim vector
  match_status?: 'pending' | 'processing' | 'ready';
  match_count?: number;
}

/**
 * Match document
 * 
 * Firestore path: /seniors/{seniorId}/matches/{matchId}
 * 
 * @note This interface uses snake_case to match the existing Match interface
 * in components/matches/types.ts for compatibility.
 */
export interface Match {
  /** Document ID */
  id: string;
  /** Senior user ID */
  senior_id: string;
  /** Caregiver user ID */
  caregiver_id: string;
  /** Match rank (1 = best match) */
  rank: number;
  /** Overall match score */
  score: number;
  /** Score type: 'ml' | 'heuristic' */
  score_type: string;
  /** Embedding similarity score (0-1) */
  similarity: number;
  
  /** Feature scores (snake_case for compatibility) */
  features: {
    similarity: number;
    location_score: number;
    availability_score: number;
    specialization_score: number;
    price_score: number;
    years_experience: number;
    certification_count: number;
  };
  
  /** Cached metadata (optional, for quick display) */
  metadata?: {
    name?: string;
    location?: string;
    /** Base64 thumbnail for quick display */
    profilePhotoBase64?: string;
    /** @deprecated Use profilePhotoBase64 */
    profilePhotoThumbnailBase64?: string;
    specializations?: string[];
  };
  
  /** Creation timestamp */
  createdAt?: Timestamp;
}

/**
 * Interest document (swipe/interaction)
 * 
 * Firestore path: /interests/{interestId}
 */
export interface Interest {
  /** Document ID (format: {seniorId}_{caregiverId}) */
  id: string;
  /** Senior user ID */
  seniorId: string;
  /** Caregiver user ID */
  caregiverId: string;
  /** Match ID (if exists) */
  matchId?: string;
  /** Interest type */
  type: 'interest' | 'super_like' | 'pass';
  /** Creation timestamp */
  createdAt: Timestamp;
}

/**
 * Mutual match document
 * 
 * Firestore path: /matches/{matchId}
 */
export interface MutualMatch {
  /** Document ID */
  id: string;
  /** Senior user ID */
  seniorId: string;
  /** Caregiver user ID */
  caregiverId: string;
  /** Original match ID */
  matchId: string;
  /** Match status */
  status: 'matched' | 'contacted' | 'hired' | 'completed';
  /** Rating (1-5 stars, if completed) */
  rating?: number;
  /** Review text (if completed) */
  review?: string;
  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
}

/**
 * Firestore Collection Structure
 * 
 * /caregivers/{userId}
 *   - Profile document with profilePhoto.base64 and profilePhoto.thumbnail
 *   - Subcollection: /certificates/{certId}
 *     - Certificate documents with file.base64
 * 
 * /seniors/{userId}
 *   - Profile document with profilePhoto.base64 and profilePhoto.thumbnail
 *   - Subcollection: /matches/{matchId}
 *     - Match documents
 * 
 * /interests/{interestId}
 *   - Interest documents (swipe interactions)
 * 
 * /matches/{matchId}
 *   - Mutual match documents
 * 
 * /matching_queue/{queueId}
 *   - Queue documents for triggering matching process
 * 
 * /config/{documentId}
 *   - Configuration documents (ML model settings, etc.)
 */

/**
 * Helper type for Firestore document with ID
 */
export type FirestoreDocument<T> = T & { id: string };

/**
 * Helper type for creating new documents (without id, timestamps)
 */
export type CreateDocument<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Helper type for updating documents (without id, createdAt)
 */
export type UpdateDocument<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt: Timestamp;
};

