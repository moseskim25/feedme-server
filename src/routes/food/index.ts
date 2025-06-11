import { Router } from "express";
import { deleteFoodController } from "@/src/controllers/food-controller";

export const foodRouter = Router();

foodRouter.delete("/food/:id", deleteFoodController);
