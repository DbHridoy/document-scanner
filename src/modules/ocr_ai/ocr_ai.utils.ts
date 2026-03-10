import axios from "axios";
import fs from "fs";
import { env } from "../../config/env";

export const commonAIFunction = async (
  file: string | Buffer,
  commonPrompt: { text: string },
  mimeType = "image/png"
) => {
  if (!env.GEMINI_AI_URL) {
    return {};
  }

  const imageBase64 =
    typeof file === "string" ? fs.readFileSync(file, "base64") : file.toString("base64");

  // Call Gemini OCR
  const response = await axios.post(env.GEMINI_AI_URL as string, {
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
  });

  // Extract model text output
  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  // Use regex to capture first valid JSON block
  const match = text.match(/\{[\s\S]*?\}/);
  const cleanJson = match ? match[0] : "{}";

  // Try parsing safely
  try {
    return JSON.parse(cleanJson);
  } catch {
    return {};
  }
};
