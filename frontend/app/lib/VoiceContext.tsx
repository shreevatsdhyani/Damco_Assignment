/**
 * VoiceContext - Browser-native TTS and STT using Web Speech API
 * No backend required, no third-party services
 */
'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

interface ISpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface ISpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): ISpeechRecognitionAlternative
  [index: number]: ISpeechRecognitionAlternative
}

interface ISpeechRecognitionResultList {
  readonly length: number
  item(index: number): ISpeechRecognitionResult
  [index: number]: ISpeechRecognitionResult
}

interface ISpeechRecognitionEvent extends Event {
  readonly results: ISpeechRecognitionResultList
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface VoiceContextValue {
  isListening: boolean
  isSpeaking: boolean
  supported: boolean
  startListening: (onInterim: (text: string) => void, onFinal: (text: string) => void, onEnd?: () => void) => void
  stopListening: () => void
  speak: (text: string) => void
  stopSpeaking: () => void
}

const VoiceContext = createContext<VoiceContextValue>({
  isListening: false,
  isSpeaking: false,
  supported: false,
  startListening: () => {},
  stopListening: () => {},
  speak: () => {},
  stopSpeaking: () => {},
})

export function useVoice() {
  return useContext(VoiceContext)
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const speechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    const isSupported = speechRecognitionSupported && speechSynthesisSupported;

    console.log("VoiceContext initialized:", {
      speechRecognitionSupported,
      speechSynthesisSupported,
      isSupported
    });

    setSupported(isSupported);
  }, [])

  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const startListening = useCallback(
    (onInterim: (text: string) => void, onFinal: (text: string) => void, onEnd?: () => void) => {
      console.log("startListening called, supported:", supported, "isListening:", isListening);

      if (!supported || isListening) {
        console.log("Cannot start listening - not supported or already listening");
        return;
      }

      const SR: new () => ISpeechRecognition =
        window.SpeechRecognition ?? window.webkitSpeechRecognition

      console.log("Creating SpeechRecognition instance with real-time transcription");
      const recognition = new SR()
      recognition.lang = 'en-US'
      recognition.interimResults = true  // Enable real-time interim results
      recognition.maxAlternatives = 1
      recognition.continuous = true      // Keep listening continuously

      let lastResultIndex = 0;
      let silenceTimer: NodeJS.Timeout | null = null;

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        // IMPORTANT: Only process NEW results, not all results from the beginning
        // The results array accumulates, so we track what we've already processed
        for (let i = lastResultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcript
            console.log("✅ Final transcript piece:", transcript);
            lastResultIndex = i + 1; // Mark this result as processed
          } else {
            interimTranscript += transcript
            console.log("⏳ Interim transcript:", transcript);
          }
        }

        // Send interim results to update input field in real-time
        if (interimTranscript) {
          onInterim(interimTranscript);
        }

        // Send final results (only new ones)
        if (finalTranscript) {
          onFinal(finalTranscript);

          // Reset silence timer - start counting 2 seconds of silence
          if (silenceTimer) {
            clearTimeout(silenceTimer);
          }
          silenceTimer = setTimeout(() => {
            console.log("🔇 2 seconds of silence detected - auto-stopping");
            if (recognitionRef.current === recognition && shouldRestart) {
              shouldRestart = false;
              recognition.stop();
            }
          }, 2000);
        }
      }

      let shouldRestart = true;

      recognition.onstart = () => {
        console.log("✅ Speech recognition started - speak now!");
        setIsListening(true);
      }

      recognition.onend = () => {
        console.log("Speech recognition ended");

        // Clear silence timer
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        // Stop and trigger auto-submit
        console.log("🛑 Stopping recognition session");
        setIsListening(false);
        // Call onEnd callback when recognition truly stops
        if (onEnd) {
          onEnd();
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);

        // Handle no-speech as a natural end (auto-submit)
        if (event.error === 'no-speech') {
          console.log("🎤 No speech detected - stopping and auto-submitting");
          shouldRestart = false;
          setIsListening(false);
          // Will trigger onEnd via the onend handler
        } else if (event.error === 'aborted') {
          shouldRestart = false;
          setIsListening(false);
        }
      }

      // Override stopListening to set shouldRestart flag
      const originalStop = () => {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        shouldRestart = false;
        recognition.stop();
      };

      recognitionRef.current = recognition;
      // Store the stop method
      (recognition as any).customStop = originalStop;

      console.log("Starting recognition...");
      recognition.start();
    },
    [supported, isListening],
  )

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current as any;
    if (recognition) {
      // Use custom stop if available (sets shouldRestart flag)
      if (recognition.customStop) {
        recognition.customStop();
      } else {
        recognition.stop();
      }
    }
    setIsListening(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      console.log("speak called, supported:", supported, "text length:", text?.length);

      if (!supported) {
        console.log("Cannot speak - not supported");
        return;
      }

      window.speechSynthesis.cancel()

      // Clean markdown and format for speech
      const clean = text
        .replace(/[#*_`~>]/g, '') // strip markdown
        .replace(/\n+/g, '. ') // newlines become sentence pauses
        .trim()

      console.log("Speaking cleaned text:", clean.substring(0, 100));

      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = 1.05
      utterance.pitch = 1.0

      utterance.onstart = () => {
        console.log("Speech synthesis started");
        setIsSpeaking(true);
      }
      utterance.onend = () => {
        console.log("Speech synthesis ended");
        setIsSpeaking(false);
      }
      utterance.onerror = (event: any) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
      }

      window.speechSynthesis.speak(utterance)
    },
    [supported],
  )

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel()
  }, [])

  return (
    <VoiceContext.Provider
      value={{ isListening, isSpeaking, supported, startListening, stopListening, speak, stopSpeaking }}
    >
      {children}
    </VoiceContext.Provider>
  )
}
