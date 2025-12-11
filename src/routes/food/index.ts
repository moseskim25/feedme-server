import { Router } from "express";
import {
  foodController,
  deleteFoodEntryController,
  getFoodByIdController,
  updateFoodServingController,
} from "@/src/controllers/food";

export const foodRouter = Router();

foodRouter.get("/food", foodController);
foodRouter.delete("/food/:id", deleteFoodEntryController);
foodRouter.get("/food/:id", getFoodByIdController);
foodRouter.patch("/food/:id/servings", updateFoodServingController);
