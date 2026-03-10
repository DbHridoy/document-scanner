import { Request } from "express";
import { Types } from "mongoose";
import { apiError } from "../../errors/api-error";
import { HttpCodes } from "../../constants/status-codes";
import { commonAIFunction } from "./ocr_ai.utils";
import { universalPrompt } from "./ocr_ai.constant";
import { ocrtechs } from "./ocr_ai.model";

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

  const { ocrType } = req.body as { ocrType: string };
  const extractedData = await commonAIFunction(
    file.buffer,
    universalPrompt,
    file.mimetype || "image/png"
  );
  const preview = await textToImageBuffer(extractedData as Record<string, unknown>);

  const created = await ocrtechs.create({
    userId: new Types.ObjectId(userId),
    ocrType,
    filePath: file.originalname || `upload-${Date.now()}`,
    textImageUrl: preview.url,
    extractedData,
  });

  return {
    id: created._id,
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
