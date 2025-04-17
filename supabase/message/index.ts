import { supabase } from "@/lib/supabase";
import { TablesInsert } from "@/types/supabase-types";

export const recordMessageInSupabase = async (
  payload: TablesInsert<"message">
) => {
  const { error } = await supabase.from("message").insert(payload);

  if (error) {
    throw new Error(`recordMessageInSupabase: ${error.message}`);
  }
};
