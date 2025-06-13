import { Request, Response } from "express";
import {
  uploadImageToR2,
  createFoodEntry,
  createSymptomEntries,
  updateFoodEntry,
  insertFeedbackToDatabase,
  updateMessageProcessedStatus,
  recordMessageInSupabase,
} from "@/src/routes/process-message/helper";
import {
  extractFoodsFromMessage,
  extractSymptomsFromMessage,
  generateImage,
  generateFeedback,
  generateImageDescription,
} from "@/src/services/ai";
import { createUserJob, updateUserJob } from "../services/user-job";

interface ProcessMessageBody {
  logicalDate: string;
  message: string;
}

const processMessageController = async (
  request: Request<{}, {}, ProcessMessageBody>,
  response: Response
) => {
  try {
    const userId = request.userId;
    const authToken = request.authToken;
    if (!userId || !authToken) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const userJob = await createUserJob({
      user_id: userId,
      description: "processing message",
    });

    const logicalDate = request.body.logicalDate;

    const insertMessage = await recordMessageInSupabase(
      userId,
      logicalDate,
      request.body.message
    );

    // const countOfMessagesForUserForToday =
    //   await getCountOfMessagesForUserForToday(userId);

    // console.log(countOfMessagesForUserForToday);

    // if (countOfMessagesForUserForToday > 10) {
    //   return response.status(400).json({
    //     error: "You have reached the maximum number of messages for today",
    //   });
    // }

    const foods = await extractFoodsFromMessage(insertMessage);

    const symptoms = await extractSymptomsFromMessage(insertMessage);

    await createSymptomEntries(userId, logicalDate, symptoms);

    const foodPromises = foods.map(async (food) => {
      const description = await generateImageDescription(food);

      const foodEntry = await createFoodEntry(
        userId,
        logicalDate,
        food,
        description
      );

      // Upload image to R2
      const image = await generateImage(description);
      const imageUrl = `food/${food.replace(/ /g, "-").toLowerCase()}.png`;
      await uploadImageToR2(imageUrl, image);

      // Save image R2 key to database
      await updateFoodEntry(foodEntry.id, {
        r2_key: imageUrl,
      });

      return foodEntry;
    });

    await Promise.all(foodPromises);

    let feedback = null;
    if (foods.length > 0) {
      feedback = await generateFeedback(userId, logicalDate);
      await insertFeedbackToDatabase(userId, logicalDate, feedback);
    }

    await updateMessageProcessedStatus(insertMessage.id);

    await updateUserJob(userJob.id, {
      completed_at: new Date().toISOString(),
    });

    return response.status(200).json(feedback);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export { processMessageController };
