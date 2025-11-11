import { Router } from "express";
import { createUserController, deleteUserController } from "@/src/controllers/user";

export const userRouter = Router();

userRouter.post("/user", createUserController);
userRouter.delete("/user", deleteUserController);
