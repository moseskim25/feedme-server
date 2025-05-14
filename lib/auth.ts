import { FastifyRequest, FastifyReply } from "fastify";
import { createSupabaseClient } from "./supabase";
import { pool } from "./db";

// Add the type declaration here
declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<{ authenticated: boolean; userId?: string }> {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      reply.status(401).send({ error: "Unauthorized: No token provided" });
      return { authenticated: false };
    }

    const supabase = createSupabaseClient(token);

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth error:", error);
      reply.status(401).send({ error: "Unauthorized: Invalid token" });
      return { authenticated: false };
    }

    return { authenticated: true, userId: data.user?.id };
  } catch (err) {
    console.error("Auth error:", err);
    reply
      .status(500)
      .send({ error: "Internal server error during authentication" });
    return { authenticated: false };
  }
}

export function authMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = await authenticate(request, reply);
    if (!auth.authenticated) {
      return reply;
    }

    // Add the userId to the request for use in route handlers
    request.userId = auth.userId;
  };
}
