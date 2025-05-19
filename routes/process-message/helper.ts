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

    const prompt = `
Task:  
Extract and generate a structured list of all foods and drinks mentioned in the conversation. Include quantities and descriptions.

Guidelines:

1. Group Appropriately:  
   - A "food" can be a complete plate, a single item, or a drink.  
   - Do NOT split ingredients unless the item was clearly consumed separately.  
   - Example: "A plate of rice and chicken" should remain as one item unless specified otherwise.

2. Handle Repeated Items Individually:  
   - If an item is mentioned multiple times, list each instance separately.  
   - Example: "I had 2 glasses of milk, then another later" → Output:  
     - 1 glass of milk  
     - 1 glass of milk  
     - 1 glass of milk  

3. Quantity Inclusion:  
   - Always include quantities using appropriate metrics (e.g., 1 cup, 1 plate, 1 glass, etc.).  
   - If quantity isn't specified, assume 1 by default.

4. Assume Implied Consumption:  
   - If a food or drink is mentioned without context assume it was consumed.  
   - Use natural default units:  
     - For drinks (milk, juice, water, coffee), assume **1 cup**.  
     - For snack foods (e.g., chocolate, candy, cookies), assume **1 piece** if unspecified.  
     - For solid foods, assume **1 serving**, **1 plate**, or another appropriate unit based on the item.

5. Include Accompaniments:  
   - If sauces or condiments were consumed with a meal, include them with the main item.  
   - Example: "Fries with ketchup" → "1 serving of fries with ketchup"

6. Empty Result:  
   - If no foods or drinks are mentioned, return an empty array.

7. Output Format:  
   - Provide the final list as a clean array of descriptive strings, one item per line.
`;

    const completion = await openai.responses.parse({
      model: "gpt-4o",
      input: [
        ...messages,
        {
          role: "user",
          content: prompt,
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
    const imagePrompt = `Generate a high-quality, realistic image from a slight top-down perspective.

GUIDELINES:
- Do not cut off any part of the food; the entire item must be fully visible within the image frame.
- Show exactly one food item based on the specified quantity. 
  - Example: "1 cup of rice" should clearly show one cup of rice, not multiple cups.
  - Example: "1 piece of chocolate" should show exactly one piece, not a full bar unless specified.
- Present the food naturally:
  - If appropriate, place it in a suitable container (e.g., on a plate, in a bowl, in a glass).
  - If the food is typically served or presented without a container (e.g., an apple, a chocolate bar, a sandwich), display it directly without a container.
  - For packaged foods, show them unwrapped unless the packaging is explicitly part of the request.
- Ensure the quantity is visually obvious and accurate.
- Scale the food size appropriately within the image frame:
  - The food should appear at a natural and realistic size relative to the image space.
  - Larger foods can occupy more of the frame, while smaller items should appear proportionally smaller, but still clearly visible.
  - Avoid making small items appear overly large or insignificant within the frame. Use good visual balance.
  - The background must be transparent with no shadows extending outside the image boundary.
- Do not add any additional objects, text, human elements, or decorations.
- Use soft, natural lighting to make the food look appetizing.
- Keep the focus entirely on the food item without visual clutter.

The image should be of: ${food}.
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

  if (messages.error || !messages.data || messages.data.length === 0) {
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
