import { Router } from "express";
import { messageCountController } from "@/src/controllers/messageCountController";

const messageCountRouter = Router();

messageCountRouter.get("/message", messageCountController);

export { messageCountRouter };
