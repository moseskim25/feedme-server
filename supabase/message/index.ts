import { supabase } from "@/lib/supabase";
import { TablesInsert } from "@/types/supabase.types";

export const insertMessageInSupabase = async (
  payload: TablesInsert<"message">
) => {
  const { error } = await supabase.from("message").insert(payload);

  if (error) {
    console.error(error);
    throw new Error(`insertMessageInSupabase: ${error.message}`);
  }
};
