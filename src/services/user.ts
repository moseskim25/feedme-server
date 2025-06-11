import { supabase } from "@/lib/supabase";
import { Tables, TablesInsert } from "@/types/supabase.types";

const createUser = async (payload: TablesInsert<"user">) => {
  const { data, error } = await supabase
    .from("user")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export { createUser };