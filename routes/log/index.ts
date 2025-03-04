import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { extractDetailsFromLogPrompt } from "./prompt";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { extractDetailsFromLog } from "./helper";
import { whisperTranscribeAudio } from "../transcribe";
import { supabaseInsertLogItem } from "@/supabase/log-item";
import { analyzeWithPerplexity } from "./analyze-perplexity";
import { analyzeOpenAI } from "./analyze-openai";
import { analyzeGemini } from "./analyze-gemini";

export const getLogs = (fastify: FastifyInstance) => {
  fastify.get("/logs", async (request, reply) => {
    const logs = await supabase.from("log").select("*");

    reply.status(200).send(logs);
  });
};

export async function postLog(fastify: FastifyInstance) {
  fastify.post(
    "/log",
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

      // const response = await analyzeWithPerplexity(userMessage);
      // const test = await analyzeOpenAI(userMessage);

      const response = await analyzeGemini(userMessage);

      const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
          { role: "system", content: extractDetailsFromLogPrompt },
          {
            role: "user",
            content: userMessage,
          },
        ],
        response_format: zodResponseFormat(
          z.object({
            descriptions: z.array(z.string()),
          }),
          "foods"
        ),
      });

      const foods = completion.choices[0].message.parsed;

      const { data: auth, error: authError } = await supabase.auth.getUser(
        token
      );

      if (authError) {
        return reply.status(401).send({ error: "Unauthorized: Invalid token" });
      }

      const log = await supabase
        .from("log")
        .insert({
          user_id: auth.user.id,
          role: "system",
          content: response,
        })
        .select("*")
        .single();

      if (log.error) {
        return reply.status(500).send({ error: "Error inserting log" });
      }

      if (foods && foods?.descriptions.length > 0) {
        await supabase.from("log_item").insert(
          foods.descriptions.map((description) => ({
            log_id: log.data.id,
            type: "food",
            description,
          }))
        );
      }

      reply.status(200).send(response);
    }
  );
}
