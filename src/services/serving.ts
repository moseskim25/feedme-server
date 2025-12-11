import { supabase } from "@/lib/supabase";

const insertServings = async (
  userId: string,
  servings: Array<{ food_id: number; food_group_id: number; servings: number }>
) => {
  const insertData = servings.map((serving) => ({
    user_id: userId,
    food_id: serving.food_id,
    food_group_id: serving.food_group_id,
    servings: serving.servings,
  }));

  const { data, error } = await supabase
    .from("serving")
    .insert(insertData)
    .select();

  if (error) {
    throw error;
  }

  return data;
};

const normalizeServings = (value: number) =>
  Math.max(0, Math.round(value * 4) / 4);

const upsertServingForFood = async ({
  userId,
  foodId,
  foodGroupId,
  servings,
}: {
  userId: string;
  foodId: number;
  foodGroupId: number;
  servings: number;
}) => {
  const normalizedServings = normalizeServings(servings);

  const { data: existingServing, error: existingError } = await supabase
    .from("serving")
    .select("id")
    .eq("food_id", foodId)
    .eq("food_group_id", foodGroupId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingServing) {
    const { data, error } = await supabase
      .from("serving")
      .update({ servings: normalizedServings })
      .eq("id", existingServing.id)
      .select("id, servings, food_group_id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  if (normalizedServings === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("serving")
    .insert({
      user_id: userId,
      food_id: foodId,
      food_group_id: foodGroupId,
      servings: normalizedServings,
    })
    .select("id, servings, food_group_id")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export { insertServings, upsertServingForFood };
