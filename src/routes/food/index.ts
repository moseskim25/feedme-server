import { Router } from "express";
import { deleteFoodController } from "@/src/controllers/foodController";

export const foodRouter = Router();

foodRouter.delete("/food/:id", deleteFoodController);
