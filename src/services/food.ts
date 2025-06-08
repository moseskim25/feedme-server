import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase.types";

const getFoodForUserOnDate = async (
  userId: Tables<"user">["id"],
  logicalDate: string
) => {
  const { data, error } = await supabase
    .from("food")
    .select("*")
    .eq("user_id", userId)
    .eq("logical_date", logicalDate)
    .is("deleted_at", null);

  if (error) throw error;

  return data;
};

const deleteFood = async (id: Tables<"food">["id"]) => {
  const { data, error } = await supabase
    .from("food")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};

export { deleteFood, getFoodForUserOnDate };
