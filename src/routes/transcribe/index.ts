import { Router } from "express";
import multer from "multer";
import { transcribeController } from "@/src/controllers/transcribe-controller";

const upload = multer({ storage: multer.memoryStorage() }); // file lives in RAM
export const transcribeRouter = Router();

transcribeRouter.post(
  "/transcribe",
  upload.single("file"), // 👈 field name must match client
  transcribeController
);
