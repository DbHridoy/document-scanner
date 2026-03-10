import "express";
import type { MulterFile, MulterFiles } from "./request.type";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        fullName: string;
        email: string;
        role: string;
      };
      file?: MulterFile;
      files?: MulterFiles;
    }
  }
}

export {};
