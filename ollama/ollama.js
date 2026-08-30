// ollama.js
// Talks to a LOCAL Ollama installation, which proxies to Ollama's cloud
// model when a "-cloud" model tag is used.
//
// IMPORTANT — endpoint choice:
// We deliberately use Ollama's NATIVE endpoint (/api/chat) instead of its
// OpenAI-compatible endpoint (/v1/chat/completions). Cloud vision models
// accessed through the OpenAI-compatible endpoint have known image-handling
// issues (images arriving detached from the multimodal pipeline / 500s on
// some vision-capable cloud models). The native /api/chat endpoint, using
// the documented `images` field on a message, is the officially supported
// and reliable path for sending an image to a multimodal Ollama model, and
// is what Ollama's own docs/examples use for every Gemma cloud model.
//
// This module is the ONLY place that talks to the model. Everything it
// returns is treated as UNTRUSTED DATA by the rest of the extension.

// ---------------------------------------------------------------------------
// Single configuration point for the model, as required.
// ---------------------------------------------------------------------------
export const MODEL = "gemma4:31b-cloud";

export const OLLAMA_HOST = "http://localhost:11434";
export const OLLAMA_CHAT_ENDPOINT = `${OLLAMA_HOST}/api/chat`;

const REQUEST_TIMEOUT_MS = 45000;

// ---------------------------------------------------------------------------
// System prompt — strict, JSON-only, no explanations, no markdown, no code.
// ---------------------------------------------------------------------------
export const SYSTEM_PROMPT = `You are a browser-automation perception module.

You will be given:
1. A screenshot of the currently visible part of a web page.
2. A natural-language instruction from the user describing an action to perform on that page.

Your ONLY job is to decide which single browser action should be performed, and return it as STRICT JSON. You do not execute anything yourself — a separate, trusted program will execute the action.

Rules (follow all of them exactly):
- Output ONLY a single JSON object. Nothing else.
- Do NOT wrap the JSON in markdown code fences.
- Do NOT include any explanation, commentary, or extra text before or after the JSON.
- Do NOT return JavaScript, HTML, or any executable code.
- Do NOT invent actions outside the supported list below.
- "x" and "y", when present, are pixel coordinates within the screenshot image, with (0,0) at the top-left corner.
- If you cannot confidently determine the requested action from the screenshot and instruction, return the ERROR action instead of guessing.

Supported actions and their EXACT JSON shapes:

CLICK — click a button, link, or clickable element:
{"action":"CLICK","target":"<visible text or label of the element>","x":<number>,"y":<number>,"confidence":<0-1>}

TYPE — type text into an input, textarea, or contenteditable field:
{"action":"TYPE","target":"<field label/placeholder/name>","text":"<text to type>","x":<number>,"y":<number>,"confidence":<0-1>}

SCROLL — scroll the page:
{"action":"SCROLL","direction":"up"|"down","amount":<number of pixels>,"confidence":<0-1>}

SELECT — choose an option from a native <select> dropdown:
{"action":"SELECT","target":"<dropdown label/name>","value":"<option text to select>","x":<number>,"y":<number>,"confidence":<0-1>}

NAVIGATE — go to a URL:
{"action":"NAVIGATE","url":"<absolute http/https URL>","confidence":<0-1>}

ERROR — you cannot determine the action:
{"action":"ERROR","reason":"<short reason>"}

Return exactly one JSON object matching one of these shapes. Nothing else.`;

/**
 * Sends the screenshot + instruction to Gemma via Ollama's native chat API
 * and returns the PARSED (but not yet validated) JSON object the model
 * produced.
 *
 * @param {string} instruction - the user's natural-language instruction
 * @param {string} imageBase64 - base64-encoded PNG/JPEG, WITHOUT the
 *                                "data:image/...;base64," prefix
 * @returns {Promise<object>} parsed JSON from the model
 * @throws {Error} with a human-readable message on any failure
 */
export async function getActionFromGemma(instruction, imageBase64) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const requestBody = {
    model: MODEL,
    stream: false,
    format: "json", // forces Ollama to guarantee syntactically valid JSON output
    options: {
      temperature: 0.2
    },
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `User instruction: "${instruction}"\n\nLook at the attached screenshot and return the JSON action described in the system prompt.`,
        images: [imageBase64]
      }
    ]
  };

  let response;
  try {
    response = await fetch(OLLAMA_CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        `Ollama request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Is Ollama running at ${OLLAMA_HOST}?`
      );
    }
    throw new Error(
      `Could not connect to Ollama at ${OLLAMA_HOST}. Make sure the Ollama app is running and OLLAMA_ORIGINS allows this extension.`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // Read the body ONCE as text, then try to parse it as JSON. Calling
    // response.json() and then response.text() on the same Response object
    // fails silently on the second call because the body stream has
    // already been consumed - that bug used to hide the real error text.
    const rawBody = await response.text().catch(() => "");
    let detail = rawBody;
    try {
      const errJson = JSON.parse(rawBody);
      detail = errJson.error || JSON.stringify(errJson);
    } catch (_) {
      // rawBody wasn't JSON; use it as-is (e.g. a plain-text CORS rejection).
    }

    if (response.status === 404) {
      throw new Error(
        `Model "${MODEL}" was not found by Ollama. Run "ollama pull ${MODEL}" (or sign in with "ollama signin" for cloud models) and try again.`
      );
    }

    if (response.status === 403) {
      throw new Error(
        `Ollama rejected the request (HTTP 403): ${detail || "forbidden"}. ` +
          `This usually means Ollama's origin allow-list is blocking this extension. ` +
          `Set OLLAMA_ORIGINS to include "chrome-extension://*" and restart Ollama (see README).`
      );
    }

    throw new Error(
      `Ollama returned an error (HTTP ${response.status}): ${detail || "unknown error"}`
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    throw new Error("Ollama returned a response that was not valid JSON.");
  }

  const content = payload && payload.message && payload.message.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("Gemma returned an empty response.");
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error("Gemma returned malformed JSON: " + content.slice(0, 200));
  }
}
