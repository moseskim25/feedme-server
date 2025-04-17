import { aiPrompt } from "./prompt";

export const analyzeWithPerplexity = async (text: string) => {
  const body = {
    model: "sonar",
    messages: [
      {
        role: "system",
        content: aiPrompt(),
      },
      {
        role: "user",
        content: text,
      },
    ],
  };

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer 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`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };

  let perplexityRequest = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options
  );

  const completion = await perplexityRequest.json();

  return completion.choices[0].message.content;
};

