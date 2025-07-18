import { deleteFood, getFoodById } from "@/src/services/food";
import { generateFeedback } from "@/src/services/feedback";
import { Request, Response } from "express";

const deleteFoodController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id } = req.params;

    const deletedFood = await deleteFood(Number.parseInt(id));

    await generateFeedback(userId, deletedFood.logical_date);

    res.status(200).json({ message: "Food deleted" });
  } catch (err) {
    console.error("Error in deleteFoodController:", err);
  }
};

const getFoodController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const food = await getFoodById(Number.parseInt(id));

    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }

    res.status(200).json(food);
  } catch (err) {
    console.error("Error in getFoodController:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { deleteFoodController, getFoodController };
