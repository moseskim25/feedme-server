import { supabase } from "@/lib/supabase";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase.types";

const createUserJob = async (payload: TablesInsert<"user_job">) => {
  const { data, error } = await supabase
    .from("user_job")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const updateUserJob = async (
  id: Tables<"user_job">["id"],
  payload: TablesUpdate<"user_job">
) => {
  const { data, error } = await supabase
    .from("user_job")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return data;
};

const getUserJob = async (userId: string, filter: Record<string, any> = {}) => {
  let query = supabase.from("user_job").select("*").eq("user_id", userId);

  // Apply filters
  Object.entries(filter).forEach(([key, value]) => {
    if (value === null) query = query.is(key, null);
    else if (Array.isArray(value)) query = query.in(key, value);
    else query = query.eq(key, value);
  });

  const { data } = await query.throwOnError();

  return data;
};

export { createUserJob, updateUserJob, getUserJob };
