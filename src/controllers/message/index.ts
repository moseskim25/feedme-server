import { Request, Response } from "express";
import {
  uploadImageToR2,
  insertFood,
  createSymptomEntries,
  updateMessageProcessedStatus,
  recordMessageInSupabase,
} from "./helper";
import {
  extractFoodsFromMessage,
  extractSymptomsFromMessage,
  generateImage,
  generateImageDescription,
  extractFoodGroupServings,
} from "@/src/services/ai";
import { insertUserJob, updateUserJob } from "@/src/services/user-job";
import { insertFoodGroupServings } from "@/src/services/food-group-serving";
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

    console.log(`Message received: ${request.body.message}`);

    const foods = await extractFoodsFromMessage(insertMessage);

    console.log(`Foods extracted: ${foods}`);

    const symptoms = await extractSymptomsFromMessage(request.body.message);

    console.log(`Symptoms extracted: ${symptoms}`);

    await createSymptomEntries(userId, logicalDate, symptoms);

    const foodPromises = foods.map(async (food) => {
      const existingFood = await getFoodByName(food);

      let description: string;
      let imageUrl: string;

      if (existingFood) {
        description =
          existingFood.description || existingFood.image_prompt || "";
        imageUrl = existingFood.r2_key!;
      } else {
        description = await generateImageDescription(food);
        const image = await generateImage(description);
        imageUrl = `food/${food.replace(/ /g, "-").toLowerCase()}.png`;
        await uploadImageToR2(imageUrl, image);
      }

      console.log(`Description: ${description}`);

      const foodEntry = await insertFood(
        userId,
        logicalDate,
        food,
        description,
        imageUrl
      );

      const foodGroupServings = await extractFoodGroupServings(description);

      console.log(`Food group servings: ${foodGroupServings}`);

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

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export { processMessageController };
