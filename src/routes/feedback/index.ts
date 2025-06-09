import { Router } from "express";
import { getFeedbackForUserForDate } from "@/src/controllers/feedbackController";

export const feedbackRouter = Router();

feedbackRouter.get("/feedback", getFeedbackForUserForDate);
