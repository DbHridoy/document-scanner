import { Request } from "express";
import { Types } from "mongoose";
import { apiError } from "../../errors/api-error";
import { HttpCodes } from "../../constants/status-codes";
import { commonAIFunction } from "./ocr_ai.utils";
import { universalPrompt } from "./ocr_ai.constant";
import { ocrtechs } from "./ocr_ai.model";
import { TOcrExtractedData } from "./ocr_ai..interface";

const getTests = async () => {
  return "ocr service is working";
};

const textToImageBuffer = async (data: Record<string, unknown> | string) => {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <rect width="100%" height="100%" fill="#ffffff" />
      <foreignObject x="24" y="24" width="1152" height="752">
        <div xmlns="http://www.w3.org/1999/xhtml"
          style="font-family: monospace; font-size: 20px; white-space: pre-wrap; color: #111;">
          ${text.replace(/[<>&]/g, (char) => {
            const escapeMap: Record<string, string> = {
              "<": "&lt;",
              ">": "&gt;",
              "&": "&amp;",
            };
            return escapeMap[char];
          })}
        </div>
      </foreignObject>
    </svg>
  `.trim();

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return { success: true, url };
};

const normalizeExtractedData = (
  extractedData: Record<string, unknown>,
  ocrType: string
): TOcrExtractedData => {
  const rawResponse = extractedData;
  const fieldsCandidate = extractedData.fields;

  const fields =
    fieldsCandidate && typeof fieldsCandidate === "object" && !Array.isArray(fieldsCandidate)
      ? (fieldsCandidate as Record<string, unknown>)
      : Object.fromEntries(
          Object.entries(extractedData).filter(([key]) => key !== "documentType")
        );

  const documentTypeValue =
    typeof extractedData.documentType === "string" && extractedData.documentType.trim()
      ? extractedData.documentType.trim()
      : ocrType !== "auto"
        ? ocrType
        : "unknown";

  return {
    documentType: documentTypeValue,
    fields,
    rawResponse,
  };
};

const buildPromptWithTypeHint = (ocrType: string) => {
  if (!ocrType || ocrType === "auto") {
    return universalPrompt;
  }

  return {
    text: `${universalPrompt.text}\nUse "${ocrType}" as a document type hint, but if the uploaded file is clearly another document type, return the actual detected type instead.`,
  };
};

const ocrIntoDb = async (req: Request, userId: string) => {
  const file = req.file as
    | {
        buffer?: Buffer;
        mimetype?: string;
        originalname?: string;
      }
    | undefined;
  if (!file?.buffer) {
    throw new apiError(HttpCodes.BadRequest, "File not provided");
  }

  const { ocrType = "auto" } = req.body as { ocrType?: string };
  const aiResponse = await commonAIFunction(
    file.buffer,
    buildPromptWithTypeHint(ocrType),
    file.mimetype || "image/png"
  );
  if (!Object.keys(aiResponse).length) {
    throw new apiError(
      HttpCodes.BadRequest,
      "AI returned no structured document data"
    );
  }

  const extractedData = normalizeExtractedData(aiResponse, ocrType);
  const preview = await textToImageBuffer(extractedData.fields);

  const created = await ocrtechs.create({
    userId: new Types.ObjectId(userId),
    ocrType,
    documentType: extractedData.documentType,
    filePath: file.originalname || `upload-${Date.now()}`,
    textImageUrl: preview.url,
    extractedData,
  });

  return {
    id: created._id,
    documentType: created.documentType,
    ocrType: created.ocrType,
    filePath: created.filePath,
    textImageUrl: created.textImageUrl,
    extractedData: created.extractedData,
  };
};

const findByMyOCRListIntoDb = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;
  const ocrType = typeof query.ocrType === "string" ? query.ocrType : undefined;

  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    isDelete: false,
  };

  if (ocrType) {
    filter.ocrType = ocrType;
  }

  const [records, total] = await Promise.all([
    ocrtechs.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ocrtechs.countDocuments(filter),
  ]);

  return {
    meta: { page, limit, total },
    records,
  };
};

const findBySpecificOCRInDb = async (id: string) => {
  const record = await ocrtechs.findOne({ _id: id, isDelete: false });
  if (!record) {
    throw new apiError(HttpCodes.NotFound, "OCR record not found");
  }

  return record;
};

const deleteOCRIntoDb = async (id: string) => {
  const deleted = await ocrtechs.findByIdAndUpdate(
    id,
    { isDelete: true, status: false },
    { new: true }
  );

  if (!deleted) {
    throw new apiError(HttpCodes.NotFound, "OCR record not found");
  }

  return {
    id: deleted._id,
    status: deleted.status,
  };
};

const OCRService = {
  getTests,
  ocrIntoDb,
  findByMyOCRListIntoDb,
  textToImageBuffer,
  findBySpecificOCRInDb,
  deleteOCRIntoDb,
};

export default OCRService;
