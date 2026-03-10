import { Schema, model } from "mongoose";
import { OcrTechModel, TOcrTech } from "./ocr_ai..interface";

const TOcrTechSchema = new Schema<TOcrTech, OcrTechModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    ocrType: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    textImageUrl: {
      type: String,
      required: true,
    },
    extractedData: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

TOcrTechSchema.statics.isOcrTechCustomId = async function (id: string) {
  return await this.findById(id);
};

export const ocrtechs = model<TOcrTech, OcrTechModel>("ocrtechs", TOcrTechSchema);
