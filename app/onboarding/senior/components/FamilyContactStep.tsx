'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signUpWithEmail } from '@/lib/firebase/auth';

const familyContactSchema = z.object({
  family_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  family_relationship: z.string().min(2, 'Por favor especifique la relación familiar'),
  family_phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido'),
  family_email: z.string().email('Email inválido'),
  family_password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type FamilyContactData = z.infer<typeof familyContactSchema>;

interface StepProps {
  data: any;
  onComplete?: (data: any) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
}

export default function FamilyContactStep({ data, onComplete, onBack, isSubmitting, readOnly = false }: StepProps) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string>('');

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
      family_password: data?.family_password || '',
    },
  });

  const onSubmit = async (formData: FamilyContactData) => {
    if (readOnly || !onComplete) return;

    // If family account was already created in the modal, just pass the data
    if (data?.family_userId) {
      onComplete({
        ...formData,
        family_userId: data.family_userId,
      });
      return;
    }

    setIsCreatingAccount(true);
    setAccountError('');

    try {
      // Create family account when submitting this step (fallback if modal wasn't used)
      let familyUserId: string | null = null;
      try {
        const familyUser = await signUpWithEmail(
          formData.family_email,
          formData.family_password,
          'family',
          formData.family_name
        );
        familyUserId = familyUser.uid;
      } catch (err: any) {
        // If account already exists, that's okay - we'll just link it
        if (err.code === 'auth/email-already-in-use') {
          setAccountError('Este email ya está registrado. El familiar podrá usar su cuenta existente.');
          // Continue anyway - we'll link the existing account
        } else {
          throw new Error(`Error creando cuenta del familiar: ${err.message}`);
        }
      }

      // Pass the familyUserId along with the form data
      onComplete({
        ...formData,
        family_userId: familyUserId,
      });
    } catch (err: any) {
      setAccountError(err.message || 'Error creando cuenta del familiar');
      setIsCreatingAccount(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Contacto Familiar de Emergencia
      </h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          {data?.family_userId ? (
            <>
              <strong>✓ Cuenta del familiar creada:</strong> La información del familiar ya fue registrada. 
              El familiar recibirá acceso para observar el proceso de onboarding y monitorear el cuidado del adulto mayor.
            </>
          ) : (
            <>
              Este contacto será notificado sobre el cuidado y podrá monitorear el progreso del adulto mayor.
              Se creará una cuenta para que pueda acceder a la plataforma.
            </>
          )}
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
          disabled={readOnly}
          readOnly={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          disabled={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          disabled={readOnly}
          readOnly={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          disabled={readOnly}
          readOnly={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="familiar@email.com"
        />
        {errors.family_email && (
          <p className="mt-1 text-sm text-red-600">{errors.family_email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña para el Familiar *
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Se creará una cuenta con este email y contraseña para que el familiar pueda acceder a la plataforma.
        </p>
        <input
          {...register('family_password')}
          type="password"
          disabled={readOnly}
          readOnly={readOnly}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="Mínimo 6 caracteres"
          minLength={6}
        />
        {errors.family_password && (
          <p className="mt-1 text-sm text-red-600">{errors.family_password.message}</p>
        )}
      </div>

      {/* Error Message */}
      {accountError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{accountError}</p>
        </div>
      )}

      {/* Navigation */}
      {!readOnly && (
        <div className="flex gap-4 pt-6 border-t">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isCreatingAccount || isSubmitting}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volver
            </button>
          )}
          <button
            type="submit"
            disabled={isCreatingAccount || isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCreatingAccount ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Creando cuenta del familiar...
              </>
            ) : isSubmitting ? (
              'Guardando...'
            ) : (
              'Siguiente: Revisar'
            )}
          </button>
        </div>
      )}
    </form>
  );
}

