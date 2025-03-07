import { supabase } from "@/lib/supabase";
import { TablesInsert } from "@/types/supabase-types";

export const supabaseInsertMessage = async (
  payload: TablesInsert<"message">
) => {
  const { error } = await supabase.from("message").insert(payload);

  if (error) {
    throw new Error(`supabaseInsertMessage: ${error.message}`);
  }
};
