declare module "openai" {
  export default class OpenAI {
    constructor(options: { apiKey?: string });
    responses: {
      parse<T = unknown>(params: unknown): Promise<{ output_parsed: T | null }>;
    };
    chat: {
      completions: {
        create(params: unknown): Promise<{
          choices: Array<{
            message: { content?: string | null };
          }>;
        }>;
      };
    };
    images: {
      generate(params: unknown): Promise<{
        data?: Array<{ url?: string; b64_json?: string }>;
      }>;
    };
    audio: {
      transcriptions: {
        create(params: unknown): Promise<{ text: string }>;
      };
    };
  }
}

declare module "openai/helpers/zod" {
  import { ZodTypeAny } from "zod";

  export function zodTextFormat<T extends ZodTypeAny>(
    schema: T,
    name?: string
  ): unknown;
}
