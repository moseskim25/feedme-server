import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { nutritionExpertPrompt } from "./prompt";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

const LogResponse = z.object({
  food: z.object({
    description: z
      .string()
      .describe("The food description and quantity consumed."),
    calories: z.number(),
    fat: z.number(),
    fiber: z.number(),
    protein: z.number(),
    vitamins: z.array(
      z.object({
        name: z.string(),
        percentage: z.number(),
      })
    ),
  }),
  // type: z.enum(["food", "symptom"]),
});

async function transcribe(fastify: FastifyInstance) {
  fastify.post("/log", async (request, reply) => {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return reply
        .status(401)
        .send({ error: "Unauthorized: No token provided" });
    }

    const audioFile = await request.file();

    if (!audioFile) {
      return reply.status(400).send({ error: "No audio file provided" });
    }

    // Converting the audio file to send to WhisperAI
    const buffer = await audioFile.toBuffer();

    const file = new File([buffer], audioFile.filename, {
      type: audioFile.mimetype,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    // Fetching the last 10 messages from the user
    const { data: auth, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      return reply.status(401).send({ error: "Unauthorized: Invalid token" });
    }

    await supabase.from("log").insert({
      content: transcription.text,
      role: "user",
      user_id: auth.user.id,
    });


    const { data: last10LogsDesc } = await supabase
      .from("log")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const pastLogs = last10LogsDesc?.reverse() || [];


    const pastMessages =
      pastLogs?.map((log) => ({
        role: log.role as "user" | "system",
        content: JSON.stringify(log.content),
      })) || [];

    // Sending the transcription to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: nutritionExpertPrompt(),
        },
        ...pastMessages,
      ],
      // response_format: zodResponseFormat(LogResponse, "log"),
    });

    // const structuredResponse = JSON.parse(
    //   completion.choices[0].message.content as string
    // );

    // const { error } = await supabase.from("log").insert({
    //   user_id: auth.user.id,
    //   role: "system",
    //   content: JSON.stringify(structuredResponse),
    // });

    // reply.status(200).send(structuredResponse);

    const response = completion.choices[0].message.content;

    await supabase.from('log').insert({
      user_id: auth.user.id,
      role: "system",
      content: response,
    })

    reply.status(200).send(response);
  });
}

export default transcribe;
