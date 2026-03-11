import { Model, Types } from "mongoose";

export interface TOcrExtractedData {
  documentType: string;
  fields: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
}

export interface TOcrTech {
  userId: Types.ObjectId;
  filePath: string;
  ocrType: string;
  documentType: string;
  status: boolean;
  textImageUrl: string;
  extractedData: TOcrExtractedData;
  isDelete: boolean;
}

export interface OcrTechModel extends Model<TOcrTech> {
  isOcrTechCustomId(id: string): Promise<TOcrTech | null>;
}
