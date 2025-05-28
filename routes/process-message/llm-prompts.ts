import { getCurrentTime } from "@/lib/utils/date.utils";

export const extractFoodsPrompt = `
Task:  
Extract and generate a structured list of all foods and drinks mentioned in the conversation. Include quantities and descriptions.

Guidelines:

1. Group Appropriately:  
   - A "food" can be a complete plate, a single item, or a drink.  
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
   - If quantity isn't specified, assume 1 by default.

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
   - If a food or drink is mentioned with no ingredients, toppings, or add-ins specified, output the item as its base version and state the absence explicitly in the description (e.g., “plain”, “no toppings”, “black”, “unsweetened”).
   - Only list extra ingredients when the user clearly mentions them.

Output Format:  
   - Provide the final list as a clean array of descriptive strings, one item per line.
   - Each description must reflect any defaults (e.g. "plain", "no toppings", "black", "unsweetened")
`;

export const extractSymptomsPrompt = `
From the user's messages, extract all mentioned symptoms.

Guidelines:
1. Include only physical or emotional symptoms (e.g., bloating, mood swings, fatigue, pain, bowel movements, nausea).
2. Exclude foods, activities, and general observations that are not symptoms.
3. Return the symptoms as a plain array of strings, e.g., ["bloating", "fatigue"].
4. If no symptoms are found, return an empty array.
`;

export const generateImagePrompt = (
  food: string
) => `Generate a realistic and appealing image of ${food} from a slight top-down perspective.

GUIDELINES:
- Do not cut off any part of the food; the entire item must be fully visible within the image frame.
- Unless the food is specified as raw, the image should be cooked.
- The food should be in a medium that is appropriate for the food, such as a plate, bowl, or cup.
- Do not add any background. The background should be transparent.
- Do not add any additional objects, text, human elements, or decorations.
- Do not add additional ingredients to the food.
`;

export const generateFeedbackPrompt = () =>
  `
Based on this conversation, provide feedback on my diet keeping in mind the time of day is ${getCurrentTime()}.

Guidelines:
1. The first sentence should be a compliment specific to their diet, unless there actually is nothing positive to say about their diet.
2. The second sentence should be constructive criticism, unless their diet is already perfect.
3. Keep your response concise.
4. Your response should be in two sentences.
`;
