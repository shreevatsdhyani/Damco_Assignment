/**
 * Enhanced Chat - Right pane with voice and inline charts
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, User, Bot, Sparkles } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useVoice } from "../lib/VoiceContext";
import ArtifactPanel from "./ArtifactPanel";
import { generateInitialSuggestions, generateFollowUpSuggestions, isSimilarQuestion } from "../utils/questionSuggestions";

interface Message {
  role: "user" | "assistant";
  content: string;
  chartData?: any;
  chartType?: "bar" | "line" | "pie";
  audioUrl?: string;
  artifactHtml?: string;
}

interface FileSchema {
  filename: string;
  columns: { name: string; dtype: string }[];
}

interface EnhancedChatProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string) => void;
  uploadedFiles?: FileSchema[];
  usedQuestions?: Set<string>;
}

const COLORS = ["#bfff00", "#00d9ff", "#ff5757", "#ff9500", "#10e37d", "#a855f7"];

export default function EnhancedChat({
  messages,
  loading,
  onSendMessage,
  uploadedFiles = [],
  usedQuestions = new Set(),
}: EnhancedChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string>("");
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const finalTranscriptRef = useRef<string>("");

  const { isListening, isSpeaking, supported, startListening, stopListening, speak, stopSpeaking } = useVoice();

  useEffect(() => {
    if (messages.length === 0 && uploadedFiles.length > 0) {
      const allSuggestions = generateInitialSuggestions(uploadedFiles);
      const filteredSuggestions = allSuggestions.filter((suggestion) => {
        for (const usedQ of Array.from(usedQuestions)) {
          if (isSimilarQuestion(suggestion, usedQ)) {
            return false;
          }
        }
        return true;
      });
      setSuggestions(filteredSuggestions);
    }
  }, [uploadedFiles, messages.length, usedQuestions]);

  useEffect(() => {
    if (messages.length >= 2) {
      const lastUserMessage = messages.filter(m => m.role === "user").slice(-1)[0];
      const lastAssistantMessage = messages.filter(m => m.role === "assistant").slice(-1)[0];

      if (lastUserMessage && lastAssistantMessage) {
        const allSuggestions = generateFollowUpSuggestions(
          lastUserMessage.content,
          lastAssistantMessage.content,
          uploadedFiles
        );

        const filteredSuggestions = allSuggestions.filter((suggestion) => {
          for (const usedQ of Array.from(usedQuestions)) {
            if (isSimilarQuestion(suggestion, usedQ)) {
              return false;
            }
          }
          return true;
        });

        if (filteredSuggestions.length === 0 && allSuggestions.length > 0) {
          setSuggestions(allSuggestions.slice(0, 3));
        } else {
          setSuggestions(filteredSuggestions);
        }
      }
    }
  }, [messages, uploadedFiles, usedQuestions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastIndex = messages.length - 1;

    if (lastMessage && lastMessage.role === "assistant" && lastMessage.content) {
      const messageId = `${messages.length}-${lastMessage.content.substring(0, 50)}`;
      if (messageId !== lastMessageIdRef.current) {
        lastMessageIdRef.current = messageId;
        setSpeakingMessageIndex(lastIndex);
        speak(lastMessage.content);
      }
    }
  }, [messages, speak]);

  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageIndex(null);
    }
  }, [isSpeaking]);

  const toggleListening = () => {
    if (!supported) {
      alert("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
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

      if (isSpeaking) {
        stopSpeaking();
        setSpeakingMessageIndex(null);
      }

      startListening(
        (interimText: string) => {
          const combined = finalTranscriptRef.current
            ? finalTranscriptRef.current + ' ' + interimText
            : interimText;
          setInputValue(combined);
        },
        (finalText: string) => {
          finalTranscriptRef.current = finalTranscriptRef.current
            ? finalTranscriptRef.current + ' ' + finalText
            : finalText;
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

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const renderChart = (message: Message) => {
    if (!message.chartData || !message.chartType) return null;

    const chartHeight = 250;

    switch (message.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={message.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#bfff00" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={message.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#bfff00" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={message.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {message.chartData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col border-l" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI Assistant</h2>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Ask questions about your financial data
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8" style={{ color: 'var(--text-secondary)' }}>
            <Bot className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-disabled)' }} />
            <p className="text-sm">Start by asking a question about your data</p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-disabled)' }}>
              Try: &quot;What is the total revenue?&quot; or &quot;Show me a chart of expenses&quot;
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
                <Bot className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
            )}

            <div className="flex-1 max-w-[80%]">
              <div
                className="rounded-lg p-3"
                style={{
                  background: message.role === "user" ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: message.role === "user" ? 'var(--text-on-accent)' : 'var(--text-primary)',
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.role === "assistant" && (message.artifactHtml || message.chartData) && (
                  <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border" style={{ color: 'var(--accent-primary)', background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Dashboard generated &rarr; View on right panel</span>
                  </div>
                )}
              </div>

              {message.role === "assistant" && (
                <button
                  onClick={() => {
                    if (speakingMessageIndex === index && isSpeaking) {
                      stopSpeaking();
                      setSpeakingMessageIndex(null);
                    } else {
                      setSpeakingMessageIndex(index);
                      speak(message.content);
                    }
                  }}
                  className="mt-2 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  style={{
                    background: speakingMessageIndex === index && isSpeaking ? 'var(--status-critical)' : 'var(--bg-card)',
                    color: speakingMessageIndex === index && isSpeaking ? 'var(--text-on-accent)' : 'var(--accent-primary)',
                  }}
                  title={speakingMessageIndex === index && isSpeaking ? "Stop reading" : "Read aloud"}
                >
                  {speakingMessageIndex === index && isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Stop reading</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Read aloud</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--border-subtle)' }}>
                <User className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
              <Bot className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--bg-card)' }}>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-disabled)' }} />
                <div className="w-2 h-2 rounded-full animate-bounce delay-100" style={{ background: 'var(--text-disabled)' }} />
                <div className="w-2 h-2 rounded-full animate-bounce delay-200" style={{ background: 'var(--text-disabled)' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!loading && suggestions.length > 0 && (
        <div className="px-4 py-3 border-t-2" style={{ background: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>
            <Sparkles className="w-4 h-4" />
            <span>Suggested questions ({suggestions.length}):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setInputValue(suggestion);
                  onSendMessage(suggestion);
                }}
                className="px-3 py-2 text-sm rounded-lg transition-colors shadow-sm font-medium"
                style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && suggestions.length === 0 && messages.length > 0 && (
        <div className="px-4 py-2 border-t text-xs" style={{ background: 'var(--status-warning)', borderColor: 'var(--status-warning)', color: 'var(--text-on-accent)' }}>
          Debug: No suggestions generated. Messages: {messages.length}, UsedQuestions: {usedQuestions.size}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className="p-3 rounded-lg transition-colors"
            style={{
              background: isListening ? 'var(--accent-primary)' : 'var(--border-subtle)',
              color: isListening ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              boxShadow: isListening ? '0 0 20px var(--shadow-glow)' : 'none',
            }}
            title={isListening ? "Click to stop listening" : "Click to start speaking"}
            disabled={!supported || loading}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type or click mic to ask..."}
              rows={isListening || inputValue.length > 50 ? 3 : 1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim() && !loading && !isListening) {
                    handleSubmit(e as any);
                  }
                }
              }}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all resize-none"
              style={{
                background: 'var(--bg-input)',
                borderColor: isListening ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
                boxShadow: isListening ? '0 0 10px var(--shadow-glow)' : 'none',
                minHeight: '48px',
                maxHeight: '120px',
                overflowY: 'auto' as const,
              }}
              disabled={loading}
            />
            {isListening && (
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <span className="w-1 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '0ms' }}></span>
                <span className="w-1 h-4 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '150ms' }}></span>
                <span className="w-1 h-3 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)', animationDelay: '300ms' }}></span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !inputValue.trim() || isListening}
            className="px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          {isListening
            ? "Listening... Text appears as you speak. Auto-submits when you stop speaking."
            : "Click mic to speak or type your question (Enter to send, Shift+Enter for new line)"}
        </p>
      </div>
    </div>
  );
}
