import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { extractDetailsFromLogPrompt } from "./prompt";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { analyzeGemini } from "./analyze-gemini";

import { analyzeWithPerplexity } from "./analyze-perplexity";

export async function postMessage(fastify: FastifyInstance) {
  fastify.post(
    "/message",
    {
      schema: {
        body: { type: "string" },
      },
    },
    async (request, reply) => {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return reply
          .status(401)
          .send({ error: "Unauthorized: No token provided" });
      }

      const userMessage = request.body as string;

      const { data: auth, error: authError } = await supabase.auth.getUser(
        token
      );

      if (authError) {
        return reply.status(401).send({ error: "Unauthorized: Invalid token" });
      }

      supabaseInsertMessage({
        user_id: auth.user.id,
        role: "user",
        content: userMessage,
      });

      // const response = await analyzeWithPerplexity(userMessage);
      const response = await analyzeOpenAI(userMessage);
      // const response = await analyzeGemini(userMessage);

      supabaseInsertMessage({
        user_id: auth.user.id,
        role: "system",
        content: response ?? "",
      });

      const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant. The current time is ${new Date()}.

Rules:
1. The user will provide a message about something they ate, drank, or felt (symptom).
2. Extract the following information from the user's message:
  - The type of message: food or symptom.
  - A description of the food item, including the serving size.
  - The date in yyyy-mm-dd format for when they ate the food. Use the current day unless the user specified otherwise. For example, if they said "last night," then you should use yesterday's date.
  - The time in HH:mm for when they ate the food. Use the current time unless they gave a generic time like "morning," "afternoon," "evening," or "night."
  - If the time was not provided, provide the time of day (morning, afternoon, evening, night, etc.). Otherwise, leave this field blank.
  - The time zone is EST.
`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        response_format: zodResponseFormat(
          z.object({
            foods: z.array(
              z.object({
                type: z.string(),
                description: z.string(),
                date: z.string(),
                time: z.string(),
                time_of_day: z.string(),
                time_zone: z.string(),
              })
            ),
          }),
          "foods"
        ),
      });

      const chatCompletion = completion.choices[0].message.parsed;

      console.log(chatCompletion);

      let foods = [];

      if (chatCompletion?.foods) {
        for (const food of chatCompletion.foods) {
          foods.push({
            user_id: auth.user.id,
            type: food.type,
            description: food.description,
            date: food.date,
            time: food.time || null,
            time_of_day: food.time_of_day || null,
            timezone: food.time_zone,
          });
        }
      }

      if (chatCompletion && chatCompletion.foods?.length > 0) {
        const { error } = await supabase.from("food").insert(foods);

        if (error) {
          throw new Error(`inserting foods: ${error.message}`);
        }
      }

      reply.status(200).send(response);
    }
  );
}
