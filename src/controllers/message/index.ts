import { Request, Response } from "express";
import {
  uploadImageToR2,
  insertFoodEntry,
  insertSymptomEntries,
  updateMessageProcessedStatus,
  recordMessageInSupabase,
} from "./helper";
import {
  extractFoodFromMessage,
  extractSymptomsFromMessage,
  generateImage,
  generateImageDescription,
  extractServings,
  ExtractedServing,
} from "@/src/services/ai";
import { insertUserJob, updateUserJob } from "@/src/services/user-job";
import { insertServings } from "@/src/services/serving";
import { getAllFoodGroups } from "@/src/services/food-group";
import { getFoodByName } from "@/src/services/food";
import { getUserIdFromRequest } from "@/src/utils/auth";

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

    const foodEntries = await extractFoodFromMessage(insertMessage);

    const symptoms = await extractSymptomsFromMessage(request.body.message);

    await insertSymptomEntries(userId, logicalDate, symptoms);

    const foodEntryPromises = foodEntries.map(async (foodItem: string) => {
      const existingFoodEntry = await getFoodByName(foodItem);

      let description: string;
      let imageUrl: string;

      if (existingFoodEntry) {
        description =
          existingFoodEntry.description || existingFoodEntry.image_prompt || "";
        imageUrl = existingFoodEntry.r2_key!;
      } else {
        description = await generateImageDescription(foodItem);
        const image = await generateImage(description);
        imageUrl = `food/${foodItem.replace(/ /g, "-").toLowerCase()}.png`;
        await uploadImageToR2(imageUrl, image);
      }

      console.log(`Description: ${description}`);

      const foodEntry = await insertFoodEntry(
        userId,
        logicalDate,
        foodItem,
        description,
        imageUrl
      );

      const servings = await extractServings(description);

      const allFoodGroups = await getAllFoodGroups();
      const foodGroupMap = new Map(allFoodGroups.map((fg) => [fg.name, fg.id]));

      const servingsData = servings
        .map((serving: ExtractedServing) => {
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
        await insertServings(userId, servingsData);
      }

      return foodEntry;
    });

    await Promise.all(foodEntryPromises);

    await updateMessageProcessedStatus(insertMessage.id);

    await updateUserJob(userJob.id, {
      completed_at: new Date().toISOString(),
    });

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export { processMessageController };
