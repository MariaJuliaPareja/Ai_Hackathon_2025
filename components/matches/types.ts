export interface Match {
  id: string;
  caregiver_id: string;
  rank: number;
  score: number;
  score_type: string;
  similarity: number;
  features: {
    similarity: number;
    location_score: number;
    availability_score: number;
    specialization_score: number;
    price_score: number;
    years_experience: number;
    certification_count: number;
  };
  metadata?: {
    name?: string;
    profilePhotoBase64?: string; // Base64-encoded image
    location?: string;
    specializations?: string[];
  };
}

export interface CaregiverData {
  name: string;
  profilePhotoBase64?: string; // Base64-encoded image string
  location: string;
  specializations: string[];
  yearsOfExperience: number;
  certifications?: Array<{ name: string }>;
}

