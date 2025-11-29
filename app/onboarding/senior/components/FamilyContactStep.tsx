'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const familyContactSchema = z.object({
  family_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  family_relationship: z.string().min(2, 'Por favor especifique la relación familiar'),
  family_phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido'),
  family_email: z.string().email('Email inválido'),
});

type FamilyContactData = z.infer<typeof familyContactSchema>;

interface StepProps {
  data: any;
  onComplete: (data: any) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export default function FamilyContactStep({ data, onComplete, onBack, isSubmitting }: StepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FamilyContactData>({
    resolver: zodResolver(familyContactSchema),
    defaultValues: {
      family_name: data?.family_name || '',
      family_relationship: data?.family_relationship || '',
      family_phone: data?.family_phone || '',
      family_email: data?.family_email || '',
    },
  });

  const onSubmit = (formData: FamilyContactData) => {
    onComplete(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Contacto Familiar de Emergencia
      </h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          Este contacto será notificado sobre el cuidado y podrá monitorear el progreso del adulto mayor.
        </p>
      </div>

      {/* Family Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Familiar *
        </label>
        <input
          {...register('family_name')}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Ej: Ana María Palacios"
        />
        {errors.family_name && (
          <p className="mt-1 text-sm text-red-600">{errors.family_name.message}</p>
        )}
      </div>

      {/* Relationship */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relación Familiar *
        </label>
        <select
          {...register('family_relationship')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Seleccione...</option>
          <option value="Hijo/a">Hijo/a</option>
          <option value="Esposo/a">Esposo/a</option>
          <option value="Nieto/a">Nieto/a</option>
          <option value="Hermano/a">Hermano/a</option>
          <option value="Sobrino/a">Sobrino/a</option>
          <option value="Otro">Otro</option>
        </select>
        {errors.family_relationship && (
          <p className="mt-1 text-sm text-red-600">{errors.family_relationship.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono *
        </label>
        <input
          {...register('family_phone')}
          type="tel"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="+51 999 888 777"
        />
        {errors.family_phone && (
          <p className="mt-1 text-sm text-red-600">{errors.family_phone.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          {...register('family_email')}
          type="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="familiar@email.com"
        />
        {errors.family_email && (
          <p className="mt-1 text-sm text-red-600">{errors.family_email.message}</p>
        )}
      </div>

      {/* Navigation */}
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
          {isSubmitting ? 'Guardando...' : 'Siguiente: Revisar'}
        </button>
      </div>
    </form>
  );
}

