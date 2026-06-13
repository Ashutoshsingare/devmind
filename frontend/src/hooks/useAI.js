/**
 * DevMind — useAI Hook
 *
 * Manages AI assistant state: sends requests to the Anthropic
 * Claude API proxy, maintains a conversation-style message history,
 * and exposes task-specific actions (chat, explain, fix, refactor).
 *
 * State shape:
 *   messages:  [{ role: "user"|"assistant"|"error", text: string, timestamp: Date }]
 *   isLoading: boolean
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

/**
 * Helper: call the AI API endpoint.
 * @param {object} body — Request payload for POST /api/ai
 * @returns {Promise<string>} — The AI response text
 */
async function callAI(body) {
  const res = await fetch(`${API_URL}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `AI request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Helper: create a message object.
 * @param {"user"|"assistant"|"error"} role
 * @param {string} text
 * @returns {{ role: string, text: string, timestamp: Date }}
 */
function createMessage(role, text) {
  return { role, text, timestamp: new Date() };
}

export default function useAI() {
  // ── State ──────────────────────────────
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('devmind_ai_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // ── Persist to sessionStorage ────────────
  useEffect(() => {
    sessionStorage.setItem('devmind_ai_messages', JSON.stringify(messages));
  }, [messages]);

  // ── Chat — general coding assistant ────
  const sendMessage = useCallback(async (userText, code, language) => {
    // Append user message
    setMessages((prev) => [...prev, createMessage('user', userText)]);
    setIsLoading(true);

    try {
      const response = await callAI({
        taskType: 'chat',
        message: userText,
        code: code || undefined,
        language: language || 'javascript',
      });

      setMessages((prev) => [...prev, createMessage('assistant', response)]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage('error', err.message || 'Failed to get AI response'),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Explain selected code ──────────────
  const explainCode = useCallback(async (selectedCode, language) => {
    const userMsg = `Explain this ${language || 'code'}:\n\`\`\`\n${selectedCode}\n\`\`\``;
    setMessages((prev) => [...prev, createMessage('user', userMsg)]);
    setIsLoading(true);

    try {
      const response = await callAI({
        taskType: 'explainCode',
        code: selectedCode,
        language: language || 'javascript',
      });

      setMessages((prev) => [...prev, createMessage('assistant', response)]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage('error', err.message || 'Failed to explain code'),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fix error in code ──────────────────
  const fixError = useCallback(async (fullCode, errorOutput, language) => {
    const userMsg = `Fix this error:\n\`\`\`\n${errorOutput}\n\`\`\``;
    setMessages((prev) => [...prev, createMessage('user', userMsg)]);
    setIsLoading(true);

    try {
      const response = await callAI({
        taskType: 'fixError',
        code: fullCode,
        language: language || 'javascript',
        error: errorOutput,
      });

      setMessages((prev) => [...prev, createMessage('assistant', response)]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage('error', err.message || 'Failed to fix error'),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Refactor selected code ─────────────
  const refactor = useCallback(async (selectedCode, language) => {
    const userMsg = `Refactor this ${language || 'code'} for clarity`;
    setMessages((prev) => [...prev, createMessage('user', userMsg)]);
    setIsLoading(true);

    try {
      const response = await callAI({
        taskType: 'refactor',
        code: selectedCode,
        language: language || 'javascript',
      });

      setMessages((prev) => [...prev, createMessage('assistant', response)]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage('error', err.message || 'Failed to refactor code'),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Optimize selected code ─────────────
  const optimizeCode = useCallback(async (selectedCode, language) => {
    const userMsg = `Optimize this ${language || 'code'} for performance`;
    setMessages((prev) => [...prev, createMessage('user', userMsg)]);
    setIsLoading(true);

    try {
      const response = await callAI({
        taskType: 'optimizeCode',
        code: selectedCode,
        language: language || 'javascript',
      });

      setMessages((prev) => [...prev, createMessage('assistant', response)]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        createMessage('error', err.message || 'Failed to optimize code'),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Clear conversation ─────────────────
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    explainCode,
    fixError,
    optimizeCode,
    refactor,
    clearMessages,
  };
}
