import { FastifyInstance } from "fastify";
import { supabase } from "@/lib/supabase";
import { recordMessageInSupabase } from "@/supabase/message";
import { analyzeEntryUsingOpenAI } from "./openai";

export async function postEntry(fastify: FastifyInstance) {
  fastify.post(
    "/entry",
    {
      schema: {
        body: { type: "string" },
      },
    },
    async (request, reply) => {
      const token = request.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return reply
          .status(401)
          .send({ error: "Unauthorized: No token provided" });
      }

      const { data: auth, error: authError } = await supabase.auth.getUser(
        token
      );

      if (authError) {
        return reply.status(401).send({ error: "Unauthorized: Invalid token" });
      }

      const response = await analyzeEntryUsingOpenAI(auth.user.id);

      recordMessageInSupabase({
        user_id: auth.user.id,
        role: "system",
        content: response ?? "",
      });

      reply.status(200).send(response);
    }
  );
}
