"use client";

import { useFormContext } from "react-hook-form";
import { SeniorOnboardingFormData, MEDICAL_CONDITIONS, MEDICAL_EQUIPMENT } from "@/lib/schemas/senior-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function MedicalProfileStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<SeniorOnboardingFormData>();

  const conditions = watch("medicalProfile.conditions") || [];
  const medications = watch("medicalProfile.medications") || [];
  const allergies = watch("medicalProfile.allergies") || [];
  const requiresEquipment = watch("medicalProfile.requiresMedicalEquipment") || false;
  const equipment = watch("medicalProfile.medicalEquipment") || [];
  const mobilityLevel = watch("medicalProfile.mobilityLevel");
  const cognitiveLevel = watch("medicalProfile.cognitiveLevel");

  const [newMedication, setNewMedication] = useState({ name: "", dosage: "", frequency: "" });
  const [newAllergy, setNewAllergy] = useState("");

  const toggleCondition = (condition: string) => {
    const current = conditions;
    if (current.includes(condition)) {
      setValue("medicalProfile.conditions", current.filter((c) => c !== condition));
    } else {
      setValue("medicalProfile.conditions", [...current, condition]);
    }
  };

  const addMedication = () => {
    if (newMedication.name.trim()) {
      setValue("medicalProfile.medications", [
        ...medications,
        {
          name: newMedication.name,
          dosage: newMedication.dosage || undefined,
          frequency: newMedication.frequency || undefined,
        },
      ]);
      setNewMedication({ name: "", dosage: "", frequency: "" });
    }
  };

  const removeMedication = (index: number) => {
    setValue("medicalProfile.medications", medications.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setValue("medicalProfile.allergies", [...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (index: number) => {
    setValue("medicalProfile.allergies", allergies.filter((_, i) => i !== index));
  };

  const toggleEquipment = (item: string) => {
    const current = equipment;
    if (current.includes(item)) {
      setValue("medicalProfile.medicalEquipment", current.filter((e) => e !== item));
    } else {
      setValue("medicalProfile.medicalEquipment", [...current, item]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Perfil Médico
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Información sobre condiciones médicas y necesidades de salud
        </p>
      </div>

      <div className="space-y-6">
        {/* Medical Conditions */}
        <div className="space-y-3">
          <Label>Condiciones Médicas *</Label>
          <p className="text-xs text-gray-500 mb-3">
            Selecciona todas las condiciones que aplican
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {MEDICAL_CONDITIONS.map((condition) => (
              <div
                key={condition}
                className={`flex items-start space-x-2 p-3 rounded-lg border-2 transition-all ${
                  conditions.includes(condition)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Checkbox
                  id={`condition-${condition}`}
                  checked={conditions.includes(condition)}
                  onCheckedChange={() => toggleCondition(condition)}
                  className="mt-1"
                />
                <Label
                  htmlFor={`condition-${condition}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {condition}
                </Label>
              </div>
            ))}
          </div>
          {errors.medicalProfile?.conditions && (
            <p className="text-sm text-destructive">
              {errors.medicalProfile.conditions.message}
            </p>
          )}
        </div>

        {/* Medications */}
        <div className="space-y-3">
          <Label>Medicamentos (Opcional)</Label>
          <div className="space-y-2">
            {medications.map((med, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1 text-sm">
                  <strong>{med.name}</strong>
                  {med.dosage && ` - ${med.dosage}`}
                  {med.frequency && ` (${med.frequency})`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedication(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del medicamento"
                value={newMedication.name}
                onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Dosis (opcional)"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Frecuencia (opcional)"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                className="flex-1"
              />
              <Button type="button" onClick={addMedication}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-3">
          <Label>Alergias (Opcional)</Label>
          <div className="space-y-2">
            {allergies.map((allergy, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1 text-sm">{allergy}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAllergy(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la alergia"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addAllergy()}
                className="flex-1"
              />
              <Button type="button" onClick={addAllergy}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobility Level */}
        <div className="space-y-2">
          <Label htmlFor="mobilityLevel">Nivel de Movilidad *</Label>
          <Select
            id="mobilityLevel"
            value={mobilityLevel || ""}
            onChange={(e) => setValue("medicalProfile.mobilityLevel", e.target.value as any)}
            className="bg-white"
          >
            <option value="">Selecciona un nivel</option>
            <option value="independiente">Independiente</option>
            <option value="asistencia_ligera">Asistencia Ligera</option>
            <option value="asistencia_moderada">Asistencia Moderada</option>
            <option value="asistencia_completa">Asistencia Completa</option>
            <option value="inmóvil">Inmóvil</option>
          </Select>
          {errors.medicalProfile?.mobilityLevel && (
            <p className="text-sm text-destructive">
              {errors.medicalProfile.mobilityLevel.message}
            </p>
          )}
        </div>

        {/* Cognitive Level */}
        <div className="space-y-2">
          <Label htmlFor="cognitiveLevel">Nivel Cognitivo *</Label>
          <Select
            id="cognitiveLevel"
            value={cognitiveLevel || ""}
            onChange={(e) => setValue("medicalProfile.cognitiveLevel", e.target.value as any)}
            className="bg-white"
          >
            <option value="">Selecciona un nivel</option>
            <option value="lucido">Lúcido</option>
            <option value="leve_deterioro">Leve Deterioro</option>
            <option value="moderado_deterioro">Moderado Deterioro</option>
            <option value="severa_demencia">Severa Demencia</option>
          </Select>
          {errors.medicalProfile?.cognitiveLevel && (
            <p className="text-sm text-destructive">
              {errors.medicalProfile.cognitiveLevel.message}
            </p>
          )}
        </div>

        {/* Medical Equipment */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requiresEquipment"
              checked={requiresEquipment}
              onCheckedChange={(checked) => setValue("medicalProfile.requiresMedicalEquipment", checked as boolean)}
            />
            <Label htmlFor="requiresEquipment" className="cursor-pointer">
              Requiere equipo médico especializado
            </Label>
          </div>
          {requiresEquipment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              {MEDICAL_EQUIPMENT.map((item) => (
                <div
                  key={item}
                  className={`flex items-start space-x-2 p-2 rounded border ${
                    equipment.includes(item)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Checkbox
                    id={`equipment-${item}`}
                    checked={equipment.includes(item)}
                    onCheckedChange={() => toggleEquipment(item)}
                  />
                  <Label htmlFor={`equipment-${item}`} className="text-sm cursor-pointer">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


