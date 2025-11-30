'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { signUpWithEmail } from '@/lib/firebase/auth';

const familyContactSchema = z.object({
  family_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  family_relationship: z.string().min(2, 'Por favor especifique la relación familiar'),
  family_phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Formato de teléfono inválido').optional().or(z.literal('')),
  family_email: z.string().email('Email inválido'),
  family_password: z.string().optional(), // Optional - only create account if provided
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
  const router = useRouter();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [accountError, setAccountError] = useState<string>('');
  const [isFamilyRegistered, setIsFamilyRegistered] = useState(false);
  const [fieldsFilled, setFieldsFilled] = useState(false);

  // Check if family was already registered and fields are filled
  useEffect(() => {
    if (data?.family_userId && data?.family_email) {
      setIsFamilyRegistered(true);
    }
    
    // Check if all required fields are filled (except relationship which can be edited)
    const hasRequiredFields = data?.family_name && 
                             data?.family_email && 
                             (data?.family_phone || data?.family_userId);
    setFieldsFilled(!!hasRequiredFields);
  }, [data]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<FamilyContactData>({
    resolver: zodResolver(familyContactSchema),
    defaultValues: {
      family_name: data?.family_name || '',
      family_relationship: data?.family_relationship || '',
      family_phone: data?.family_phone || '',
      family_email: data?.family_email || '',
      family_password: data?.family_password || '',
    },
    mode: 'onChange',
  });

  const formValues = watch();

  const handleFinalSubmit = async (allFormData: any) => {
    console.log('🚀 handleFinalSubmit called');
    console.log('📊 Form data:', {
      hasData: !!allFormData,
      keys: allFormData ? Object.keys(allFormData) : [],
      familyData: allFormData?.family_name || 'missing',
    });

    setIsSubmittingFinal(true);
    setAccountError('');

    try {
      const user = auth.currentUser;
      console.log('👤 Current user:', user ? { uid: user.uid, email: user.email } : 'null');
      
      if (!user) {
        throw new Error('No hay usuario autenticado. Por favor, inicia sesión nuevamente.');
      }

      // Family account should already be created
      const familyUserId = allFormData?.family_userId || null;
      console.log('👨‍👩‍👧 Family user ID:', familyUserId);

      // Prepare data without password (don't store password in Firestore)
      const { family_password, family_userId: _, ...dataToSave } = allFormData;
      
      console.log('💾 Preparing to save to Firestore...');
      console.log('📝 Data keys to save:', Object.keys(dataToSave));

      // Save to Firestore with match_status: 'pending' to trigger matchmaking UI
      const seniorRef = doc(db, 'seniors', user.uid);
      const seniorData = {
        ...dataToSave,
        userId: user.uid,
        email: user.email,
        role: 'senior',
        onboardingCompleted: true,
        family_userId: familyUserId, // Link to family account if created
        match_status: 'pending', // Start matchmaking process
        match_count: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('💾 Saving senior profile to Firestore...');
      await setDoc(seniorRef, seniorData);
      console.log('✅ Senior profile saved successfully');

      // Queue matching job - This triggers the Cloud Function automatically
      console.log('📋 Creating matching queue document...');
      await setDoc(doc(db, 'matching_queue', user.uid), {
        seniorId: user.uid,
        status: 'queued',
        createdAt: serverTimestamp(),
      });
      console.log('✅ Matching queue created');

      console.log('🔄 Redirecting to dashboard...');
      // Redirect to dashboard to see matchmaking progress with Claude AI
      router.push('/dashboard');
      console.log('✅ Redirect initiated');
      
    } catch (err: any) {
      console.error('❌ Error in handleFinalSubmit:', err);
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
      });
      setAccountError(err.message || 'Error guardando perfil. Verifica la consola para más detalles.');
      setIsSubmittingFinal(false);
    }
  };

  const onSubmit = async (formData: FamilyContactData) => {
    console.log('📝 onSubmit called');
    console.log('📊 Form data received:', formData);
    console.log('🔒 ReadOnly mode:', readOnly);
    console.log('📦 Previous steps data:', data);

    if (readOnly) {
      console.warn('⚠️ Form is read-only, submission blocked');
      return;
    }

    let familyUserId: string | null = null;
    let familyData: any = {};

    // If family account was already created (from registration page)
    if (data?.family_userId || fieldsFilled) {
      console.log('✅ Family account already exists, using existing data');
      familyData = {
        // Preserve existing data if fields are filled, but allow relationship to be updated
        family_name: fieldsFilled ? (data.family_name || formData.family_name) : formData.family_name,
        family_email: fieldsFilled ? (data.family_email || formData.family_email) : formData.family_email,
        family_phone: fieldsFilled ? (data.family_phone || formData.family_phone) : formData.family_phone,
        family_relationship: formData.family_relationship, // Always allow relationship to be updated
        family_userId: data?.family_userId || null,
      };
    } else {
      // Check if password is provided - only create account if password exists
      const hasPassword = formData.family_password && formData.family_password.trim() !== '';
      
      if (!hasPassword) {
        console.log('⚠️ No password provided, skipping family account creation');
        console.log('ℹ️ Will save contact info only (no account created)');
        
        // Just save contact info without creating account
        familyData = {
          ...formData,
          family_userId: null, // No account created
        };
      } else {
        console.log('👤 Creating new family account with password...');
        // Create family account only if password is provided
        setIsCreatingAccount(true);
        setAccountError('');

        try {
          try {
            console.log('🔐 Creating family user account...');
            const familyUser = await signUpWithEmail(
              formData.family_email,
              formData.family_password!,
              'family',
              formData.family_name
            );
            familyUserId = familyUser.uid;
            console.log('✅ Family account created:', familyUserId);
          } catch (err: any) {
            console.error('❌ Error creating family account:', err);
            // If account already exists, that's okay - we'll just link it
            if (err.code === 'auth/email-already-in-use') {
              console.log('ℹ️ Family email already exists, continuing...');
              setAccountError('Este email ya está registrado. El familiar podrá usar su cuenta existente.');
              // Continue anyway - we'll link the existing account
            } else {
              throw new Error(`Error creando cuenta del familiar: ${err.message}`);
            }
          }

          familyData = {
            ...formData,
            family_userId: familyUserId,
          };
          setIsCreatingAccount(false);
        } catch (err: any) {
          console.error('❌ Fatal error creating family account:', err);
          setAccountError(err.message || 'Error creando cuenta del familiar');
          setIsCreatingAccount(false);
          return;
        }
      }
    }

    // Merge with all previous steps data
    const allFormData = {
      ...data, // All previous steps data (step 1, 2, 3)
      ...familyData, // Family contact data (step 4)
    };

    console.log('📦 Merged form data:', {
      hasData: !!allFormData,
      keys: Object.keys(allFormData),
      step1: !!allFormData.name,
      step2: !!allFormData.medical_comorbidities,
      step3: !!allFormData.routine_assistance_tasks,
      step4: !!allFormData.family_name,
    });

    // Execute final submit directly (save to Firestore, create matching queue, and redirect)
    console.log('🚀 Calling handleFinalSubmit...');
    try {
      await handleFinalSubmit(allFormData);
    } catch (error: any) {
      console.error('❌ Error in onSubmit calling handleFinalSubmit:', error);
      setAccountError(error.message || 'Error al procesar el formulario');
      setIsSubmittingFinal(false);
    }
  };

  // Debug form state
  useEffect(() => {
    console.log('📝 Form values changed:', formValues);
    console.log('✅ Form errors:', errors);
    console.log('📊 Form state:', {
      isValid: Object.keys(errors).length === 0,
      isFormSubmitting,
      isSubmittingFinal,
      isCreatingAccount,
      readOnly,
    });
  }, [formValues, errors, isFormSubmitting, isSubmittingFinal, isCreatingAccount, readOnly]);

  return (
    <form 
      onSubmit={(e) => {
        console.log('📋 Form submit event triggered');
        console.log('📊 Form state before submit:', {
          isValid: Object.keys(errors).length === 0,
          errors: Object.keys(errors),
          formValues,
        });
        handleSubmit(onSubmit)(e).catch((error) => {
          console.error('❌ Form submit error:', error);
          setAccountError('Error al procesar el formulario. Verifica que todos los campos estén completos.');
        });
      }} 
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Contacto Familiar de Emergencia
      </h2>

      <div className={`border rounded-lg p-4 mb-6 ${
        isFamilyRegistered 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <p className={`text-sm ${
          isFamilyRegistered ? 'text-green-800' : 'text-yellow-800'
        }`}>
          {isFamilyRegistered ? (
            <>
              <strong>✓ Cuenta del familiar creada:</strong> La información del familiar ya fue registrada. 
              El familiar con email <strong>{data?.family_email}</strong> recibirá acceso para observar el proceso de onboarding y monitorear el cuidado del adulto mayor.
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
          disabled={readOnly || fieldsFilled}
          readOnly={readOnly || fieldsFilled}
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
        {fieldsFilled && !readOnly && (
          <p className="text-xs text-blue-600 mb-2">
            Puedes modificar la relación familiar si es necesario.
          </p>
        )}
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
          disabled={readOnly || fieldsFilled}
          readOnly={readOnly || fieldsFilled}
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
          disabled={readOnly || fieldsFilled}
          readOnly={readOnly || fieldsFilled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="familiar@email.com"
        />
        {errors.family_email && (
          <p className="mt-1 text-sm text-red-600">{errors.family_email.message}</p>
        )}
      </div>

      {/* Password - Optional */}
      {!fieldsFilled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña para el Familiar <span className="text-gray-500 font-normal">(Opcional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Si proporcionas una contraseña, se creará una cuenta para que el familiar pueda acceder a la plataforma. 
            Si dejas este campo vacío, solo se guardará la información de contacto.
          </p>
          <input
            {...register('family_password')}
            type="password"
            disabled={readOnly}
            readOnly={readOnly}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Opcional - Mínimo 6 caracteres si se proporciona"
            minLength={6}
          />
          {errors.family_password && (
            <p className="mt-1 text-sm text-red-600">{errors.family_password.message}</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {accountError && (
        <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
              <p className="text-sm text-red-700">{accountError}</p>
              <button
                type="button"
                onClick={() => {
                  console.log('🔄 Retrying submit...');
                  setAccountError('');
                  handleSubmit(onSubmit)();
                }}
                className="mt-2 text-xs bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Por favor corrige los siguientes errores:
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            {Object.entries(errors).map(([field, error]: [string, any]) => (
              <li key={field}>
                {field}: {error?.message || 'Campo inválido'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4 pt-6 border-t">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isCreatingAccount || isSubmitting || readOnly}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={isCreatingAccount || isSubmittingFinal || readOnly}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          {isCreatingAccount ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Creando cuenta del familiar...
            </>
          ) : isSubmittingFinal ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Guardando y buscando cuidadores...
            </>
          ) : (
            'Confirmar y Buscar Cuidadores'
          )}
        </button>
      </div>
    </form>
  );
}

