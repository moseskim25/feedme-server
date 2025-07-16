import { Router } from "express";
import { feedController } from "@/src/controllers/feed";

export const feedRouter = Router();

feedRouter.get("/feed", feedController);
