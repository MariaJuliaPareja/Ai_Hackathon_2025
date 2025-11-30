# 🔧 Fix Rápido: Error de Permisos Firestore

## ⚠️ Error Actual
```
FirebaseError: Missing or insufficient permissions
```

## ✅ Solución (2 minutos)

### Paso 1: Abre Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto

### Paso 2: Ve a Firestore Rules
1. En el menú lateral, haz clic en **"Firestore Database"**
2. Haz clic en la pestaña **"Rules"** (arriba)

### Paso 3: Copia las Reglas
Copia TODO el contenido del archivo `firestore.rules` y pégalo en el editor de reglas.

**O copia directamente esto:**

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

### Paso 4: Publica las Reglas
1. Haz clic en el botón **"Publish"** (arriba a la derecha)
2. Espera 30 segundos para que las reglas se propaguen

### Paso 5: Prueba
1. Vuelve a tu aplicación
2. Intenta completar el cuestionario nuevamente
3. El error debería desaparecer ✅

## 🔍 Verificación

Después de aplicar las reglas, verifica en Firestore Console que los datos se guarden en:
- `/caregivers/{userId}/questionnaire_results/latest`
- `/caregivers/{userId}` (debe tener `questionnaire_completed: true` y `profile_approved: true/false`)

## 📝 Nota Importante

La regla clave que faltaba es:
```javascript
match /questionnaire_results/{resultId} {
  allow read, write: if request.auth != null && request.auth.uid == caregiverId;
}
```

Esta regla permite que los cuidadores escriban en su propia subcolección de resultados de cuestionario.

