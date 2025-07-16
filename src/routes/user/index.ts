import { Router } from "express";
import { createUserController } from "@/src/controllers/user";

export const userRouter = Router();

userRouter.post("/user", createUserController);
