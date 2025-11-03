import { Request, Response } from "express";
import { getAllFoodGroups } from "@/src/services/food-group";

const getFoodGroupsController = async (req: Request, res: Response) => {
  try {
    const data = await getAllFoodGroups();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getFoodGroupsController:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export { getFoodGroupsController };

