# File Processing Utilities

## Overview

This directory contains utilities for processing files for Base64 storage in Firestore.

## Files

### `fileProcessing.ts` (Recommended - Production Ready)
**Status**: ✅ Production-ready, comprehensive utility

**Features**:
- Image compression with progressive quality reduction
- PDF to Base64 conversion
- Smart file processing (profile vs certificate)
- Thumbnail generation
- File validation
- Size estimation
- Error handling

**Usage**:
```typescript
import { processFileForStorage, validateFile } from '@/lib/utils/fileProcessing';

// Validate first
const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// Process file
const processed = await processFileForStorage(file, 'profile');
// Returns: { base64, originalName, mimeType, sizeKB, processedAt }
```

### `image-compression.ts` (Legacy)
**Status**: ⚠️ Legacy - Consider migrating to `fileProcessing.ts`

**Features**:
- Image compression
- Thumbnail generation
- Used by profile photo upload

**Note**: This file may be deprecated in favor of `fileProcessing.ts` in the future.

## Migration Path

When ready to consolidate:
1. Update `PersonalInfoStep.tsx` to use `fileProcessing.ts`
2. Update `ProfessionalInfoStep.tsx` to use `fileProcessing.ts`
3. Deprecate `image-compression.ts`
4. Remove `image-compression.ts` after migration

## Best Practices

1. **Always validate** files before processing
2. **Use appropriate type**: `'profile'` for photos, `'certificate'` for certs
3. **Handle errors** gracefully with user-friendly messages
4. **Show progress** during processing (can take 1-3 seconds)
5. **Check size limits** before saving to Firestore (1MB document limit)

## Size Limits

- **Profile photos**: 200KB max (compressed)
- **Certificate images**: 700KB max (compressed)
- **Certificate PDFs**: 800KB max (no compression)
- **Firestore document**: 1MB total limit

## Examples

### Profile Photo
```typescript
const processed = await processFileForStorage(file, 'profile');
// Automatically compressed to 800x800, ~200KB
```

### Certificate (Image)
```typescript
const processed = await processFileForStorage(file, 'certificate');
// Compressed to 1200x1600, ~700KB max
```

### Certificate (PDF)
```typescript
const processed = await processFileForStorage(file, 'certificate');
// Validated to 800KB max, no compression
```

### Create Thumbnail
```typescript
import { createThumbnail } from '@/lib/utils/fileProcessing';

const thumbnail = await createThumbnail(base64Image, 100);
// Returns 100x100px thumbnail Base64
```


