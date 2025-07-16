import { Router } from "express";
import { getUserJobController } from "@/src/controllers/user/job";

export const userJobRouter = Router();

userJobRouter.get("/user/job", getUserJobController);
