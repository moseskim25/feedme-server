import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase.types";

// Type declarations are now in index.ts as global namespace extension

export function authMiddleware() {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      console.log("called middleware");
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return response
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      const supabase = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      const { data, error } = await supabase.auth.getUser();

      console.log('supabase auth getUser')
      console.log(data)

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
