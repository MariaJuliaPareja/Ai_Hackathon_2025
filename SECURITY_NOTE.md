# ⚠️ Security Note: Anthropic API Key in Browser

## Current Implementation

The Anthropic API client is currently configured with `dangerouslyAllowBrowser: true` to allow client-side execution for the hackathon demo.

**Location**: `lib/matching/claudeMatchingEngine.ts`

```typescript
const anthropic = apiKey ? new Anthropic({ 
  apiKey,
  dangerouslyAllowBrowser: true, // ⚠️ For hackathon demo only
}) : null;
```

## ⚠️ Security Warning

**This exposes your API key in the browser bundle.** Anyone can:
1. Open browser DevTools
2. View the JavaScript bundle
3. Extract your API key
4. Use it to make their own API calls (costing you money)

## ✅ For Hackathon/Demo: ACCEPTABLE

- Quick setup and demo
- Temporary API key can be rotated after demo
- Easier to demonstrate the feature

## 🚨 For Production: MUST MOVE TO BACKEND

### Recommended Architecture:

1. **Create API Route**: `app/api/matching/route.ts`
   ```typescript
   import { Anthropic } from '@anthropic-ai/sdk';
   
   export async function POST(request: Request) {
     const anthropic = new Anthropic({
       apiKey: process.env.ANTHROPIC_API_KEY, // Server-side only
     });
     
     // Process matching here
     return Response.json({ matches });
   }
   ```

2. **Call from Client**: `lib/firebase/functions/processMatching.ts`
   ```typescript
   const response = await fetch('/api/matching', {
     method: 'POST',
     body: JSON.stringify({ seniorId, caregivers }),
   });
   ```

3. **Environment Variables**:
   - Remove `NEXT_PUBLIC_ANTHROPIC_API_KEY` from `.env.local`
   - Add `ANTHROPIC_API_KEY` (without `NEXT_PUBLIC_` prefix)
   - This keeps it server-side only

## 🔄 Migration Checklist

- [ ] Create `/app/api/matching/route.ts`
- [ ] Move matching logic to API route
- [ ] Update `processMatchingForSenior` to call API route
- [ ] Change env var from `NEXT_PUBLIC_ANTHROPIC_API_KEY` to `ANTHROPIC_API_KEY`
- [ ] Remove `dangerouslyAllowBrowser: true`
- [ ] Test that API key is no longer visible in browser bundle
- [ ] Rotate API key after migration

## 📝 Current Status

✅ **Hackathon Demo**: Working with `dangerouslyAllowBrowser: true`  
⚠️ **Production Ready**: NO - Requires backend migration

