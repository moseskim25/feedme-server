import { MultipartFile } from "@fastify/multipart";
import { FastifyInstance } from "fastify";
import OpenAI from "openai";

export const transcribe = async (fastify: FastifyInstance) => {
  fastify.post("/transcribe", async (request, reply) => {
    const audioFile = await request.file();

    if (!audioFile) {
      return reply.status(400).send({ error: "No audio file provided" });
    }

    const transcribedText = await transcribeAudioUsingWhisperAI(audioFile);

    reply.status(200).send(transcribedText);
  });
};

export const transcribeAudioUsingWhisperAI = async (
  audioFile: MultipartFile
) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

  const buffer = await audioFile.toBuffer();

  const file = new File([buffer], audioFile.filename, {
    type: audioFile.mimetype,
  });

  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
  });

  return transcription.text;
};
