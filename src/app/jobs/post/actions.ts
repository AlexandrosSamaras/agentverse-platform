
"use server";

import { autofillJobDetails } from "@/ai/flows/autofill-job-details-flow";
import type { AutofillJobDetailsInput, AutofillJobDetailsOutput } from "@/ai/flows/autofill-job-details-flow";
import { AvailableSkills } from "@/types"; // Import AvailableSkills

export async function getAutofillJobSuggestions(
  naturalLanguageQuery: string
): Promise<AutofillJobDetailsOutput | { error: string }> {
  try {
    if (!naturalLanguageQuery || naturalLanguageQuery.trim() === "") {
      return { error: "Project description query cannot be empty." };
    }

    const input: AutofillJobDetailsInput = {
      naturalLanguageQuery,
      availableSkills: AvailableSkills, // Pass the list of available skills
    };

    const result = await autofillJobDetails(input);
    
    // Ensure the result conforms to what the frontend expects, 
    // even if some fields are optional in the Zod schema.
    return {
      suggestedProjectTitle: result.suggestedProjectTitle,
      refinedProjectDescription: result.refinedProjectDescription,
      suggestedSkills: result.suggestedSkills,
    };

  } catch (error) {
    console.error("Error in autofillJobDetails flow:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to get job post suggestions: ${errorMessage}` };
  }
}
