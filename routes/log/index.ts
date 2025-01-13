import { FastifyInstance } from "fastify";
import OpenAI from "openai";
import { nutritionExpertPrompt } from "../../prompts/nutrition-expert";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

const LogResponse = z.object({
  userInput: z.string(),
  aiResponse: z.string(),
  category: z.enum(["food", "drink", "water", "symptoms"]),
  symptomDescription: z.string(),
  foodDescription: z.string(),
});

async function transcribe(fastify: FastifyInstance) {
  fastify.post("/log", async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");
      console.log('token')
      console.log(token)

      if (!token) {
        return reply.status(401).send({ error: "Unauthorized: No token provided" });
      }


      const audioFile = await request.file();

      if (!audioFile) {
        return reply.status(400).send({ error: "No audio file provided" });
      }

      const buffer = await audioFile.toBuffer();

      const file = new File([buffer], audioFile.filename, {
        type: audioFile.mimetype,
      });

      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
      });

      console.log(transcription);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: nutritionExpertPrompt(transcription.text),
          },
        ],
        response_format: zodResponseFormat(LogResponse, "log"),
      });

      const structuredResponse = JSON.parse(
        completion.choices[0].message.content as string
      );

      console.log(structuredResponse)

      const { data: auth } = await supabase.auth.getUser(token);

      const { error } = await supabase.from("log").insert({
        userInput: transcription.text,
        aiResponse: structuredResponse.aiResponse,
        category: structuredResponse.category,
        symptomDescription: structuredResponse.symptomDescription,
        foodDescription: structuredResponse.foodDescription,
        userId: auth?.user?.id,
      });

      reply.send(structuredResponse.aiResponse);
      // reply.send(completion.choices[0].message);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      reply.status(500).send({ error: "Failed to transcribe audio" });
    }
  });
}

export default transcribe;
