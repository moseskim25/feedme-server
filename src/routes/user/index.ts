import { Router } from "express";
import { createUserController } from "@/src/controllers/userController";

export const userRouter = Router();

userRouter.post("/user", createUserController);