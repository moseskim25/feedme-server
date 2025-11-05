import { Request, Response } from "express";
import OpenAI from "openai";

export const transcribeController = async (req: Request, res: Response) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No audio file provided" });

    const arrayBuffer = new ArrayBuffer(req.file.buffer.byteLength);
    new Uint8Array(arrayBuffer).set(req.file.buffer);

    const file = new File([arrayBuffer], req.file.originalname, {
      type: req.file.mimetype,
    });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

    const { text } = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
