import { supabase } from "@/lib/supabase";
import { Request, Response } from "express";
import { createUser } from "@/src/services/user";

const createUserController = async (req: Request, res: Response) => {
  try {
    console.log("Creating user");

    const userId = req.userId as string;

    console.log("User ID", userId);

    // Check if user already exists
    const getUser = await supabase
      .from("user")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (getUser.error) throw getUser.error;

    if (getUser.data) {
      return res.status(200).json({ message: "User already exists" });
    }

    await createUser({
      id: userId,
    });

    return res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { createUserController };
