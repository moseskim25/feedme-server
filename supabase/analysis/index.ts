import { createSupabaseClient, supabase } from "@/lib/supabase";
import { TablesInsert, TablesUpdate } from "@/types/supabase.types";
import { SupabaseClient } from "@supabase/supabase-js";

export const insertAnalysisInSupabase = async (
  supabase: SupabaseClient,
  payload: TablesInsert<"analysis">
) => {
  const { error } = await supabase.from("analysis").insert(payload).select();

  if (error) {
    console.error(error);
    throw new Error("Failed to insert analysis in supabase");
  }
};

export const updateAnalysisInSupabase = async (
  supabase: SupabaseClient,
  payload: TablesUpdate<"analysis">
) => {
  const { error } = await supabase.from("analysis").update(payload);

  if (error) {
    console.error(error);
    throw new Error("Failed to update analysis in supabase");
  }
};
