"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData, SPECIALIZATION_OPTIONS, CERTIFICATION_OPTIONS } from "@/lib/schemas/caregiver-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { processFileForStorage, validateFile } from "@/lib/utils/fileProcessing";

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
  
  const [processingCerts, setProcessingCerts] = useState<Record<string, boolean>>({});
  const [certErrors, setCertErrors] = useState<Record<string, string>>({});

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

  const handleCertFileChange = async (certName: string, file: File | null) => {
    const current = certifications;
    const existingIndex = current.findIndex((c) => c.name === certName);
    
    if (!file) {
      // Remove file
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          file: undefined,
        };
        setValue("professionalInfo.certifications", updated);
        setCertErrors((prev) => {
          const next = { ...prev };
          delete next[certName];
          return next;
        });
      }
      return;
    }

    // Validate file
    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.valid) {
      setCertErrors((prev) => ({
        ...prev,
        [certName]: validation.error || 'Error de validación',
      }));
      return;
    }

    // Process file to Base64
    setProcessingCerts((prev) => ({ ...prev, [certName]: true }));
    setCertErrors((prev) => {
      const next = { ...prev };
      delete next[certName];
      return next;
    });

    try {
      const processed = await processFileForStorage(file, 'certificate');
      
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          file: {
            base64: processed.base64,
            originalName: processed.originalName,
            mimeType: processed.mimeType,
            sizeKB: processed.sizeKB,
          },
        };
        setValue("professionalInfo.certifications", updated);
      } else {
        // Add new certification with file
        setValue("professionalInfo.certifications", [
          ...current,
          {
            name: certName,
            file: {
              base64: processed.base64,
              originalName: processed.originalName,
              mimeType: processed.mimeType,
              sizeKB: processed.sizeKB,
            },
          },
        ]);
      }
    } catch (error: any) {
      setCertErrors((prev) => ({
        ...prev,
        [certName]: error.message || 'Error procesando el archivo',
      }));
    } finally {
      setProcessingCerts((prev) => {
        const next = { ...prev };
        delete next[certName];
        return next;
      });
    }
  };

  const getCertFile = (certName: string) => {
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
                    <div className="mt-3 pl-6 space-y-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleCertFileChange(certName, file);
                        }}
                        className="hidden"
                        id={`cert-file-${certName}`}
                        disabled={processingCerts[certName]}
                      />
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`cert-file-${certName}`}
                          className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm ${
                            processingCerts[certName] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {processingCerts[certName] ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : certFile && typeof certFile === 'object' && 'base64' in certFile ? (
                            <>
                              <FileText className="h-4 w-4" />
                              {certFile.originalName} ({(certFile.sizeKB || 0).toFixed(0)}KB)
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Subir certificado
                            </>
                          )}
                        </Label>
                        {certFile && typeof certFile === 'object' && 'base64' in certFile && !processingCerts[certName] && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => handleCertFileChange(certName, null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {certErrors[certName] && (
                        <p className="text-sm text-destructive">{certErrors[certName]}</p>
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
