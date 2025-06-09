import { Router } from "express";
import { feedController } from "@/src/controllers/feedController";

export const feedRouter = Router();

feedRouter.get("/feed", feedController);
