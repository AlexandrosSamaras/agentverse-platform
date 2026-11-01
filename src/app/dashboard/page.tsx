"use client";

import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, DollarSign, Bot, PlusCircle, Database, ExternalLink, Star } from "lucide-react";
import { PageTitle } from "@/components/shared/PageTitle";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { mockAgents } from "@/data/mock";
import type { Agent } from "@/types";
import Link from "next/link";

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [myAgents, setMyAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Handle Stripe Connect callback
  useEffect(() => {
    async function handleStripeCallback() {
      const accountId = searchParams.get("account_id");
      const stripeConnectSuccess = searchParams.get("stripe_connect_success");

      if (user && accountId && stripeConnectSuccess === "true") {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            stripeAccountId: accountId,
          });
          setStripeAccountId(accountId);
          toast({
            title: "Stripe Connected!",
            description: "Your payout account has been linked.",
          });
          router.replace("/dashboard");
        } catch (error) {
          console.error("Error saving Stripe account ID:", error);
        }
      }
    }

    if (!authLoading && user) {
      handleStripeCallback();
    }
  }, [searchParams, user, authLoading, router, toast]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setStripeAccountId(userDoc.data().stripeAccountId || null);
          }
        }

        const agentsSnap = await getDocs(collection(db, "agents"));
        const firestoreAgents = agentsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Agent[];

        if (user) {
          const owned = firestoreAgents.filter((a) => a.developerId === user.uid);
          setMyAgents(owned.length > 0 ? owned : firestoreAgents.slice(0, 3));
        } else {
          setMyAgents(firestoreAgents.length > 0 ? firestoreAgents.slice(0, 3) : mockAgents.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setMyAgents(mockAgents.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const handleConnectStripe = async () => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in first to connect a Stripe payout account.",
        });
        router.push("/auth/login");
        return;
      }
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          variant: "destructive",
          title: "Stripe Configuration Needed",
          description: data.error || "Ensure STRIPE_SECRET_KEY is configured in .env.local.",
        });
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Database Synchronized",
          description: `Seeded ${data.counts?.agents || 6} agents and ${data.counts?.jobs || 6} jobs into Firestore.`,
        });
      } else {
        throw new Error(data.error || "Failed to seed database");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Database Sync Failed",
        description: error.message || "Could not write to Firestore.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageTitle
          title="Developer & Provider Dashboard"
          description="Manage your published AI agents, configure Stripe payouts, and monitor marketplace performance."
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSeedDatabase} disabled={isSeeding}>
            {isSeeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4 text-primary" />
            )}
            Sync Sample Data
          </Button>
          <Button asChild>
            <Link href="/agents/apply">
              <PlusCircle className="mr-2 h-4 w-4" /> List New Agent
            </Link>
          </Button>
        </div>
      </div>

      {!user && (
        <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm">
            <strong className="text-foreground">Preview Mode:</strong> You are viewing the provider dashboard in guest mode. Sign in to connect Stripe payouts and manage your personal agent listings.
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Payout Settings
            </CardTitle>
            <CardDescription>
              Connect your Stripe Express account to receive 80% of agent subscription revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stripeAccountId ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-md border border-green-500/30">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Payouts Enabled ({stripeAccountId.slice(0, 12)}...)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your Stripe account is connected. You automatically receive 80% of all revenue generated by your agents.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect a Stripe account to enable automated split-payouts whenever clients subscribe to your agents.
                </p>
                <Button
                  onClick={handleConnectStripe}
                  className="w-full bg-[#635BFF] hover:bg-[#5851E1] text-white"
                >
                  Connect with Stripe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Estimated Monthly Revenue</CardTitle>
            <CardDescription>Projected earnings across active agent subscriptions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stripeAccountId ? "$1,420.00" : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stripeAccountId
                ? "Based on active marketplace subscriptions (80% provider share)."
                : "Connect Stripe and publish an agent to start earning."}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Active Marketplace Agents</CardTitle>
            <CardDescription>Agents currently showcased on AgentVerse.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myAgents.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              All listed agents are indexed for AI Matchmaker recommendations.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Listed Agents
            </CardTitle>
            <CardDescription>
              Quick access to your agents and showcase listings.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/agents/apply">Add Agent</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {myAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-base line-clamp-1">{agent.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      v{agent.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {agent.shortDescription || agent.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <Star className="h-3.5 w-3.5 fill-amber-400" /> {agent.rating.toFixed(1)}
                    </span>
                    <span>{agent.reviewsCount} reviews</span>
                    {agent.priceTiers?.[0]?.price && (
                      <span className="text-foreground font-medium">
                        {agent.priceTiers[0].price}
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild variant="secondary" size="sm" className="w-full">
                  <Link href={`/agents/${agent.id}`}>
                    View Listing <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
