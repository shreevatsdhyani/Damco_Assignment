/**
 * Custom hook for chat/query functionality
 */
"use client";

import { useState } from "react";
import apiClient from "../lib/api";
import type { Message, QueryRequest, QueryResponse } from "../types";

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendQuery = async (
    fileId: string,
    question: string,
    voiceEnabled: boolean = false
  ) => {
    setLoading(true);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const request: QueryRequest = {
        file_id: fileId,
        question,
        voice_enabled: voiceEnabled,
      };

      const response: QueryResponse = await apiClient.executeQuery(request);

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        audio_url: response.audio_url,
        chart_data: response.chart_data,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Query execution failed";

      // Add error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    loading,
    sendQuery,
    clearChat,
  };
};
