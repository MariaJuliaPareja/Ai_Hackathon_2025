# Dashboard de Matching - Guía de Acceso

## 🎯 Ruta Directa al Dashboard de Matching

### Para Seniors:
```
/dashboard/senior
```

### Acceso Completo:
- **URL Local**: `http://localhost:3000/dashboard/senior`
- **URL Producción**: `https://tu-dominio.com/dashboard/senior`

## 📋 Requisitos de Acceso

1. **Usuario debe estar autenticado** como "senior" o "family"
2. **Perfil de senior debe existir** en Firestore (`/seniors/{userId}`)
3. Si el perfil no existe, se redirige automáticamente a `/onboarding/senior`

## 🔄 Flujo Automático

1. **Usuario completa onboarding** → Se crea documento en `matching_queue`
2. **Redirección automática** → `/dashboard/senior`
3. **Matching se inicia automáticamente** si `match_status === 'queued'`
4. **Dashboard muestra progreso en tiempo real**

## 🎨 Estados del Dashboard

### 1. **Queued/Processing** (En Proceso)
- Muestra barra de progreso
- Indica paso actual del matching
- Mensaje: "Buscando Cuidadores Compatibles"

### 2. **Ready** (Listo)
- Muestra grid de matches ordenados por score ML
- Cada match incluye:
  - Puntuación de compatibilidad (0-100%)
  - Explicaciones generadas por Claude AI
  - Fortalezas clave
  - Análisis detallado expandible

### 3. **Error** (Error)
- Muestra mensaje de error
- Opción para contactar soporte

### 4. **No Matches** (Sin Matches)
- Muestra sugerencias
- Botón para reintentar matching

## 🔧 Configuración Requerida

### Variable de Entorno:
```env
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Obtener API Key:
1. Ir a https://console.anthropic.com/
2. Crear cuenta o iniciar sesión
3. Generar nueva API key
4. Agregar a `.env.local`

## 📊 Mejoras en el Prompt de Claude

### Cambios Implementados:

1. **Prompt más detallado y contextualizado**
   - Incluye mapeo de estados cognitivos y niveles de cuidado
   - Explicaciones claras de cada campo
   - Contexto cultural peruano

2. **Scoring mejorado**
   - Peso correcto: 40% compatibilidad médica (CRÍTICO)
   - 25% match de habilidades
   - 20% proximidad geográfica
   - 10% nivel de experiencia
   - 5% disponibilidad

3. **Análisis más específico**
   - Menciona condiciones médicas concretas
   - Habilidades específicas requeridas
   - Ubicaciones exactas
   - Consideraciones honestas sobre limitaciones

4. **Fallback mejorado**
   - Cálculo de compatibilidad médica mejorado
   - Scoring de ubicación más granular
   - Experiencia evaluada por rangos
   - Textos más informativos

## 🚀 Uso Directo

### Desde el código:
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard/senior');
```

### Desde un link:
```tsx
<Link href="/dashboard/senior">
  Ver Matches
</Link>
```

### Desde navegador:
Simplemente navega a: `/dashboard/senior`

## 📝 Notas Importantes

- El dashboard requiere autenticación
- Si no hay perfil de senior, redirige a onboarding
- El matching se ejecuta automáticamente si está en cola
- Las actualizaciones son en tiempo real vía Firestore listeners
- Los matches se ordenan por score ML (mayor a menor)

