import { supabase } from "@/lib/supabase";
import { Request, Response } from "express";
import { createUser, deleteUserAccount } from "@/src/services/user";

const createUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;

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

const deleteUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing user id" });
    }

    const result = await deleteUserAccount(userId);

    if (!result.success && result.reason === "not_found") {
      console.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { createUserController, deleteUserController };
