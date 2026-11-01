"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { mockJobRequests } from '@/data/mock';
import type { JobRequest } from '@/types';
import { BudgetCategoryValues, AutonomyLevelValues } from '@/types';
import { JobCard } from '@/components/jobs/JobCard';
import { PageTitle } from '@/components/shared/PageTitle';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Briefcase, Code2, DollarSign, Settings2, PlusCircle, RotateCcw, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const ALL_SKILLS_VALUE = "__ALL_SKILLS__";
const ALL_TECH_STACKS_VALUE = "__ALL_TECH_STACKS__";
const ALL_BUDGET_CATEGORIES_VALUE = "__ALL_BUDGET_CATEGORIES__";
const ALL_AUTONOMY_LEVELS_VALUE = "__ALL_AUTONOMY_LEVELS__";

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<JobRequest[]>(mockJobRequests);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(ALL_SKILLS_VALUE);
  const [selectedTechStack, setSelectedTechStack] = useState(ALL_TECH_STACKS_VALUE);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>(ALL_BUDGET_CATEGORIES_VALUE);
  const [selectedAutonomyLevel, setSelectedAutonomyLevel] = useState<string>(ALL_AUTONOMY_LEVELS_VALUE);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const snapshot = await getDocs(collection(db, "jobs"));
        const firestoreJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobRequest));
        if (firestoreJobs.length > 0) {
          const mergedMap = new Map<string, JobRequest>();
          mockJobRequests.forEach(j => mergedMap.set(j.id, j));
          firestoreJobs.forEach(j => mergedMap.set(j.id, j));
          setJobs(Array.from(mergedMap.values()));
        }
      } catch (err) {
        console.warn("Using mockJobRequests fallback:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const allSkills = useMemo(
    () => Array.from(new Set(jobs.flatMap(job => job.requiredSkills || []))).sort(),
    [jobs]
  );

  const allTechStacks = useMemo(
    () => Array.from(new Set(jobs.flatMap(job => job.projectTechStack || []).filter(Boolean))).sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch =
        (job.projectTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (job.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (job.projectDescription?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesSkill =
        selectedSkill === ALL_SKILLS_VALUE
          ? true
          : (job.requiredSkills || []).includes(selectedSkill);

      const matchesTechStack =
        selectedTechStack === ALL_TECH_STACKS_VALUE
          ? true
          : (job.projectTechStack || []).includes(selectedTechStack);

      const matchesBudgetCategory =
        selectedBudgetCategory === ALL_BUDGET_CATEGORIES_VALUE
          ? true
          : job.budgetCategory === selectedBudgetCategory;

      const matchesAutonomyLevel =
        selectedAutonomyLevel === ALL_AUTONOMY_LEVELS_VALUE
          ? true
          : job.desiredAutonomyLevel === selectedAutonomyLevel;

      return matchesSearch && matchesSkill && matchesTechStack && matchesBudgetCategory && matchesAutonomyLevel && job.status === 'Open';
    });
  }, [jobs, searchTerm, selectedSkill, selectedTechStack, selectedBudgetCategory, selectedAutonomyLevel]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSkill !== ALL_SKILLS_VALUE ||
    selectedTechStack !== ALL_TECH_STACKS_VALUE ||
    selectedBudgetCategory !== ALL_BUDGET_CATEGORIES_VALUE ||
    selectedAutonomyLevel !== ALL_AUTONOMY_LEVELS_VALUE;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSkill(ALL_SKILLS_VALUE);
    setSelectedTechStack(ALL_TECH_STACKS_VALUE);
    setSelectedBudgetCategory(ALL_BUDGET_CATEGORIES_VALUE);
    setSelectedAutonomyLevel(ALL_AUTONOMY_LEVELS_VALUE);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <PageTitle
          title="Browse Job Requests"
          description="Find projects seeking specialized AI agents and automation experts."
          className="mb-0"
        />
        <Link
          href="/jobs/post"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          )}
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Post a Job Request
        </Link>
      </div>

      <Card className="mb-10 shadow-md border-border/60">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-1">
              <label htmlFor="search-jobs" className="block text-sm font-medium text-foreground mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-jobs"
                  type="text"
                  placeholder="Title, Company, Desc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label htmlFor="filter-skill" className="block text-sm font-medium text-foreground mb-1.5">
                Filter by Skill
              </label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger id="filter-skill" className="w-full">
                  <div className="flex items-center gap-2 truncate">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="All Skills" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SKILLS_VALUE}>All Skills</SelectItem>
                  {allSkills.map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-tech-stack" className="block text-sm font-medium text-foreground mb-1.5">
                Filter by Tech Stack
              </label>
              <Select value={selectedTechStack} onValueChange={setSelectedTechStack}>
                <SelectTrigger id="filter-tech-stack" className="w-full">
                  <div className="flex items-center gap-2 truncate">
                    <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="All Tech Stacks" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TECH_STACKS_VALUE}>All Tech Stacks</SelectItem>
                  {allTechStacks.map(tech => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-budget" className="block text-sm font-medium text-foreground mb-1.5">
                Filter by Budget
              </label>
              <Select value={selectedBudgetCategory} onValueChange={setSelectedBudgetCategory}>
                <SelectTrigger id="filter-budget" className="w-full">
                  <div className="flex items-center gap-2 truncate">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="All Budget Categories" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_BUDGET_CATEGORIES_VALUE}>All Budget Categories</SelectItem>
                  {BudgetCategoryValues.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="filter-autonomy" className="block text-sm font-medium text-foreground mb-1.5">
                Desired Autonomy
              </label>
              <Select value={selectedAutonomyLevel} onValueChange={setSelectedAutonomyLevel}>
                <SelectTrigger id="filter-autonomy" className="w-full">
                  <div className="flex items-center gap-2 truncate">
                    <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
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
                Showing <strong className="text-foreground">{filteredJobs.length}</strong> open job requests
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

      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-xl bg-card/30">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">No Open Jobs Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria, or post a new job request.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
              <RotateCcw className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          )}
        </div>
      )}
    </>
  );
}
