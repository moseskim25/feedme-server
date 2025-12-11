import { uploadToCloudflareImages } from "@/lib/cloudflare-images";
import { Tables, TablesUpdate } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

type GeneratedImage = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  _request_id?: string | null;
};

export const uploadImageToCloudflare = async (
  filename: string,
  image: GeneratedImage
): Promise<string> => {
  if (!image.data) {
    throw new Error("No image data received from OpenAI");
  }

  const imageBase64 = image.data[0].b64_json;

  if (!imageBase64) {
    throw new Error("Error preparing image for Cloudflare");
  }

  const imageBytes = Buffer.from(imageBase64, "base64");

  const uploadedImage = await uploadToCloudflareImages(imageBytes, filename);

  return uploadedImage.deliveryUrl ?? uploadedImage.id;
};

export const uploadBufferToCloudflare = async (
  filename: string,
  buffer: Buffer
): Promise<string> => {
  const uploadedImage = await uploadToCloudflareImages(buffer, filename);
  return uploadedImage.deliveryUrl ?? uploadedImage.id;
};

export const recordMessageInSupabase = async (
  userId: string,
  logicalDate: string,
  message: string
) => {
  const insertMessage = await supabase
    .from("message")
    .insert({
      user_id: userId,
      content: message,
      role: "user",
      logical_date: logicalDate,
    })
    .select("*")
    .single();

  if (insertMessage.error) {
    console.error(insertMessage.error);
    throw new Error("Failed to insert message");
  }

  return insertMessage.data;
};

export const insertSymptomEntries = async (
  userId: string,
  logicalDate: string,
  symptoms: string[]
) => {
  const symptomsEntries = symptoms.map((symptom) => ({
    user_id: userId,
    logical_date: logicalDate,
    description: symptom,
  }));

  const insertSymptoms = await supabase.from("symptom").insert(symptomsEntries);

  if (insertSymptoms.error) {
    console.error(
      `Failed to insert symptoms: ${JSON.stringify(insertSymptoms)}`
    );
    throw new Error(
      `Failed to insert symptoms: ${JSON.stringify(insertSymptoms)}`
    );
  }

  return insertSymptoms.data;
};

export const insertFoodEntry = async (
  userId: string,
  logicalDate: string,
  foodDescription: string,
  image_prompt: string,
  r2_key?: string
) => {
  const insertFood = await supabase
    .from("food")
    .insert({
      user_id: userId,
      logical_date: logicalDate,
      description: foodDescription,
      image_prompt,
      ...(r2_key && { r2_key }),
    })
    .select()
    .single();

  if (insertFood.error) {
    throw new Error(
      `Failed to insert food entry: ${JSON.stringify(insertFood)}`
    );
  }

  return insertFood.data;
};

export const updateFoodEntry = async (
  foodId: Tables<"food">["id"],
  payload: TablesUpdate<"food">
) => {
  const updateFood = await supabase
    .from("food")
    .update(payload)
    .eq("id", foodId);

  if (updateFood.error) {
    console.error(`Failed to update food entry: ${JSON.stringify(updateFood)}`);
    throw new Error(
      `Failed to update food entry: ${JSON.stringify(updateFood)}`
    );
  }

  return updateFood.data;
};



export const updateMessageProcessedStatus = async (
  messageId: Tables<"message">["id"]
) => {
  const updateMessageProcessedStatus = await supabase
    .from("message")
    .update({
      is_processed: true,
    })
    .eq("id", messageId);

  if (updateMessageProcessedStatus.error) {
    console.error(updateMessageProcessedStatus.error);
    throw new Error("Failed to update message processed status");
  }

  return updateMessageProcessedStatus.data;
};
