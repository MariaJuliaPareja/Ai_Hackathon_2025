# Claude API Debugging Guide

## 🔍 Verificación de API Key

### 1. Verificar que la API Key esté configurada

```bash
# En la raíz del proyecto, verifica .env.local
cat .env.local | grep ANTHROPIC
```

Debería mostrar:
```
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Verificar formato de API Key

La API key debe:
- Comenzar con `sk-ant-`
- Tener al menos 50 caracteres
- Estar en `.env.local` (no en `.env`)

### 3. Reiniciar servidor de desarrollo

Después de agregar la API key:
```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

## 🐛 Debugging Steps

### Paso 1: Verificar logs en consola del navegador

Abre la consola del navegador (F12) y busca:
- ✅ `Anthropic API key is configured`
- ✅ `Using Claude API for ML-powered matching`
- ✅ `Calling Claude API for match evaluation`
- ❌ `Anthropic API key NOT configured`
- ❌ `Using mock matching`

### Paso 2: Verificar logs en terminal

En el terminal donde corre `npm run dev`, busca:
- `🔍 Matching Configuration:`
- `API Key present: true/false`
- `Using Claude API: true/false`

### Paso 3: Verificar estado en Firestore

1. Ve a Firebase Console → Firestore
2. Busca el documento del senior: `/seniors/{userId}`
3. Verifica:
   - `match_status`: debería cambiar a `processing` → `ready`
   - `match_current_step`: debería mostrar el progreso
   - `match_error`: si hay error, aparecerá aquí

### Paso 4: Verificar matches generados

1. En Firestore, busca: `/seniors/{userId}/matches`
2. Deberías ver documentos con:
   - `score.overall`: número 0-100
   - `mlReasoning.summary`: texto explicativo
   - `caregiver`: datos del cuidador

## ⚠️ Problemas Comunes

### Problema 1: "Anthropic API key NOT configured"

**Solución:**
1. Crea/edita `.env.local` en la raíz del proyecto
2. Agrega: `NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...`
3. Reinicia el servidor (`npm run dev`)

### Problema 2: "Claude API timeout"

**Solución:**
- El timeout es de 30 segundos por match
- Si hay muchos cuidadores, puede tomar tiempo
- El sistema automáticamente usa fallback si falla

### Problema 3: "Invalid response structure from Claude"

**Solución:**
- Claude puede devolver JSON malformado ocasionalmente
- El sistema automáticamente usa fallback
- Revisa los logs para ver el error específico

### Problema 4: Dashboard muestra "loading" infinito

**Solución:**
1. Verifica que `match_status` en Firestore no esté en `processing` indefinidamente
2. Si está atascado, cambia manualmente a `ready` en Firestore
3. O elimina el documento y vuelve a ejecutar matching

## 🔧 Testing Manual

### Test 1: Verificar API Key

```typescript
// En la consola del navegador o en código
console.log('API Key:', process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY?.substring(0, 15));
```

### Test 2: Test directo de Claude API

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 100,
  messages: [{ role: 'user', content: 'Hello' }],
});

console.log(response);
```

### Test 3: Verificar matching completo

1. Completa onboarding de un senior
2. Ve a `/dashboard/senior`
3. Observa los logs en consola
4. Verifica que aparezcan matches en menos de 2 minutos

## 📊 Logs Esperados

### Con API Key configurada:
```
✅ Anthropic API key is configured
   Key preview: sk-ant-api03-JlH...
🔍 Matching Configuration:
   API Key present: true
   API Key valid: true
   Using Claude API: true
   Caregivers to evaluate: 5
🤖 Using Claude API for ML-powered matching
🚀 Starting batch evaluation for 5 caregivers
📊 Evaluating match 1/5: Claudia Mendoza
🤖 Calling Claude API for match evaluation: Claudia Mendoza
✅ Claude API response received in 2341ms
✅ Match evaluated: Claudia Mendoza - Score: 94%
```

### Sin API Key:
```
⚠️ Anthropic API key NOT configured
   Using mock matching instead
📝 Using mock matching (no Claude API key configured)
✅ Mock matching completed: 5 matches
```

## 🚨 Fallback Automático

El sistema tiene **fallback automático** en múltiples niveles:

1. **Sin API Key** → Usa mock matching
2. **API Key inválida** → Usa mock matching
3. **Timeout de Claude** → Usa fallback scoring
4. **Error de Claude** → Usa fallback scoring
5. **Sin cuidadores** → Crea mock caregivers automáticamente

**El sistema SIEMPRE genera matches**, incluso si todo falla.

## 📝 Notas Importantes

1. **La API key debe estar en `.env.local`**, no en `.env`
2. **Reinicia el servidor** después de cambiar `.env.local`
3. **Los logs están en consola del navegador** (F12)
4. **El matching puede tomar 1-2 minutos** con Claude API
5. **El sistema siempre funciona**, incluso sin API key (usa mock)

