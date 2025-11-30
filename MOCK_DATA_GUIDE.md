# Mock Data Guide - Desarrollo y Demo

## 📋 Descripción

Este sistema incluye datos mock (simulados) de cuidadores para permitir el desarrollo y demostración del dashboard sin necesidad de:
- Cuidadores reales en la base de datos
- API de Claude configurada
- Proceso de matching completo

## 🚀 Uso Automático

El sistema **automáticamente** crea cuidadores mock cuando:
1. Un senior completa el onboarding
2. Se ejecuta el proceso de matching
3. No hay cuidadores disponibles en Firestore

## 📝 Cuidadores Mock Incluidos

### 1. **Claudia Mendoza**
- **Ubicación**: Miraflores, Lima
- **Experiencia**: 7 años
- **Especializaciones**: Alzheimer, Demencia, Diabetes
- **Tarifa**: S/38/hora
- **Calificación**: 4.8/5
- **Disponibilidad**: Lunes-Sábado 8am-6pm

### 2. **María Elena Quispe**
- **Ubicación**: San Isidro, Lima
- **Experiencia**: 5 años
- **Especializaciones**: Parkinson, Movilidad reducida
- **Tarifa**: S/32/hora
- **Calificación**: 4.6/5
- **Disponibilidad**: Lunes-Viernes 9am-5pm

### 3. **Rosa Huamán**
- **Ubicación**: Surco, Lima
- **Experiencia**: 10 años
- **Especializaciones**: Cuidado general, Compañía
- **Tarifa**: S/28/hora
- **Calificación**: 4.9/5
- **Disponibilidad**: Lunes-Domingo flexible

### 4. **Carmen Torres**
- **Ubicación**: La Molina, Lima
- **Experiencia**: 4 años
- **Especializaciones**: Diabetes, Hipertensión
- **Tarifa**: S/35/hora
- **Calificación**: 4.7/5
- **Disponibilidad**: Lunes-Viernes 8am-4pm

### 5. **Ana García**
- **Ubicación**: Barranco, Lima
- **Experiencia**: 6 años
- **Especializaciones**: Cuidado post-operatorio, Heridas
- **Tarifa**: S/40/hora
- **Calificación**: 4.9/5
- **Disponibilidad**: Lunes-Sábado 10am-8pm

## 🔧 Creación Manual

Si necesitas crear los cuidadores mock manualmente:

```typescript
import { createMockCaregivers } from '@/lib/firebase/mockData';

// Crear cuidadores mock
await createMockCaregivers();
```

O desde el dashboard:
- Ve a `/dashboard/senior`
- Si no hay matches, verás un botón "Crear Datos Demo"
- Haz clic para crear los cuidadores mock

## 🎯 Matching Mock vs Real

### Matching Mock (Sin API Key)
- Se ejecuta automáticamente si `NEXT_PUBLIC_ANTHROPIC_API_KEY` no está configurada
- Usa scoring heurístico simple basado en:
  - Ubicación (40%)
  - Experiencia (20%)
  - Habilidades (40%)
- Genera explicaciones básicas pero útiles

### Matching Real (Con API Key)
- Requiere `NEXT_PUBLIC_ANTHROPIC_API_KEY` en `.env.local`
- Usa Claude API para análisis profundo
- Genera explicaciones detalladas y personalizadas
- Fallback automático a mock si Claude falla

## 📊 Estructura de Datos Mock

Los cuidadores mock se guardan en Firestore con la misma estructura que los reales:

```
/caregivers/mock-caregiver-1
  ├── personalInfo
  │   ├── name: "Claudia Mendoza"
  │   └── location: "Miraflores, Lima"
  ├── professionalInfo
  │   ├── yearsOfExperience: 7
  │   └── specializations: ["Alzheimer", "Demencia", ...]
  ├── experienceDescription
  ├── availability
  ├── preferences
  ├── active: true
  ├── onboardingCompleted: true
  └── hourlyRate: 38
```

## 🔍 Verificación

Para verificar si los mock caregivers existen:

```typescript
import { hasMockCaregivers } from '@/lib/firebase/mockData';

const exists = await hasMockCaregivers();
console.log('Mock caregivers exist:', exists);
```

## ⚠️ Notas Importantes

1. **Los cuidadores mock se crean automáticamente** cuando no hay cuidadores reales
2. **No se duplican** - el sistema verifica antes de crear
3. **Son completamente funcionales** - se pueden usar para matching real
4. **Se pueden eliminar** manualmente desde Firestore Console si es necesario

## 🧪 Testing

Para testing, puedes:
1. Eliminar todos los cuidadores de Firestore
2. Completar onboarding de un senior
3. El sistema creará automáticamente los mock caregivers
4. El matching funcionará con datos mock

## 📝 Personalización

Para agregar más cuidadores mock, edita `lib/firebase/mockData.ts`:

```typescript
const MOCK_CAREGIVERS = [
  // ... cuidadores existentes
  {
    personalInfo: {
      name: 'Nuevo Cuidador',
      location: 'Ubicación',
    },
    // ... resto de campos
  },
];
```

