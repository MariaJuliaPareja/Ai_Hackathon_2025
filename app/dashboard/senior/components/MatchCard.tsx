'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CaregiverMatch } from '@/lib/types/matching';

interface Props {
  match: CaregiverMatch;
  seniorId: string;
}

export default function MatchCard({ match, seniorId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(match.status);

  const handleInterest = async () => {
    setStatus('interested');
    await updateDoc(
      doc(db, 'seniors', seniorId, 'matches', match.caregiverId),
      { status: 'interested', interestedAt: new Date().toISOString() }
    );
  };

  const handleReject = async () => {
    setStatus('rejected');
    await updateDoc(
      doc(db, 'seniors', seniorId, 'matches', match.caregiverId),
      { status: 'rejected', rejectedAt: new Date().toISOString() }
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excelente Match';
    if (score >= 70) return 'Muy Buen Match';
    if (score >= 60) return 'Buen Match';
    return 'Match Aceptable';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with Rank */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white text-blue-600 font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center">
            #{match.rank}
          </div>
          <span className="text-white font-medium">Top Match</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score.overall)}`}>
          {match.score.overall}% Compatible
        </div>
      </div>

      <div className="p-6">
        {/* Caregiver Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {match.caregiver.profilePhoto?.thumbnail ? (
              <img
                src={match.caregiver.profilePhoto.thumbnail}
                alt={match.caregiver.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-400">👤</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {match.caregiver.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {match.caregiver.yearsExperience} años de experiencia • {match.caregiver.location}
            </p>
            <div className="flex items-center gap-2 mb-2">
              {match.caregiver.avgRating && (
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">★</span>
                  <span className="text-sm font-medium">{match.caregiver.avgRating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-sm text-gray-500">
                S/{match.caregiver.hourlyRate}/hora
              </span>
            </div>
          </div>
        </div>

        {/* ML Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            ✨ Por qué es un excelente match:
          </p>
          <p className="text-sm text-blue-800">
            {match.mlReasoning.summary}
          </p>
        </div>

        {/* Key Strengths */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">FORTALEZAS CLAVE:</p>
          <div className="space-y-1">
            {match.mlReasoning.strengths.slice(0, 3).map((strength, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-sm text-gray-700">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Details */}
        {expanded && (
          <div className="border-t pt-4 mt-4 space-y-4">
            {/* Score Breakdown */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">DETALLES DE COMPATIBILIDAD:</p>
              <div className="grid grid-cols-2 gap-2">
                <ScoreBar label="Experiencia Médica" score={match.score.breakdown.semantic_similarity} />
                <ScoreBar label="Habilidades" score={match.score.breakdown.skills_match} />
                <ScoreBar label="Ubicación" score={match.score.breakdown.location_proximity} />
                <ScoreBar label="Disponibilidad" score={match.score.breakdown.availability_fit} />
              </div>
            </div>

            {/* Compatibility Factors */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">ANÁLISIS DETALLADO:</p>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Experiencia Médica:</span>
                  <p className="text-gray-600">{match.mlReasoning.compatibility_factors.medical_expertise}</p>
                </div>
                <div>
                  <span className="font-medium">Enfoque de Cuidado:</span>
                  <p className="text-gray-600">{match.mlReasoning.compatibility_factors.care_approach}</p>
                </div>
                <div>
                  <span className="font-medium">Logística:</span>
                  <p className="text-gray-600">{match.mlReasoning.compatibility_factors.practical_fit}</p>
                </div>
              </div>
            </div>

            {/* Considerations */}
            {match.mlReasoning.considerations && match.mlReasoning.considerations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">CONSIDERACIONES:</p>
                <div className="space-y-1">
                  {match.mlReasoning.considerations.map((consideration, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">⚠</span>
                      <span className="text-sm text-gray-700">{consideration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">SOBRE EL CUIDADOR:</p>
              <p className="text-sm text-gray-600">{match.caregiver.bio}</p>
            </div>

            {/* Skills & Certifications */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">HABILIDADES:</p>
                <div className="flex flex-wrap gap-1">
                  {match.caregiver.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">CERTIFICACIONES:</p>
                <div className="flex flex-wrap gap-1">
                  {match.caregiver.certifications.map((cert, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-xs text-blue-700 rounded">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 mt-4 border-t"
        >
          {expanded ? '▲ Ver menos' : '▼ Ver más detalles'}
        </button>

        {/* Action Buttons */}
        {status === 'pending' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleReject}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              No me interesa
            </button>
            <button
              onClick={handleInterest}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Me interesa
            </button>
          </div>
        )}

        {status === 'interested' && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              ✓ Interés registrado. Te contactaremos pronto.
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">Match descartado</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-700">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColor(score)} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

