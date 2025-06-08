import { getLogicalDateForToday } from "@/lib/utils/date.utils";
import { supabase } from "@/lib/supabase";
import { Tables } from "@/types/supabase.types";

const getCountOfMessagesForUserForToday = async (
  userId: Tables<"user">["id"]
) => {
  const logicalDate = getLogicalDateForToday();

  const { count, error } = await supabase
    .from("message")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("logical_date", logicalDate);

  if (error) throw error;

  return count ?? 0;
};

export { getCountOfMessagesForUserForToday };
