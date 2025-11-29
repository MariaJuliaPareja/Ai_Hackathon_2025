'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const seniorNeedsSchema = z.object({
  routine_medication_times: z.string().min(5, 'Por favor ingrese al menos un horario de medicación'),
  routine_assistance_tasks: z.array(z.string()).min(1, 'Seleccione al menos una tarea de asistencia'),
  care_intensity: z.enum(['light', 'moderate', 'intensive', '24_7']),
  special_requirements: z.string().optional(),
});

type SeniorNeedsData = z.infer<typeof seniorNeedsSchema>;

interface StepProps {
  data: any;
  onComplete?: (data: any) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

const ASSISTANCE_TASKS = [
  { id: 'bathing', label: 'Baño y aseo personal' },
  { id: 'feeding', label: 'Alimentación y nutrición' },
  { id: 'mobility', label: 'Movilización y transferencias' },
  { id: 'medication', label: 'Administración de medicamentos' },
  { id: 'companionship', label: 'Compañía y supervisión' },
  { id: 'housekeeping', label: 'Tareas del hogar' },
  { id: 'medical_appointments', label: 'Acompañamiento a citas médicas' },
  { id: 'physical_therapy', label: 'Apoyo en terapia física' },
];

export default function SeniorNeedsStep({ data, onComplete, onBack, isSubmitting, readOnly = false }: StepProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<SeniorNeedsData>({
    resolver: zodResolver(seniorNeedsSchema),
    defaultValues: {
      routine_medication_times: data?.routine_medication_times || '',
      routine_assistance_tasks: data?.routine_assistance_tasks || [],
      care_intensity: data?.care_intensity || 'moderate',
      special_requirements: data?.special_requirements || '',
    },
  });

  const [medicationTimes, setMedicationTimes] = useState<string[]>(
    data?.routine_medication_times?.split(', ') || ['']
  );

  const addMedicationTime = () => {
    setMedicationTimes([...medicationTimes, '']);
  };

  const removeMedicationTime = (index: number) => {
    setMedicationTimes(medicationTimes.filter((_, i) => i !== index));
  };

  const updateMedicationTime = (index: number, value: string) => {
    const updated = [...medicationTimes];
    updated[index] = value;
    setMedicationTimes(updated);
  };

  const onSubmit = (formData: SeniorNeedsData) => {
    if (readOnly || !onComplete) return;
    
    // Join medication times into comma-separated string for ML
    const joinedTimes = medicationTimes.filter(t => t.trim()).join(', ');
    
    onComplete({
      ...formData,
      routine_medication_times: joinedTimes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Necesidades de Cuidado y Rutina Diaria
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Importante:</strong> Esta información ayuda a encontrar el cuidador más compatible con las necesidades específicas del adulto mayor.
        </p>
      </div>

      {/* Medication Times - ML CRITICAL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Horarios de Medicación *
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Liste los horarios en que debe tomar medicamentos (ej: 8:00 AM, 2:00 PM, 9:00 PM)
        </p>
        
        <div className="space-y-2">
          {medicationTimes.map((time, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={time}
                onChange={(e) => updateMedicationTime(index, e.target.value)}
                placeholder="Ej: 8:00 AM"
                disabled={readOnly}
                readOnly={readOnly}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {medicationTimes.length > 1 && !readOnly && (
                <button
                  type="button"
                  onClick={() => removeMedicationTime(index)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
        
        {!readOnly && (
          <button
            type="button"
            onClick={addMedicationTime}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Agregar otro horario
          </button>
        )}
        
        <input
          type="hidden"
          {...register('routine_medication_times')}
          value={medicationTimes.filter(t => t.trim()).join(', ')}
        />
        
        {errors.routine_medication_times && (
          <p className="mt-1 text-sm text-red-600">{errors.routine_medication_times.message}</p>
        )}
      </div>

      {/* Assistance Tasks - ML CRITICAL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tareas de Asistencia Requeridas *
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Seleccione todas las tareas en las que el adulto mayor necesita ayuda
        </p>
        
        <Controller
          name="routine_assistance_tasks"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              {ASSISTANCE_TASKS.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    value={task.id}
                    checked={field.value?.includes(task.id)}
                    disabled={readOnly}
                    onChange={(e) => {
                      if (readOnly) return;
                      const checked = e.target.checked;
                      const currentValue = field.value || [];
                      
                      if (checked) {
                        field.onChange([...currentValue, task.id]);
                      } else {
                        field.onChange(currentValue.filter((v) => v !== task.id));
                      }
                    }}
                    className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-700">{task.label}</span>
                </label>
              ))}
            </div>
          )}
        />
        
        {errors.routine_assistance_tasks && (
          <p className="mt-1 text-sm text-red-600">{errors.routine_assistance_tasks.message}</p>
        )}
      </div>

      {/* Care Intensity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Intensidad del Cuidado Requerido *
        </label>
        <select
          {...register('care_intensity')}
          disabled={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="light">Ligero - Pocas horas al día</option>
          <option value="moderate">Moderado - Medio tiempo</option>
          <option value="intensive">Intensivo - Tiempo completo diurno</option>
          <option value="24_7">24/7 - Cuidado permanente</option>
        </select>
        {errors.care_intensity && (
          <p className="mt-1 text-sm text-red-600">{errors.care_intensity.message}</p>
        )}
      </div>

      {/* Special Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Requerimientos Especiales (Opcional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Cualquier necesidad adicional específica (ej: dieta especial, manejo de equipos médicos, idioma, etc.)
        </p>
        <textarea
          {...register('special_requirements')}
          rows={3}
          disabled={readOnly}
          readOnly={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Ejemplo: Requiere cuidador que hable quechua, experiencia con sonda PEG, dieta para diabéticos..."
        />
      </div>

      {/* Navigation */}
      {!readOnly && (
        <div className="flex gap-4 pt-6 border-t">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Volver
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Siguiente: Contacto Familiar'}
          </button>
        </div>
      )}
    </form>
  );
}

