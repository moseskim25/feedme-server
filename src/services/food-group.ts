import { supabase } from "@/lib/supabase";

const getAllFoodGroups = async () => {
  const { data, error } = await supabase
    .from("food_group")
    .select("*")
    .order('id', { ascending: true })


  if (error) {
    throw error;
  }

  return data;
};

export { getAllFoodGroups };