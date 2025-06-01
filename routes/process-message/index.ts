import { createSupabaseClient } from "@/lib/supabase";
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

export const processMessageRouter = Router();

interface ProcessMessageBody {
  logicalDate: string;
  message: string;
}

processMessageRouter.post(
  "/process-message",
  async (request: Request<{}, {}, ProcessMessageBody>, response: Response) => {
    try {
      const userId = request.userId;
      const authToken = request.authToken;
      if (!userId || !authToken) {
        return response.status(401).json({ error: "Unauthorized" });
      }

      const supabase = createSupabaseClient(authToken);
      const logicalDate = request.body.logicalDate;

      const insertMessage = await recordMessageInSupabase(
        supabase,
        userId,
        logicalDate,
        request.body.message
      );

      const foods = await extractFoodsFromMessage(insertMessage);

      const symptoms = await extractSymptomsFromMessage(insertMessage);
      await createSymptomEntries(supabase, userId, logicalDate, symptoms);

      const foodPromises = foods.map(async (food) => {
        const description = await generateImageDescription(food);

        console.log(description);

        const foodEntry = await createFoodEntry(
          supabase,
          userId,
          logicalDate,
          food,
          description
        );

        const image = await generateImage(description);
        const imageUrl = `${userId}/${logicalDate}/${foodEntry.id}.png`;
        await uploadImageToR2(imageUrl, image);

        await updateFoodEntry(supabase, foodEntry.id, {
          r2_key: imageUrl,
        });

        return foodEntry;
      });

      await Promise.all(foodPromises);

      const feedback = await generateFeedback(supabase, userId, logicalDate);
      await insertFeedbackToDatabase(supabase, userId, logicalDate, feedback);

      await updateMessageProcessedStatus(supabase, insertMessage.id);

      return response.status(200).json(feedback);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: "Internal server error" });
    }
  }
);
