"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData, SPECIALIZATION_OPTIONS, CERTIFICATION_OPTIONS } from "@/lib/schemas/caregiver-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText } from "lucide-react";
import { useState } from "react";

export default function ProfessionalInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<CaregiverOnboardingFormData>();

  const yearsOfExperience = watch("professionalInfo.yearsOfExperience") || 0;
  const specializations = watch("professionalInfo.specializations") || [];
  const certifications = watch("professionalInfo.certifications") || [];

  const toggleSpecialization = (spec: string) => {
    const current = specializations;
    if (current.includes(spec)) {
      setValue(
        "professionalInfo.specializations",
        current.filter((s) => s !== spec)
      );
    } else {
      setValue("professionalInfo.specializations", [...current, spec]);
    }
  };

  const toggleCertification = (certName: string) => {
    const current = certifications;
    const existingIndex = current.findIndex((c) => c.name === certName);
    
    if (existingIndex >= 0) {
      // Remove certification
      setValue(
        "professionalInfo.certifications",
        current.filter((_, i) => i !== existingIndex)
      );
    } else {
      // Add certification
      setValue("professionalInfo.certifications", [
        ...current,
        { name: certName },
      ]);
    }
  };

  const handleCertFileChange = (certName: string, file: File | null) => {
    const current = certifications;
    const existingIndex = current.findIndex((c) => c.name === certName);
    
    if (existingIndex >= 0) {
      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        file: file || undefined,
      };
      setValue("professionalInfo.certifications", updated);
    }
  };

  const getCertFile = (certName: string): File | string | undefined => {
    const cert = certifications.find((c) => c.name === certName);
    return cert?.file;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Profesional
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Información sobre tu experiencia y credenciales profesionales
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Años de Experiencia *</Label>
          <Input
            id="yearsOfExperience"
            type="number"
            min="0"
            max="50"
            {...register("professionalInfo.yearsOfExperience", {
              valueAsNumber: true,
            })}
            className="bg-white"
            value={yearsOfExperience}
            onChange={(e) =>
              setValue(
                "professionalInfo.yearsOfExperience",
                parseInt(e.target.value) || 0
              )
            }
          />
          {errors.professionalInfo?.yearsOfExperience && (
            <p className="text-sm text-destructive">
              {errors.professionalInfo.yearsOfExperience.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Especializaciones *</Label>
          <p className="text-xs text-gray-500 mb-3">
            Selecciona todas las especializaciones en las que tienes experiencia
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECIALIZATION_OPTIONS.map((spec) => (
              <div
                key={spec}
                className={`flex items-start space-x-2 p-3 rounded-lg border-2 transition-all ${
                  specializations.includes(spec)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Checkbox
                  id={`spec-${spec}`}
                  checked={specializations.includes(spec)}
                  onCheckedChange={() => toggleSpecialization(spec)}
                  className="mt-1"
                />
                <Label
                  htmlFor={`spec-${spec}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {spec}
                </Label>
              </div>
            ))}
          </div>
          {errors.professionalInfo?.specializations && (
            <p className="text-sm text-destructive">
              {errors.professionalInfo.specializations.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Certificaciones</Label>
          <p className="text-xs text-gray-500 mb-3">
            Selecciona tus certificaciones y sube los documentos correspondientes
          </p>
          <div className="space-y-3">
            {CERTIFICATION_OPTIONS.map((certName) => {
              const isSelected = certifications.some((c) => c.name === certName);
              const certFile = getCertFile(certName);

              return (
                <div
                  key={certName}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`cert-${certName}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCertification(certName)}
                      />
                      <Label
                        htmlFor={`cert-${certName}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {certName}
                      </Label>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pl-6">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleCertFileChange(certName, file);
                        }}
                        className="hidden"
                        id={`cert-file-${certName}`}
                      />
                      <Label
                        htmlFor={`cert-file-${certName}`}
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        {certFile instanceof File ? (
                          <>
                            <FileText className="h-4 w-4" />
                            {certFile.name}
                          </>
                        ) : certFile ? (
                          <>
                            <FileText className="h-4 w-4" />
                            Documento cargado
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Subir certificado
                          </>
                        )}
                      </Label>
                      {certFile instanceof File && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-8"
                          onClick={() => handleCertFileChange(certName, null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
