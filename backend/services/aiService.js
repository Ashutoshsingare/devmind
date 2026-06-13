/**
 * DevMind — AI Service (Anthropic Claude API Client)
 *
 * Builds task-specific prompts and proxies requests to the
 * Gemini API. API key is read exclusively from
 * process.env.GEMINI_API_KEY — never hardcoded.
 *
 * Supported task types: explainCode, fixError, refactor, chat
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_TOKENS = 4096;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Prompt Templates
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PROMPT_TEMPLATES = {
  explainCode: ({ code, language }) =>
    `Explain what this ${language} code does. Cover: purpose, inputs, outputs, edge cases. Be concise.\n\n\`\`\`${language}\n${code}\n\`\`\``,

  fixError: ({ code, language, error }) =>
    `This ${language} code has an error: ${error}. Fix it. Return corrected code only — no explanation, no markdown.\n\n\`\`\`${language}\n${code}\n\`\`\``,

  optimizeCode: ({ code, language }) =>
    `Optimize this ${language} code for performance and efficiency. Maintain the same behavior. Return optimized code only — no explanation, no markdown.\n\n\`\`\`${language}\n${code}\n\`\`\``,

  refactor: ({ code, language }) =>
    `Refactor this ${language} code for clarity. Do not change behavior. Return code only — no markdown.\n\n\`\`\`${language}\n${code}\n\`\`\``,

  chat: ({ language, message }) =>
    `You are an expert coding assistant. User is editing ${language}. Answer concisely. User: ${message}`,
};

/**
 * Build the user prompt for a given task type.
 *
 * @param {string} taskType — One of: explainCode, fixError, refactor, chat
 * @param {object} params  — { code?, language, error?, message? }
 * @returns {string} — The constructed prompt
 * @throws {Error} — If taskType is invalid or required params are missing
 */
function buildPrompt(taskType, params) {
  const builder = PROMPT_TEMPLATES[taskType];

  if (!builder) {
    const err = new Error(
      `Invalid task type: "${taskType}". Supported: ${Object.keys(PROMPT_TEMPLATES).join(', ')}`
    );
    err.statusCode = 400;
    throw err;
  }

  // Validate required fields per task type
  if (!params.language || typeof params.language !== 'string') {
    const err = new Error('Language is required for all AI tasks');
    err.statusCode = 400;
    throw err;
  }

  if (taskType === 'chat') {
    if (!params.message || typeof params.message !== 'string') {
      const err = new Error('Message is required for chat task type');
      err.statusCode = 400;
      throw err;
    }
  } else {
    if (!params.code || typeof params.code !== 'string') {
      const err = new Error('Code is required for this task type');
      err.statusCode = 400;
      throw err;
    }
  }

  if (taskType === 'fixError') {
    if (!params.error || typeof params.error !== 'string') {
      const err = new Error('Error description is required for fixError task type');
      err.statusCode = 400;
      throw err;
    }
  }

  return builder(params);
}

/**
 * Send a request to the Gemini API.
 *
 * @param {object} options
 * @param {string} options.taskType — explainCode | fixError | refactor | chat
 * @param {string} options.code     — Source code (required for non-chat tasks)
 * @param {string} options.language — Programming language
 * @param {string} [options.error]  — Error description (required for fixError)
 * @param {string} [options.message]— User message (required for chat)
 * @returns {Promise<{ response: string, model: string, usage: object }>}
 * @throws {Error} — On missing API key, validation failure, or API error
 */
async function sendAIRequest({ taskType, code, language, error, message }) {
  // ── Check API key ──────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Set it in your .env file.'
    );
    err.statusCode = 503;
    throw err;
  }

  // ── Build prompt ───────────────────────────
  const prompt = buildPrompt(taskType, { code, language, error, message });

  // ── Call Gemini API ─────────────────────
  // Dynamic import for node-fetch (ESM module)
  const fetch = (await import('node-fetch')).default;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
      }
    }),
  });

  // ── Handle API errors ─────────────────────
  if (!response.ok) {
    let errorMessage = `Gemini API error: ${response.status} ${response.statusText}`;

    try {
      const errorBody = await response.json();
      if (errorBody.error && errorBody.error.message) {
        errorMessage = `Gemini API error: ${errorBody.error.message}`;
      }
    } catch {
      // Use the default error message
    }

    const err = new Error(errorMessage);
    err.statusCode = response.status === 429 ? 429 : 400; // 400 exposes error to UI
    throw err;
  }

  // ── Parse successful response ─────────────
  const data = await response.json();

  let textContent = '';
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
    textContent = data.candidates[0].content.parts.map((p) => p.text).join('\n');
  }

  return {
    response: textContent,
    model: GEMINI_MODEL,
    usage: data.usageMetadata || {},
  };
}

/**
 * Get the list of supported AI task types.
 * @returns {string[]}
 */
function getSupportedTaskTypes() {
  return Object.keys(PROMPT_TEMPLATES);
}

module.exports = {
  sendAIRequest,
  buildPrompt,
  getSupportedTaskTypes,
};
