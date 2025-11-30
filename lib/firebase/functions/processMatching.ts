/**
 * Firebase Cloud Function to process matching queue
 * Triggered when a new document is added to /matching_queue
 */

import { collection, doc, getDocs, setDoc, updateDoc, query, where, limit, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { batchEvaluateMatches } from '@/lib/matching/claudeMatchingEngine';
import { serverTimestamp } from 'firebase/firestore';
import { createMockCaregivers } from '../mockData';

export async function processMatchingForSenior(seniorId: string) {
  try {
    // Update status to processing
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_status: 'processing',
      match_progress: 0,
      match_current_step: 'Cargando perfil del adulto mayor...',
      updatedAt: serverTimestamp(),
    });

    // Get senior profile
    const seniorDoc = await getDoc(doc(db, 'seniors', seniorId));
    if (!seniorDoc.exists()) throw new Error('Senior profile not found');

    const seniorData = seniorDoc.data();

    // Update progress
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_progress: 10,
      match_current_step: 'Buscando cuidadores disponibles...',
      updatedAt: serverTimestamp(),
    });

    // Get all active caregivers
    let caregiversSnapshot = await getDocs(
      query(
        collection(db, 'caregivers'),
        where('onboardingCompleted', '==', true),
        where('active', '==', true)
      )
    );

    let caregivers = caregiversSnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.id,
      ...doc.data(),
    })) as any[];

    // If no caregivers exist, create mock data for demo
    if (caregivers.length === 0) {
      console.log('⚠️ No caregivers found, creating mock data for demo...');
      await createMockCaregivers();
      
      // Fetch again after creating mocks
      caregiversSnapshot = await getDocs(
        query(
          collection(db, 'caregivers'),
          where('onboardingCompleted', '==', true),
          where('active', '==', true)
        )
      );
      
      caregivers = caregiversSnapshot.docs.map(doc => ({
        id: doc.id,
        userId: doc.id,
        ...doc.data(),
      })) as any[];

      if (caregivers.length === 0) {
        throw new Error('No caregivers available even after creating mocks');
      }
    }

    // Update progress
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_progress: 20,
      match_current_step: `Evaluando ${caregivers.length} cuidadores...`,
      updatedAt: serverTimestamp(),
    });

    // FORCE Claude API usage - no fallback to mock
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';
    const useClaudeAPI = apiKey && apiKey !== '' && apiKey.startsWith('sk-ant-');

    console.log('🔍 Matching Configuration:');
    console.log(`   API Key present: ${!!apiKey}`);
    console.log(`   API Key valid: ${apiKey.startsWith('sk-ant-')}`);
    console.log(`   Using Claude API: ${useClaudeAPI}`);
    console.log(`   Caregivers to evaluate: ${caregivers.length}`);

    if (!useClaudeAPI) {
      throw new Error(
        'Claude API key no configurada. ' +
        'Agrega NEXT_PUBLIC_ANTHROPIC_API_KEY a .env.local y reinicia el servidor.'
      );
    }

    // Use Claude API for real matching - REQUIRED
    console.log('🤖 Using Claude API for ML-powered matching (REQUIRED)');
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_current_step: `Evaluando ${caregivers.length} cuidadores con Claude AI...`,
      updatedAt: serverTimestamp(),
    });

    let matches: any[];

    try {
      const startTime = Date.now();
      matches = await batchEvaluateMatches(
        seniorData as any,
        caregivers,
        async (progress, step) => {
          await updateDoc(doc(db, 'seniors', seniorId), {
            match_progress: 20 + (progress * 0.7), // 20-90%
            match_current_step: step,
            updatedAt: serverTimestamp(),
          });
        }
      );
      const duration = Date.now() - startTime;
      console.log(`✅ Claude matching completed in ${duration}ms`);
      console.log(`   Generated ${matches.length} matches using Claude AI`);
    } catch (error: any) {
      console.error('❌ Claude API failed:', error);
      console.error('   Error message:', error.message || error);
      throw new Error(
        `Claude API error: ${error.message || 'Unknown error'}. ` +
        'Verifica que la API key sea válida y que Claude API esté disponible.'
      );
    }

    // Update progress
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_progress: 90,
      match_current_step: 'Guardando resultados...',
      updatedAt: serverTimestamp(),
    });

    // Save top 10 matches to subcollection
    const topMatches = matches.slice(0, 10);

    for (const match of topMatches) {
      await setDoc(
        doc(db, 'seniors', seniorId, 'matches', match.caregiverId),
        {
          ...match,
          seniorId,
          createdAt: new Date().toISOString(),
        }
      );
    }

    // Update senior status to ready
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_status: 'ready',
      match_progress: 100,
      match_current_step: 'Completado',
      match_count: topMatches.length,
      last_matched_at: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });

    // Update queue status
    const queueDoc = doc(db, 'matching_queue', seniorId);
    const queueExists = await getDoc(queueDoc);
    if (queueExists.exists()) {
      await updateDoc(queueDoc, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Matching complete for senior ${seniorId}: ${topMatches.length} matches found`);
  } catch (error) {
    console.error('Error processing matching:', error);

    // Update status to error
    await updateDoc(doc(db, 'seniors', seniorId), {
      match_status: 'error',
      match_error: (error as Error).message,
      updatedAt: serverTimestamp(),
    });

    const queueDoc = doc(db, 'matching_queue', seniorId);
    const queueExists = await getDoc(queueDoc);
    if (queueExists.exists()) {
      await updateDoc(queueDoc, {
        status: 'failed',
        error: (error as Error).message,
      });
    }
  }
}

