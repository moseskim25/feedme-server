import { Request, Response } from "express";
import { getUserIdFromRequest } from "@/src/utils/auth";
import { processMessage } from "@/src/services/message";

interface ProcessMessageBody {
  logicalDate: string;
  message: string;
}

const processMessageController = async (
  request: Request<{}, {}, ProcessMessageBody>,
  response: Response
) => {
  try {
    const userId = getUserIdFromRequest(request);
    await processMessage(userId, request.body.logicalDate, request.body.message);
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing message:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export { processMessageController };
