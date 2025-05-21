import { createSupabaseClient } from "@/lib/supabase";
import { FastifyInstance } from "fastify";
import {
  uploadImageToR2,
  getUnprocessedMessages,
  createFoodEntry,
  createSymptomEntries,
  updateFoodEntry,
  insertFeedbackToDatabase,
  updateMessageProcessedStatus,
} from "./helper";
import {
  extractFoodsFromMessages,
  extractSymptomsFromMessages,
  generateImage,
  generateFeedback,
} from "./llm-helper";

export async function processMessage(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      logicalDate: string;
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

      const messages = await getUnprocessedMessages(
        supabase,
        userId,
        logicalDate
      );

      const formattedMessages = messages.map((message) => ({
        role: message.role as "user" | "system",
        content: message.content,
      }));

      const foods = await extractFoodsFromMessages(formattedMessages);

      const symptoms = await extractSymptomsFromMessages(formattedMessages);
      await createSymptomEntries(supabase, userId, logicalDate, symptoms);

      const foodPromises = foods.map(async (food) => {
        const foodEntry = await createFoodEntry(
          supabase,
          userId,
          logicalDate,
          food
        );

        const image = await generateImage(food);
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

      const messageIds = messages.map((message) => message.id);
      await updateMessageProcessedStatus(supabase, messageIds);

      return reply.status(200).send(feedback);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
