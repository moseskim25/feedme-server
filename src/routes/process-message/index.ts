import { Router, Request, Response } from "express";
import {
  uploadImageToR2,
  createFoodEntry,
  createSymptomEntries,
  updateFoodEntry,
  insertFeedbackToDatabase,
  updateMessageProcessedStatus,
  recordMessageInSupabase,
} from "./helper";
import {
  extractFoodsFromMessage,
  extractSymptomsFromMessage,
  generateImage,
  generateFeedback,
  generateImageDescription,
} from "./llm-helper";
import { getCountOfMessagesForUserForToday } from "@/src/services/message";

export const processMessageRouter = Router();

interface ProcessMessageBody {
  logicalDate: string;
  message: string;
}

processMessageRouter.post(
  "/process-message",
  async (request: Request<{}, {}, ProcessMessageBody>, response: Response) => {
    try {
      console.log("Processing message");

      const userId = request.userId;
      const authToken = request.authToken;
      if (!userId || !authToken) {
        return response.status(401).json({ error: "Unauthorized" });
      }

      const logicalDate = request.body.logicalDate;

      const insertMessage = await recordMessageInSupabase(
        userId,
        logicalDate,
        request.body.message
      );

      const countOfMessagesForUserForToday =
        await getCountOfMessagesForUserForToday(userId);

      console.log(countOfMessagesForUserForToday);

      if (countOfMessagesForUserForToday > 2) {
        return response.status(400).json({
          error: "You have reached the maximum number of messages for today",
        });
      }

      const foods = await extractFoodsFromMessage(insertMessage);

      const symptoms = await extractSymptomsFromMessage(insertMessage);
      await createSymptomEntries(userId, logicalDate, symptoms);

      const foodPromises = foods.map(async (food) => {
        const description = await generateImageDescription(food);

        console.log(description);

        const foodEntry = await createFoodEntry(
          userId,
          logicalDate,
          food,
          description
        );

        const image = await generateImage(description);
        const imageUrl = `${userId}/${logicalDate}/${foodEntry.id}.png`;
        await uploadImageToR2(imageUrl, image);

        await updateFoodEntry(foodEntry.id, {
          r2_key: imageUrl,
        });

        return foodEntry;
      });

      await Promise.all(foodPromises);

      const feedback = await generateFeedback(userId, logicalDate);
      await insertFeedbackToDatabase(userId, logicalDate, feedback);

      await updateMessageProcessedStatus(insertMessage.id);

      return response.status(200).json(feedback);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: "Internal server error" });
    }
  }
);
