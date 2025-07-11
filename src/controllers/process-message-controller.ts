import { Request, Response } from "express";
import {
  uploadImageToR2,
  insertFood,
  createSymptomEntries,
  updateFood,
  insertFeedbackToDatabase,
  updateMessageProcessedStatus,
  recordMessageInSupabase,
} from "@/src/controllers/process-message-controller-helper";
import {
  extractFoodsFromMessage,
  extractSymptomsFromMessage,
  generateImage,
  generateFeedback,
  generateImageDescription,
  extractFoodGroupServings,
} from "@/src/services/ai";
import { insertUserJob, updateUserJob } from "../services/user-job";
import { insertFoodGroupServings } from "../services/food-group-serving";
import { getAllFoodGroups } from "../services/food-group";
import { getUserIdFromRequest } from "../utils/auth";

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

    const userJob = await insertUserJob({
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

    const symptoms = await extractSymptomsFromMessage(request.body.message);

    await createSymptomEntries(userId, logicalDate, symptoms);

    const foodPromises = foods.map(async (food) => {
      const description = await generateImageDescription(food);

      const foodEntry = await insertFood(
        userId,
        logicalDate,
        food,
        description
      );

      const image = await generateImage(description);
      const imageUrl = `food/${food.replace(/ /g, "-").toLowerCase()}.png`;
      await uploadImageToR2(imageUrl, image);

      await updateFood(foodEntry.id, {
        r2_key: imageUrl,
      });

      const foodGroupServings = await extractFoodGroupServings(description);

      const allFoodGroups = await getAllFoodGroups();
      const foodGroupMap = new Map(allFoodGroups.map((fg) => [fg.name, fg.id]));

      const servingsData = foodGroupServings
        .map((serving) => {
          const foodGroupId = foodGroupMap.get(serving.foodGroup);
          if (!foodGroupId) {
            console.warn(
              `Food group '${serving.foodGroup}' not found in database`
            );
            return null;
          }
          return {
            food_id: foodEntry.id,
            food_group_id: foodGroupId,
            servings: serving.servings,
          };
        })
        .filter((serving) => serving !== null);

      if (servingsData.length > 0) {
        await insertFoodGroupServings(userId, servingsData);
      }

      return foodEntry;
    });

    await Promise.all(foodPromises);

    await updateMessageProcessedStatus(insertMessage.id);

    await updateUserJob(userJob.id, {
      completed_at: new Date().toISOString(),
    });

    return response.status(200);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export { processMessageController };
