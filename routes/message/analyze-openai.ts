import OpenAI from "openai";
import { nutritionExpertPrompt } from "./analyze-perplexity";

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

export const analyzeOpenAI = async (text: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: nutritionExpertPrompt()
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const response = completion.choices[0].message.content;

  console.log('open ai response')
  console.log(response)

  return response
};
