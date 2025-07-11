import { supabase } from "@/lib/supabase";

const getAllFoodGroups = async () => {
  const { data, error } = await supabase
    .from("food_group")
    .select("*")
    .order("name");

  if (error) {
    throw error;
  }

  return data;
};

export { getAllFoodGroups };