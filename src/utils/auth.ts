import { Request } from "express";

export const getUserIdFromRequest = (req: Request): string => {
  return req.userId!;
};