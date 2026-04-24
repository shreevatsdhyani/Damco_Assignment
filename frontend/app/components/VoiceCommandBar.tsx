"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Sparkles, FlaskConical } from "lucide-react";
import { useVoice } from "../lib/VoiceContext";
import { generateInitialSuggestions, generateFollowUpSuggestions, isSimilarQuestion } from "../utils/questionSuggestions";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FileSchema {
  filename: string;
  columns: { name: string; dtype: string }[];
}

interface VoiceCommandBarProps {
  onSendMessage: (message: string) => void;
  onOpenScenario: () => void;
  loading: boolean;
  messages: Message[];
  uploadedFiles?: FileSchema[];
  usedQuestions?: Set<string>;
  aiSuggestions?: string[];
}

export default function VoiceCommandBar({
  onSendMessage,
  onOpenScenario,
  loading,
  messages,
  uploadedFiles = [],
  usedQuestions = new Set(),
  aiSuggestions = [],
}: VoiceCommandBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const finalTranscriptRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isListening, supported, startListening, stopListening, isSpeaking, stopSpeaking } = useVoice();

  useEffect(() => {
    if (aiSuggestions.length > 0) {
      const filtered = aiSuggestions.filter(s => !Array.from(usedQuestions).some(u => isSimilarQuestion(s, u)));
      setSuggestions(filtered.slice(0, 4));
      return;
    }
    if (messages.length === 0 && uploadedFiles.length > 0) {
      const all = generateInitialSuggestions(uploadedFiles);
      const filtered = all.filter(s => !Array.from(usedQuestions).some(u => isSimilarQuestion(s, u)));
      setSuggestions(filtered.slice(0, 4));
    }
  }, [uploadedFiles, messages.length, usedQuestions, aiSuggestions]);

  useEffect(() => {
    if (aiSuggestions.length > 0) return;
    if (messages.length >= 2) {
      const lastUser = messages.filter(m => m.role === "user").slice(-1)[0];
      const lastAssistant = messages.filter(m => m.role === "assistant").slice(-1)[0];
      if (lastUser && lastAssistant) {
        const all = generateFollowUpSuggestions(lastUser.content, lastAssistant.content, uploadedFiles);
        const filtered = all.filter(s => !Array.from(usedQuestions).some(u => isSimilarQuestion(s, u)));
        setSuggestions((filtered.length > 0 ? filtered : all).slice(0, 4));
      }
    }
  }, [messages, uploadedFiles, usedQuestions, aiSuggestions]);

  const toggleListening = () => {
    if (!supported) {
      alert("Speech recognition not supported. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      stopListening();
      if (finalTranscriptRef.current.trim() && !loading) {
        onSendMessage(finalTranscriptRef.current.trim());
        setInputValue("");
        finalTranscriptRef.current = "";
      }
    } else {
      finalTranscriptRef.current = "";
      setInputValue("");
      if (isSpeaking) stopSpeaking();

      startListening(
        (interim: string) => {
          const combined = finalTranscriptRef.current
            ? finalTranscriptRef.current + " " + interim
            : interim;
          setInputValue(combined);
        },
        (final_: string) => {
          finalTranscriptRef.current = finalTranscriptRef.current
            ? finalTranscriptRef.current + " " + final_
            : final_;
          setInputValue(finalTranscriptRef.current);
        },
        () => {
          if (finalTranscriptRef.current.trim() && !loading) {
            onSendMessage(finalTranscriptRef.current.trim());
            setInputValue("");
            finalTranscriptRef.current = "";
          }
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
      {/* Suggestions Row */}
      {!loading && suggestions.length > 0 && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2 overflow-x-auto">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(s)}
              className="px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors border"
              style={{
                background: 'transparent',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--accent-primary)';
                (e.target as HTMLElement).style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)';
                (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Voice Orb */}
        <button
          onClick={toggleListening}
          disabled={!supported || loading}
          className="relative w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-40"
          style={{
            background: isListening ? 'var(--accent-primary)' : 'var(--bg-input)',
            color: isListening ? 'var(--text-on-accent)' : 'var(--text-secondary)',
            boxShadow: isListening ? '0 0 0 4px color-mix(in srgb, var(--accent-primary) 30%, transparent), 0 0 30px var(--shadow-glow)' : 'none',
          }}
          title={isListening ? "Stop listening" : "Speak to your CFO"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: 'var(--accent-primary)' }} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--status-critical)' }} />
            </>
          )}
        </button>

        {/* Text Input */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening... speak now" : "Ask your CFO anything..."}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 text-sm transition-all"
              style={{
                background: 'var(--bg-input)',
                borderColor: isListening ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
                boxShadow: isListening ? '0 0 10px var(--shadow-glow)' : 'none',
              }}
              disabled={loading}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && inputValue.trim() && !loading && !isListening) {
                  handleSubmit(e);
                }
              }}
            />
            {isListening && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <span className="w-1 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)' }} />
                <span className="w-1 h-4 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '150ms' }} />
                <span className="w-1 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Scenario Button */}
          <button
            type="button"
            onClick={onOpenScenario}
            className="p-3 rounded-xl transition-colors"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
            }}
            title="What-If Scenario"
          >
            <FlaskConical className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={loading || !inputValue.trim() || isListening}
            className="p-3 rounded-xl transition-colors disabled:opacity-40"
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--text-on-accent)',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Status line */}
      <div className="px-4 pb-2">
        <p className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>
          {loading ? "Analyzing..." : isListening ? "Listening... speak naturally. Auto-submits on silence." : "Click mic to speak or type your question. Enter to send."}
        </p>
      </div>
    </div>
  );
}
