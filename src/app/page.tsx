"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { mockAgents } from '@/data/mock';
import type { Agent } from '@/types';
import { AutonomyLevelValues } from '@/types';
import { AgentCard } from '@/components/agents/AgentCard';
import { PageTitle } from '@/components/shared/PageTitle';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  BrainCircuit,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  RotateCcw,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ALL_CAPABILITIES_VALUE = "__ALL_CAPABILITIES__";
const ALL_INDUSTRIES_VALUE = "__ALL_INDUSTRIES__";
const ALL_AUTONOMY_LEVELS_VALUE = "__ALL_AUTONOMY_LEVELS__";

const trustedNames = [
  "Nvidia", "Anthropic", "Microsoft", "OpenAI", "Google", "Meta",
  "Databricks", "Hugging Face", "Salesforce", "Glean", "Ema",
  "Perplexity", "LangChain", "Adept AI", "Inflection AI"
];

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCapability, setSelectedCapability] = useState(ALL_CAPABILITIES_VALUE);
  const [selectedIndustry, setSelectedIndustry] = useState(ALL_INDUSTRIES_VALUE);
  const [selectedAutonomyLevel, setSelectedAutonomyLevel] = useState(ALL_AUTONOMY_LEVELS_VALUE);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "agents"));
        const firestoreAgents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
        if (firestoreAgents.length > 0) {
          // Merge Firestore agents with mockAgents so user-created agents appear alongside the rich catalog
          const mergedMap = new Map<string, Agent>();
          mockAgents.forEach(a => mergedMap.set(a.id, a));
          firestoreAgents.forEach(a => mergedMap.set(a.id, a));
          setAgents(Array.from(mergedMap.values()));
        }
      } catch (error) {
        console.warn("Using mockAgents catalog fallback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const allCapabilities = useMemo(
    () => Array.from(new Set(agents.flatMap(agent => agent.capabilities || []))).sort(),
    [agents]
  );
  const allIndustries = useMemo(
    () => Array.from(new Set(agents.flatMap(agent => agent.targetIndustry || []))).sort(),
    [agents]
  );

  const featuredAgents = useMemo(
    () => agents.filter(agent => agent.rating >= 4.6).slice(0, 3),
    [agents]
  );

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      if (!agent) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (agent.name?.toLowerCase() || '').includes(searchLower) ||
        (agent.description?.toLowerCase() || '').includes(searchLower) ||
        (agent.developer?.toLowerCase() || '').includes(searchLower) ||
        (agent.tags || []).some(tag => tag.toLowerCase().includes(searchLower));

      const matchesCapability =
        selectedCapability === ALL_CAPABILITIES_VALUE
          ? true
          : (agent.capabilities || []).includes(selectedCapability);

      const agentIndustries = agent.targetIndustry || [];
      const matchesIndustry =
        selectedIndustry === ALL_INDUSTRIES_VALUE
          ? true
          : agentIndustries.includes(selectedIndustry);

      const matchesAutonomyLevel =
        selectedAutonomyLevel === ALL_AUTONOMY_LEVELS_VALUE
          ? true
          : agent.autonomyLevel === selectedAutonomyLevel;

      return matchesSearch && matchesCapability && matchesIndustry && matchesAutonomyLevel;
    });
  }, [agents, searchTerm, selectedCapability, selectedIndustry, selectedAutonomyLevel]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCapability !== ALL_CAPABILITIES_VALUE ||
    selectedIndustry !== ALL_INDUSTRIES_VALUE ||
    selectedAutonomyLevel !== ALL_AUTONOMY_LEVELS_VALUE;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCapability(ALL_CAPABILITIES_VALUE);
    setSelectedIndustry(ALL_INDUSTRIES_VALUE);
    setSelectedAutonomyLevel(ALL_AUTONOMY_LEVELS_VALUE);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>The Digital Workforce Marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Hire Autonomous{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                AI Agents
              </span>{' '}
              for Every Workflow
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Discover, evaluate, and deploy verified AI agents across data analytics, software engineering, customer operations, and research—or monetize the agents you build.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/#agent-listing-section"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-3px_var(--primary-glow)]"
                )}
              >
                Explore Marketplace <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/recommendations"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-primary/40 hover:border-primary")}
              >
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                AI Agent Matchmaker
              </Link>
              <Link
                href="/agents/apply"
                className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
              >
                <Bot className="mr-2 h-4 w-4" />
                List Your Agent
              </Link>
            </div>

            {/* Key Platform Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto">
              <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{agents.length}+</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Curated AI Agents
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{allCapabilities.length}+</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-accent" /> Specialized Skills
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{allIndustries.length}+</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-primary" /> Target Industries
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">99.9%</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <BrainCircuit className="h-3.5 w-3.5 text-accent" /> Enterprise SLA Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section - Rolling Carousel */}
      <section className="py-10 bg-muted/20 border-y border-border/40 overflow-hidden my-6">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            Built for Modern AI Ecosystems & Enterprise Stacks
          </h2>
          <div className="relative flex overflow-x-hidden group">
            <div className="animate-marquee whitespace-nowrap flex group-hover:pause">
              {trustedNames.concat(trustedNames).map((name, index) => (
                <span key={`${name}-${index}`} className="text-lg sm:text-xl font-semibold text-muted-foreground/60 mx-6 sm:mx-8">
                  {name}
                </span>
              ))}
            </div>
            <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex group-hover:pause">
              {trustedNames.concat(trustedNames).map((name, index) => (
                <span key={`${name}-${index}-R2`} className="text-lg sm:text-xl font-semibold text-muted-foreground/60 mx-6 sm:mx-8">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Agents Section */}
      {featuredAgents.length > 0 && (
        <section id="featured-agents-section" className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <PageTitle
              title="Featured Digital Employees"
              description="Top-rated autonomous agents verified for accuracy, security, and enterprise integration."
              className="text-center mb-10"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Separator className="my-8 md:my-12" />

      {/* Agent Listing Section */}
      <section id="agent-listing-section" className="py-12 md:py-16 scroll-mt-16">
        <div className="container mx-auto px-4">
          <PageTitle
            title="Discover AI Agents"
            description="Filter by capability, industry, or autonomy level to find the right agent for your team."
            className="text-center mb-10"
          />

          <Card className="mb-8 shadow-md border-border/60">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
                <div className="lg:col-span-1">
                  <label htmlFor="search-agents" className="block text-sm font-medium text-foreground mb-1.5">
                    Search Agents
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-agents"
                      type="text"
                      placeholder="Name, developer, tag..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="filter-capability" className="block text-sm font-medium text-foreground mb-1.5">
                    Filter by Capability
                  </label>
                  <Select value={selectedCapability} onValueChange={setSelectedCapability}>
                    <SelectTrigger id="filter-capability" className="w-full">
                      <SelectValue placeholder="All Capabilities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_CAPABILITIES_VALUE}>All Capabilities</SelectItem>
                      {allCapabilities.map(cap => (
                        <SelectItem key={cap} value={cap}>{cap}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="filter-industry" className="block text-sm font-medium text-foreground mb-1.5">
                    Filter by Industry
                  </label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger id="filter-industry" className="w-full">
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_INDUSTRIES_VALUE}>All Industries</SelectItem>
                      {allIndustries.map(ind => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="filter-autonomy" className="block text-sm font-medium text-foreground mb-1.5">
                    Filter by Autonomy
                  </label>
                  <Select value={selectedAutonomyLevel} onValueChange={setSelectedAutonomyLevel}>
                    <SelectTrigger id="filter-autonomy" className="w-full">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="All Autonomy Levels" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_AUTONOMY_LEVELS_VALUE}>All Autonomy Levels</SelectItem>
                      {AutonomyLevelValues.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <strong className="text-foreground">{filteredAgents.length}</strong> of{' '}
                    <strong className="text-foreground">{agents.length}</strong> agents
                  </span>
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-xl bg-card/30">
              <Filter className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Matching Agents Found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                No agents matched your current filter combination. Try broadening your search criteria or resetting filters.
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
                <RotateCcw className="mr-2 h-4 w-4" /> Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
