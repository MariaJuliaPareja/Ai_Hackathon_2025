"use client";

import { useFormContext } from "react-hook-form";
import { CaregiverOnboardingFormData } from "@/lib/schemas/caregiver-onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useState } from "react";

export default function PersonalInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<CaregiverOnboardingFormData>();

  const photo = watch("personalInfo.photo");
  const [preview, setPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("personalInfo.photo", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setValue("personalInfo.photo", undefined);
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Personal
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Comencemos con tu información básica
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre Completo *</Label>
          <Input
            id="name"
            {...register("personalInfo.name")}
            placeholder="John Doe"
            className="bg-white"
          />
          {errors.personalInfo?.name && (
            <p className="text-sm text-destructive">
              {errors.personalInfo.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación *</Label>
          <Input
            id="location"
            {...register("personalInfo.location")}
            placeholder="City, State"
            className="bg-white"
          />
          {errors.personalInfo?.location && (
            <p className="text-sm text-destructive">
              {errors.personalInfo.location.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Foto de Perfil</Label>
          <div className="flex items-center gap-4">
            {preview || (photo && typeof photo === "string") ? (
              <div className="relative">
                <img
                  src={preview || (photo as string)}
                  alt="Profile preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                {preview || photo ? "Cambiar Foto" : "Subir Foto"}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

