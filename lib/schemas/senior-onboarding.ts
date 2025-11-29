import { z } from "zod";

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  age: z.number().min(18, "La edad debe ser al menos 18").max(120, "Edad inválida"),
  location: z.string().min(2, "La ubicación es requerida"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").optional(),
  photo: z.union([
    // New format: object with full and thumbnail
    z.object({
      full: z.string().refine(
        (val) => {
          if (!val.startsWith("data:image/")) return false;
          const sizeKB = (val.length * 3) / 4 / 1024;
          return sizeKB <= 900;
        },
        { message: "La imagen completa debe ser menor a 900KB" }
      ),
      thumbnail: z.string().refine(
        (val) => {
          if (!val.startsWith("data:image/")) return false;
          const sizeKB = (val.length * 3) / 4 / 1024;
          return sizeKB <= 50;
        },
        { message: "La miniatura debe ser menor a 50KB" }
      ),
    }),
    // Legacy format: single string
    z.string().optional().refine(
      (val) => {
        if (!val) return true;
        if (!val.startsWith("data:image/")) return false;
        const sizeKB = (val.length * 3) / 4 / 1024;
        return sizeKB <= 900;
      },
      { message: "La imagen debe ser un Base64 válido y menor a 900KB" }
    ),
  ]).optional(),
});

// Step 2: Medical Profile
export const medicalProfileSchema = z.object({
  conditions: z.array(z.string()).min(1, "Selecciona al menos una condición médica"),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
  })).optional(),
  allergies: z.array(z.string()).optional(),
  mobilityLevel: z.enum(["independiente", "asistencia_ligera", "asistencia_moderada", "asistencia_completa", "inmóvil"]),
  cognitiveLevel: z.enum(["lucido", "leve_deterioro", "moderado_deterioro", "severa_demencia"]),
  requiresMedicalEquipment: z.boolean(),
  medicalEquipment: z.array(z.string()).optional(),
});

// Step 3: Senior Needs (ML CRITICAL)
export const seniorNeedsSchema = z.object({
  // Daily routine
  dailyRoutine: z.object({
    wakeTime: z.string(),
    bedTime: z.string(),
    mealTimes: z.array(z.string()).min(1, "Especifica al menos un horario de comida"),
    medicationTimes: z.array(z.string()).optional(),
    preferredActivities: z.array(z.string()).optional(),
  }),
  
  // Care needs
  careNeeds: z.object({
    personalCare: z.array(z.string()).min(1, "Selecciona al menos una necesidad de cuidado personal"),
    mealAssistance: z.enum(["ninguna", "preparacion", "alimentacion_asistida", "sonda_enteral"]),
    medicationManagement: z.enum(["independiente", "recordatorios", "administracion_completa"]),
    mobilityAssistance: z.enum(["ninguna", "supervision", "asistencia_parcial", "asistencia_completa"]),
    cognitiveSupport: z.enum(["ninguna", "recordatorios", "orientacion", "supervision_constante"]),
  }),
  
  // Availability needed
  availabilityNeeded: z.object({
    monday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
    tuesday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
    wednesday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
    thursday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
    friday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
    saturday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
    sunday: z.object({
      morning: z.boolean(),
      afternoon: z.boolean(),
      evening: z.boolean(),
      overnight: z.boolean(),
    }),
  }),
  
  // Budget
  budgetRange: z.object({
    min: z.number().min(0, "El presupuesto mínimo debe ser 0 o mayor"),
    max: z.number().min(0, "El presupuesto máximo debe ser 0 o mayor"),
  }).refine((data) => data.min <= data.max, {
    message: "El presupuesto mínimo debe ser menor o igual al máximo",
  }),
  
  // Preferences
  preferredLanguages: z.array(z.string()).optional(),
  preferredGender: z.enum(["cualquiera", "masculino", "femenino"]).optional(),
  specialRequirements: z.string().optional(),
});

// Step 4: Family Contact
export const familyContactSchema = z.object({
  isFamilyMember: z.boolean(),
  familyContacts: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
    isEmergencyContact: z.boolean(),
    isPrimaryContact: z.boolean(),
  })).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
});

// Complete form schema
export const seniorOnboardingSchema = z.object({
  basicInfo: basicInfoSchema,
  medicalProfile: medicalProfileSchema,
  seniorNeeds: seniorNeedsSchema,
  familyContact: familyContactSchema,
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type MedicalProfileFormData = z.infer<typeof medicalProfileSchema>;
export type SeniorNeedsFormData = z.infer<typeof seniorNeedsSchema>;
export type FamilyContactFormData = z.infer<typeof familyContactSchema>;
export type SeniorOnboardingFormData = z.infer<typeof seniorOnboardingSchema>;

// Medical condition options (matching caregiver specializations)
export const MEDICAL_CONDITIONS = [
  "Demencia vascular",
  "Disfagia y alimentación asistida",
  "Post-ACV y rehabilitación",
  "Sonda PEG y alimentación enteral",
  "Cuidado paliativo",
  "Diabetes e hipertensión",
  "Parkinson y trastornos del movimiento",
  "Movilidad asistida y prevención de caídas",
  "Enfermedad de Alzheimer",
  "Enfermedad de Parkinson",
  "Demencia",
  "Enfermedad Cardíaca",
  "Recuperación de ACV",
  "Artritis",
  "Deterioro Visual",
  "Deterioro Auditivo",
  "Condiciones de Salud Mental",
] as const;

// Personal care needs
export const PERSONAL_CARE_NEEDS = [
  "Baño y aseo personal",
  "Vestirse",
  "Alimentación",
  "Movilidad y transferencias",
  "Incontinencia",
  "Cuidado de la piel",
  "Cuidado de heridas",
] as const;

// Medical equipment options
export const MEDICAL_EQUIPMENT = [
  "Silla de ruedas",
  "Andador",
  "Bastón",
  "Cama hospitalaria",
  "Colchón antiescaras",
  "Oxígeno",
  "Nebulizador",
  "Sonda de alimentación",
  "Monitor de signos vitales",
  "Otro",
] as const;


