import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase.types";

const deleteMessage = async (id: Tables<"message">["id"]) => {
  const { data, error } = await supabase.from("message").delete().eq("id", id);

  if (error) throw error;

  return data;
};

const generateFeedback = () => {};

export { deleteMessage, generateFeedback };
