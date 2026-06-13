/**
 * DevMind — useRunner Hook
 *
 * Manages code execution state: sends code to the sandbox API,
 * captures stdout/stderr as separate output entries, tracks
 * running state and exit code.
 *
 * State shape:
 *   output:    [{ text: string, type: "stdout"|"stderr"|"system" }]
 *   isRunning: boolean
 *   exitCode:  number | null
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';

/**
 * Detect language from filename extension.
 * @param {string} filename
 * @returns {string}
 */
function detectLanguage(filename) {
  if (!filename) return 'javascript';
  const ext = filename.split('.').pop().toLowerCase();
  const langMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
    java: 'java',
    cpp: 'cpp',
  };
  return langMap[ext] || ext;
}

export default function useRunner() {
  // ── State ──────────────────────────────
  const [output, setOutput] = useState(() => {
    const saved = sessionStorage.getItem('devmind_runner_output');
    return saved ? JSON.parse(saved) : [];
  });
  const [isRunning, setIsRunning] = useState(false);
  const [exitCode, setExitCode] = useState(null);

  // ── Persist to sessionStorage ────────────
  useEffect(() => {
    sessionStorage.setItem('devmind_runner_output', JSON.stringify(output));
  }, [output]);

  // ── Run code ───────────────────────────
  const runCode = useCallback(async (filename, content, language) => {
    // Determine language — explicit param or detect from filename
    const lang = language || detectLanguage(filename);

    // Add a system message marking the run start
    setOutput((prev) => [
      ...prev,
      {
        text: `▶ Running ${filename || 'code'} (${lang})...`,
        type: 'system',
        timestamp: new Date(),
      },
    ]);

    setIsRunning(true);
    setExitCode(null);

    // Prevent running unsupported front-end files
    const supportedExecutableLangs = ['javascript', 'typescript', 'python', 'java', 'cpp'];
    if (!supportedExecutableLangs.includes(lang)) {
      setOutput((prev) => [
        ...prev,
        {
          text: `Cannot execute "${lang}" files in the backend terminal. The Run button is for executing scripts.`,
          type: 'stderr',
          timestamp: new Date(),
        },
      ]);
      setExitCode(1);
      setIsRunning(false);
      return;
    }


    try {
      const res = await fetch(`${API_URL}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: content, language: lang }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errorMsg = body.error || `Execution failed: ${res.status}`;

        setOutput((prev) => [
          ...prev,
          { text: errorMsg, type: 'stderr', timestamp: new Date() },
        ]);
        setExitCode(1);
        setIsRunning(false);
        return;
      }

      const data = await res.json();

      // Append stdout lines
      if (data.stdout) {
        const stdoutLines = data.stdout.split('\n');
        setOutput((prev) => [
          ...prev,
          ...stdoutLines.map((line) => ({
            text: line,
            type: 'stdout',
            timestamp: new Date(),
          })),
        ]);
      }

      // Append stderr lines
      if (data.stderr) {
        const stderrLines = data.stderr.split('\n');
        setOutput((prev) => [
          ...prev,
          ...stderrLines.map((line) => ({
            text: line,
            type: 'stderr',
            timestamp: new Date(),
          })),
        ]);
      }

      // Append exit/timeout system message
      if (data.timedOut) {
        setOutput((prev) => [
          ...prev,
          {
            text: '⏱ Process timed out after 10 seconds',
            type: 'system',
            timestamp: new Date(),
          },
        ]);
        setExitCode(null);
      } else {
        const code = data.exitCode ?? 0;
        const icon = code === 0 ? '✓' : '✗';
        setOutput((prev) => [
          ...prev,
          {
            text: `${icon} Process exited with code ${code}`,
            type: 'system',
            timestamp: new Date(),
          },
        ]);
        setExitCode(code);
      }
    } catch (err) {
      // Network or unexpected error
      setOutput((prev) => [
        ...prev,
        {
          text: `Error: ${err.message || 'Failed to connect to server'}`,
          type: 'stderr',
          timestamp: new Date(),
        },
      ]);
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  }, []);

  // ── Clear output ───────────────────────
  const clearOutput = useCallback(() => {
    setOutput([]);
    setExitCode(null);
  }, []);

  return {
    output,
    isRunning,
    exitCode,
    runCode,
    clearOutput,
  };
}
