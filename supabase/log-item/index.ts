import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase-types";

export const supabaseInsertLogItem = async (
  logId: Tables<"log_item">["log_id"],
  description: Tables<"log_item">["description"]
) => {
  const { error } = await supabase.from("log_item").insert({
    log_id: logId,
    type: "food",
    description,
  });

  if (error) {
    throw new Error(`supabaseInsertLogItem: ${error.message}`);
  }
};