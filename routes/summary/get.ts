import { openai } from "@/lib/openai";
import { createSupabaseClient } from "@/lib/supabase";
import { FastifyInstance } from "fastify";
import { getCurrentTime } from "@/lib/utils/date.utils";
import { uploadToR2 } from "@/lib/r2";

export async function generateSummary(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      logicalDate: string;
    };
  }>("/summary", async (request, reply) => {
    // Validate token
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return reply
        .status(401)
        .send({ error: "Unauthorized: No token provided" });
    }

    const supabase = createSupabaseClient(token);

    // Get user ID from token
    const authQuery = await supabase.auth.getUser();

    const userId = authQuery.data.user?.id;

    if (!userId) {
      return reply
        .status(401)
        .send({ error: "Unauthorized: No user ID provided" });
    }

    // Query params
    const logicalDate = request.query.logicalDate;

    // Get messages from supabase for the given date
    const messagesQuery = await supabase
      .from("message")
      .select("*")
      .eq("user_id", userId)
      .eq("logical_date", logicalDate);

    if (!messagesQuery.data || messagesQuery.data.length === 0) {
      return { error: "No messages found for this date" };
    }

    // Format the messages for the OpenAI API
    const messages = messagesQuery.data.map((message) => ({
      role: message.role as "user" | "system",
      content: message.content,
    }));

    console.log(messages);

    // Have OpenAI analyze the messages and provide feedback
    console.log(getCurrentTime());
    const feedbackChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...messages,
        {
          role: "user",
          content: `Based on this conversation, provide feedback on my diet keeping in mind the time of day is ${getCurrentTime()}. Keep it relatively short and concise. Try to be organized in how you communicate.`,
        },
      ],
    });

    const feedbackChatCompletionResponse =
      feedbackChatCompletion.choices[0].message.content;

    // Generate an image of what the user ate. Starting with generating a prompt
    const imagePromptChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...messages,
        {
          role: "user",
          content: `Based on this conversation, create a list of foods I ate. Include the quantity and a description of each item. Don't use any formatting, just a list separated by commas.`,
        },
      ],
    });

    const imagePrompt = imagePromptChatCompletion.choices[0].message.content;

    console.log(imagePrompt);

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt || "",
      n: 1,
      size: "1024x1024",
    });

    // Save the image to cloudflare r2
    const imageBase64 = image.data[0].b64_json;

    if (imageBase64) {
      const imageBytes = Buffer.from(imageBase64, "base64");

      const imageUrl = await uploadToR2(
        imageBytes,
        `${userId}/${logicalDate}.png`
      );

      console.log(imageUrl);

      const insertSummaryQuery = await supabase.from("summary").insert({
        user_id: userId,
        logical_date: logicalDate,
        image_url: `${userId}/${logicalDate}.png`,
        image_prompt: imagePrompt,
        feedback: feedbackChatCompletionResponse,
      });

      if (insertSummaryQuery.error) {
        console.error(insertSummaryQuery.error);
      }
    }

    return reply.status(200).send(feedbackChatCompletionResponse);
  });
}
