"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seniorOnboardingSchema, SeniorOnboardingFormData } from "@/lib/schemas/senior-onboarding";
import { saveSeniorProfile } from "@/lib/firebase/seniors";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import BasicInfoStep from "./BasicInfoStep";
import MedicalProfileStep from "./MedicalProfileStep";
import SeniorNeedsStep from "./SeniorNeedsStep";
import FamilyContactStep from "./FamilyContactStep";
import ReviewStep from "./ReviewStep";

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  "Información Básica",
  "Perfil Médico",
  "Necesidades de Cuidado",
  "Contacto de Familia",
  "Revisar",
];

export default function SeniorOnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const methods = useForm<SeniorOnboardingFormData>({
    resolver: zodResolver(seniorOnboardingSchema),
    mode: "onChange",
    defaultValues: {
      basicInfo: {
        name: "",
        age: undefined,
        location: "",
        phone: undefined,
        photo: undefined,
      },
      medicalProfile: {
        conditions: [],
        medications: [],
        allergies: [],
        mobilityLevel: undefined,
        cognitiveLevel: undefined,
        requiresMedicalEquipment: false,
        medicalEquipment: [],
      },
      seniorNeeds: {
        dailyRoutine: {
          wakeTime: "07:00",
          bedTime: "22:00",
          mealTimes: [],
          medicationTimes: [],
          preferredActivities: [],
        },
        careNeeds: {
          personalCare: [],
          mealAssistance: "ninguna",
          medicationManagement: "independiente",
          mobilityAssistance: "ninguna",
          cognitiveSupport: "ninguna",
        },
        availabilityNeeded: {
          monday: { morning: false, afternoon: false, evening: false, overnight: false },
          tuesday: { morning: false, afternoon: false, evening: false, overnight: false },
          wednesday: { morning: false, afternoon: false, evening: false, overnight: false },
          thursday: { morning: false, afternoon: false, evening: false, overnight: false },
          friday: { morning: false, afternoon: false, evening: false, overnight: false },
          saturday: { morning: false, afternoon: false, evening: false, overnight: false },
          sunday: { morning: false, afternoon: false, evening: false, overnight: false },
        },
        budgetRange: {
          min: 0,
          max: 0,
        },
        preferredLanguages: [],
        preferredGender: "cualquiera",
        specialRequirements: undefined,
      },
      familyContact: {
        isFamilyMember: false,
        familyContacts: [],
        emergencyContact: undefined,
      },
    },
  });

  const { handleSubmit, trigger, formState } = methods;
  const progress = (currentStep / TOTAL_STEPS) * 100;

  const getStepSchema = (step: number) => {
    switch (step) {
      case 1:
        return seniorOnboardingSchema.shape.basicInfo;
      case 2:
        return seniorOnboardingSchema.shape.medicalProfile;
      case 3:
        return seniorOnboardingSchema.shape.seniorNeeds;
      case 4:
        return seniorOnboardingSchema.shape.familyContact;
      default:
        return seniorOnboardingSchema;
    }
  };

  const handleNext = async () => {
    const stepFields: Record<number, (keyof SeniorOnboardingFormData)[]> = {
      1: ["basicInfo"],
      2: ["medicalProfile"],
      3: ["seniorNeeds"],
      4: ["familyContact"],
    };

    const fieldsToValidate = stepFields[currentStep as keyof typeof stepFields];
    if (fieldsToValidate) {
      const isValid = await trigger(fieldsToValidate as any);
      if (!isValid) return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: SeniorOnboardingFormData) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);
    try {
      await saveSeniorProfile(user.uid, data);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving senior profile:", error);
      alert("Error al guardar el perfil. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <MedicalProfileStep />;
      case 3:
        return <SeniorNeedsStep />;
      case 4:
        return <FamilyContactStep />;
      case 5:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="text-2xl">Registro de Adulto Mayor</CardTitle>
                <CardDescription>
                  Paso {currentStep} de {TOTAL_STEPS}: {STEP_TITLES[currentStep - 1]}
                </CardDescription>
                <Progress value={progress} className="mt-4" />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {renderStep()}

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>

                  {currentStep < TOTAL_STEPS ? (
                    <Button type="button" onClick={handleNext}>
                      Siguiente
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        "Guardando..."
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Completar Registro
                        </>
                      )}
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


