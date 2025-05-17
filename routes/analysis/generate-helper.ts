import { pool } from "@/lib/db";
import { openai } from "@/lib/openai";
import { uploadToR2 } from "@/lib/r2";
import { getCurrentTime } from "@/lib/utils/date.utils";
import { Tables } from "@/types/supabase.types";
import { ImagesResponse } from "openai/resources/images";

export const getMessagesForDate = async (userId: string, date: string) => {
  try {
    const query = `
            SELECT * FROM message
            WHERE user_id = $1 AND logical_date = $2
        `;

    const queryResult = await pool.query(query, [userId, date]);

    const data = queryResult.rows as Tables<"message">[];

    if (data.length === 0) {
      throw new Error("No messages found for date");
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get messages for date");
  }
};

export const getAnalysisVersionNumber = async (
  userId: string,
  date: string
) => {
  try {
    const query = `
            SELECT COUNT(*) FROM analysis
            WHERE user_id = $1 AND logical_date = $2
    `;

    const result = await pool.query(query, [userId, date]);

    return Number.parseInt(result.rows[0].count);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get analysis version number");
  }
};

export const generateFeedbackUsingOpenAI = async (
  messages: {
    role: "user" | "system";
    content: string;
  }[]
) => {
  try {
    const feedbackChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...messages,
        {
          role: "user",
          content: `Based on this conversation, provide feedback on my diet keeping in mind the time of day is ${getCurrentTime()}. Keep it relatively short and concise. Your response should be in one paragraph.`,
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

export const generateListOfFoodsUsingOpenAI = async (
  messages: {
    role: "user" | "system";
    content: string;
  }[]
) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...messages,
        {
          role: "user",
          content: `
You are creating a prompt for an image generator. Your task is to organize the conversation into a list of foods I ate.

GUIDELINE:
1. If there are a group of foods that were eaten in one meal and should be in one plate, specify that in the list.
2. Include the quantity of each food if it's specified. If not specified, assume it's 1. If a food or snack is repeated, count the total number of items.
3. Return it in a numbered list.
4. Don't include any other text.
5. If a food is repeated multiple times and not part of a single meal/plate, group them all onto one plate or pile. This probably applies to snacks - ex: if they ate 2 cookies, don't list them as two separate items.
6. Pay close attention to the quantity of each food. It's very important to show the exact number of each food.
7. Not all foods belong on a plate but still group the items together.
8. Don't add additional text. I just want the list of foods along with their quantities.

EXAMPLES:
1. 10 glasses of milk.
2. 4 pieces of chocolate.
3. A plate of pasta with ground beef.
`,
        },
      ],
    });

    const content = completion.choices[0].message.content;

    console.log("content", content);

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate list of foods");
  }
};

export const generateImageUsingOpenAI = async (listOfFoods: string) => {
  try {
    const imagePrompt = `Create an image of the following foods on a dinner table.

GUIDELINE:
1. The image should be from a bird's eye view.
2. The foods should be on a dinner table.
3. Do not cut the image off at the edges.
4. The proportions and quantities are very important.

The foods are:
${listOfFoods}
`;

    console.log("imagePrompt", imagePrompt);

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt,
      size: "1024x1024",
      quality: "medium",
    });

    if (image?.data?.length) {
      return { image, imagePrompt };
    }

    throw new Error("No image data received from OpenAI");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate image");
  }
};

export const uploadImageToR2 = async (
  filename: string,
  image: ImagesResponse & {
    _request_id?: string | null;
  }
) => {
  if (!image.data) {
    throw new Error("No image data received from OpenAI");
  }

  const imageBase64 = image.data[0].b64_json;

  if (!imageBase64) {
    throw new Error("Error uploading image to R2");
  }

  const imageBytes = Buffer.from(imageBase64, "base64");

  await uploadToR2(imageBytes, filename);
};

export const insertAnalysisToSupabase = async (
  userId: string,
  date: string,

  imageUrl: string,
  imagePrompt: string,
  feedback: string
) => {
  try {
    const query = `
            INSERT INTO analysis (user_id, logical_date, image_url, image_prompt, feedback)
            VALUES ($1, $2, $3, $4, $5)
        `;

    await pool.query(query, [userId, date, imageUrl, imagePrompt, feedback]);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to insert analysis");
  }
};

export const markMessagesAsProcessed = async (
  userId: string,
  messageIds: number[]
) => {
  try {
    const query = `
            UPDATE message
            SET is_processed = true
            WHERE user_id = $1 AND id = ANY($2)
        `;

    await pool.query(query, [userId, messageIds]);
  } catch (error) {
    console.error(error);
    throw new Error("Failed to mark messages as processed");
  }
};
