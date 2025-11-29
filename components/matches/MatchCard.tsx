"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Award, Sparkles } from "lucide-react";
import { Match, CaregiverData } from "./types";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface MatchCardProps {
  match: Match;
  caregiver: CaregiverData;
  matchingFactors: string[];
  onSwipe: (direction: "left" | "right" | "up", match: Match) => void;
}

export default function MatchCard({
  match,
  caregiver,
  matchingFactors,
}: MatchCardProps) {
  const matchScore = Math.round(match.similarity * 100);
  const [displayPhoto, setDisplayPhoto] = useState<string | undefined>(
    caregiver.profilePhotoThumbnailBase64 || caregiver.profilePhotoBase64
  );
  const [isLoadingFullPhoto, setIsLoadingFullPhoto] = useState(false);

  // Lazy load full photo when card is visible/interacted with
  useEffect(() => {
    // If we only have thumbnail, load full photo on-demand
    if (caregiver.profilePhotoThumbnailBase64 && !caregiver.profilePhotoBase64) {
      // Load full photo when component mounts (or on hover/interaction)
      const loadFullPhoto = async () => {
        setIsLoadingFullPhoto(true);
        try {
          const caregiverRef = doc(db, "caregivers", match.caregiver_id);
          const caregiverSnap = await getDoc(caregiverRef);
          if (caregiverSnap.exists()) {
            const data = caregiverSnap.data();
            const fullPhoto = data.personalInfo?.profilePhotoBase64;
            if (fullPhoto) {
              setDisplayPhoto(fullPhoto);
            }
          }
        } catch (error) {
          console.error("Error loading full photo:", error);
        } finally {
          setIsLoadingFullPhoto(false);
        }
      };

      // Load after a short delay to prioritize thumbnail display
      const timer = setTimeout(loadFullPhoto, 100);
      return () => clearTimeout(timer);
    } else if (caregiver.profilePhotoBase64) {
      // Full photo already available
      setDisplayPhoto(caregiver.profilePhotoBase64);
    }
  }, [caregiver, match.caregiver_id]);

  return (
    <Card className="overflow-hidden shadow-2xl">
      <div className="relative">
        {/* Photo */}
        <div className="relative h-96 bg-gradient-to-br from-blue-400 to-indigo-600">
          {displayPhoto ? (
            <>
              <img
                src={displayPhoto}
                alt={`Foto de perfil de ${caregiver.name}`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoadingFullPhoto ? "opacity-50" : "opacity-100"
                }`}
              />
              {isLoadingFullPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-6xl text-gray-400">
                {caregiver.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Match score badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="absolute top-4 right-4 bg-white rounded-full px-4 py-2 shadow-lg"
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-lg">{matchScore}%</span>
            </div>
          </motion.div>
        </div>

        <CardContent className="p-6">
          {/* Name and experience */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {caregiver.name}
            </h2>
            <p className="text-gray-600">
              {caregiver.yearsOfExperience} años de experiencia
            </p>
          </div>

          {/* Location and distance */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{caregiver.location}</span>
            {match.features.location_score > 0.8 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Muy cerca
              </span>
            )}
          </div>

          {/* Matching factors */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Por qué esta coincidencia:
            </h3>
            <div className="space-y-2">
              {matchingFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="text-green-500 font-bold">✓</span>
                  <span>{factor}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Specializations */}
          {caregiver.specializations.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Especializaciones
              </h3>
              <div className="flex flex-wrap gap-2">
                {caregiver.specializations.slice(0, 3).map((spec, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {spec}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications count */}
          {caregiver.certifications && caregiver.certifications.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Award className="w-4 h-4" />
              <span>
                {caregiver.certifications.length} certificación
                {caregiver.certifications.length > 1 ? "es" : ""}
              </span>
            </div>
          )}

          {/* Swipe hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500"
          >
            Desliza para ver más opciones
          </motion.div>
        </CardContent>
      </div>
    </Card>
  );
}

