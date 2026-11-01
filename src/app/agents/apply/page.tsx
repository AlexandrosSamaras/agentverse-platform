"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AvailableSkills,
  AutonomyLevelValues,
  DeploymentModelValues,
  InteractionStyleValues,
  type AutonomyLevel,
  type DeploymentModel,
  type InteractionStyle,
} from "@/types";
import { useAuth } from "@/components/providers/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { isSafeHttpUrl, sanitizePlainText } from "@/lib/security";
import { BotMessageSquare, CheckCircle, Rocket, Loader2, ShieldCheck, DollarSign, Cpu } from "lucide-react";

export default function ListAgentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState(user?.displayName || "");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [primaryFunction, setPrimaryFunction] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [customCapabilities, setCustomCapabilities] = useState("");
  const [targetIndustries, setTargetIndustries] = useState("Technology, E-commerce, SaaS");
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("Workflow Automation");
  const [deploymentModel, setDeploymentModel] = useState<DeploymentModel>("SaaS");
  const [interactionStyle, setInteractionStyle] = useState<InteractionStyle>("Conversational (Text)");
  const [underlyingModels, setUnderlyingModels] = useState("Gemini 2.0 Flash, GPT-4o");
  const [techStack, setTechStack] = useState("Python, TypeScript, Next.js");
  const [pricingModel, setPricingModel] = useState("Subscription (Monthly)");
  const [startingPrice, setStartingPrice] = useState("$99/mo");
  const [tierFeatures, setTierFeatures] = useState("Unlimited API requests, 24/7 autonomous execution, Priority support");
  const [documentationLink, setDocumentationLink] = useState("");
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCapability = (cap: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((item) => item !== cap) : [...prev, cap]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !developer.trim() || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Required Fields",
        description: "Please provide at least the Agent Name, Developer/Company Name, and Detailed Description.",
      });
      return;
    }

    const extraCaps = customCapabilities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const allCapabilities = Array.from(new Set([...selectedCapabilities, ...extraCaps]));

    if (allCapabilities.length === 0) {
      toast({
        variant: "destructive",
        title: "Capabilities Required",
        description: "Please select or enter at least one capability for your AI agent.",
      });
      return;
    }

    if (documentationLink.trim() && !isSafeHttpUrl(documentationLink.trim())) {
      toast({
        variant: "destructive",
        title: "Invalid Documentation URL",
        description: "Documentation link must be a valid https:// or http:// URL.",
      });
      return;
    }

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();

    const newAgentData = {
      name: sanitizePlainText(name, 100),
      developer: sanitizePlainText(developer, 100),
      developerId: user?.uid || "community-provider",
      shortDescription: sanitizePlainText(shortDescription.trim() || description.trim().slice(0, 120), 160),
      description: sanitizePlainText(description, 2500),
      primaryFunction: sanitizePlainText(primaryFunction.trim() || allCapabilities[0], 120),
      capabilities: allCapabilities.map((c) => sanitizePlainText(c, 60)).filter(Boolean),
      tags: allCapabilities.slice(0, 6).map((c) => sanitizePlainText(c, 40)).filter(Boolean),
      targetIndustry: targetIndustries
        .split(",")
        .map((s) => sanitizePlainText(s, 50))
        .filter(Boolean),
      autonomyLevel,
      deploymentModel: [deploymentModel],
      interactionStyle: [interactionStyle],
      underlyingModels: underlyingModels
        .split(",")
        .map((s) => sanitizePlainText(s, 60))
        .filter(Boolean),
      techStack: techStack
        .split(",")
        .map((s) => sanitizePlainText(s, 60))
        .filter(Boolean),
      pricingModel: sanitizePlainText(pricingModel.trim() || "Subscription", 60),
      priceTiers: [
        {
          name: "Standard Plan",
          price: sanitizePlainText(startingPrice.trim() || "$99/mo", 40),
          description: "Full access to agent capabilities and standard integrations.",
          features: tierFeatures
            .split(",")
            .map((s) => sanitizePlainText(s, 100))
            .filter(Boolean),
        },
      ],
      freeTrialAvailable,
      freeTrialDetails: freeTrialAvailable ? "14-day free trial included" : undefined,
      documentationLink: isSafeHttpUrl(documentationLink.trim())
        ? documentationLink.trim()
        : "https://docs.agentverse.ai",
      avatarUrl: "https://placehold.co/100x100.png",
      dataAiHint: "robot avatar",
      verified: false,
      version: "1.0.0",
      dateListed: nowIso,
      lastUpdated: nowIso,
      rating: 5.0,
      reviewsCount: 1,
    };

    try {
      const docRef = await addDoc(collection(db, "agents"), newAgentData);
      toast({
        title: "Agent Published to AgentVerse!",
        description: `${newAgentData.name} is now live on the marketplace.`,
      });
      router.push(`/agents/${docRef.id}`);
    } catch (error) {
      console.error("Error publishing agent:", error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Could not save to Firestore. Check your Firebase permissions or connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Publish Your AI Agent"
        description="List your autonomous agent or AI workflow on the AgentVerse marketplace and start reaching global clients."
      />

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BotMessageSquare className="h-7 w-7 text-primary" />
              Agent Listing Application
            </CardTitle>
            <CardDescription>
              Complete the profile below to publish your AI agent directly to the AgentVerse catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name *</Label>
                  <Input
                    id="agent-name"
                    placeholder="e.g., InsightBot Pro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="developer-name">Developer / Organization *</Label>
                  <Input
                    id="developer-name"
                    placeholder="e.g., FutureAI Corp"
                    value={developer}
                    onChange={(e) => setDeveloper(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="short-desc">Short Tagline *</Label>
                  <Input
                    id="short-desc"
                    placeholder="Concise one-line value proposition..."
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-fn">Primary Function *</Label>
                  <Input
                    id="primary-fn"
                    placeholder="e.g., Automated Code Review & QA"
                    value={primaryFunction}
                    onChange={(e) => setPrimaryFunction(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-desc">Detailed Agent Description *</Label>
                <Textarea
                  id="full-desc"
                  rows={5}
                  placeholder="Explain how your agent works, what problems it solves, its architecture, and typical results..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base">Core Capabilities *</Label>
                <p className="text-xs text-muted-foreground">
                  Select all capabilities that apply to your agent.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-3 border rounded-md bg-muted/20">
                  {AvailableSkills.slice(0, 18).map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cap-${skill}`}
                        checked={selectedCapabilities.includes(skill)}
                        onCheckedChange={() => toggleCapability(skill)}
                      />
                      <label
                        htmlFor={`cap-${skill}`}
                        className="text-xs font-medium leading-none cursor-pointer"
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
                <Input
                  placeholder="Additional custom capabilities (comma-separated)..."
                  value={customCapabilities}
                  onChange={(e) => setCustomCapabilities(e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Autonomy Level</Label>
                  <Select
                    value={autonomyLevel}
                    onValueChange={(v) => setAutonomyLevel(v as AutonomyLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AutonomyLevelValues.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Deployment Model</Label>
                  <Select
                    value={deploymentModel}
                    onValueChange={(v) => setDeploymentModel(v as DeploymentModel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DeploymentModelValues.map((dep) => (
                        <SelectItem key={dep} value={dep}>
                          {dep}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interaction Style</Label>
                  <Select
                    value={interactionStyle}
                    onValueChange={(v) => setInteractionStyle(v as InteractionStyle)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {InteractionStyleValues.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label htmlFor="models" className="flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-primary" /> Underlying Models
                  </Label>
                  <Input
                    id="models"
                    placeholder="e.g., Gemini 2.0 Flash, Claude 3.7, Custom RAG"
                    value={underlyingModels}
                    onChange={(e) => setUnderlyingModels(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tech-stack">Tech Stack & Integrations</Label>
                  <Input
                    id="tech-stack"
                    placeholder="e.g., Python, LangChain, Slack API, GitHub"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industries">Target Industries (comma-separated)</Label>
                  <Input
                    id="industries"
                    placeholder="e.g., FinTech, E-commerce, Healthcare"
                    value={targetIndustries}
                    onChange={(e) => setTargetIndustries(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docs-link">Documentation / Demo URL</Label>
                  <Input
                    id="docs-link"
                    type="url"
                    placeholder="https://docs.youragent.ai"
                    value={documentationLink}
                    onChange={(e) => setDocumentationLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-primary" /> Pricing & Plan Configuration
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricing-model">Pricing Model</Label>
                    <Input
                      id="pricing-model"
                      placeholder="e.g., Subscription, Usage-based, Per Seat"
                      value={pricingModel}
                      onChange={(e) => setPricingModel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="starting-price">Standard Tier Price *</Label>
                    <Input
                      id="starting-price"
                      placeholder="e.g., $99/mo or $0.05/call"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier-features">Included Features (comma-separated)</Label>
                  <Input
                    id="tier-features"
                    placeholder="Unlimited runs, API access, Slack integration, 99.9% SLA"
                    value={tierFeatures}
                    onChange={(e) => setTierFeatures(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free-trial"
                    checked={freeTrialAvailable}
                    onCheckedChange={(checked) => setFreeTrialAvailable(Boolean(checked))}
                  />
                  <label htmlFor="free-trial" className="text-sm cursor-pointer">
                    Offer a 14-day free trial to prospective clients
                  </label>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publishing Agent...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" /> Publish Agent to Marketplace
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="bg-muted/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Why List with AgentVerse?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">Instant AI Matchmaking:</strong> Your agent is indexed by our Gemini-powered recommendation engine to match incoming business queries.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">Stripe Connect Payouts:</strong> Receive 80% of all subscription and project revenue directly to your bank account.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-foreground">Verified Badge & Reviews:</strong> Build trust with verified customer reviews, benchmark links, and SLA transparency.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Enterprise Onboarding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Need custom SLA terms, private cloud deployment verification, or bulk agent onboarding?
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="mailto:partnerships@agentverse.com?subject=Enterprise%20Agent%20Listing">
                  Contact Partnerships Team
                </a>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
