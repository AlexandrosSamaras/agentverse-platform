
import Link from 'next/link';
import Image from 'next/image';
import type { JobRequest } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CalendarDays, DollarSign, Settings2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { AgentRating } from '@/components/agents/AgentRating'; 
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobRequest;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300",
      "shadow-[0_0_12px_-2px_var(--card-glow)] hover:shadow-[0_0_18px_-0px_var(--card-glow)]"
      )}>
      <CardHeader className="p-4">
        <div className="flex items-start space-x-4">
          {job.companyLogoUrl && (
            <Image
              src={job.companyLogoUrl}
              alt={`${job.companyName} logo`}
              width={48}
              height={48}
              className="rounded-md border"
              data-ai-hint={job.dataAiHintCompanyLogo || 'company logo'}
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">
              <Link href={`/jobs/${job.id}`} className="hover:text-primary transition-colors">
                {job.projectTitle}
              </Link>
            </CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm text-muted-foreground">
                By {job.companyName}
              </CardDescription>
              {job.companyRating && (
                <div className="flex items-center gap-1">
                  <AgentRating rating={job.companyRating} starSize={14} />
                   <span className="text-xs text-muted-foreground">({job.companyRating.toFixed(1)})</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow space-y-3">
        <div>
          <p className="text-sm text-foreground mb-3 line-clamp-3">{job.projectDescription}</p>
        </div>
        
        {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-primary"/>
                Key Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="secondary" size="sm">{skill}</Badge>
                ))}
                {job.requiredSkills.length > 3 && <Badge variant="outline" size="sm">+{job.requiredSkills.length - 3} more</Badge>}
              </div>
            </div>
        )}
        
        <div className="space-y-1.5 text-xs pt-2">
          {job.budget && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground/90">Budget:</span>
                <span>{job.budget} {job.budgetCategory ? `(${job.budgetCategory})` : ''}</span>
            </div>
          )}
          {job.desiredAutonomyLevel && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground/90">Autonomy:</span>
                <Badge variant="outline" size="sm">{job.desiredAutonomyLevel}</Badge>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t flex justify-between items-center">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5"/> 
          Posted: {format(new Date(job.postedDate), "PP")}
        </span>
        <Link href={`/jobs/${job.id}`}>
          <Button variant="outline" size="sm">View & Apply</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
