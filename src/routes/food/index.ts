import { Router } from "express";
import { deleteFoodController } from "@/src/controllers/food";

export const foodRouter = Router();

foodRouter.delete("/food/:id", deleteFoodController);
