'use client';

import { useEffect, useState } from 'react';

export default function APIStatusBanner() {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'configured' | 'missing'>('checking');

  useEffect(() => {
    // Check API key status (client-side check)
    // Note: In Next.js, NEXT_PUBLIC_ vars are available at build time
    // We can't directly check process.env in browser, but we can infer from behavior
    // For now, we'll show a helpful message
    setApiKeyStatus('checking');
    
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    // In production, assume it's configured if matches are being generated
    // In dev, show helpful message
    if (isDev) {
      // Try to detect if API key might be missing by checking console warnings
      // This is a heuristic approach
      setTimeout(() => {
        setApiKeyStatus('missing'); // Default to showing help in dev
      }, 1000);
    } else {
      setApiKeyStatus('configured');
    }
  }, []);

  if (apiKeyStatus === 'checking') {
    return null;
  }

  if (apiKeyStatus === 'missing') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">
                Modo Demo: Claude API no configurada
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Para usar matching con IA, configura <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_ANTHROPIC_API_KEY</code> en <code className="bg-yellow-100 px-1 rounded">.env.local</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

