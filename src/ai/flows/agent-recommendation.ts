'use server';

import { getModel } from '@/lib/ai';
import { z } from 'zod';

const AgentRecommendationInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the project for which an AI agent is needed.'),
  platformAgentProfilesData: z
    .string()
    .describe(
      'A summary of all available AI agents on the platform, including their names, key capabilities, and brief descriptions.'
    ),
});

export type AgentRecommendationInput = z.infer<typeof AgentRecommendationInputSchema>;

const AgentRecommendationOutputSchema = z.object({
  recommendedAgents: z
    .array(z.string())
    .describe('A list of recommended AI agent names based on the project description and available profiles.'),
  reasoning: z
    .string()
    .describe(
      'Detailed reasoning for each recommendation, explaining why the agent is a good fit by connecting project needs to agent capabilities.'
    ),
});

export type AgentRecommendationOutput = z.infer<typeof AgentRecommendationOutputSchema>;

export async function agentRecommendation(input: AgentRecommendationInput): Promise<AgentRecommendationOutput> {
  const prompt = `
    You are an expert AI Agent Matchmaking Consultant on AgentVerse. Your primary goal is to connect users with the most suitable AI agents for their specific projects by analyzing their needs and the profiles of agents available on our platform.

    User's Project Description:
    "${input.projectDescription}"

    Available AI Agents on Our Platform:
    ---
    ${input.platformAgentProfilesData}
    ---

    Your Task:
    1. Carefully analyze the user's "Project Description" to understand the core requirements, objectives, desired outcomes, and any implied skills or industry focus.
    2. Review the "Available AI Agents on Our Platform" data.
    3. Identify and recommend up to 3-5 agents from the platform list that are the best fit for the described project.
    4. For each recommended agent, you MUST provide:
       a. The agent's name (exactly as it appears in the platform data).
       b. A detailed justification explaining *why* this particular agent is a strong match. Connect specific aspects, keywords, or needs from the "Project Description" to the agent's listed capabilities, description, or typical use cases. Be specific and insightful.

    Output Format:
    Provide your response strictly as a JSON object with the following structure:
    {
      "recommendedAgents": ["Agent Name 1", "Agent Name 2"],
      "reasoning": "Agent Name 1: [Detailed justification]...\\n\\nAgent Name 2: [Detailed justification]..."
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
        recommendedAgents: Array.isArray(output.recommendedAgents) ? output.recommendedAgents : [],
        reasoning: typeof output.reasoning === 'string' ? output.reasoning : "No reasoning provided.",
      };
    } catch (error) {
      console.warn(`Model ${modelName} failed in agentRecommendation, trying next if available:`, error);
    }
  }

  return {
    recommendedAgents: [],
    reasoning: "Could not generate recommendations at this time. Please check your Gemini API key configuration and try again.",
  };
}
