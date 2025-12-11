import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase.types";
const getFoodForUserOnDate = async (
  userId: Tables<"user">["id"],
  logicalDate: string,
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

const deleteFoodEntry = async (id: Tables<"food">["id"]) => {
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

const getFoodByName = async (foodName: string) => {
  const { data, error } = await supabase
    .from("food")
    .select("*")
    .eq("description", foodName)
    .is("deleted_at", null)
    .not("r2_key", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  return data?.[0] || null;
};

const getFoodById = async (
  id: Tables<"food">["id"],
) => {
  const { data, error } = await supabase
    .from("food")
    .select(
      "id, description, r2_key, logical_date, serving(id, servings, food_group(id, name))"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) throw error;

  console.log(data)

  return data;
};

const isFoodOwnedByUser = async (
  foodId: Tables<"food">["id"],
  userId: Tables<"food">["user_id"],
) => {
  const { data, error } = await supabase
    .from("food")
    .select("id")
    .eq("id", foodId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
};

export {
  deleteFoodEntry,
  getFoodForUserOnDate,
  getFoodByName,
  getFoodById,
  isFoodOwnedByUser,
};
