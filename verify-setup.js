#!/usr/bin/env node

/**
 * Quick verification script to check if setup is complete
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying setup...\n');

let allGood = true;

// Check .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('   Create it with your Firebase configuration\n');
  allGood = false;
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  
  const missing = requiredVars.filter(v => !envContent.includes(v));
  if (missing.length > 0) {
    console.log('❌ .env.local missing variables:');
    missing.forEach(v => console.log(`   - ${v}`));
    allGood = false;
  } else {
    console.log('✅ .env.local file exists with all required variables');
  }
}

// Check node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('❌ node_modules not found');
  console.log('   Run: npm install\n');
  allGood = false;
} else {
  console.log('✅ node_modules directory exists');
}

// Check key dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const keyDeps = ['next', 'react', 'firebase', 'framer-motion'];
const missingDeps = keyDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Missing dependencies:');
  missingDeps.forEach(dep => console.log(`   - ${dep}`));
  allGood = false;
} else {
  console.log('✅ Key dependencies present');
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ Setup looks good! You can run: npm run dev');
} else {
  console.log('⚠️  Please fix the issues above before running the app');
  console.log('\n📖 See QUICK_START.md or SETUP_GUIDE.md for help');
}

process.exit(allGood ? 0 : 1);


