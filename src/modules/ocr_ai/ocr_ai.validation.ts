import { z } from "zod";
const ocrschema = z.object({
  ocrType: z.string().min(1, "ocr type is required"),
});

const OCRValidation = {
  ocrschema,
};

export default OCRValidation;
