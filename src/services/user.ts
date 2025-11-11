import { supabase } from "@/lib/supabase";
import { TablesInsert } from "@/types/supabase.types";

const createUser = async (payload: TablesInsert<"user">) => {
  const { data, error } = await supabase
    .from("user")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
};

const deleteUserAccount = async (userId: string) => {
  const { data: existingUser, error: fetchError } = await supabase
    .from("user")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existingUser) {
    return { success: false as const, reason: "not_found" as const };
  }

  const { error: deleteError } = await supabase.from("user").delete().eq("id", userId);

  if (deleteError) throw deleteError;

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

  if (authDeleteError) throw authDeleteError;

  return { success: true as const };
};

export { createUser, deleteUserAccount };
