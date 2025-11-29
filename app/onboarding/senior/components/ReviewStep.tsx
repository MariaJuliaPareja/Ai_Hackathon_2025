'use client';

interface StepProps {
  data: any;
  onComplete: (data: any) => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

const ASSISTANCE_TASK_LABELS: Record<string, string> = {
  bathing: 'Baño y aseo personal',
  feeding: 'Alimentación y nutrición',
  mobility: 'Movilización y transferencias',
  medication: 'Administración de medicamentos',
  companionship: 'Compañía y supervisión',
  housekeeping: 'Tareas del hogar',
  medical_appointments: 'Acompañamiento a citas médicas',
  physical_therapy: 'Apoyo en terapia física',
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
  const handleConfirm = () => {
    onComplete(data);
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
            <p><strong>Nombre:</strong> {data.name}</p>
            <p><strong>Edad:</strong> {data.age} años</p>
            <p><strong>Ubicación:</strong> {data.location}</p>
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
            <p><strong>Condiciones:</strong> {data.medical_comorbidities}</p>
            <p><strong>Movilidad:</strong> {data.mobility_score ? MOBILITY_LABELS[data.mobility_score] : 'N/A'}</p>
            <p><strong>Estado Cognitivo:</strong> {data.cognitive_status ? COGNITIVE_LABELS[data.cognitive_status] : 'N/A'}</p>
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
          <h3 className="font-semibold text-gray-900 mb-2">Contacto Familiar</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Nombre:</strong> {data.family_name}</p>
            <p><strong>Relación:</strong> {data.family_relationship}</p>
            <p><strong>Teléfono:</strong> {data.family_phone}</p>
            <p><strong>Email:</strong> {data.family_email}</p>
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
          disabled={isSubmitting}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            'Confirmar y Buscar Cuidadores'
          )}
        </button>
      </div>
    </div>
  );
}

