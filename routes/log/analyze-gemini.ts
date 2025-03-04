import { nutritionExpertPrompt } from "./analyze-perplexity";

export const analyzeGemini = async (text: string) => {
  const { GoogleGenerativeAI } = require("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `${nutritionExpertPrompt()}\nUser message: ${text}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  console.log(response);

  return response;
};
