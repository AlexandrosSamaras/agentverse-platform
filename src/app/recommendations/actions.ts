"use server";

import { agentRecommendation } from "@/ai/flows/agent-recommendation";
import type { AgentRecommendationInput, AgentRecommendationOutput } from "@/ai/flows/agent-recommendation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { mockAgents } from "@/data/mock";
import type { Agent } from "@/types";

function formatAgentProfilesForLLM(agents: Agent[]): string {
  return agents
    .map(
      (agent) =>
        `ID: ${agent.id}; Name: ${agent.name}; Capabilities: ${(agent.capabilities || []).join(', ')}; Autonomy: ${agent.autonomyLevel || 'Unspecified'}; Description: ${agent.description.substring(0, 200)}...`
    )
    .join('\n---\n');
}

async function fetchAvailableAgents(): Promise<Agent[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "agents"));
    const firestoreAgents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
    if (firestoreAgents.length > 0) {
      return firestoreAgents;
    }
  } catch (err) {
    console.warn("Could not fetch agents from Firestore for recommendations, falling back to mockAgents:", err);
  }
  return mockAgents;
}

export async function getAgentRecommendations(
  projectDescription: string
): Promise<AgentRecommendationOutput | { error: string }> {
  try {
    if (!projectDescription || projectDescription.trim() === "") {
      return { error: "Project description cannot be empty." };
    }

    const agents = await fetchAvailableAgents();
    const platformAgentProfilesData = formatAgentProfilesForLLM(agents);

    const input: AgentRecommendationInput = {
      projectDescription,
      platformAgentProfilesData,
    };

    const result = await agentRecommendation(input);
    return result;
  } catch (error) {
    console.error("Error in agentRecommendation flow:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { error: `Failed to get recommendations: ${errorMessage}. Please try again later.` };
  }
}
