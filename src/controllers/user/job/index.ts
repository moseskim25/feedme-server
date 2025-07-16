import { Request, Response } from "express";
import { getUserJob } from "@/src/services/user-job";

const getUserJobController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { status } = req.query;

    // Build filter based on query params
    const filter = status === "pending" ? { completed_at: null } : {};

    const jobs = await getUserJob(userId, filter);

    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error in getUserJobController:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getUserJobController };
