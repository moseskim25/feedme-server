import { Router } from "express";
import { processMessageController } from "@/src/controllers/message";

export const messageRouter = Router();

messageRouter.post("/message", processMessageController);
