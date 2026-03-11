import { z } from "zod";
const ocrschema = z.object({
  ocrType: z.string().trim().min(1, "ocr type cannot be empty").optional().default("auto"),
});

const OCRValidation = {
  ocrschema,
};

export default OCRValidation;
