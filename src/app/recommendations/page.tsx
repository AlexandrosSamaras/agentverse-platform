
"use client";

import { useState } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { RecommendationForm } from '@/components/recommendations/RecommendationForm';
import { RecommendationResults } from '@/components/recommendations/RecommendationResults';
import { getAgentRecommendations } from './actions';
import type { AgentRecommendationOutput } from "@/ai/flows/agent-recommendation"; // Input type no longer needed here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<AgentRecommendationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (projectDescription: string) => { // Takes projectDescription string
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    
    // Pass projectDescription directly to the server action
    const result = await getAgentRecommendations(projectDescription); 

    if ('error' in result) {
      setError(result.error);
    } else {
      setRecommendations(result);
    }
    setIsLoading(false);
  };

  return (
    <>
      <PageTitle
        title="AI Agent Recommendations"
        description="Describe your project, and our AI will analyze your needs and suggest suitable agents from our platform."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
             <Wand2 className="h-6 w-6 text-primary" /> Find Your AI Agent
          </CardTitle>
          <CardDescription>
            Simply describe your project below. Our intelligent system will match you with the best-suited AI agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecommendationForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="mt-10 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">Our AI is analyzing your requirements and searching for the best agents...</p>
        </div>
      )}

      <RecommendationResults results={recommendations} error={error} />
    </>
  );
}
