import { Request, Response } from "express";
import {
  uploadBufferToCloudflare,
  insertFoodEntry,
  insertSymptomEntries,
  updateMessageProcessedStatus,
  recordMessageInSupabase,
} from "./helper";
import {
  extractFoodFromMessage,
  extractSymptomsFromMessage,
  generateImageUsingNanoBanana,
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
  const overallStart = Date.now();
  try {
    const userId = getUserIdFromRequest(request);
    const logicalDate = request.body.logicalDate;

    // Create user job
    let sectionStart = Date.now();
    const userJob = await insertUserJob({
      user_id: userId,
      description: "processing message",
    });
    console.log(`[TIMING] Create user job: ${Date.now() - sectionStart}ms`);

    // Record message
    sectionStart = Date.now();
    const insertMessage = await recordMessageInSupabase(
      userId,
      logicalDate,
      request.body.message
    );
    console.log(`[TIMING] Record message: ${Date.now() - sectionStart}ms`);

    // Extract food entries and symptoms in parallel
    sectionStart = Date.now();
    const [foodEntries, symptoms] = await Promise.all([
      extractFoodFromMessage(insertMessage),
      extractSymptomsFromMessage(request.body.message),
    ]);
    console.log(`[TIMING] Extract food & symptoms: ${Date.now() - sectionStart}ms`);

    // Insert symptoms
    sectionStart = Date.now();
    await insertSymptomEntries(userId, logicalDate, symptoms);
    console.log(`[TIMING] Insert symptoms: ${Date.now() - sectionStart}ms`);

    // Process all food entries
    sectionStart = Date.now();
    const foodEntryPromises = foodEntries.map(async (foodItem: string) => {
      const existingFoodEntry = await getFoodByName(foodItem);

      // Helper to get or generate image URL
      const getImageUrl = async () => {
        if (existingFoodEntry) {
          return existingFoodEntry.r2_key!;
        }

        const imageBuffer = await generateImageUsingNanoBanana(
          `${foodItem}, white background, centered composition.`
        );
        const filename = `food-${foodItem.replace(/ /g, "-").toLowerCase()}.png`;
        return await uploadBufferToCloudflare(filename, imageBuffer);
      };

      // Run image generation and servings extraction in parallel
      const [imageUrl, servings] = await Promise.all([
        getImageUrl(),
        extractServings(foodItem)
      ]);

      const foodEntry = await insertFoodEntry(
        userId,
        logicalDate,
        foodItem,
        foodItem, // Use foodItem as the image_prompt
        imageUrl
      );

      const allFoodGroups = await getAllFoodGroups();
      const foodGroupMap = new Map(allFoodGroups.map((fg) => [fg.name, fg.id]));

      const servingsData = servings
        .map((serving: ExtractedServing) => {
          const foodGroupId = foodGroupMap.get(serving.foodGroup);
          if (!foodGroupId) {
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
    console.log(`[TIMING] Process all food entries: ${Date.now() - sectionStart}ms`);

    // Update message status
    sectionStart = Date.now();
    await updateMessageProcessedStatus(insertMessage.id);
    console.log(`[TIMING] Update message status: ${Date.now() - sectionStart}ms`);

    // Complete user job
    sectionStart = Date.now();
    await updateUserJob(userJob.id, {
      completed_at: new Date().toISOString(),
    });
    console.log(`[TIMING] Complete user job: ${Date.now() - sectionStart}ms`);

    const totalTime = Date.now() - overallStart;
    console.log(`[TIMING] ===== TOTAL: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s) =====`);
    return response.status(200).json({ success: true });
  } catch (error) {
    const totalTime = Date.now() - overallStart;
    console.error(`[TIMING] Error after ${totalTime}ms:`, error);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export { processMessageController };
