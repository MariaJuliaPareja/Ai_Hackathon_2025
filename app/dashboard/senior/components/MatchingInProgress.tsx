'use client';

interface Props {
  progress: number;
  currentStep: string;
}

export default function MatchingInProgress({ progress, currentStep }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Buscando Cuidadores Compatibles
        </h2>
        <p className="text-gray-600">
          Nuestra IA está analizando perfiles para encontrar los mejores matches
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{progress}% completado</p>
      </div>

      {/* Current Step */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900">
          {currentStep || 'Iniciando proceso...'}
        </p>
      </div>

      <p className="text-xs text-gray-500 mt-6">
        Este proceso toma entre 30 segundos y 2 minutos. 
        No cierres esta página.
      </p>
    </div>
  );
}

