import { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import OCRService from "./ocr_ai..service";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";

const getTests: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await OCRService.getTests();
    res.status(HttpCodes.Ok).json({
      success: true,
      message: "Tests fetched successfully",
      data: result,
    });
  }
);

const ocr: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new apiError(HttpCodes.Unauthorized, "Unauthorized");
  }

  const result = await OCRService.ocrIntoDb(req, userId);
  res.status(HttpCodes.Ok).json({
    success: true,
    message: "OCR processed successfully",
    data: result,
  });
});

const findByMyOCRList: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new apiError(HttpCodes.Unauthorized, "Unauthorized");
    }

    const result = await OCRService.findByMyOCRListIntoDb(userId, req.query);
    res.status(HttpCodes.Ok).json({
      success: true,
      message: "OCR records fetched successfully",
      data: result,
    });
  }
);

const textToImageBuffer: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await OCRService.textToImageBuffer({
      documentType: "PASSPORT CARD",
      nationality: "USA",
      surname: "TRAVELER",
      givenNames: "HAPPY",
    });

    res.status(HttpCodes.Ok).json({
      success: true,
      message: "Preview generated successfully",
      data: result,
    });
  }
);

const findBySpecificOCR: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await OCRService.findBySpecificOCRInDb(req.params.id);
    res.status(HttpCodes.Ok).json({
      success: true,
      message: "OCR record fetched successfully",
      data: result,
    });
  }
);

const deleteOCR: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await OCRService.deleteOCRIntoDb(req.params.id);
    res.status(HttpCodes.Ok).json({
      success: true,
      message: "OCR record deleted successfully",
      data: result,
    });
  }
);

const OCRController = {
  getTests,
  ocr,
  findByMyOCRList,
  textToImageBuffer,
  findBySpecificOCR,
  deleteOCR,
};

export default OCRController;
