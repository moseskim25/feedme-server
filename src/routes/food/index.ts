import { Router } from "express";
import { deleteFoodController, getFoodController } from "@/src/controllers/food";

export const foodRouter = Router();

foodRouter.delete("/food/:id", deleteFoodController);
foodRouter.get("/food/:id", getFoodController);