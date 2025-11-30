'use client';

import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import type { CaregiverMatch } from '@/lib/types/matching';
import { Button } from '@/components/ui/button';
import { getAnthropicAPIKey } from '@/lib/utils/apiCheck';

// Get API key using the same method as matching engine
// This ensures consistency across the app
// ⚠️ TEMPORARY: Hardcoded for demo - replace with getAnthropicAPIKey() after hackathon
const apiKey = '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';

// Debug logging - check in browser console (F12 → Console tab)
console.log('🔑 CaregiverChatModal API Key Debug:');
console.log('  - API Key present:', !!apiKey);
console.log('  - API Key length:', apiKey?.length || 0);
console.log('  - API Key preview:', apiKey ? apiKey.substring(0, 20) + '...' : 'MISSING');
console.log('  - API Key format valid:', apiKey ? (apiKey.startsWith('sk-ant-api03-') && apiKey.length > 80) : false);

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  match: CaregiverMatch;
  isOpen: boolean;
  onClose: () => void;
  onRequestInterview: () => void;
}

// Keywords for validating question relevance
const RELEVANT_KEYWORDS = [
  'experiencia', 'años', 'trabajo', 'trabajado', 'cuidado', 'cuidador',
  'habilidad', 'habilidades', 'capacidad', 'capacidades', 'puedo', 'puede',
  'disponibilidad', 'horario', 'horarios', 'día', 'días', 'semana',
  'certificación', 'certificaciones', 'certificado', 'estudios', 'formación',
  'enfoque', 'método', 'estilo', 'manera', 'forma', 'cómo',
  'precio', 'tarifa', 'costo', 'cobro', 'cobras',
  'ubicación', 'distancia', 'cerca', 'lejos',
  'especialización', 'especialidades', 'condiciones', 'enfermedades',
  'medicamentos', 'medicación', 'administración',
  'movilidad', 'movilizar', 'transferencias',
  'alimentación', 'comida', 'preparación',
  'higiene', 'baño', 'aseo',
  'compañía', 'supervisión',
];

// Initialize Anthropic client - same pattern as matching engine
// Create client once at module level (like matching engine does)
const anthropicClient = apiKey ? new Anthropic({ 
  apiKey: apiKey.trim(), // Ensure no whitespace
  dangerouslyAllowBrowser: true, // Required for client-side execution
}) : null;

const getAnthropicClient = () => {
  if (!apiKey || !anthropicClient) {
    console.error('❌ NEXT_PUBLIC_ANTHROPIC_API_KEY not found or invalid');
    console.error('   API Key present:', !!apiKey);
    console.error('   API Key length:', apiKey?.length || 0);
    return null;
  }
  
  console.log('✅ Using Anthropic client (same as matching engine)');
  return anthropicClient;
};

// Validate if question is relevant to caregiving
function isQuestionRelevant(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  return RELEVANT_KEYWORDS.some(keyword => lowerQuestion.includes(keyword));
}

// Build caregiver profile context for system prompt
function buildCaregiverContext(match: CaregiverMatch): string {
  const c = match.caregiver;
  
  return `Eres ${c.name}, un cuidador profesional con ${c.yearsExperience} años de experiencia.

PERFIL PROFESIONAL:
- Edad: ${c.age} años
- Ubicación: ${c.location}
- Años de experiencia: ${c.yearsExperience}
- Tarifa: S/${c.hourlyRate} por hora
${c.avgRating ? `- Calificación promedio: ${c.avgRating}/5` : ''}

HABILIDADES:
${c.skills?.map(s => `- ${s}`).join('\n') || '- Cuidado general'}

CERTIFICACIONES:
${c.certifications?.map(cert => `- ${cert}`).join('\n') || '- En proceso'}

BIOGRAFÍA:
${c.bio || 'Cuidador dedicado con experiencia en cuidado de adultos mayores.'}

ESPECIALIZACIONES:
${match.mlReasoning.compatibility_factors.medical_expertise}

ENFOQUE DE CUIDADO:
${match.mlReasoning.compatibility_factors.care_approach}

DISPONIBILIDAD:
${match.mlReasoning.compatibility_factors.practical_fit}

INSTRUCCIONES:
- Responde SIEMPRE en primera persona como si fueras ${c.name}
- Sé amable, profesional y empático
- Solo responde preguntas sobre tu experiencia, habilidades, disponibilidad, enfoque de cuidado y certificaciones
- Si te preguntan algo fuera de tema, responde: "Por favor, hazme preguntas sobre mi experiencia como cuidador"
- Mantén respuestas concisas pero informativas (2-4 oraciones)
- Usa un tono conversacional y cercano`;
}

export default function CaregiverChatModal({ match, isOpen, onClose, onRequestInterview }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy ${match.caregiver.name}. Estoy aquí para responder tus preguntas sobre mi experiencia como cuidador. ¿En qué puedo ayudarte?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset chat when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: 'assistant',
          content: `¡Hola! Soy ${match.caregiver.name}. Estoy aquí para responder tus preguntas sobre mi experiencia como cuidador. ¿En qué puedo ayudarte?`,
          timestamp: new Date(),
        },
      ]);
      setInputValue('');
    }
  }, [isOpen, match.caregiver.name]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Validate question relevance BEFORE API call
    if (!isQuestionRelevant(userMessage)) {
      const rejectionMessage: Message = {
        role: 'assistant',
        content: 'Por favor, hazme preguntas sobre mi experiencia como cuidador, mis habilidades, disponibilidad, certificaciones o mi enfoque de cuidado.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, rejectionMessage]);
      setIsLoading(false);
      return;
    }

    try {
      const anthropic = getAnthropicClient();
      if (!anthropic) {
        const errorMsg = 'API key no configurada. Por favor, verifica que NEXT_PUBLIC_ANTHROPIC_API_KEY esté en .env.local y reinicia el servidor.';
        console.error('❌', errorMsg);
        const errorMessage: Message = {
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      }));

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Call Claude API
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: buildCaregiverContext(match),
        messages: conversationHistory.slice(-10), // Keep last 10 messages for context
      });

      const assistantContent = response.content[0];
      if (assistantContent.type !== 'text') {
        throw new Error('Respuesta inesperada de Claude');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('❌ Error calling Claude API:', error);
      
      // Handle authentication errors specifically
      let errorMessageText = 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.';
      
      if (error?.status === 401 || error?.message?.includes('authentication') || error?.message?.includes('401')) {
        errorMessageText = 'Error de autenticación: La API key no es válida o no está configurada. Por favor, verifica que NEXT_PUBLIC_ANTHROPIC_API_KEY esté en .env.local y reinicia el servidor.';
        console.error('🔑 Authentication Error Details:');
        console.error('   - API Key present:', !!apiKey);
        console.error('   - API Key length:', apiKey?.length || 0);
        console.error('   - Error:', error.message || error);
      } else if (error?.message) {
        errorMessageText = `Error: ${error.message}`;
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorMessageText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            {match.caregiver.profilePhoto?.thumbnail ? (
              <img
                src={match.caregiver.profilePhoto.thumbnail}
                alt={match.caregiver.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">{match.caregiver.name}</h3>
              <p className="text-sm text-blue-100">Chat con IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  {match.caregiver.profilePhoto?.thumbnail ? (
                    <img
                      src={match.caregiver.profilePhoto.thumbnail}
                      alt={match.caregiver.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                {match.caregiver.profilePhoto?.thumbnail ? (
                  <img
                    src={match.caregiver.profilePhoto.thumbnail}
                    alt={match.caregiver.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white rounded-b-lg">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Enviar
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Puedes preguntar sobre experiencia, habilidades, disponibilidad, certificaciones y enfoque de cuidado
          </p>
        </div>

        {/* Request Interview Button */}
        {messages.length > 2 && (
          <div className="p-4 border-t bg-blue-50">
            <Button
              onClick={() => {
                onRequestInterview();
                onClose();
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-medium"
            >
              Solicitar Entrevista
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

