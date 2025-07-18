import { pool } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase.types";
import { getFoodById as getFoodByIdSql } from "@/generated/prisma/sql";
import { prisma } from "@/lib/prisma";

type FoodWithServings = {
  id: number;
  description: string | null;
  r2_key: string | null;
  name: string | null;
  servings: string;
};

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

const getFoodByName = async (food: string) => {
  const { data, error } = await supabase
    .from("food")
    .select("*")
    .eq("description", food)
    .is("deleted_at", null)
    .not("r2_key", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  return data?.[0] || null;
};


const getFoodById = async (id: Tables<"food">["id"]): Promise<getFoodByIdSql.Result[]> => {
  const data = await prisma.$queryRawTyped(getFoodByIdSql(id));
  return data;
};

export { deleteFood, getFoodForUserOnDate, getFoodByName, getFoodById };
