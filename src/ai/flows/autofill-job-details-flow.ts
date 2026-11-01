'use server';

import { getModel } from '@/lib/ai';
import { z } from 'zod';
import type { AutofillJobDetailsInput as AutofillJobDetailsInputType, AutofillJobDetailsOutput as AutofillJobDetailsOutputType } from '@/types';

const AutofillJobDetailsInputSchema = z.object({
  naturalLanguageQuery: z
    .string()
    .describe('A natural language description of the project or job requirements.'),
  availableSkills: z
    .array(z.string())
    .describe('A list of predefined skills to help the AI choose relevant ones.'),
});

const AutofillJobDetailsOutputSchema = z.object({
  suggestedProjectTitle: z
    .string()
    .optional()
    .describe('A concise and relevant project title extracted or generated from the query.'),
  refinedProjectDescription: z
    .string()
    .optional()
    .describe(
      'A well-structured project description based on the input query.'
    ),
  suggestedSkills: z
    .array(z.string())
    .optional()
    .describe(
      'A list of suggested skills relevant to the project, ideally chosen from the provided availableSkills list.'
    ),
});

export type AutofillJobDetailsInput = z.infer<typeof AutofillJobDetailsInputSchema>;
export type AutofillJobDetailsOutput = z.infer<typeof AutofillJobDetailsOutputSchema>;

export async function autofillJobDetails(input: AutofillJobDetailsInputType): Promise<AutofillJobDetailsOutputType> {
  const prompt = `
    You are an expert assistant helping users create job postings on AgentVerse.
    Your task is to analyze a natural language project description and extract key information to pre-fill a job posting form.

    Project Query:
    "${input.naturalLanguageQuery}"

    Available skills to choose from (try to match these if appropriate, otherwise you can suggest closely related skills if necessary):
    ${input.availableSkills.map(skill => `- ${skill}`).join('\n')}

    Based on the project query, please provide:
    1. A 'suggestedProjectTitle': A concise and engaging title for the job post.
    2. A 'refinedProjectDescription': Take the user's query and rephrase it into a clear, well-structured project description suitable for a job post (at least 60 characters). Highlight key objectives and deliverables.
    3. A list of 'suggestedSkills': Identify skills from the "Available skills" list that are most relevant to the project query.

    Ensure your output is a JSON object with the following structure:
    {
      "suggestedProjectTitle": "Title",
      "refinedProjectDescription": "Description",
      "suggestedSkills": ["Skill 1", "Skill 2"]
    }
  `;

  const modelsToTry = ["gemini-3.8-flash", "gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-3.1-flash-lite-preview"];

  for (const modelName of modelsToTry) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const responseText = result.response.text();
      const output = JSON.parse(responseText);

      return {
        suggestedProjectTitle: output.suggestedProjectTitle,
        refinedProjectDescription: output.refinedProjectDescription,
        suggestedSkills: Array.isArray(output.suggestedSkills) ? output.suggestedSkills : [],
      };
    } catch (error) {
      console.warn(`Model ${modelName} failed in autofillJobDetails, trying next if available:`, error);
    }
  }

  return {};
}
