'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { compressAndEncodeImageWithThumbnail } from '@/lib/utils/image-compression';

interface BasicInfoStepProps {
  data: Partial<{
    name: string;
    age: number;
    gender: 'M' | 'F' | 'other';
    location: string;
    profilePhoto?: { base64: string; thumbnail: string };
  }>;
  onComplete: (data: Partial<any>) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export default function BasicInfoStep({ data, onComplete, onBack, isSubmitting }: BasicInfoStepProps) {
  const [name, setName] = useState(data.name || '');
  const [age, setAge] = useState(data.age?.toString() || '');
  const [gender, setGender] = useState<'M' | 'F' | 'other'>(data.gender || 'M');
  const [location, setLocation] = useState(data.location || '');
  const [photo, setPhoto] = useState<{ base64: string; thumbnail: string } | undefined>(data.profilePhoto);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setIsCompressing(true);

    try {
      const { full, thumbnail } = await compressAndEncodeImageWithThumbnail(file);
      setPhoto({ base64: full, thumbnail });
    } catch (err: any) {
      setError(err.message || 'Error al procesar la imagen');
    } finally {
      setIsCompressing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: isCompressing,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !age || !location.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      setError('La edad debe ser entre 18 y 120 años');
      return;
    }

    onComplete({
      name: name.trim(),
      age: ageNum,
      gender,
      location: location.trim(),
      profilePhoto: photo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="María González"
            className="bg-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Edad *</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="75"
              className="bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género *</Label>
            <Select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'other')}
              className="bg-white"
              required
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="other">Otro</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación *</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ciudad, Estado"
            className="bg-white"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Foto de Perfil (Opcional)</Label>
          {photo ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={photo.base64}
                  alt="Vista previa"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => setPhoto(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <Button type="button" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Cambiar Foto
                </Button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              } ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        ? 'Suelta la imagen aquí'
                        : 'Arrastra una foto o haz clic para seleccionar'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o WEBP (máx. 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>
            Anterior
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="ml-auto">
          {isSubmitting ? 'Guardando...' : 'Siguiente'}
        </Button>
      </div>
    </form>
  );
}

