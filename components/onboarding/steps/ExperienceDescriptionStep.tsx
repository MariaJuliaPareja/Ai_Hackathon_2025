"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

export default function ExperienceDescriptionStep() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<CaregiverOnboardingFormData>();

  const experienceDescription = watch("experienceDescription.experienceDescription") || "";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Descripción de Experiencia
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Describe tu experiencia específica con condiciones geriátricas
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <CardDescription className="text-sm text-gray-700 mb-4">
            <strong>Ejemplo:</strong> "He trabajado 5 años con pacientes con demencia vascular severa,
            manejando episodios de agitación, asistiendo en alimentación por disfagia,
            y coordinando con neurólogos para ajuste de medicación antipsicótica."
          </CardDescription>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="experienceDescription">
          Describe tu experiencia detallada *
        </Label>
        <Textarea
          id="experienceDescription"
          {...register("experienceDescription.experienceDescription")}
          placeholder="Describe tu experiencia específica con condiciones geriátricas..."
          className="bg-white min-h-[200px]"
          value={experienceDescription}
        />
        <p className="text-xs text-gray-500">
          Mínimo 50 caracteres. Sé específico sobre condiciones, tratamientos y experiencias.
        </p>
        {errors.experienceDescription?.experienceDescription && (
          <p className="text-sm text-destructive">
            {errors.experienceDescription.experienceDescription.message}
          </p>
        )}
        {experienceDescription && (
          <p className="text-xs text-gray-600">
            {experienceDescription.length} caracteres
          </p>
        )}
      </div>
    </div>
  );
}

