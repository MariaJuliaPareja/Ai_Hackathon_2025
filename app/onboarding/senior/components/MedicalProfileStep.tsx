'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface MedicalProfileStepProps {
  data: Partial<{
    medical_comorbidities: string;
    mobility_score: number;
    cognitive_status: 'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  }>;
  onComplete: (data: Partial<any>) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

const MOBILITY_OPTIONS = [
  { value: 1, label: '1 - Independiente (sin asistencia)' },
  { value: 2, label: '2 - Asistencia ligera (supervisión)' },
  { value: 3, label: '3 - Asistencia moderada (ayuda parcial)' },
  { value: 4, label: '4 - Asistencia completa (dependiente)' },
];

const COGNITIVE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'mild_impairment', label: 'Deterioro Leve' },
  { value: 'moderate_impairment', label: 'Deterioro Moderado' },
  { value: 'severe_impairment', label: 'Deterioro Severo / Demencia' },
];

export default function MedicalProfileStep({ data, onComplete, onBack, isSubmitting }: MedicalProfileStepProps) {
  const [medical_comorbidities, setMedicalComorbidities] = useState(data.medical_comorbidities || '');
  const [mobility_score, setMobilityScore] = useState<number>(data.mobility_score || 1);
  const [cognitive_status, setCognitiveStatus] = useState<'normal' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment'>(
    data.cognitive_status || 'normal'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medical_comorbidities.trim()) {
      alert('Por favor describe las condiciones médicas');
      return;
    }

    onComplete({
      medical_comorbidities: medical_comorbidities.trim(),
      mobility_score,
      cognitive_status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Perfil Médico
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Información médica crítica para encontrar el cuidador adecuado
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="medical_comorbidities">
            Condiciones Médicas (Comorbilidades) *
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            Describe todas las condiciones médicas, enfermedades crónicas, y diagnósticos relevantes.
            Ejemplo: "Diabetes tipo 2, hipertensión, demencia vascular, artritis reumatoide"
          </p>
          <Textarea
            id="medical_comorbidities"
            value={medical_comorbidities}
            onChange={(e) => setMedicalComorbidities(e.target.value)}
            placeholder="Ej: Diabetes tipo 2, hipertensión, demencia vascular..."
            className="bg-white min-h-[120px]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobility_score">
            Nivel de Movilidad (Escala 1-4) *
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            Selecciona el nivel que mejor describe la capacidad de movilidad
          </p>
          <Select
            id="mobility_score"
            value={mobility_score.toString()}
            onChange={(e) => setMobilityScore(parseInt(e.target.value))}
            className="bg-white"
            required
          >
            {MOBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cognitive_status">
            Estado Cognitivo *
          </Label>
          <p className="text-xs text-gray-500 mb-2">
            Selecciona el nivel que mejor describe el estado cognitivo
          </p>
          <Select
            id="cognitive_status"
            value={cognitive_status}
            onChange={(e) => setCognitiveStatus(e.target.value as any)}
            className="bg-white"
            required
          >
            {COGNITIVE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
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

