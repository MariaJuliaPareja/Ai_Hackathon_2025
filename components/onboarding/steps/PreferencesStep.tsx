"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CONDITIONS = [
  "Enfermedad de Alzheimer",
  "Enfermedad de Parkinson",
  "Demencia",
  "Diabetes",
  "Enfermedad Cardíaca",
  "Recuperación de ACV",
  "Cáncer",
  "Artritis",
  "Deterioro Visual",
  "Deterioro Auditivo",
  "Problemas de Movilidad",
  "Condiciones de Salud Mental",
  "Cuidado Paliativo",
];

const ALL_CONDITIONS_OPTION = "Todos";

export default function PreferencesStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<CaregiverOnboardingFormData>();

  const preferredAgeRange = watch("preferences.preferredAgeRange");
  const conditions = watch("preferences.conditionsComfortableWith") || [];

  const toggleCondition = (condition: string) => {
    const current = conditions.filter((c) => c !== ALL_CONDITIONS_OPTION); // Remove "Todos" from current array
    
    // Handle "Todos" option
    if (condition === ALL_CONDITIONS_OPTION) {
      if (current.length === CONDITIONS.length) {
        // Deselect all
        setValue("preferences.conditionsComfortableWith", []);
      } else {
        // Select all conditions (without adding "Todos" to the array)
        setValue("preferences.conditionsComfortableWith", [...CONDITIONS]);
      }
      return;
    }
    
    // Handle regular conditions
    if (current.includes(condition)) {
      // Remove condition
      const newConditions = current.filter((c) => c !== condition);
      setValue("preferences.conditionsComfortableWith", newConditions);
    } else {
      // Add condition
      const newConditions = [...current, condition];
      setValue("preferences.conditionsComfortableWith", newConditions);
    }
  };
  
  // Check if "Todos" should be checked (all conditions selected, excluding "Todos" from the array)
  const isAllSelected = conditions.filter((c) => c !== ALL_CONDITIONS_OPTION).length === CONDITIONS.length;
  
  // Get conditions to display (exclude "Todos" from badges)
  const displayConditions = conditions.filter((c) => c !== ALL_CONDITIONS_OPTION);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Preferencias
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Establece tus preferencias para el emparejamiento
        </p>
      </div>

      <div className="space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Rango de Edad Preferido</CardTitle>
            <CardDescription>
              Selecciona el rango de edad de adultos mayores con los que te sientes cómodo trabajando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="minAge">Edad Mínima</Label>
                <Input
                  id="minAge"
                  type="number"
                  min="0"
                  max="100"
                  {...register("preferences.preferredAgeRange.min", {
                    valueAsNumber: true,
                  })}
                  className="bg-white"
                />
              </div>
              <div className="pt-8 text-gray-500">a</div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="maxAge">Edad Máxima</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min="0"
                  max="100"
                  {...register("preferences.preferredAgeRange.max", {
                    valueAsNumber: true,
                  })}
                  className="bg-white"
                />
              </div>
            </div>
            {errors.preferences?.preferredAgeRange && (
              <p className="text-sm text-destructive mt-2">
                {errors.preferences.preferredAgeRange.message}
              </p>
            )}
            {preferredAgeRange && (
              <p className="text-sm text-gray-600 mt-2">
                Rango de edad: {preferredAgeRange.min} - {preferredAgeRange.max} años
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base">Condiciones con las que te Sientes Cómodo *</CardTitle>
            <CardDescription>
              Selecciona todas las condiciones con las que te sientes cómodo y tienes experiencia trabajando
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* "Todos" option - special styling */}
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="condition-todos"
                  checked={isAllSelected}
                  onCheckedChange={() => toggleCondition(ALL_CONDITIONS_OPTION)}
                />
                <Label
                  htmlFor="condition-todos"
                  className="text-sm font-semibold cursor-pointer text-purple-700"
                >
                  {ALL_CONDITIONS_OPTION}
                </Label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONDITIONS.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${condition}`}
                    checked={conditions.includes(condition) || isAllSelected}
                    onCheckedChange={() => toggleCondition(condition)}
                    disabled={isAllSelected && !conditions.includes(condition)}
                  />
                  <Label
                    htmlFor={`condition-${condition}`}
                    className={`text-sm font-normal cursor-pointer ${
                      isAllSelected && !conditions.includes(condition) ? 'opacity-50' : ''
                    }`}
                  >
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
            {displayConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {displayConditions.map((condition) => (
                  <span
                    key={condition}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            )}
            {errors.preferences?.conditionsComfortableWith && (
              <p className="text-sm text-destructive mt-2">
                {errors.preferences.conditionsComfortableWith.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

