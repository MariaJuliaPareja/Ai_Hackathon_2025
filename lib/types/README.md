# Firestore Type Definitions

## Overview

This directory contains TypeScript interfaces for all Firestore documents using Base64 inline storage.

## Files

### `firestore.ts`
**Status**: ✅ Production-ready type definitions

**Purpose**: Centralized type definitions for all Firestore collections and documents.

## Schema Evolution

### Current State (Backward Compatible)

The codebase currently uses **flat fields** for Base64 storage:
```typescript
{
  personalInfo: {
    profilePhotoBase64?: string;        // Full size
    profilePhotoThumbnailBase64?: string; // Thumbnail
  }
}
```

### Target State (Structured)

The new schema uses **structured objects**:
```typescript
{
  personalInfo: {
    profilePhoto?: {
      base64: string;
      thumbnail: string;
      originalName: string;
      mimeType: string;
      sizeKB: number;
      uploadedAt: Timestamp;
    }
  }
}
```

### Migration Strategy

1. **Phase 1**: Support both formats (current)
   - Read from both `profilePhotoBase64` and `profilePhoto.base64`
   - Write to new structured format
   - Keep legacy fields for backward compatibility

2. **Phase 2**: Migrate existing data
   - Script to convert flat fields to structured objects
   - Update all read operations

3. **Phase 3**: Remove legacy fields
   - Remove deprecated fields from interfaces
   - Clean up migration code

## Key Interfaces

### `ProfilePhoto`
Structured profile photo with metadata:
- `base64`: Full-size image (800x800, ~200KB)
- `thumbnail`: Thumbnail (100x100, ~20KB)
- `originalName`: Original filename
- `mimeType`: MIME type
- `sizeKB`: Size in KB
- `uploadedAt`: Upload timestamp

### `CertificateFile`
Certificate file stored as Base64:
- `base64`: Base64-encoded file
- `originalName`: Original filename
- `mimeType`: MIME type (PDF or image)
- `sizeKB`: Size in KB

### `CaregiverProfile`
Main caregiver document:
- Personal info with `profilePhoto` object
- Professional info
- Experience, availability, preferences
- ML embedding and description

### `Certificate`
Certificate subcollection document:
- Stored in `/caregivers/{userId}/certificates/{certId}`
- Contains `file` object with Base64
- Includes verification status, dates

## Firestore Structure

```
/caregivers/{userId}
  ├── personalInfo.profilePhoto.base64
  ├── personalInfo.profilePhoto.thumbnail
  └── /certificates/{certId}
      └── file.base64

/seniors/{userId}
  ├── personalInfo.profilePhoto.base64
  ├── personalInfo.profilePhoto.thumbnail
  └── /matches/{matchId}
      └── metadata.profilePhotoBase64 (thumbnail)

/interests/{interestId}
  └── (swipe interactions)

/matches/{matchId}
  └── (mutual matches)
```

## Usage Examples

### Reading Profile Photo

```typescript
import { CaregiverProfile } from '@/lib/types/firestore';

// New structured format
const photo = caregiver.personalInfo.profilePhoto;
if (photo) {
  const fullImage = photo.base64;
  const thumbnail = photo.thumbnail;
}

// Legacy format (backward compatible)
const legacyPhoto = caregiver.personalInfo.profilePhotoBase64;
if (legacyPhoto) {
  // Use legacy photo
}
```

### Creating Certificate

```typescript
import { Certificate, CertificateFile } from '@/lib/types/firestore';
import { processFileForStorage } from '@/lib/utils/fileProcessing';

const processed = await processFileForStorage(file, 'certificate');

const certificate: Certificate = {
  id: certId,
  name: 'CNA Certification',
  type: 'professional',
  file: {
    base64: processed.base64,
    originalName: processed.originalName,
    mimeType: processed.mimeType,
    sizeKB: processed.sizeKB,
  },
  verified: false,
  uploadedAt: serverTimestamp(),
};
```

## Helper Types

### `FirestoreDocument<T>`
Adds `id` field to any type:
```typescript
type CaregiverDoc = FirestoreDocument<CaregiverProfile>;
// { id: string, ...CaregiverProfile }
```

### `CreateDocument<T>`
Removes `id` and timestamps for creating new documents:
```typescript
type NewCaregiver = CreateDocument<CaregiverProfile>;
// Omit<CaregiverProfile, 'id' | 'createdAt' | 'updatedAt'>
```

### `UpdateDocument<T>`
For partial updates:
```typescript
type CaregiverUpdate = UpdateDocument<CaregiverProfile>;
// Partial<...> & { updatedAt: Timestamp }
```

## Best Practices

1. **Always use structured format** for new code
2. **Support legacy format** when reading existing data
3. **Validate file sizes** before saving (1MB document limit)
4. **Use thumbnails** in list views for performance
5. **Store certificates in subcollection** to avoid size limits

## Size Limits

- **Profile photos**: 200KB (full) + 20KB (thumbnail) = 220KB
- **Certificate files**: 700KB (images) or 800KB (PDFs)
- **Firestore document**: 1MB total limit
- **Subcollection documents**: 1MB each (isolated from main doc)

## Related Files

- `lib/utils/fileProcessing.ts` - File processing utilities
- `lib/firebase/caregivers.ts` - Caregiver data operations
- `lib/schemas/caregiver-onboarding.ts` - Zod validation schemas
- `STORAGE_MIGRATION_AUDIT.md` - Migration documentation


