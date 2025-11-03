import { Router } from "express";
import { getFoodGroupsController } from "@/src/controllers/food-group";

export const foodGroupRouter = Router();

foodGroupRouter.get("/food-group", getFoodGroupsController);

