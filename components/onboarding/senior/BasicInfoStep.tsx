"use client";

import { useFormContext } from "react-hook-form";
import { SeniorOnboardingFormData } from "@/lib/schemas/senior-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { compressAndEncodeImageWithThumbnail } from "@/lib/utils/image-compression";

export default function BasicInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<SeniorOnboardingFormData>();

  const photoData = watch("basicInfo.photo");
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setIsCompressing(true);

    try {
      const { full, thumbnail } = await compressAndEncodeImageWithThumbnail(file);
      setValue("basicInfo.photo", { full, thumbnail });
      setPreview(full);
    } catch (err: any) {
      setError(err.message || "Error al procesar la imagen");
      setValue("basicInfo.photo", undefined);
      setPreview(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: isCompressing,
  });

  const handleRemovePhoto = () => {
    setValue("basicInfo.photo", undefined);
    setPreview(null);
    setError(null);
  };

  const displayPreview = preview || 
    (photoData && typeof photoData === "object" && photoData.full ? photoData.full : null) ||
    (photoData && typeof photoData === "string" ? photoData : null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Básica
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Comencemos con tu información personal
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            {...register("basicInfo.name")}
            placeholder="María González"
            className="bg-white"
          />
          {errors.basicInfo?.name && (
            <p className="text-sm text-destructive">
              {errors.basicInfo.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Edad *</Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="120"
            {...register("basicInfo.age", { valueAsNumber: true })}
            placeholder="75"
            className="bg-white"
          />
          {errors.basicInfo?.age && (
            <p className="text-sm text-destructive">
              {errors.basicInfo.age.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación *</Label>
          <Input
            id="location"
            {...register("basicInfo.location")}
            placeholder="Ciudad, Estado"
            className="bg-white"
          />
          {errors.basicInfo?.location && (
            <p className="text-sm text-destructive">
              {errors.basicInfo.location.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (Opcional)</Label>
          <Input
            id="phone"
            {...register("basicInfo.phone")}
            placeholder="+52 555 123 4567"
            className="bg-white"
          />
          {errors.basicInfo?.phone && (
            <p className="text-sm text-destructive">
              {errors.basicInfo.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Foto de Perfil (Opcional)</Label>
          
          {displayPreview ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={displayPreview}
                  alt="Vista previa de perfil"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleRemovePhoto}
                  aria-label="Eliminar foto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <div
                  {...getRootProps()}
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <input {...getInputProps()} />
                  <Upload className="h-4 w-4" />
                  <span>Cambiar Foto</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              } ${isCompressing ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label="Zona de carga de foto de perfil"
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-2">
                {isCompressing ? (
                  <>
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <p className="text-sm text-gray-600">Procesando imagen...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600 text-center">
                      {isDragActive
                        ? "Suelta la imagen aquí"
                        : "Arrastra una foto o haz clic para seleccionar"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o WEBP (máx. 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

