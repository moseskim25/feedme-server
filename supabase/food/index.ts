import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase-types";

export const supabaseInsertLogItem = async (
  userId: Tables<"user">["id"],
  description: Tables<"food">["description"]
) => {
  const { error } = await supabase.from("food").insert({
    description,
    user_id: userId,
  });

  if (error) {
    throw new Error(`supabaseInsertLogItem: ${error.message}`);
  }
};
