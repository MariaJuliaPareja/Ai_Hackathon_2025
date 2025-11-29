import { z } from "zod";

// Step 1: Personal Info
export const personalInfoSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  location: z.string().min(2, "La ubicación es requerida"),
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
          return sizeKB <= 50; // Thumbnail should be small
        },
        { message: "La miniatura debe ser menor a 50KB" }
      ),
    }),
    // Legacy format: single string (for backward compatibility)
    z.string().optional().refine(
      (val) => {
        if (!val) return true; // Optional
        if (!val.startsWith("data:image/")) return false;
        const sizeKB = (val.length * 3) / 4 / 1024;
        return sizeKB <= 900;
      },
      {
        message: "La imagen debe ser un Base64 válido y menor a 900KB",
      }
    ),
  ]).optional(),
});

// Step 2: Professional Info
export const professionalInfoSchema = z.object({
  yearsOfExperience: z.number().min(0, "Los años de experiencia deben ser 0 o más").max(50),
  specializations: z.array(z.string()).min(1, "Selecciona al menos una especialización"),
  certifications: z.array(z.object({
    name: z.string(),
    file: z.instanceof(File).optional().or(z.string().optional()),
  })).optional(),
});

// Step 3: Experience Description
export const experienceDescriptionSchema = z.object({
  experienceDescription: z.string().min(50, "La descripción debe tener al menos 50 caracteres"),
});

// Step 4: Availability
const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
  available: z.boolean(),
});

const dayScheduleSchema = z.object({
  morning: timeSlotSchema,
  afternoon: timeSlotSchema,
  evening: timeSlotSchema,
});

export const availabilitySchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
});

// Step 5: Preferences
export const preferencesSchema = z.object({
  preferredAgeRange: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }).refine((data) => data.min <= data.max, {
    message: "La edad mínima debe ser menor o igual a la edad máxima",
  }),
  conditionsComfortableWith: z.array(z.string()).min(1, "Selecciona al menos una condición"),
});

// Complete form schema
export const caregiverOnboardingSchema = z.object({
  personalInfo: personalInfoSchema,
  professionalInfo: professionalInfoSchema,
  experienceDescription: experienceDescriptionSchema,
  availability: availabilitySchema,
  preferences: preferencesSchema,
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type ProfessionalInfoFormData = z.infer<typeof professionalInfoSchema>;
export type ExperienceDescriptionFormData = z.infer<typeof experienceDescriptionSchema>;
export type AvailabilityFormData = z.infer<typeof availabilitySchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type CaregiverOnboardingFormData = z.infer<typeof caregiverOnboardingSchema>;

// Specialization options
export const SPECIALIZATION_OPTIONS = [
  "Cuidado de demencia vascular",
  "Manejo de disfagia y alimentación asistida",
  "Cuidados post-ACV y rehabilitación",
  "Manejo de sonda PEG y alimentación enteral",
  "Cuidado paliativo",
  "Diabetes e hipertensión",
  "Parkinson y trastornos del movimiento",
  "Movilidad asistida y prevención de caídas",
] as const;

// Certification options
export const CERTIFICATION_OPTIONS = [
  "CNA (Certified Nursing Assistant)",
  "HHA (Home Health Aide)",
  "CPR/First Aid",
  "Dementia Care Specialist",
  "Medication Administration",
  "Physical Therapy Assistant",
  "Licensed Practical Nurse (LPN)",
  "Registered Nurse (RN)",
] as const;
