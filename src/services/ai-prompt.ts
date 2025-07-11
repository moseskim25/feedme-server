import { getCurrentTime } from "@/lib/utils/date.utils";

export const extractFoodsPrompt = (message: string) => `
Task:  
Extract and generate a structured list of all foods and drinks mentioned in the following message: "${message}". Include quantities and descriptions.

Guidelines:

1. Group Appropriately:  
   - A "food" can be a complete plate, a single item, or a drink. Based on the message, place items together if they sound like they accompany each other. For example, if the user says "I had a salad and a sandwich", then the salad and sandwich should be grouped together.
   - Do NOT split ingredients unless the item was clearly consumed separately.  
   - Example: "A plate of rice and chicken" should remain as one item unless specified otherwise.

2. Handle Repeated Items Individually:  
   - If an item is mentioned multiple times, list each instance separately.  
   - Example: "I had 2 glasses of milk, then another later" → Output:  
     - 1 glass of milk  
     - 1 glass of milk  
     - 1 glass of milk  

3. Quantity Inclusion:  
   - Always include quantities using appropriate metrics (e.g., 1 cup, 1 plate, 1 glass, etc.).  
   - If quantity isn't specified, assume 1 serving by default.

4. Assume Implied Consumption:  
   - If a food or drink is mentioned without context assume it was consumed.  
   - Use natural default units:  
     - For drinks (milk, juice, water, coffee), assume **1 cup**.  
     - For snack foods (e.g., chocolate, candy, cookies), assume **1 piece** if unspecified.  
     - For solid foods, assume **1 serving**, **1 plate**, or another appropriate unit based on the item.

5. Include Accompaniments:  
   - If sauces or condiments were consumed with a meal, include them with the main item.  
   - Example: "Fries with ketchup" → "1 serving of fries with ketchup"

6. Empty Result:  
   - If no foods or drinks are mentioned, return an empty array.

7. Default Ingredients:
   - If a food or drink is mentioned with no ingredients, toppings, or add-ins specified, output the item as its base version and state the absence explicitly in the description (e.g., "plain", "no toppings", "black", "unsweetened").
   - Only list extra ingredients when the user clearly mentions them.

Output Format:  
   - Provide the final list as a clean array of descriptive foods, one item per line.
   - Each description must reflect any defaults (e.g. "plain", "no toppings", "black", "unsweetened")
`;

export const extractSymptomsPrompt = (message: string) => `
From the user's message: "${message}", summarize everything related to physical, mental, or emotional health.

Guidelines:
1. Try to summarize and dissect their message concisely but don't remove too many details.
2. Exclude foods and drink.
3. Return your response as an array of strings.
4. Return an empty array if there's nothing to report.

Examples of what to include:
- "Had a headache this morning"
- "Feeling really energetic today" 
- "My stools were really great"
- "Slept poorly last night"
- "Feeling anxious about work"
`;

export const generateImagePrompt = (food: string) => `
Generate a photorealistic image of ${food} in an appropriate serving medium shot from a slight top-down angle.
`;

export const generateImageDescriptionPrompt = (food: string) => `
You're job is to generate a description of ${food} for an image generation model.

Guidelines:
- The image should be from a slight top-down angle.
- The background should always be transparent.
- The medium should be appropriate for the food, for example a plate, bowl, or cup.
- Make sure to emphasize what is or is not included in the food. If the food is vague, describe the original food without any additional ingredients.
- Describe the medium the food is served in. If it's a refreshing drink, it makes sense for the cup to be clear. If it's a hot drink then a mug. Discern the appropriate medium.
- The background is often mistaken and not transparent. Make sure to describe the background as transparent.
- Focus on just the description of the food visually. Don't include details on why you're requesting it to look a certain way. For example, no need to say that something compliments the food.
- Keep it relatively brief. If the description is too long it can cause the image generation model to hallucinate.
- Based on the serving size, be very exact in the quantity. If one serving typically has x number of pieces, then describe it as such.
`;

export const generateFeedbackPrompt = (foods: string[]) =>
  `
Analyze this daily food intake: ${foods.join(", ")}.

Provide feedback in 1-2 sentences:
1. If there's a genuinely positive nutritional aspect, mention it briefly
2. Identify the SINGLE most critical nutritional gap that would most improve their health (consider: fruits, vegetables, whole grains, protein, fiber, healthy fats)

Focus on the most impactful improvement, not multiple minor issues. Be specific and actionable.
`;
