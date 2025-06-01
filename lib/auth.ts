import { Request, Response, NextFunction } from "express";
import { createSupabaseClient } from "./supabase";
import { pool } from "./db";

// Type declarations are now in index.ts as global namespace extension

export async function authenticate(
  request: Request,
  response: Response
): Promise<{ authenticated: boolean; userId?: string }> {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      response.status(401).json({ error: "Unauthorized: No token provided" });
      return { authenticated: false };
    }

    const supabase = createSupabaseClient(token);

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
      response.status(401).json({ error: "Unauthorized: Invalid token" });
      return { authenticated: false };
    }

    return { authenticated: true, userId: data.user.id };
  } catch (err) {
    console.error("Auth error:", err);
    response
      .status(500)
      .json({ error: "Internal server error during authentication" });
    return { authenticated: false };
  }
}

export function authMiddleware() {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return response
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      const supabase = createSupabaseClient(token);
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Auth error:", error);
        return response
          .status(401)
          .json({ error: "Unauthorized: Invalid token" });
      }

      // Add both userId and token to the request
      request.userId = data.user?.id;
      request.authToken = token;

      next();
    } catch (err) {
      console.error("Auth error:", err);
      return response
        .status(500)
        .json({ error: "Internal server error during authentication" });
    }
  };
}
