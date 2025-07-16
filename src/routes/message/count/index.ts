import { Router } from "express";
import { messageCountController } from "@/src/controllers/message/count";

const messageCountRouter = Router();

messageCountRouter.get("/message", messageCountController);

export { messageCountRouter };
