import { deleteFood } from "@/src/services/food";
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

export { deleteFoodController };
