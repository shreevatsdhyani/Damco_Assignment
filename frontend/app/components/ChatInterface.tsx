/**
 * Chat interface component
 * Voice-first chat interface for querying financial data
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import type { Message } from "../types";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, voiceEnabled: boolean) => void;
  loading: boolean;
  fileId?: string;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  loading,
  fileId,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    transcript,
    listening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading && fileId) {
      onSendMessage(input.trim(), voiceEnabled);
      setInput("");
      resetTranscript();
    }
  };

  const handleVoiceToggle = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">
              Ask me anything about your financial data
            </p>
            <p className="text-sm">
              Try: "What is our runway?" or "Show me Q3 software expenses"
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.audio_url && (
                  <audio
                    controls
                    className="mt-2 w-full"
                    src={message.audio_url}
                  />
                )}
                {message.chart_data && (
                  <div className="mt-2 p-2 bg-white rounded">
                    <p className="text-xs text-gray-600">Chart data available</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                listening
                  ? "Listening..."
                  : fileId
                  ? "Ask a question about your data..."
                  : "Upload a file to start"
              }
              disabled={loading || !fileId}
              className={`
                w-full px-4 py-3 pr-12 rounded-lg border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${listening ? "ring-2 ring-red-500" : ""}
              `}
            />
            {isSupported && fileId && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={loading}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2
                  p-2 rounded-full transition-colors
                  ${
                    listening
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {listening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading || !fileId}
            className="
              px-6 py-3 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors
              disabled:bg-gray-300 disabled:cursor-not-allowed
              flex items-center gap-2
            "
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        {!isSupported && (
          <p className="text-xs text-yellow-600 mt-2">
            Voice input not supported in this browser
          </p>
        )}
      </div>
    </div>
  );
}
