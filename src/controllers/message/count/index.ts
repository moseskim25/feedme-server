import { Request, Response } from "express";
import { getCountOfMessagesForUserForToday } from "@/src/services/message";

const messageCountController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;


    const countOfMessagesForUserForToday =
      await getCountOfMessagesForUserForToday(userId);

    res.status(200).json({ count: countOfMessagesForUserForToday });
  } catch (err) {
    console.error("Error in messageCountController:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { messageCountController };
