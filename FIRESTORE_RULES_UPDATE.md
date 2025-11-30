# Actualización de Reglas de Firestore

## Problema
Error: "Missing or insufficient permissions" al guardar resultados del cuestionario en `/caregivers/{userId}/questionnaire_results/{resultId}`

## Solución
Las reglas de Firestore necesitan permitir escritura en la subcolección `questionnaire_results` dentro de `caregivers`.

## Pasos para Aplicar las Reglas

### Opción 1: Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Rules**
4. Copia y pega las siguientes reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Caregivers can read/write their own profile
    match /caregivers/{caregiverId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == caregiverId;
      
      // Questionnaire results subcollection
      match /questionnaire_results/{resultId} {
        allow read, write: if request.auth != null && request.auth.uid == caregiverId;
      }
      
      // Certificates subcollection
      match /certificates/{certId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == caregiverId;
      }
    }
    
    // Seniors can read/write their own data
    match /seniors/{seniorId} {
      allow read, write: if request.auth != null && request.auth.uid == seniorId;
      
      // Matches subcollection
      match /matches/{matchId} {
        allow read, write: if request.auth != null && request.auth.uid == seniorId;
      }
    }
    
    // Matching queue
    match /matching_queue/{queueId} {
      allow read, write: if request.auth != null;
    }
    
    // Job applications
    match /job_applications/{applicationId} {
      allow read, write: if request.auth != null;
    }
    
    // Interests
    match /interests/{interestId} {
      allow read, write: if request.auth != null;
    }
    
    // Matches
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }
    
    // Config
    match /config/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

5. Haz clic en **Publish**

### Opción 2: Firebase CLI

Si tienes Firebase CLI configurado:

```bash
firebase deploy --only firestore:rules
```

## Cambios Realizados

### Nuevas Reglas Agregadas:

1. **Subcolección `questionnaire_results`** dentro de `caregivers`:
   - Permite que los cuidadores lean y escriban sus propios resultados de cuestionario
   - Ruta: `/caregivers/{caregiverId}/questionnaire_results/{resultId}`

2. **Subcolección `certificates`** dentro de `caregivers`:
   - Permite que los cuidadores lean y escriban sus propios certificados
   - Ruta: `/caregivers/{caregiverId}/certificates/{certId}`

3. **Colección `job_applications`**:
   - Permite que usuarios autenticados lean y escriban aplicaciones de trabajo
   - Ruta: `/job_applications/{applicationId}`

## Verificación

Después de aplicar las reglas:

1. Intenta completar el cuestionario nuevamente
2. Verifica en la consola del navegador que no haya errores de permisos
3. Verifica en Firestore Console que los datos se hayan guardado correctamente en:
   - `/caregivers/{userId}/questionnaire_results/latest`
   - `/caregivers/{userId}` (campo `questionnaire_completed` y `profile_approved`)

## Nota de Seguridad

Las reglas aseguran que:
- Solo el cuidador autenticado puede escribir en sus propios resultados
- Los resultados son legibles por cualquier usuario autenticado (para matching)
- Los certificados solo pueden ser escritos por el propietario

