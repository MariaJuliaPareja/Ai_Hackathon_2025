"use client";

import { useFormContext } from "react-hook-form";
import { SeniorOnboardingFormData, PERSONAL_CARE_NEEDS } from "@/lib/schemas/senior-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { useState } from "react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default function SeniorNeedsStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<SeniorOnboardingFormData>();

  const dailyRoutine = watch("seniorNeeds.dailyRoutine");
  const careNeeds = watch("seniorNeeds.careNeeds");
  const availabilityNeeded = watch("seniorNeeds.availabilityNeeded");
  const budgetRange = watch("seniorNeeds.budgetRange");
  const personalCare = watch("seniorNeeds.careNeeds.personalCare") || [];
  const [newMealTime, setNewMealTime] = useState("");
  const [newMedTime, setNewMedTime] = useState("");

  const togglePersonalCare = (need: string) => {
    const current = personalCare;
    if (current.includes(need)) {
      setValue("seniorNeeds.careNeeds.personalCare", current.filter((n) => n !== need));
    } else {
      setValue("seniorNeeds.careNeeds.personalCare", [...current, need]);
    }
  };

  const addMealTime = () => {
    if (newMealTime.trim()) {
      const current = dailyRoutine?.mealTimes || [];
      setValue("seniorNeeds.dailyRoutine.mealTimes", [...current, newMealTime.trim()]);
      setNewMealTime("");
    }
  };

  const removeMealTime = (index: number) => {
    const current = dailyRoutine?.mealTimes || [];
    setValue("seniorNeeds.dailyRoutine.mealTimes", current.filter((_, i) => i !== index));
  };

  const addMedTime = () => {
    if (newMedTime.trim()) {
      const current = dailyRoutine?.medicationTimes || [];
      setValue("seniorNeeds.dailyRoutine.medicationTimes", [...(current || []), newMedTime.trim()]);
      setNewMedTime("");
    }
  };

  const removeMedTime = (index: number) => {
    const current = dailyRoutine?.medicationTimes || [];
    setValue("seniorNeeds.dailyRoutine.medicationTimes", current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Necesidades de Cuidado
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Esta información es crítica para encontrar el cuidador perfecto
        </p>
      </div>

      <div className="space-y-6">
        {/* Daily Routine */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-gray-900">Rutina Diaria</h4>
          
          <div className="space-y-2">
            <Label htmlFor="wakeTime">Hora de despertar *</Label>
            <Input
              id="wakeTime"
              type="time"
              {...register("seniorNeeds.dailyRoutine.wakeTime")}
              className="bg-white"
            />
            {errors.seniorNeeds?.dailyRoutine?.wakeTime && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.dailyRoutine.wakeTime.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedTime">Hora de dormir *</Label>
            <Input
              id="bedTime"
              type="time"
              {...register("seniorNeeds.dailyRoutine.bedTime")}
              className="bg-white"
            />
            {errors.seniorNeeds?.dailyRoutine?.bedTime && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.dailyRoutine.bedTime.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Horarios de Comida *</Label>
            <div className="space-y-2">
              {(dailyRoutine?.mealTimes || []).map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={time} readOnly className="bg-white" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMealTime(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newMealTime}
                  onChange={(e) => setNewMealTime(e.target.value)}
                  placeholder="Agregar horario"
                  className="flex-1 bg-white"
                />
                <Button type="button" onClick={addMealTime}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {errors.seniorNeeds?.dailyRoutine?.mealTimes && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.dailyRoutine.mealTimes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Horarios de Medicación (Opcional)</Label>
            <div className="space-y-2">
              {(dailyRoutine?.medicationTimes || []).map((time, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={time} readOnly className="bg-white" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedTime(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newMedTime}
                  onChange={(e) => setNewMedTime(e.target.value)}
                  placeholder="Agregar horario"
                  className="flex-1 bg-white"
                />
                <Button type="button" onClick={addMedTime}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Care Needs */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Necesidades de Cuidado</h4>
          
          <div className="space-y-3">
            <Label>Cuidado Personal *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERSONAL_CARE_NEEDS.map((need) => (
                <div
                  key={need}
                  className={`flex items-start space-x-2 p-3 rounded-lg border-2 transition-all ${
                    personalCare.includes(need)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Checkbox
                    id={`care-${need}`}
                    checked={personalCare.includes(need)}
                    onCheckedChange={() => togglePersonalCare(need)}
                    className="mt-1"
                  />
                  <Label htmlFor={`care-${need}`} className="text-sm font-normal cursor-pointer flex-1">
                    {need}
                  </Label>
                </div>
              ))}
            </div>
            {errors.seniorNeeds?.careNeeds?.personalCare && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.careNeeds.personalCare.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mealAssistance">Asistencia con Alimentación *</Label>
            <Select
              id="mealAssistance"
              value={careNeeds?.mealAssistance || ""}
              onChange={(e) => setValue("seniorNeeds.careNeeds.mealAssistance", e.target.value as any)}
              className="bg-white"
            >
              <option value="">Selecciona una opción</option>
              <option value="ninguna">Ninguna</option>
              <option value="preparacion">Preparación de comidas</option>
              <option value="alimentacion_asistida">Alimentación asistida</option>
              <option value="sonda_enteral">Sonda enteral</option>
            </Select>
            {errors.seniorNeeds?.careNeeds?.mealAssistance && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.careNeeds.mealAssistance.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicationManagement">Manejo de Medicamentos *</Label>
            <Select
              id="medicationManagement"
              value={careNeeds?.medicationManagement || ""}
              onChange={(e) => setValue("seniorNeeds.careNeeds.medicationManagement", e.target.value as any)}
              className="bg-white"
            >
              <option value="">Selecciona una opción</option>
              <option value="independiente">Independiente</option>
              <option value="recordatorios">Recordatorios</option>
              <option value="administracion_completa">Administración completa</option>
            </Select>
            {errors.seniorNeeds?.careNeeds?.medicationManagement && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.careNeeds.medicationManagement.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobilityAssistance">Asistencia con Movilidad *</Label>
            <Select
              id="mobilityAssistance"
              value={careNeeds?.mobilityAssistance || ""}
              onChange={(e) => setValue("seniorNeeds.careNeeds.mobilityAssistance", e.target.value as any)}
              className="bg-white"
            >
              <option value="">Selecciona una opción</option>
              <option value="ninguna">Ninguna</option>
              <option value="supervision">Supervisión</option>
              <option value="asistencia_parcial">Asistencia parcial</option>
              <option value="asistencia_completa">Asistencia completa</option>
            </Select>
            {errors.seniorNeeds?.careNeeds?.mobilityAssistance && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.careNeeds.mobilityAssistance.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cognitiveSupport">Apoyo Cognitivo *</Label>
            <Select
              id="cognitiveSupport"
              value={careNeeds?.cognitiveSupport || ""}
              onChange={(e) => setValue("seniorNeeds.careNeeds.cognitiveSupport", e.target.value as any)}
              className="bg-white"
            >
              <option value="">Selecciona una opción</option>
              <option value="ninguna">Ninguna</option>
              <option value="recordatorios">Recordatorios</option>
              <option value="orientacion">Orientación</option>
              <option value="supervision_constante">Supervisión constante</option>
            </Select>
            {errors.seniorNeeds?.careNeeds?.cognitiveSupport && (
              <p className="text-sm text-destructive">
                {errors.seniorNeeds.careNeeds.cognitiveSupport.message}
              </p>
            )}
          </div>
        </div>

        {/* Availability Needed */}
        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-semibold text-gray-900">Disponibilidad Necesaria</h4>
          <p className="text-xs text-gray-600">
            Selecciona los horarios en los que necesitas cuidado
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAYS.map((day) => (
              <div key={day} className="space-y-2">
                <Label className="font-medium">{DAY_LABELS[day]}</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${day}-morning`}
                      checked={availabilityNeeded?.[day]?.morning || false}
                      onCheckedChange={(checked) =>
                        setValue(`seniorNeeds.availabilityNeeded.${day}.morning`, checked as boolean)
                      }
                    />
                    <Label htmlFor={`${day}-morning`} className="text-sm">Mañana</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${day}-afternoon`}
                      checked={availabilityNeeded?.[day]?.afternoon || false}
                      onCheckedChange={(checked) =>
                        setValue(`seniorNeeds.availabilityNeeded.${day}.afternoon`, checked as boolean)
                      }
                    />
                    <Label htmlFor={`${day}-afternoon`} className="text-sm">Tarde</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${day}-evening`}
                      checked={availabilityNeeded?.[day]?.evening || false}
                      onCheckedChange={(checked) =>
                        setValue(`seniorNeeds.availabilityNeeded.${day}.evening`, checked as boolean)
                      }
                    />
                    <Label htmlFor={`${day}-evening`} className="text-sm">Noche</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${day}-overnight`}
                      checked={availabilityNeeded?.[day]?.overnight || false}
                      onCheckedChange={(checked) =>
                        setValue(`seniorNeeds.availabilityNeeded.${day}.overnight`, checked as boolean)
                      }
                    />
                    <Label htmlFor={`${day}-overnight`} className="text-sm">Nocturno</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-gray-900">Presupuesto</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">Presupuesto Mínimo (MXN/mes) *</Label>
              <Input
                id="budgetMin"
                type="number"
                min="0"
                {...register("seniorNeeds.budgetRange.min", { valueAsNumber: true })}
                placeholder="5000"
                className="bg-white"
              />
              {errors.seniorNeeds?.budgetRange?.min && (
                <p className="text-sm text-destructive">
                  {errors.seniorNeeds.budgetRange.min.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">Presupuesto Máximo (MXN/mes) *</Label>
              <Input
                id="budgetMax"
                type="number"
                min="0"
                {...register("seniorNeeds.budgetRange.max", { valueAsNumber: true })}
                placeholder="15000"
                className="bg-white"
              />
              {errors.seniorNeeds?.budgetRange?.max && (
                <p className="text-sm text-destructive">
                  {errors.seniorNeeds.budgetRange.max.message}
                </p>
              )}
            </div>
          </div>
          {errors.seniorNeeds?.budgetRange && typeof errors.seniorNeeds.budgetRange === "object" && "message" in errors.seniorNeeds.budgetRange && (
            <p className="text-sm text-destructive">
              {errors.seniorNeeds.budgetRange.message as string}
            </p>
          )}
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Preferencias (Opcional)</h4>
          
          <div className="space-y-2">
            <Label htmlFor="preferredGender">Género Preferido del Cuidador</Label>
            <Select
              id="preferredGender"
              value={watch("seniorNeeds.preferredGender") || "cualquiera"}
              onChange={(e) => setValue("seniorNeeds.preferredGender", e.target.value as any)}
              className="bg-white"
            >
              <option value="cualquiera">Cualquiera</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequirements">Requisitos Especiales (Opcional)</Label>
            <Textarea
              id="specialRequirements"
              {...register("seniorNeeds.specialRequirements")}
              placeholder="Ej: Preferencia por cuidadores con experiencia en música o arte..."
              className="bg-white min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

