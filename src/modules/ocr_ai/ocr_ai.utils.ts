import axios from "axios";
import fs from "fs";
import { env } from "../../config/env";
import { apiError } from "../../errors/api-error";
import { HttpCodes } from "../../constants/status-codes";

type GeminiPart = {
  text?: string;
};

const extractJsonCandidate = (text: string) => {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  if (!trimmed) {
    return "{}";
  }

  const directStarts = ["{", "["];
  if (directStarts.includes(trimmed[0])) {
    return trimmed;
  }

  const objectStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  const startCandidates = [objectStart, arrayStart].filter((value) => value >= 0);

  if (startCandidates.length === 0) {
    return "{}";
  }

  const start = Math.min(...startCandidates);
  const openChar = trimmed[start];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;

  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(start, index + 1);
      }
    }
  }

  return "{}";
};

const parseGeminiResponse = (text: string): Record<string, unknown> => {
  const candidate = extractJsonCandidate(text);

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
};

export const commonAIFunction = async (
  file: string | Buffer,
  commonPrompt: { text: string },
  mimeType = "image/png"
) => {
  if (!env.GEMINI_AI_URL) {
    throw new apiError(
      HttpCodes.BadRequest,
      "GEMINI_AI_URL is not configured"
    );
  }

  const imageBase64 =
    typeof file === "string" ? fs.readFileSync(file, "base64") : file.toString("base64");

  let response;
  try {
    response = await axios.post(
      env.GEMINI_AI_URL,
      {
        contents: [
          {
            parts: [
              commonPrompt,
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      },
      {
        timeout: 60000,
      }
    );
  } catch (error) {
    throw new apiError(HttpCodes.BadRequest, "Failed to process document with AI");
  }

  const parts = response.data?.candidates?.[0]?.content?.parts as GeminiPart[] | undefined;
  const text = parts?.map((part) => part.text || "").join("\n").trim() || "{}";

  return parseGeminiResponse(text);
};
