/**
 * Type definitions for ML-powered matching system
 */

export interface MatchScore {
  overall: number; // 0-100
  breakdown: {
    semantic_similarity: number; // Embedding cosine similarity
    skills_match: number; // Critical skills compatibility
    location_proximity: number; // Distance-based score
    availability_fit: number; // Schedule overlap
    experience_level: number; // Years + specializations
  };
}

export interface MLReasoning {
  summary: string; // "Excellent match for dementia care with local availability"
  strengths: string[]; // ["5+ years dementia experience", "Same district", "Fluent in Quechua"]
  considerations?: string[]; // ["Premium rate", "Limited weekend availability"]
  compatibility_factors: {
    medical_expertise: string; // "Strong match for Alzheimer's and diabetes management"
    care_approach: string; // "Patient-centered, family-oriented style"
    practical_fit: string; // "Lives 2km away, available Mon-Fri 8am-6pm"
  };
}

export interface CaregiverMatch {
  matchId: string;
  caregiverId: string;
  seniorId: string;

  // ML Scores
  score: MatchScore;
  mlReasoning: MLReasoning;

  // Caregiver Basic Info (denormalized for performance)
  caregiver: {
    name: string;
    age: number;
    location: string;
    yearsExperience: number;
    skills: string[];
    certifications: string[];
    bio: string;
    profilePhoto?: {
      thumbnail: string;
      base64: string;
    };
    hourlyRate: number;
    availability: {
      [key: string]: number[]; // { "lun": [8, 18], ... }
    };
    avgRating?: number;
    totalHours?: number;
  };

  // Match Metadata
  status: 'pending' | 'viewed' | 'interested' | 'contacted' | 'rejected';
  createdAt: Date;
  viewedAt?: Date;

  // Ranking
  rank: number; // 1-based ranking
}

export interface MatchingStatus {
  status: 'queued' | 'processing' | 'ready' | 'error';
  progress?: number; // 0-100
  currentStep?: string; // "Generating embeddings...", "Comparing profiles...", etc.
  matchCount?: number;
  error?: string;
  lastUpdated: Date;
}

