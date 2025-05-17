import { openai } from "@/lib/openai";
import { createSupabaseClient, supabase } from "@/lib/supabase";
import { FastifyInstance } from "fastify";
import { getCurrentTime } from "@/lib/utils/date.utils";
import { uploadToR2 } from "@/lib/r2";
import {
  getMessagesForDate,
  markMessagesAsProcessed,
  insertAnalysisToSupabase,
  getAnalysisVersionNumber,
  generateFeedbackUsingOpenAI,
  generateListOfFoodsUsingOpenAI,
  generateImageUsingOpenAI,
  uploadImageToR2,
} from "./generate-helper";
import { insertAnalysisInSupabase } from "@/supabase/analysis";

export async function generateAnalysis(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      logicalDate: string;
    };
  }>("/analysis", async (request, reply) => {
    try {
      const userId = request.userId;
      const authToken = request.authToken;

      if (!userId || !authToken) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const supabase = createSupabaseClient(authToken);

      const logicalDate = request.body.logicalDate;

      const messages = await getMessagesForDate(userId, logicalDate);

      const formattedMessages = messages.map((message) => ({
        role: message.role as "user" | "system",
        content: message.content,
      }));

      const feedbackChatCompletionResponse = await generateFeedbackUsingOpenAI(
        formattedMessages
      );

      const listOfFoods = await generateListOfFoodsUsingOpenAI(
        formattedMessages
      );

      const versionCount = await getAnalysisVersionNumber(userId, logicalDate);

      const { image, imagePrompt } = await generateImageUsingOpenAI(
        listOfFoods
      );

      const imageUrl = `${userId}/${logicalDate}-${versionCount + 1}.png`;

      await uploadImageToR2(imageUrl, image);

      await insertAnalysisInSupabase(supabase, {
        user_id: userId,
        logical_date: logicalDate,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        feedback: feedbackChatCompletionResponse,
      });

      const messageIds = messages.map((message) => message.id);
      const latestMessageIdProcessed = Math.max(...messageIds);

      const { error: updateError } = await supabase
        .from("message")
        .update({ is_processed: true })
        .lte("id", latestMessageIdProcessed);

      if (updateError) {
        console.error(updateError);
        throw new Error("Failed to mark messages as processed");
      }

      return reply.status(200).send(feedbackChatCompletionResponse);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  });
}
