/**
 * Mock caregiver data generator for development/demo purposes
 * Creates realistic caregiver profiles in Firestore for testing
 */

import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './config';
import { serverTimestamp } from 'firebase/firestore';

export interface MockCaregiver {
  userId: string;
  personalInfo: {
    name: string;
    location: string;
    profilePhotoBase64?: string;
    profilePhotoThumbnailBase64?: string;
  };
  professionalInfo: {
    yearsOfExperience: number;
    specializations: string[];
    certificationCount?: number;
  };
  experienceDescription: {
    experienceDescription: string;
  };
  availability: {
    [key: string]: number[];
  };
  preferences: {
    preferredAgeRange?: [number, number];
    preferredGender?: string;
    maxDistance?: number;
  };
  active: boolean;
  onboardingCompleted: boolean;
  bio?: string;
  hourlyRate: number;
  avgRating?: number;
  createdAt: any;
  updatedAt: any;
}

const MOCK_CAREGIVERS: Omit<MockCaregiver, 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    personalInfo: {
      name: 'Claudia Mendoza',
      location: 'Miraflores, Lima',
    },
    professionalInfo: {
      yearsOfExperience: 7,
      specializations: ['Alzheimer', 'Demencia', 'Diabetes', 'Cuidado de adultos mayores'],
      certificationCount: 3,
    },
    experienceDescription: {
      experienceDescription: 'Soy enfermera con 7 años de experiencia especializada en cuidado de adultos mayores con Alzheimer y demencia. He trabajado en hogares de ancianos y atención domiciliaria. Manejo medicación inyectable, monitoreo de signos vitales y apoyo emocional.',
    },
    availability: {
      lun: [8, 18],
      mar: [8, 18],
      mie: [8, 18],
      jue: [8, 18],
      vie: [8, 18],
      sab: [8, 14],
    },
    preferences: {
      preferredAgeRange: [70, 90],
      maxDistance: 10,
    },
    active: true,
    onboardingCompleted: true,
    bio: 'Enfermera profesional con pasión por el cuidado de adultos mayores. Especializada en demencia y Alzheimer. Creo en un enfoque compasivo y centrado en la familia.',
    hourlyRate: 38,
    avgRating: 4.8,
  },
  {
    personalInfo: {
      name: 'María Elena Quispe',
      location: 'San Isidro, Lima',
    },
    professionalInfo: {
      yearsOfExperience: 5,
      specializations: ['Parkinson', 'Movilidad reducida', 'Fisioterapia básica'],
      certificationCount: 2,
    },
    experienceDescription: {
      experienceDescription: 'Cuidadora con 5 años de experiencia ayudando a adultos mayores con problemas de movilidad y Parkinson. Tengo conocimientos básicos de fisioterapia y soy paciente y comprensiva.',
    },
    availability: {
      lun: [9, 17],
      mar: [9, 17],
      mie: [9, 17],
      jue: [9, 17],
      vie: [9, 17],
    },
    preferences: {
      preferredAgeRange: [65, 85],
      maxDistance: 15,
    },
    active: true,
    onboardingCompleted: true,
    bio: 'Cuidadora dedicada con experiencia en Parkinson y movilidad reducida. Me especializo en ayudar a mantener la independencia y calidad de vida.',
    hourlyRate: 32,
    avgRating: 4.6,
  },
  {
    personalInfo: {
      name: 'Rosa Huamán',
      location: 'Surco, Lima',
    },
    professionalInfo: {
      yearsOfExperience: 10,
      specializations: ['Cuidado general', 'Compañía', 'Tareas del hogar', 'Medicación oral'],
      certificationCount: 4,
    },
    experienceDescription: {
      experienceDescription: 'Con más de 10 años de experiencia, he cuidado a múltiples adultos mayores. Me especializo en compañía, tareas del hogar y administración de medicamentos. Soy muy organizada y confiable.',
    },
    availability: {
      lun: [7, 19],
      mar: [7, 19],
      mie: [7, 19],
      jue: [7, 19],
      vie: [7, 19],
      sab: [8, 16],
      dom: [8, 16],
    },
    preferences: {
      preferredAgeRange: [60, 95],
      maxDistance: 20,
    },
    active: true,
    onboardingCompleted: true,
    bio: 'Cuidadora experimentada y confiable. Me encanta ayudar a adultos mayores a mantener su independencia y bienestar. Siempre con una sonrisa.',
    hourlyRate: 28,
    avgRating: 4.9,
  },
  {
    personalInfo: {
      name: 'Carmen Torres',
      location: 'La Molina, Lima',
    },
    professionalInfo: {
      yearsOfExperience: 4,
      specializations: ['Diabetes', 'Hipertensión', 'Alimentación saludable'],
      certificationCount: 2,
    },
    experienceDescription: {
      experienceDescription: 'Cuidadora con 4 años de experiencia especializada en diabetes e hipertensión. Tengo conocimientos en nutrición y preparo comidas saludables. Monitoreo de glucosa y presión arterial.',
    },
    availability: {
      lun: [8, 16],
      mar: [8, 16],
      mie: [8, 16],
      jue: [8, 16],
      vie: [8, 16],
    },
    preferences: {
      preferredAgeRange: [70, 88],
      maxDistance: 12,
    },
    active: true,
    onboardingCompleted: true,
    bio: 'Especialista en cuidado de adultos mayores con diabetes e hipertensión. Creo en una alimentación saludable y monitoreo constante de la salud.',
    hourlyRate: 35,
    avgRating: 4.7,
  },
  {
    personalInfo: {
      name: 'Ana García',
      location: 'Barranco, Lima',
    },
    professionalInfo: {
      yearsOfExperience: 6,
      specializations: ['Cuidado post-operatorio', 'Heridas', 'Medicación compleja'],
      certificationCount: 3,
    },
    experienceDescription: {
      experienceDescription: 'Enfermera con 6 años de experiencia en cuidado post-operatorio y manejo de heridas. He trabajado con pacientes que requieren atención médica compleja y administración de múltiples medicamentos.',
    },
    availability: {
      lun: [10, 20],
      mar: [10, 20],
      mie: [10, 20],
      jue: [10, 20],
      vie: [10, 20],
      sab: [10, 18],
    },
    preferences: {
      preferredAgeRange: [75, 92],
      maxDistance: 8,
    },
    active: true,
    onboardingCompleted: true,
    bio: 'Enfermera profesional especializada en cuidado post-operatorio. Experiencia en manejo de heridas y medicación compleja. Muy detallista y profesional.',
    hourlyRate: 40,
    avgRating: 4.9,
  },
];

/**
 * Check if mock caregivers already exist
 */
export async function hasMockCaregivers(): Promise<boolean> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'caregivers'),
        where('onboardingCompleted', '==', true),
        where('active', '==', true)
      )
    );
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking mock caregivers:', error);
    return false;
  }
}

/**
 * Create mock caregivers in Firestore
 */
export async function createMockCaregivers(): Promise<void> {
  try {
    const existing = await hasMockCaregivers();
    if (existing) {
      console.log('✅ Mock caregivers already exist, skipping creation');
      return;
    }

    console.log('📝 Creating mock caregivers...');

    for (let i = 0; i < MOCK_CAREGIVERS.length; i++) {
      const mockData = MOCK_CAREGIVERS[i];
      const userId = `mock-caregiver-${i + 1}`;

      const caregiverData: MockCaregiver = {
        userId,
        ...mockData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'caregivers', userId), caregiverData);
      console.log(`✅ Created mock caregiver: ${mockData.personalInfo.name}`);
    }

    console.log(`✅ Successfully created ${MOCK_CAREGIVERS.length} mock caregivers`);
  } catch (error) {
    console.error('❌ Error creating mock caregivers:', error);
    throw error;
  }
}

/**
 * Generate simple mock matches without Claude API (for demo)
 */
export function generateMockMatches(
  seniorData: any,
  caregivers: any[]
): any[] {
  return caregivers.map((caregiver, index) => {
    // Simple scoring based on location and experience
    const locationMatch = seniorData.location === caregiver.personalInfo?.location ? 100 : 70;
    const experienceScore = Math.min((caregiver.professionalInfo?.yearsOfExperience / 10) * 100, 100);
    
    // Check skills match
    const seniorTasks = seniorData.routine_assistance_tasks || [];
    const caregiverSkills = caregiver.professionalInfo?.specializations || [];
    const skillsMatch = seniorTasks.length > 0
      ? Math.round((seniorTasks.filter((task: string) =>
          caregiverSkills.some((skill: string) =>
            skill.toLowerCase().includes(task.toLowerCase()) ||
            task.toLowerCase().includes(skill.toLowerCase())
          )
        ).length / seniorTasks.length) * 100)
      : 80;

    const overall = Math.round(
      skillsMatch * 0.40 +
      locationMatch * 0.20 +
      experienceScore * 0.20 +
      75 * 0.10 + // availability
      80 * 0.10   // experience level
    );

    return {
      matchId: `match-${Date.now()}-${index}`,
      caregiverId: caregiver.userId || caregiver.id,
      seniorId: '',
      score: {
        overall,
        breakdown: {
          semantic_similarity: skillsMatch,
          skills_match: skillsMatch,
          location_proximity: locationMatch,
          availability_fit: 75,
          experience_level: experienceScore,
        },
      },
      mlReasoning: {
        summary: `${overall >= 85 ? 'Excelente' : overall >= 70 ? 'Buen' : 'Aceptable'} match. ${caregiver.personalInfo?.name} tiene ${caregiver.professionalInfo?.yearsOfExperience} años de experiencia${locationMatch >= 90 ? ' y está en la misma ubicación' : ''}.`,
        strengths: [
          `${caregiver.professionalInfo?.yearsOfExperience} años de experiencia profesional`,
          locationMatch >= 90 ? 'Misma ubicación' : 'Ubicación cercana',
          `${caregiver.professionalInfo?.specializations?.length || 0} especializaciones`,
          caregiver.professionalInfo?.specializations?.[0] ? `Experiencia en ${caregiver.professionalInfo.specializations[0]}` : 'Experiencia general',
        ],
        considerations: overall < 80 ? ['Match basado en perfil general, se recomienda entrevista'] : [],
        compatibility_factors: {
          medical_expertise: caregiver.professionalInfo?.specializations?.length > 0
            ? `Experiencia en: ${caregiver.professionalInfo.specializations.join(', ')}`
            : 'Experiencia general en cuidado de adultos mayores',
          care_approach: caregiver.bio || caregiver.experienceDescription?.experienceDescription || 'Cuidadora profesional y dedicada',
          practical_fit: `Ubicado en ${caregiver.personalInfo?.location}, tarifa S/${caregiver.hourlyRate || 30}/hora${caregiver.avgRating ? `, calificación ${caregiver.avgRating}/5` : ''}`,
        },
      },
      caregiver: {
        name: caregiver.personalInfo?.name || caregiver.name || 'Cuidador',
        age: 35 + index * 5,
        location: caregiver.personalInfo?.location || caregiver.location || 'Lima',
        yearsExperience: caregiver.professionalInfo?.yearsOfExperience || caregiver.yearsExperience || 5,
        skills: caregiver.professionalInfo?.specializations || caregiver.skills || [],
        certifications: caregiver.professionalInfo?.specializations || [],
        bio: caregiver.bio || caregiver.experienceDescription?.experienceDescription || 'Cuidadora profesional',
        profilePhoto: caregiver.personalInfo?.profilePhoto,
        hourlyRate: caregiver.hourlyRate || 30,
        availability: caregiver.availability || {},
        avgRating: caregiver.avgRating,
      },
      status: 'pending',
      createdAt: new Date(),
      rank: index + 1,
    };
  }).sort((a, b) => b.score.overall - a.score.overall);
}

