/**
 * Custom hook for speech recognition using react-speech-recognition
 */
"use client";

import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition as useNativeSpeechRecognition,
} from "react-speech-recognition";

export const useSpeechRecognition = () => {
  const [isSupported, setIsSupported] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useNativeSpeechRecognition();

  useEffect(() => {
    setIsSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: false });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  return {
    transcript,
    listening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};
