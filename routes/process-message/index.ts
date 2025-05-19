import { createSupabaseClient } from "@/lib/supabase";
import { FastifyInstance } from "fastify";
import {
  generateListOfFoodsUsingOpenAI,
  uploadImageToR2,
  getUnprocessedMessages,
  generateImage,
  generateFeedback,
} from "./helper";

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

      const listOfFoods = await generateListOfFoodsUsingOpenAI(
        formattedMessages
      );

      const foodPromises = listOfFoods.map(async (food) => {
        const insertFood = await supabase
          .from("food")
          .insert({
            user_id: userId,
            logical_date: logicalDate,
            description: food,
          })
          .select()
          .single();

        if (insertFood.error) {
          console.error(`Failed to insert food: ${JSON.stringify(insertFood)}`);
          throw new Error(
            `Failed to insert food: ${JSON.stringify(insertFood)}`
          );
        }

        const image = await generateImage(food);

        const imageUrl = `${userId}/${logicalDate}/${insertFood.data.id}.png`;
        await uploadImageToR2(imageUrl, image);

        const updateFood = await supabase
          .from("food")
          .update({
            r2_key: imageUrl,
          })
          .eq("id", insertFood.data.id);

        if (updateFood.error) {
          console.error(updateFood.error);
          throw new Error("Failed to update food");
        }

        return insertFood.data;
      });

      await Promise.all(foodPromises);

      const feedback = await generateFeedback(supabase, userId, logicalDate);

      const insertFeedback = await supabase.from("feedback").insert({
        user_id: userId,
        logical_date: logicalDate,
        content: feedback,
      });

      if (insertFeedback.error) {
        console.error(insertFeedback.error);
        throw new Error("Failed to insert feedback");
      }

      const messageIds = messages.map((message) => message.id);
      const updateMessageProcessedStatus = await supabase
        .from("message")
        .update({
          is_processed: true,
        })
        .in("id", messageIds);

      if (updateMessageProcessedStatus.error) {
        console.error(updateMessageProcessedStatus.error);
        throw new Error("Failed to update message processed status");
      }

      return reply.status(200).send(feedback);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
