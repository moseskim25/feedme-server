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
   - Always include quantities using appropriate metrics (e.g., 1 cup, 1 plate, 1 glass, 1 can, etc.).  
   - If quantity isn't specified, assume 1 serving by default.
   - Preserve the medium of consumption if it is specified.

4. Assume Implied Consumption:  
   - Use natural default units:  
     - For drinks (milk, juice, water, coffee), assume **1 cup**.  
     - For snack foods (e.g., chocolate, candy, cookies), assume **1 piece** if unspecified.  
     - For solid foods, assume **1 serving**, **1 plate**, or another appropriate unit based on the item.

5. Include Accompaniments:  
   - If sauces or condiments were consumed with a meal, include them with the main item.  
   - Assume the base ingredients are in the food mentioned unless they're naming the ingredients manually.
   - Example: "Fries with ketchup" → "1 serving of fries with ketchup"

Output Format:  
   - Provide the final list as a clean array of descriptive foods, one item per line.
   - Each description must reflect any defaults (e.g. "plain", "no toppings", "black", "unsweetened")
`;

export const extractSymptomsPrompt = () => `Extract all the symptoms from the user's message related to how they might feel physically, mentally, or emotionally. Format the output as an array of strings.`;

export const generateImageDescriptionPrompt = () => `You are an expert food photography prompt generator. Create a detailed visual description optimized for AI image generation.

Output Structure:
"[Food name], [cooked/raw], [served in/without] [appropriate container if required]. [Exact quantity and visual details]. [Container material and color if used]. [Key visual characteristics]. White background. Centered composition."

Visual Priority Order:
1. Food appearance and texture (emphasize cooked state if applicable)
2. Serving container details (if present)
3. Portion precision
4. Centered, aesthetic composition

Technical Requirements:
- Focus purely on visual elements
`;

const extractFoodGroupsPrompt = (foodGroups: string) => `Identify the number of servings present. Food groups are: ${foodGroups}.

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
