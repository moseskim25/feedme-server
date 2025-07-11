import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase.types";

const insertFoodGroupServings = async (
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
    .from("food_group_serving")
    .insert(insertData)
    .select();

  if (error) {
    throw error;
  }

  return data;
};

export { insertFoodGroupServings };
