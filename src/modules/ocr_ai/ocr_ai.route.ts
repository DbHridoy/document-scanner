import express, { NextFunction, Request, Response } from "express";
import OCRValidation from "./ocr_ai.validation";
import OCRController from "./ocr_ai..controller";
import { upload } from "../../middlewares/upload.middleware";
import { apiError } from "../../errors/api-error";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../container";

const router = express.Router();

router.get("/test", OCRController.getTests);

router.post(
  "/ocr",
  authMiddleware.authenticate,
  upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body.data && typeof req.body.data === "string") {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(new apiError(400, "Invalid JSON data"));
    }
  },

  validate(OCRValidation.ocrschema),

  OCRController.ocr,
);

router.get("/find_my_ocr_list", authMiddleware.authenticate, OCRController.findByMyOCRList);
router.get("/textToImageBuffer", OCRController.textToImageBuffer);
router.get("/find_by_specific_ocr/:id", OCRController.findBySpecificOCR);
router.delete("/delete_ocr/:id", OCRController.deleteOCR);

const OcrRoute = router;
export default OcrRoute;
