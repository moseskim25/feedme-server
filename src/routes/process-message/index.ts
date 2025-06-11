import { Router } from "express";
import { processMessageController } from "@/src/controllers/process-message-controller";

export const processMessageRouter = Router();

processMessageRouter.post("/process-message", processMessageController);
