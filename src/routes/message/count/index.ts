import { Router } from "express";
import { messageCountController } from "@/src/controllers/message-count-controller";

const messageCountRouter = Router();

messageCountRouter.get("/message", messageCountController);

export { messageCountRouter };
