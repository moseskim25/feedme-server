import { FastifyInstance } from "fastify";
import OpenAI from "openai";

interface LogFoodRequestBody {
  food: string;
}

async function logFood(fastify: FastifyInstance) {
  fastify.post<{ Body: LogFoodRequestBody }>(
    "/log-food",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            food: { type: "string" },
          },
          required: ["food"],
        },
      },
    },
    async (request, reply) => {
      console.log(process.env.OPENAI_SECRET_KEY);

      const incoming = request.body;
      const { food } = incoming;

      const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition expert. Please rely on factual data, preferrably from USDA sources.",
          },
          {
            role: "user",
            content: `Tell me nutrition facts about ${food}.`,
          },
        ],
      });

      console.log(completion.choices[0].message);

      return completion.choices[0].message;
    }
  );
}

export default logFood;
