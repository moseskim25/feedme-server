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
Begin with a concise checklist (any number of bullets) of how you will identify, extract, and summarize all aspects related to physical, mental, or emotional health from the user's message: "${message}".

Requirements:
1. Provide concise summaries and insights from their message, preserving important details.
2. Omit any mention of foods or drinks.
3. Format the output as an array of strings.
4. If the message contains nothing relevant, return an empty array.
After extracting summaries, briefly verify that each item addresses only physical, mental, or emotional health and contains no references to foods or drinks; self-correct if necessary.

Include items such as:
- "Had a headache this morning"
- "Feeling really energetic today"
- "My stools were really great"
- "Slept poorly last night"
- "Feeling anxious about work"

`;

export const generateImageDescriptionPrompt = () => `
You are an expert food photography prompt generator. Create a detailed visual description optimized for AI image generation.

Required Elements:
- Angle: Slight top-down perspective (45-degree angle)
- Background: Transparent PNG format (no shadows, no reflections)
- Serving Container: Use a context-appropriate vessel (plate for solids, bowl for liquids, clear glass for cold drinks, ceramic mug for hot beverages). If the food is naturally standalone (e.g., whole fruits, vegetables, pastries), omit the container entirely.
- Portion Accuracy: Single standard serving size with exact quantities
- Food Purity: Base food only, no added ingredients, garnishes, or decorative cuts
- Cooking State: Specify if the food is cooked or raw. By default, meat and seafood should appear fully cooked unless “raw” is explicitly stated.

Output Structure:
"[Food name], [cooked/raw], [served in/without] [appropriate container if required], photographed from a slight overhead angle. [Exact quantity and visual details]. [Container material and color if used]. [Key visual characteristics]. Transparent background, soft diffused studio lighting, high resolution, food photography style. Transparent PNG, centered composition."

Visual Priority Order:
1. Food appearance and texture (emphasize cooked state if applicable)
2. Serving container details (if present)
3. Portion precision
4. Centered, aesthetic composition

Technical Requirements:
- Focus purely on visual elements
- Emphasize transparent PNG background twice
- Strict food photography style

`;

export const generateFeedbackPrompt = (foods: string[]) =>
  `
Analyze this daily food intake: ${foods.join(", ")}.

Provide feedback in 1-2 sentences:
1. If there's a genuinely positive nutritional aspect, mention it briefly
2. Identify the SINGLE most critical nutritional gap that would most improve their health (consider: fruits, vegetables, whole grains, protein, fiber, healthy fats)

Focus on the most impactful improvement, not multiple minor issues. Be specific and actionable.
`;

const extractFoodGroupsPrompt = (foodGroups: string) => `
You are a nutrition analysis assistant for a food tracking app.

Go through each of the food groups. For each one, identify the number of servings present. Food groups are: ${foodGroups}.

Use fractional servings to reflect portion size and prominence; avoid treating minor additions as full servings.

After generating the JSON output, briefly validate that each outputted food group matches the spelling in the food groups list and that no unmentioned groups are included. If no food groups are identified, ensure the output is an empty JSON object ({}).

# Output Format

Return a JSON object where:
- Each key is a detected food group (exact spelling as in the food groups list), with its estimated servings as a numerical value (including fractions when relevant).
- If no food groups are present, return an empty JSON object: {}.

Example:
{
"Grains": 1.5,
"Vegetables": 0.5,
"Protein": 1
}

If none are found:
{}
`;

export { extractFoodGroupsPrompt };
