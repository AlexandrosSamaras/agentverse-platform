"use client";

import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { mockAgents, mockReviews } from '@/data/mock';
import type { Agent, Review } from '@/types';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AgentRating } from '@/components/agents/AgentRating';
import { AgentSandboxConsole } from '@/components/agents/AgentSandboxConsole';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  Briefcase, DollarSign, MessageSquare, Download, Layers, ShieldCheck, CalendarDays, Zap, BarChart3, Users, Edit, Star, BrainCircuit,
  Share2, Terminal, Info, SearchCheck, BookOpen, Handshake, LinkIcon, CheckCircle, Award, Loader2, ArrowLeft, Send
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, Suspense } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthContext";
import { isSafeHttpUrl, sanitizePlainText } from "@/lib/security";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a star rating").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(500, "Comment must be less than 500 characters."),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

function AgentProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const agentId = params.id as string;

  const checkoutSuccess = searchParams.get("success") === "true";
  const checkoutCanceled = searchParams.get("canceled") === "true";

  const [currentRating, setCurrentRating] = useState(0);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHiring, setIsHiring] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Contact dialog state
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const fetchAgentAndReviews = async () => {
      let foundAgent: Agent | null = mockAgents.find(a => a.id === agentId) || null;
      let loadedReviews: Review[] = mockReviews.filter(r => r.agentId === agentId);

      try {
        const agentDoc = await getDoc(doc(db, "agents", agentId));
        if (agentDoc.exists()) {
          foundAgent = { id: agentDoc.id, ...agentDoc.data() } as Agent;
        }

        const reviewsQuery = query(collection(db, "reviews"), where("agentId", "==", agentId));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const firestoreReviews = reviewsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        if (firestoreReviews.length > 0) {
          const mergedMap = new Map<string, Review>();
          loadedReviews.forEach(r => mergedMap.set(r.id, r));
          firestoreReviews.forEach(r => mergedMap.set(r.id, r));
          loadedReviews = Array.from(mergedMap.values());
        }
      } catch (error) {
        console.warn("Using mock data fallback for agent details:", error);
      } finally {
        setAgent(foundAgent);
        setReviews(loadedReviews);
        setLoading(false);
      }
    };

    fetchAgentAndReviews();
  }, [agentId]);

  const handleHire = async () => {
    if (!agent) return;
    setIsHiring(true);

    try {
      let price = 100;
      if (agent.priceTiers && agent.priceTiers.length > 0) {
        const priceString = agent.priceTiers[0].price;
        const match = priceString.match(/\$(\d+)/);
        if (match) {
          price = parseInt(match[1], 10);
        }
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          price: price,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate checkout");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message || "Could not start Stripe checkout session.",
      });
    } finally {
      setIsHiring(false);
    }
  };

  const handleSendProviderMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setIsSendingMessage(true);

    try {
      await addDoc(collection(db, "inquiries"), {
        agentId: agent?.id,
        agentName: agent?.name,
        developer: agent?.developer,
        senderId: user?.uid || "anonymous",
        senderEmail: user?.email || "anonymous",
        subject: sanitizePlainText(contactSubject || `Inquiry regarding ${agent?.name}`, 200),
        message: sanitizePlainText(contactMessage, 2000),
        createdAt: new Date().toISOString(),
      }).catch(() => {});

      toast({
        title: "Message Sent",
        description: `Your inquiry has been sent to ${agent?.developer}. They will respond via email shortly.`,
      });
      setContactSubject("");
      setContactMessage("");
      setContactOpen(false);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const handleReviewSubmit = async (data: ReviewFormData) => {
    if (!agent) return;
    setIsSubmittingReview(true);

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      agentId: agent.id,
      userId: user?.uid || "guest",
      userName: sanitizePlainText(user?.displayName || user?.email?.split("@")[0] || "Verified User", 80),
      userAvatarUrl: user?.photoURL || undefined,
      rating: data.rating,
      comment: sanitizePlainText(data.comment, 500),
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "reviews"), newReview).catch(() => {});
      setReviews(prev => [newReview, ...prev]);
      toast({
        title: "Review Published",
        description: "Thank you for sharing your feedback on this AI agent!",
      });
      reviewForm.reset();
      setCurrentRating(0);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Agent Not Found</h2>
        <p className="text-muted-foreground">The AI agent you are looking for does not exist or has been removed.</p>
        <Button asChild variant="outline">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const lastUpdatedFormatted = agent.lastUpdated ? new Date(agent.lastUpdated).toLocaleDateString() : null;
  const dateListedFormatted = agent.dateListed ? new Date(agent.dateListed).toLocaleDateString() : null;

  const renderList = (items?: string[], emptyText: string = "Not specified") => {
    if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    return (
      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    );
  };

  const renderBadges = (items?: string[], variant: "default" | "secondary" | "outline" | "destructive" | "success" = "outline", emptyText: string = "Not specified") => {
    if (!items || items.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map(item => <Badge key={item} variant={variant} size="sm">{item}</Badge>)}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/#agent-listing-section">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Agents
          </Link>
        </Button>
      </div>

      {checkoutSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10 text-foreground">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <AlertTitle className="font-semibold text-green-400">Agent Successfully Hired!</AlertTitle>
          <AlertDescription>
            Your payment for <strong>{agent.name}</strong> has been processed. Deployment credentials and onboarding instructions have been sent to your account.
          </AlertDescription>
        </Alert>
      )}

      {checkoutCanceled && (
        <Alert variant="destructive">
          <Info className="h-5 w-5" />
          <AlertTitle>Checkout Canceled</AlertTitle>
          <AlertDescription>
            Your checkout session was canceled. No charges were made. You can hire this agent whenever you&apos;re ready.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-xl overflow-hidden border-border/60">
        <CardHeader className="bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {agent.avatarUrl && (
              <Image
                src={agent.avatarUrl}
                alt={`${agent.name} avatar`}
                width={120}
                height={120}
                className="rounded-xl border-2 border-primary/30 shadow-md shrink-0"
                data-ai-hint={agent.dataAiHint || 'abstract technology'}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{agent.name}</h1>
                {agent.verified && (
                  <Badge variant="outline" className="border-primary/40 text-primary flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">Developed by <strong className="text-foreground">{agent.developer}</strong></p>
              {agent.shortDescription && <p className="text-sm font-medium text-foreground/90 mb-2">{agent.shortDescription}</p>}
              <div className="flex items-center space-x-2 mb-3">
                <AgentRating rating={agent.rating} starSize={18} />
                <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{agent.description}</p>
              {agent.tags && agent.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {agent.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="capitalize">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2.5 w-full md:w-auto md:items-end mt-4 md:mt-0 shrink-0">
              <Button
                size="lg"
                className="w-full md:w-52 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_-3px_var(--primary-glow)]"
                onClick={handleHire}
                disabled={isHiring}
              >
                {isHiring ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" /> Hire Agent
                  </>
                )}
              </Button>

              <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full md:w-52">
                    <MessageSquare className="mr-2 h-5 w-5" /> Contact Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Message {agent.developer}</DialogTitle>
                    <DialogDescription>
                      Have questions about custom integrations, enterprise pricing, or SLAs for {agent.name}? Send a direct inquiry.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSendProviderMessage} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder={`Inquiry about ${agent.name}`}
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="Describe your use case, integration needs, or questions..."
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setContactOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSendingMessage}>
                        <Send className="mr-2 h-4 w-4" />
                        {isSendingMessage ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {isSafeHttpUrl(agent.documentationLink) && (
                <Button asChild variant="ghost" size="sm" className="w-full md:w-52 justify-center">
                  <a href={agent.documentationLink} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> View Documentation
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-x-8 gap-y-6">
          {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Functional Capabilities</h3>
              {agent.primaryFunction && <p className="text-sm text-muted-foreground mb-2"><strong className="text-foreground">Primary Function:</strong> {agent.primaryFunction}</p>}
              {agent.specificSubTasks && agent.specificSubTasks.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Specific Sub-Tasks:</strong> {renderList(agent.specificSubTasks)}</div>}
              <strong className="text-sm text-foreground">Core Capabilities:</strong> {renderList(agent.capabilities, "Core capabilities not specified.")}
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Use Cases & Target Audience</h3>
              {agent.intendedUseCases && agent.intendedUseCases.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Intended Use Cases:</strong> {renderList(agent.intendedUseCases)}</div>}
              {agent.targetIndustry && agent.targetIndustry.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Target Industries:</strong> {renderBadges(agent.targetIndustry, "outline")}</div>}
              {agent.targetBusinessSize && agent.targetBusinessSize.length > 0 && <div><strong className="text-sm text-foreground">Target Business Sizes:</strong> {renderBadges(agent.targetBusinessSize, "outline")}</div>}
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Proven Impact
              </h3>
              {agent.caseStudies && agent.caseStudies.length > 0 ? (
                <ul className="space-y-4">
                  {agent.caseStudies.map((study, index) => (
                    <li key={index} className="p-4 border rounded-md bg-card shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-sm text-foreground leading-relaxed">{study.description}</p>
                      {isSafeHttpUrl(study.link) && (
                        <a href={study.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1.5 inline-flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          Learn More
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific case studies or examples of prior work provided for this agent.</p>
              )}
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Operational Details</h3>
              {agent.autonomyLevel && <p className="text-sm text-muted-foreground mb-2"><strong className="text-foreground">Autonomy Level:</strong> <Badge variant="secondary">{agent.autonomyLevel}</Badge></p>}
              {agent.interactionStyle && agent.interactionStyle.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Interaction Styles:</strong> {renderBadges(agent.interactionStyle, "secondary")}</div>}
              {agent.decisionMakingCapabilities && agent.decisionMakingCapabilities.length > 0 && <div><strong className="text-sm text-foreground">Decision-Making Capabilities:</strong> {renderList(agent.decisionMakingCapabilities)}</div>}
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" /> Technical Specifications</h3>
              {agent.underlyingAiTechnologies && agent.underlyingAiTechnologies.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Underlying AI Tech:</strong> {renderBadges(agent.underlyingAiTechnologies)}</div>}
              {agent.underlyingModels && agent.underlyingModels.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Core Models:</strong> {renderList(agent.underlyingModels)}</div>}
              {agent.techStack && agent.techStack.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Tech Stack:</strong> {renderBadges(agent.techStack, "outline")}</div>}
              {agent.inputDataFormats && agent.inputDataFormats.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Input Data Formats:</strong> {renderBadges(agent.inputDataFormats, "secondary")}</div>}
              {agent.outputDataFormats && agent.outputDataFormats.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Output Data Formats:</strong> {renderBadges(agent.outputDataFormats, "secondary")}</div>}
              {agent.languagesSupported && agent.languagesSupported.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Languages Supported:</strong> {renderBadges(agent.languagesSupported, "outline")}</div>}
              {agent.scalabilityInfo && <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Scalability:</strong> {agent.scalabilityInfo}</p>}
              {agent.computationalRequirements && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Computational Requirements:</strong> {agent.computationalRequirements}</p>}
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><SearchCheck className="h-5 w-5 text-primary" /> Performance & Evaluation</h3>
              {agent.keyPerformanceMetrics && agent.keyPerformanceMetrics.length > 0 && (
                <div className="mb-2">
                  <strong className="text-sm text-foreground">Key Performance Metrics:</strong>
                  <ul className="list-none pl-0 mt-1 space-y-1.5">
                    {agent.keyPerformanceMetrics.map((kpm, i) => (
                      <li key={i} className="text-sm text-muted-foreground border-l-2 border-primary/50 pl-2">
                        <strong className="text-foreground/90">{kpm.metric}:</strong> {kpm.value}
                        {kpm.description && <span className="block text-xs text-muted-foreground/80 italic">({kpm.description})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {isSafeHttpUrl(agent.benchmarkingResultsLink) && <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Benchmarking:</strong> <a href={agent.benchmarkingResultsLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Results</a></p>}
              {agent.evaluationMethodology && <p className="text-sm text-muted-foreground mb-1"><strong className="text-foreground">Evaluation Methodology:</strong> {agent.evaluationMethodology}</p>}
              {agent.knownLimitationsBiases && agent.knownLimitationsBiases.length > 0 && <div className="mb-2"><strong className="text-sm text-foreground">Known Limitations/Biases:</strong> {renderList(agent.knownLimitationsBiases)}</div>}
              {agent.explainabilityFeatures && <p className="text-sm text-muted-foreground"><strong className="text-foreground">Explainability:</strong> {agent.explainabilityFeatures}</p>}
            </section>
          </div>

          {/* Sidebar Column */}
          <aside className="space-y-6 md:border-l md:pl-6">
            <Card className="bg-muted/20">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary" />Agent Overview</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" />Pricing:</span>
                  <span className="font-medium text-right">{agent.pricingModel || "Flexible"}</span>
                </div>
                {agent.priceTiers && agent.priceTiers.length > 0 && (
                  <div className="pt-1">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">Price Tiers:</span>
                    {agent.priceTiers.map(tier => (
                      <div key={tier.name} className="text-xs border p-2.5 rounded-md mb-2 bg-background/50">
                        <strong className="text-foreground block mb-1">{tier.name} — {tier.price}</strong>
                        <ul className="list-disc list-inside pl-1 text-muted-foreground/90 space-y-0.5">
                          {tier.features.map(f => <li key={f}>{f}</li>)}
                        </ul>
                        {tier.description && <p className="mt-1 text-muted-foreground/80">{tier.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {agent.freeTrialAvailable && <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />Free trial: {agent.freeTrialDetails || "Available"}</p>}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Layers className="h-4 w-4" />Version:</span>
                  <span>{agent.version}</span>
                </div>
                {dateListedFormatted && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Listed:</span>
                    <span>{dateListedFormatted}</span>
                  </div>
                )}
                {lastUpdatedFormatted && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Updated:</span>
                    <span>{lastUpdatedFormatted}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" />Integration & Deployment</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2.5">
                {agent.deploymentModel && agent.deploymentModel.length > 0 && <div><strong className="text-foreground block mb-1">Deployment Models:</strong> {renderBadges(agent.deploymentModel, "secondary")}</div>}
                {agent.integrations && agent.integrations.length > 0 && <div className="pt-1"><strong className="text-foreground block mb-1">Integrations:</strong> {renderBadges(agent.integrations, "secondary")}</div>}
                {agent.easeOfIntegration && <p><strong className="text-foreground">Ease of Integration:</strong> {agent.easeOfIntegration}</p>}
                {agent.typicalTimeToDeploy && <p><strong className="text-foreground">Typical Time to Deploy:</strong> {agent.typicalTimeToDeploy}</p>}
                {isSafeHttpUrl(agent.documentationLink) && <Button asChild variant="link" size="sm" className="p-0 h-auto"><a href={agent.documentationLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1"><BookOpen className="h-4 w-4" />View Documentation</a></Button>}
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" />Support & Maintenance</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2.5">
                {agent.supportChannels && agent.supportChannels.length > 0 && <div><strong className="text-foreground block mb-1">Support Channels:</strong> {renderBadges(agent.supportChannels, "outline")}</div>}
                {agent.supportHours && <p><strong className="text-foreground">Support Hours:</strong> {agent.supportHours}</p>}
                {agent.slas && <p><strong className="text-foreground">SLAs:</strong> {agent.slas}</p>}
                {agent.maintenanceUpdatePolicy && <p><strong className="text-foreground">Maintenance & Updates:</strong> {agent.maintenanceUpdatePolicy}</p>}
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Trust & Compliance</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2.5">
                {agent.dataSecurityPractices && agent.dataSecurityPractices.length > 0 && <div><strong className="text-foreground">Data Security:</strong> {renderList(agent.dataSecurityPractices)}</div>}
                {agent.securityCompliance && agent.securityCompliance.length > 0 && <div className="pt-1"><strong className="text-foreground block mb-1">Compliance:</strong> {renderBadges(agent.securityCompliance, "secondary")}</div>}
                {agent.ethicalGuidelinesAdherence && <p><strong className="text-foreground">Ethics:</strong> {agent.ethicalGuidelinesAdherence}</p>}
                {agent.transparencyMeasures && agent.transparencyMeasures.length > 0 && <div className="pt-1"><strong className="text-foreground">Transparency:</strong> {renderList(agent.transparencyMeasures)}</div>}
                {agent.biasMitigationEfforts && <p><strong className="text-foreground">Bias Mitigation:</strong> {agent.biasMitigationEfforts}</p>}
                {agent.auditability && <p><strong className="text-foreground">Auditability:</strong> {agent.auditability}</p>}
              </CardContent>
            </Card>
          </aside>
        </CardContent>
      </Card>

      {/* Interactive Agent Sandbox & Unified Control Plane */}
      <AgentSandboxConsole agent={agent} />

      <Card className="shadow-xl border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> User Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="flex space-x-4 border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                <UserAvatar src={review.userAvatarUrl} alt={review.userName} fallback={review.userName.substring(0, 1)} dataAiHint={review.dataAiHint} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{review.userName}</h4>
                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <AgentRating rating={review.rating} className="my-1" />
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No reviews yet for this agent. Be the first to leave one below!</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Edit className="h-6 w-6 text-primary" /> Leave a Review</CardTitle>
          <CardDescription>Share your experience working with {agent.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
              <FormField
                control={reviewForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Rating</FormLabel>
                    <FormControl>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <Star
                            key={starValue}
                            className={cn(
                              "h-7 w-7 cursor-pointer transition-colors",
                              currentRating >= starValue ? "text-accent fill-accent" : "text-muted-foreground/40 hover:text-accent/60"
                            )}
                            onClick={() => {
                              field.onChange(starValue);
                              setCurrentRating(starValue);
                            }}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reviewForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="comment">Your Review</FormLabel>
                    <FormControl>
                      <Textarea
                        id="comment"
                        placeholder="Tell us about accuracy, integration speed, and overall impact..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingReview}>
                {isSubmittingReview ? "Publishing..." : "Submit Review"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AgentProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AgentProfileContent />
    </Suspense>
  );
}
