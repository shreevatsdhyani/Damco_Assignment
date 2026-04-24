"use client";

import { useRef, useEffect, useState } from "react";
import { Bot, User, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { useVoice } from "../lib/VoiceContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  chartData?: any;
  chartType?: string;
  audioUrl?: string;
  artifactHtml?: string;
}

interface ConversationHistoryProps {
  messages: Message[];
  loading: boolean;
}

export default function ConversationHistory({ messages, loading }: ConversationHistoryProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string>("");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const justTriggeredRef = useRef(false);
  const { isSpeaking, speak, stopSpeaking } = useVoice();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && last.content) {
      const id = `${messages.length}-${last.content.substring(0, 50)}`;
      if (id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = id;
        justTriggeredRef.current = true;
        setSpeakingIndex(messages.length - 1);
        speak(last.content);
      }
    }
  }, [messages, speak]);

  useEffect(() => {
    if (!isSpeaking) {
      if (justTriggeredRef.current) {
        justTriggeredRef.current = false;
        return;
      }
      setSpeakingIndex(null);
    }
  }, [isSpeaking]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-app)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-12 h-12 mb-3" style={{ color: 'var(--text-disabled)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>
              Use the command bar below to ask your AI CFO a question
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--bg-card)' }}>
                <Bot className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              </div>
            )}
            <div className="max-w-[70%]">
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: msg.role === "user" ? 'var(--accent-primary)' : 'var(--bg-chat-ai)',
                  color: msg.role === "user" ? 'var(--text-on-accent)' : 'var(--text-primary)',
                  border: msg.role === "assistant" ? '1px solid var(--border-chat-ai)' : 'none',
                }}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && msg.artifactHtml && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium pt-2 border-t" style={{ color: 'var(--accent-primary)', borderColor: 'var(--border-subtle)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard generated — switch to Dashboard tab to view
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (() => {
                const isThisSpeaking = speakingIndex === i && (isSpeaking || justTriggeredRef.current);
                return (
                  <button
                    onClick={() => {
                      if (isThisSpeaking) {
                        stopSpeaking();
                        setSpeakingIndex(null);
                        justTriggeredRef.current = false;
                      } else {
                        setSpeakingIndex(i);
                        justTriggeredRef.current = true;
                        speak(msg.content);
                      }
                    }}
                    className="mt-1.5 px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                    style={{
                      color: isThisSpeaking ? 'var(--status-critical)' : 'var(--text-disabled)',
                    }}
                  >
                    {isThisSpeaking ? (
                      <><VolumeX className="w-3.5 h-3.5" /> Stop reading</>
                    ) : (
                      <><Volume2 className="w-3.5 h-3.5" /> Read aloud</>
                    )}
                  </button>
                );
              })()}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--border-subtle)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
              <Bot className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-card)' }}>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-disabled)' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-disabled)', animationDelay: '0.1s' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-disabled)', animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
