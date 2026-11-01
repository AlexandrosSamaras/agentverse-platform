"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { mockJobRequests } from '@/data/mock';
import type { JobRequest } from '@/types';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AgentRating } from '@/components/agents/AgentRating';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Building2,
  Tag,
  DollarSign,
  CalendarDays,
  Sparkles,
  Cpu,
  Award,
  Handshake,
  CalendarClock,
  Mail,
  MessageSquare,
  ThumbsUp,
  Settings2,
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/AuthContext';
import { sanitizePlainText } from '@/lib/security';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [job, setJob] = useState<JobRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  // Apply modal state
  const [applyOpen, setApplyOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Contact modal state
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [isContacting, setIsContacting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      let foundJob: JobRequest | null = mockJobRequests.find(j => j.id === jobId) || null;
      try {
        const jobDoc = await getDoc(doc(db, "jobs", jobId));
        if (jobDoc.exists()) {
          foundJob = { id: jobDoc.id, ...jobDoc.data() } as JobRequest;
        }
      } catch (err) {
        console.warn("Using mockJobRequests fallback for job detail:", err);
      } finally {
        setJob(foundJob);
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !agentName.trim() || !coverLetter.trim()) return;
    setIsApplying(true);

    try {
      await addDoc(collection(db, "jobApplications"), {
        jobId: job.id,
        projectTitle: job.projectTitle,
        companyName: job.companyName,
        applicantId: user?.uid || "guest",
        applicantEmail: user?.email || "guest",
        agentName: sanitizePlainText(agentName, 120),
        proposedRate: sanitizePlainText(proposedRate, 80),
        coverLetter: sanitizePlainText(coverLetter, 2000),
        submittedAt: new Date().toISOString(),
      }).catch(() => {});

      setHasApplied(true);
      setApplyOpen(false);
      toast({
        title: "Proposal Submitted!",
        description: `Your application with ${agentName} has been sent to ${job.companyName}.`,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !contactMessage.trim()) return;
    setIsContacting(true);

    try {
      await addDoc(collection(db, "jobInquiries"), {
        jobId: job.id,
        companyName: job.companyName,
        senderEmail: user?.email || "guest",
        message: sanitizePlainText(contactMessage, 2000),
        sentAt: new Date().toISOString(),
      }).catch(() => {});

      setContactOpen(false);
      setContactMessage("");
      toast({
        title: "Message Sent",
        description: `Your message has been forwarded to ${job.companyName} (${job.contactEmail}).`,
      });
    } finally {
      setIsContacting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Job Request Not Found</h2>
        <p className="text-muted-foreground">This job posting may have been closed or removed.</p>
        <Button asChild variant="outline">
          <Link href="/jobs"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/jobs">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Job Board
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl overflow-hidden border-border/60">
        <CardHeader className="bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {job.companyLogoUrl && (
              <Image
                src={job.companyLogoUrl}
                alt={`${job.companyName} logo`}
                width={96}
                height={96}
                className="rounded-xl border-2 border-primary/20 shadow-md shrink-0"
                data-ai-hint={job.dataAiHintCompanyLogo || 'company logo'}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>{job.status}</Badge>
                {job.budgetCategory && <Badge variant="outline">{job.budgetCategory}</Badge>}
              </div>
              <PageTitle title={job.projectTitle} className="mb-2" />
              <div className="flex items-center gap-2 text-lg text-muted-foreground mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">{job.companyName}</span>
              </div>
              {job.companyRating && (
                <div className="flex items-center space-x-2">
                  <AgentRating rating={job.companyRating} starSize={16} />
                  <span className="text-sm text-muted-foreground">({job.companyRating.toFixed(1)} client rating)</span>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2.5 w-full md:w-auto md:items-end shrink-0">
              <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="w-full md:w-52 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_-3px_var(--primary-glow)]"
                    disabled={hasApplied}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Proposal Sent
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="mr-2 h-5 w-5" /> Apply with Agent
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Apply for {job.projectTitle}</DialogTitle>
                    <DialogDescription>
                      Submit your AI agent or custom automation proposal to {job.companyName}.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleApplySubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Agent Name / Solution Title</label>
                      <Input
                        placeholder="e.g., SalesFlow Autonomous Qualifier v2"
                        required
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Proposed Budget / Rate</label>
                      <Input
                        placeholder={`Client budget: ${job.budget}`}
                        required
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Integration Plan & Capabilities Pitch</label>
                      <Textarea
                        placeholder="Explain how your agent meets the required skills, tech stack, and desired autonomy level..."
                        rows={5}
                        required
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setApplyOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isApplying}>
                        <Send className="mr-2 h-4 w-4" />
                        {isApplying ? "Submitting..." : "Submit Proposal"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full md:w-52">
                    <MessageSquare className="mr-2 h-5 w-5" /> Contact Client
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contact {job.companyName}</DialogTitle>
                    <DialogDescription>
                      Ask clarifying questions about project scope, data formats, or timeline before submitting a proposal.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleContactSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Your Question</label>
                      <Textarea
                        placeholder="Write your message to the hiring team..."
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setContactOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isContacting}>
                        <Send className="mr-2 h-4 w-4" />
                        {isContacting ? "Sending..." : "Send Message"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Project Description</h3>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{job.projectDescription}</p>
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Agent Benefits</h3>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {job.agentBenefits || "Opportunity for long-term deployment and recurring licensing revenue."}
              </p>
            </section>
            <Separator />
            <section>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(job.requiredSkills || []).map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
              </div>
            </section>
            {job.projectTechStack && job.projectTechStack.length > 0 && (
              <>
                <Separator />
                <section>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> Project Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.projectTechStack.map(tech => <Badge key={tech} variant="outline">{tech}</Badge>)}
                  </div>
                </section>
              </>
            )}
            {job.desiredAutonomyLevel && (
              <>
                <Separator />
                <section>
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> Desired Agent Autonomy</h3>
                  <Badge variant="secondary" className="text-sm">{job.desiredAutonomyLevel}</Badge>
                </section>
              </>
            )}
          </div>

          <aside className="space-y-6 md:border-l md:pl-6">
            <Card className="bg-muted/20">
              <CardHeader><CardTitle className="text-lg">Job Details</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-primary" />Budget:</span>
                  <span className="text-right font-semibold">{job.budget}</span>
                </div>
                {job.duration && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" />Duration:</span>
                    <span className="text-right">{job.duration}</span>
                  </div>
                )}
                {job.postedDate && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" />Posted:</span>
                    <span className="text-right">{format(new Date(job.postedDate), "PPP")}</span>
                  </div>
                )}
                {job.preferredOnboardingDate && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-primary" />Ideal Start:</span>
                    <span className="text-right">{format(new Date(job.preferredOnboardingDate), "PPP")}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary" />Contact:</span>
                  <a href={`mailto:${job.contactEmail}`} className="text-right text-primary hover:underline truncate">{job.contactEmail}</a>
                </div>
              </CardContent>
            </Card>
          </aside>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-border/60">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" /> About {job.companyName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-md flex items-center gap-1.5"><Handshake className="h-5 w-5 text-primary" /> Work Style</h4>
              <Badge variant="outline" className="text-sm">{job.companyWorkStyle || "Flexible Collaboration"}</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-md flex items-center gap-1.5"><Award className="h-5 w-5 text-primary" /> Payment Summary</h4>
              <p className="text-sm text-muted-foreground">{job.companyPaymentHistorySummary || "Verified client on AgentVerse."}</p>
            </div>
          </div>

          {job.companyTestimonials && job.companyTestimonials.length > 0 ? (
            <div>
              <Separator className="my-6" />
              <h4 className="text-xl font-semibold mb-4">Company Testimonials</h4>
              <div className="space-y-4">
                {job.companyTestimonials.map((testimonial, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="p-4">
                      <blockquote className="text-sm italic text-foreground">&ldquo;{testimonial.testimonial}&rdquo;</blockquote>
                      <p className="text-xs text-muted-foreground mt-2 text-right">
                        — {testimonial.reviewerName} (Project: {testimonial.projectName}, {format(new Date(testimonial.date), "MMM yyyy")})
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Separator className="my-6" />
              <p className="text-sm text-muted-foreground text-center py-2">No testimonials available for this company yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
