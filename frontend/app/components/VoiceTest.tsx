/**
 * Voice Test Component - Standalone test for voice functionality
 */
"use client";

import { useState } from "react";
import { useVoice } from "../lib/VoiceContext";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export default function VoiceTest() {
  const [transcript, setTranscript] = useState("");
  const [testText, setTestText] = useState("Hello! This is a test of the text to speech system.");

  const { isListening, isSpeaking, supported, startListening, stopListening, speak, stopSpeaking } = useVoice();

  const handleStartListening = () => {
    console.log("Test: Starting listening");
    startListening((text: string) => {
      console.log("Test: Received transcript:", text);
      setTranscript(text);
    });
  };

  const handleSpeak = () => {
    console.log("Test: Speaking");
    speak(testText);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Voice System Test</h2>

      {/* Support Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <p className="font-semibold">
          Status: {supported ? "✅ Supported" : "❌ Not Supported"}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Browser: {typeof window !== "undefined" ? window.navigator.userAgent.split(" ").pop() : "Unknown"}
        </p>
        <p className="text-sm text-gray-600">
          Speech Recognition: {typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) ? "✅" : "❌"}
        </p>
        <p className="text-sm text-gray-600">
          Speech Synthesis: {typeof window !== "undefined" && "speechSynthesis" in window ? "✅" : "❌"}
        </p>
      </div>

      {/* Speech-to-Text Test */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-3">Speech-to-Text Test</h3>
        <button
          onClick={isListening ? stopListening : handleStartListening}
          disabled={!supported}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isListening
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
        <div className="mt-3 p-3 bg-gray-50 rounded min-h-[60px]">
          <p className="text-sm font-semibold mb-1">Transcript:</p>
          <p className="text-gray-700">{transcript || "(Click the mic button and speak)"}</p>
        </div>
      </div>

      {/* Text-to-Speech Test */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-3">Text-to-Speech Test</h3>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-3"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSpeak}
            disabled={!supported || !testText}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Volume2 className="w-5 h-5" />
            Speak
          </button>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
            >
              <VolumeX className="w-5 h-5" />
              Stop Speaking
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {isSpeaking ? "🔊 Speaking..." : "Press Speak to hear the text"}
        </p>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Voice features require microphone permissions.
          Chrome, Edge, and Safari support these features best.
          Check the browser console (F12) for debug logs.
        </p>
      </div>
    </div>
  );
}
