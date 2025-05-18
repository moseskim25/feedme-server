import { openai } from "@/lib/openai";
import { uploadToR2 } from "@/lib/r2";
import { getCurrentTime } from "@/lib/utils/date.utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { ImagesResponse } from "openai/resources/images";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

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

export const getUnprocessedMessages = async (
  supabase: SupabaseClient,
  userId: string,
  logicalDate: string
) => {
  const { data, error } = await supabase
    .from("message")
    .select("*")
    .eq("user_id", userId)
    .eq("logical_date", logicalDate)
    .is("is_processed", false);

  if (error) {
    console.error(error);
    throw new Error("Failed to get unprocessed messages");
  }

  console.log("data", data);

  return data;
};

export const generateListOfFoodsUsingOpenAI = async (
  messages: {
    role: "user" | "system";
    content: string;
  }[]
) => {
  try {
    console.log("messages", messages);
    const completion = await openai.responses.parse({
      model: "gpt-4o",
      input: [
        ...messages,
        {
          role: "user",
          content: `This conversation mentions the foods I've eaten. Your job is to generate a list of anything I consumed as a description including the quantity.

GUIDELINE:
1. A food is not each ingredient. It can be a plate of food including various items. For example, a plate of rice and chicken doesn't have to be split up into rice and chicken. It can be a single item on a plate.
2. If a food is mentioned multiple times, include it as a separate item.
3. If no foods are mentioned, return an empty array.
4. If no quantity is mentioned, assume it is 1.
5. If sauces were eaten with a meal, you can include it along with the meal it was eaten with.`,
        },
      ],
      text: {
        format: zodTextFormat(
          z.object({
            foods: z.array(z.string()),
          }),
          "listOfFoods"
        ),
      },
    });

    const content = completion.output_parsed;

    console.log("content", content);

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const listOfFoods = content.foods;

    return listOfFoods;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate list of foods");
  }
};

export const generateImage = async (food: string) => {
  try {
    const imagePrompt = `Generate an image from a slight top-down perspective.

GUIDELINE:
- Do not cut the image off at the edges.
- The image should be of a single food item.
- The quantity of the food item is very important.
- The background should be transparent.
- The images should be presented in a realistic way. Example, in a bowl or on a plate.

The image should be of: ${food}
`;

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: imagePrompt,
      size: "1024x1024",
      quality: "medium",
    });

    if (image?.data?.length) {
      return image;
    }

    throw new Error("No image data received from OpenAI");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate image");
  }
};

export const generateFeedback = async (
  supabase: SupabaseClient,
  userId: string,
  logicalDate: string
) => {
  const messages = await supabase
    .from("message")
    .select("*")
    .eq("user_id", userId)
    .eq("logical_date", logicalDate)
    .is("is_processed", true)
    .order("created_at", { ascending: true });

  if (messages.error) {
    console.error(messages.error);
    throw new Error("Failed to get messages");
  }

  try {
    const feedbackChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...messages.data.map((message) => ({
          role: message.role,
          content: message.content,
        })),
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
