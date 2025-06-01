import { createSupabaseClient } from "@/lib/supabase";
import { FastifyInstance } from "fastify";
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

export async function processMessage(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      logicalDate: string;
      message: string;
    };
  }>("/process-message", async (request, reply) => {
    try {
      const userId = request.userId;
      const authToken = request.authToken;
      if (!userId || !authToken) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const supabase = createSupabaseClient(authToken);
      const logicalDate = request.body.logicalDate;

      const insertMessage = await recordMessageInSupabase(
        supabase,
        userId,
        logicalDate,
        request.body.message
      );

      console.log(insertMessage);

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

      return reply.status(200).send(feedback);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
