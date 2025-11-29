"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { caregiverOnboardingSchema, CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { saveCaregiverProfile } from "@/lib/firebase/caregivers";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import ProfessionalInfoStep from "./steps/ProfessionalInfoStep";
import ExperienceDescriptionStep from "./steps/ExperienceDescriptionStep";
import AvailabilityStep from "./steps/AvailabilityStep";
import PreferencesStep from "./steps/PreferencesStep";

const TOTAL_STEPS = 5;

export default function CaregiverOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const methods = useForm<CaregiverOnboardingFormData>({
    resolver: zodResolver(caregiverOnboardingSchema),
    mode: "onChange",
    defaultValues: {
      personalInfo: {
        name: "",
        location: "",
      },
      professionalInfo: {
        yearsOfExperience: 0,
        specializations: [],
        certifications: [],
      },
      experienceDescription: {
        experienceDescription: "",
      },
      availability: {
        monday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
        tuesday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
        wednesday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
        thursday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
        friday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
        saturday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
        sunday: {
          morning: { start: "09:00", end: "12:00", available: false },
          afternoon: { start: "12:00", end: "17:00", available: false },
          evening: { start: "17:00", end: "21:00", available: false },
        },
      },
      preferences: {
        preferredAgeRange: {
          min: 65,
          max: 85,
        },
        conditionsComfortableWith: [],
      },
    },
  });

  const { handleSubmit, trigger } = methods;
  const progress = (currentStep / TOTAL_STEPS) * 100;

  const getStepSchema = (step: number) => {
    switch (step) {
      case 1:
        return "personalInfo";
      case 2:
        return "professionalInfo";
      case 3:
        return "experienceDescription";
      case 4:
        return "availability";
      case 5:
        return "preferences";
      default:
        return "";
    }
  };

  const handleNext = async () => {
    const fieldName = getStepSchema(currentStep) as keyof CaregiverOnboardingFormData;
    const isValid = await trigger(fieldName as any);
    
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CaregiverOnboardingFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await saveCaregiverProfile(user.uid, data);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving caregiver profile:", error);
      alert("Error al guardar el perfil. Por favor, intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    "Información Personal",
    "Información Profesional",
    "Descripción de Experiencia",
    "Disponibilidad",
    "Preferencias",
  ];

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  Perfil de Cuidador
                </CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Paso {currentStep} de {TOTAL_STEPS}: {stepTitles[currentStep - 1]}
                </CardDescription>
                <Progress value={progress} className="mt-4 h-2 bg-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-6 bg-white">
              <form onSubmit={handleSubmit(onSubmit)}>
                {currentStep === 1 && <PersonalInfoStep />}
                {currentStep === 2 && <ProfessionalInfoStep />}
                {currentStep === 3 && <ExperienceDescriptionStep />}
                {currentStep === 4 && <AvailabilityStep />}
                {currentStep === 5 && <PreferencesStep />}

                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    Atrás
                  </Button>
                  {currentStep < TOTAL_STEPS ? (
                    <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                      Siguiente
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                      {isSubmitting ? "Guardando..." : "Completar Perfil"}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}
