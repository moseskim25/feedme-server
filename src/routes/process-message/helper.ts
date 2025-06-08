import { openai } from "@/lib/openai";
import { uploadToR2 } from "@/lib/r2";
import { getCurrentTime } from "@/lib/utils/date.utils";
import { Database, Tables, TablesUpdate } from "@/types/supabase.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { ImagesResponse } from "openai/resources/images";
import { supabase } from "@/lib/supabase";

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

export const createSymptomEntries = async (
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

export const createFoodEntry = async (
  userId: string,
  logicalDate: string,
  food: string,
  image_prompt: string
) => {
  const insertFood = await supabase
    .from("food")
    .insert({
      user_id: userId,
      logical_date: logicalDate,
      description: food,
      image_prompt,
    })
    .select()
    .single();

  if (insertFood.error) {
    console.error(`Failed to insert food: ${JSON.stringify(insertFood)}`);
    throw new Error(`Failed to insert food: ${JSON.stringify(insertFood)}`);
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
    console.error(`Failed to update food: ${JSON.stringify(updateFood)}`);
    throw new Error(`Failed to update food: ${JSON.stringify(updateFood)}`);
  }

  return updateFood.data;
};

export const insertFeedbackToDatabase = async (
  userId: string,
  logicalDate: string,
  feedback: string
) => {
  const insertFeedback = await supabase.from("feedback").insert({
    user_id: userId,
    logical_date: logicalDate,
    content: feedback,
  });

  if (insertFeedback.error) {
    console.error(insertFeedback.error);
    throw new Error("Failed to insert feedback");
  }

  return insertFeedback.data;
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
