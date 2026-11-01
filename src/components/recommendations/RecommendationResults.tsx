"use client";

import { useEffect, useState } from "react";
import type { AgentRecommendationOutput } from "@/ai/flows/agent-recommendation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, ThumbsUp, Lightbulb, SearchX, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { mockAgents } from "@/data/mock";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Agent } from "@/types";
import { AgentRating } from "@/components/agents/AgentRating";

interface RecommendationResultsProps {
  results: AgentRecommendationOutput | null;
  error: string | null;
}

export function RecommendationResults({ results, error }: RecommendationResultsProps) {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "agents"));
        const firestoreAgents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
        if (firestoreAgents.length > 0) {
          const combinedMap = new Map<string, Agent>();
          mockAgents.forEach(a => combinedMap.set(a.id, a));
          firestoreAgents.forEach(a => combinedMap.set(a.id, a));
          setAgents(Array.from(combinedMap.values()));
        }
      } catch (err) {
        console.warn("Using mockAgents in RecommendationResults:", err);
      }
    };
    fetchAgents();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <Bot className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!results) {
    return null;
  }

  const findMatchedAgent = (agentName: string): Agent | undefined => {
    const normalized = agentName.trim().toLowerCase();
    return agents.find(a => a.name.toLowerCase() === normalized || normalized.includes(a.name.toLowerCase()));
  };

  return (
    <Card className="mt-10 shadow-xl border-primary/20">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <ThumbsUp className="h-6 w-6 text-primary" /> AI-Powered Recommendations
        </CardTitle>
        <CardDescription>
          Based on your project requirements, here are the top AI agents matched by our system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {results.recommendedAgents && results.recommendedAgents.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Agent Matches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.recommendedAgents.map((agentName: string, index: number) => {
                const matchedAgent = findMatchedAgent(agentName);
                return (
                  <div
                    key={index}
                    className="flex flex-col justify-between p-4 rounded-lg border bg-card/60 hover:border-primary/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-lg text-foreground flex items-center gap-1.5">
                          {matchedAgent ? (
                            <Link href={`/agents/${matchedAgent.id}`} className="hover:text-primary transition-colors">
                              {matchedAgent.name}
                            </Link>
                          ) : (
                            agentName
                          )}
                          {matchedAgent?.verified && (
                            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </span>
                        {matchedAgent && (
                          <div className="flex items-center gap-1">
                            <AgentRating rating={matchedAgent.rating} starSize={14} />
                          </div>
                        )}
                      </div>
                      {matchedAgent && (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">By {matchedAgent.developer}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {matchedAgent.shortDescription || matchedAgent.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(matchedAgent.capabilities || []).slice(0, 3).map(cap => (
                              <Badge key={cap} variant="secondary" size="sm">{cap}</Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {matchedAgent && (
                      <div className="pt-2 border-t flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/agents/${matchedAgent.id}`}>
                            View Agent Profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <SearchX className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">No Specific Agents Recommended</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Our AI couldn&apos;t identify specific agents based on your current description. Try adding more details about your goals or browse all agents directly.
            </p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/#agent-listing-section">Browse All Agents</Link>
              </Button>
            </div>
          </div>
        )}

        {results.reasoning && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Matchmaking Analysis & Reasoning
            </h3>
            <div className="text-muted-foreground whitespace-pre-line bg-muted/30 p-5 rounded-lg border text-sm leading-relaxed">
              {results.reasoning}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
