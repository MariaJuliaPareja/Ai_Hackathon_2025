'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';

interface StepProps {
  data: any;
  onComplete?: (data: any) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

const ASSISTANCE_TASK_LABELS: Record<string, string> = {
  compania: 'Compañía',
  higiene_personal: 'Higiene Personal',
  preparacion_alimentos: 'Preparación de alimentos saludables',
  administracion_medicamentos: 'Administración de medicamentos',
  movilizacion: 'Movilizar a la persona adulta mayor a parques, espacios públicos, citas médicas, etc.',
  cuidado_postradas: 'Cuidado de personas postradas',
  primeros_auxilios_basicos: 'Primeros Auxilios Básicos',
  primeros_auxilios_psicologicos: 'Primeros Auxilios Psicológicos',
  carga_fisica: 'Cargar físicamente a la persona adulta mayor',
};

const MOBILITY_LABELS: Record<number, string> = {
  1: '1 - Independiente (sin asistencia)',
  2: '2 - Asistencia ligera (supervisión)',
  3: '3 - Asistencia moderada (ayuda parcial)',
  4: '4 - Asistencia completa (dependiente)',
};

const COGNITIVE_LABELS: Record<string, string> = {
  normal: 'Normal',
  mild_impairment: 'Deterioro Leve',
  moderate_impairment: 'Deterioro Moderado',
  severe_impairment: 'Deterioro Severo / Demencia',
};

const CARE_INTENSITY_LABELS: Record<string, string> = {
  light: 'Ligero - Pocas horas al día',
  moderate: 'Moderado - Medio tiempo',
  intensive: 'Intensivo - Tiempo completo diurno',
  '24_7': '24/7 - Cuidado permanente',
};

export default function ReviewStep({ data, onComplete, onBack, isSubmitting }: StepProps) {
  const router = useRouter();
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFinalSubmit = async () => {
    setIsSubmittingFinal(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado');

      // Family account should already be created in FamilyContactStep
      const familyUserId = data?.family_userId || null;

      // Prepare data without password (don't store password in Firestore)
      const { family_password, family_userId: _, ...dataToSave } = data;

      // Save to Firestore
      await setDoc(doc(db, 'seniors', user.uid), {
        ...dataToSave,
        userId: user.uid,
        email: user.email,
        role: 'senior',
        onboardingCompleted: true,
        family_userId: familyUserId, // Link to family account if created
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Queue matching job
      await setDoc(doc(db, 'matching_queue', user.uid), {
        seniorId: user.uid,
        status: 'queued',
        createdAt: serverTimestamp(),
      });

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Error saving senior profile:', err);
      setError((err as Error).message || 'Error guardando perfil');
      setIsSubmittingFinal(false);
    }
  };

  const handleConfirm = () => {
    // Execute final submit when user confirms
    handleFinalSubmit();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Revisar y Confirmar
      </h2>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        {/* Basic Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Información Básica</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {data.name && (
              <p><strong>Nombre:</strong> {data.name}</p>
            )}
            {data.age && (
              <p><strong>Edad:</strong> {data.age} años</p>
            )}
            {data.location && (
              <p><strong>Ubicación:</strong> {data.location}</p>
            )}
            {data.gender && (
              <p><strong>Género:</strong> {data.gender === 'M' ? 'Masculino' : data.gender === 'F' ? 'Femenino' : 'Otro'}</p>
            )}
            {data.profilePhoto && (
              <p><strong>Foto:</strong> <span className="text-green-600">✓ Cargada</span></p>
            )}
          </div>
        </div>

        {/* Medical Profile */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Perfil Médico</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {data.medical_comorbidities && (
              <p><strong>Condiciones:</strong> {data.medical_comorbidities}</p>
            )}
            {data.mobility_score && (
              <p><strong>Movilidad:</strong> {MOBILITY_LABELS[data.mobility_score] || `Nivel ${data.mobility_score}`}</p>
            )}
            {data.cognitive_status && (
              <p><strong>Estado Cognitivo:</strong> {COGNITIVE_LABELS[data.cognitive_status] || data.cognitive_status}</p>
            )}
          </div>
        </div>

        {/* Care Needs */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Necesidades de Cuidado</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {data.routine_medication_times && (
              <p><strong>Horarios de Medicación:</strong> {data.routine_medication_times}</p>
            )}
            <p>
              <strong>Tareas de Asistencia:</strong>{' '}
              {data.routine_assistance_tasks?.length > 0
                ? data.routine_assistance_tasks
                    .map((taskId: string) => ASSISTANCE_TASK_LABELS[taskId] || taskId)
                    .join(', ')
                : 'Ninguna'}
            </p>
            <p><strong>Intensidad:</strong> {data.care_intensity ? CARE_INTENSITY_LABELS[data.care_intensity] : 'N/A'}</p>
            {data.special_requirements && (
              <p><strong>Requerimientos Especiales:</strong> {data.special_requirements}</p>
            )}
          </div>
        </div>

        {/* Family Contact */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Contacto Familiar de Emergencia</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {data.family_name && (
              <p><strong>Nombre:</strong> {data.family_name}</p>
            )}
            {data.family_relationship && (
              <p><strong>Relación:</strong> {data.family_relationship}</p>
            )}
            {data.family_phone && (
              <p><strong>Teléfono:</strong> {data.family_phone}</p>
            )}
            {data.family_email && (
              <p><strong>Email:</strong> {data.family_email}</p>
            )}
            {data.family_userId && (
              <p className="text-green-600">
                <strong>✓</strong> Cuenta del familiar creada exitosamente
              </p>
            )}
            {!data.family_userId && data.family_password && (
              <p className="text-green-600">
                <strong>✓</strong> Se creará una cuenta para el familiar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Al confirmar, aceptas nuestros términos de servicio y política de privacidad.{' '}
          Comenzaremos a buscar cuidadores compatibles de inmediato.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            Volver
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || isSubmittingFinal}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {isSubmitting || isSubmittingFinal ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Guardando y buscando cuidadores...
            </>
          ) : (
            'Confirmar y Buscar Cuidadores'
          )}
        </button>
      </div>
    </div>
  );
}

