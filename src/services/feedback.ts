import { openai } from "@/lib/openai";
import { Tables } from "@/types/supabase.types";
import { getFoodForUserOnDate } from "./food";

const generateFeedback = async (
  userId: Tables<"user">["id"],
  logicalDate: string,
) => {
  try {
    const foodEntries = await getFoodForUserOnDate(userId, logicalDate);

    const feedbackChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: generateFeedbackPrompt(
            foodEntries.map((entry) => entry.description as string),
          ),
        },
      ],
    });

    const feedbackChatCompletionResponse =
      feedbackChatCompletion.choices[0].message.content;

    if (!feedbackChatCompletionResponse) {
      throw new Error("No feedback received from OpenAI");
    }

    return feedbackChatCompletionResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate feedback");
  }
};

const generateFeedbackPrompt = (foodDescriptions: string[]) =>
  `
This is what I consumed today: ${foodDescriptions.join(", ")}. Please criticize my intake.

Keep your response max 2 sentences. First say something positive. Then give constructive criticism.
`;

export { generateFeedback };
