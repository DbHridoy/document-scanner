import { Model, Types } from "mongoose";

export interface TOcrTech {
  userId: Types.ObjectId;
  filePath: string;
  ocrType: string;
  status: boolean;
  textImageUrl: string;
  extractedData: Record<string, unknown>;
  isDelete: boolean;
}

export interface OcrTechModel extends Model<TOcrTech> {
  isOcrTechCustomId(id: string): Promise<TOcrTech | null>;
}
