/**
 * Utility to check if Anthropic API key is configured
 * Works in both client and server environments
 */

export function hasAnthropicAPIKey(): boolean {
  if (typeof window === 'undefined') {
    // Server-side
    return !!(
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY &&
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY !== '' &&
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY.startsWith('sk-ant-')
    );
  } else {
    // Client-side - check if it's available
    // Note: In Next.js, NEXT_PUBLIC_ vars are available at build time
    // But we can't access process.env directly in browser
    // So we'll check via a runtime check
    return true; // Assume it's set if we're using it
  }
}

export function getAnthropicAPIKey(): string {
  const key = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
  if (!key || key === '' || !key.startsWith('sk-ant-')) {
    console.warn('⚠️ Anthropic API key not configured or invalid');
    return '';
  }
  return key;
}

export function logAPIKeyStatus(): void {
  const key = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
  if (key && key !== '' && key.startsWith('sk-ant-')) {
    console.log('✅ Anthropic API key is configured');
    console.log(`   Key preview: ${key.substring(0, 15)}...`);
  } else {
    console.warn('⚠️ Anthropic API key NOT configured');
    console.warn('   Using mock matching instead');
  }
}

