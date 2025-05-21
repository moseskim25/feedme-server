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

7. Output Format:  
   - Provide the final list as a clean array of descriptive strings, one item per line.
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
) => `Generate a high-quality, realistic image from a slight top-down perspective.

GUIDELINES:
- Do not cut off any part of the food; the entire item must be fully visible within the image frame.
- Show exactly one food item based on the specified quantity. 
  - Example: "1 cup of rice" should clearly show one cup of rice, not multiple cups.
  - Example: "1 piece of chocolate" should show exactly one piece, not a full bar unless specified.
- Present the food naturally:
  - If appropriate, place it in a suitable container (e.g., on a plate, in a bowl, in a glass).
  - If the food is typically served or presented without a container (e.g., an apple, a chocolate bar, a sandwich), display it directly without a container.
  - For packaged foods, show them unwrapped unless the packaging is explicitly part of the request.
- Ensure the quantity is visually obvious and accurate.
- Scale the food size appropriately within the image frame:
  - The food should appear at a natural and realistic size relative to the image space.
  - Larger foods can occupy more of the frame, while smaller items should appear proportionally smaller, but still clearly visible.
  - Avoid making small items appear overly large or insignificant within the frame. Use good visual balance.
- The background must be transparent with no shadows extending outside the image boundary.
- Do not add any additional objects, text, human elements, or decorations.
- Use soft, natural lighting to make the food look appetizing.
- Keep the focus entirely on the food item without visual clutter.

The image should be of: ${food}.
`;
