import Link from 'next/link';
import Image from 'next/image';
import type { Agent } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentRating } from './AgentRating';
import { Zap, BrainCircuit, ShieldCheck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const startingPrice =
    agent.priceTiers && agent.priceTiers.length > 0
      ? agent.priceTiers[0].price
      : agent.pricingModel || 'Contact for pricing';

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden rounded-xl border-border/60 shadow-lg hover:shadow-xl transition-all duration-300",
      "shadow-[0_0_12px_-4px_var(--card-glow)] hover:shadow-[0_0_20px_-2px_var(--card-glow)] hover:border-primary/40"
    )}>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start space-x-4">
          {agent.avatarUrl && (
            <Image
              src={agent.avatarUrl}
              alt={`${agent.name} avatar`}
              width={60}
              height={60}
              className="rounded-lg border border-border/80 object-cover shrink-0"
              data-ai-hint={agent.dataAiHint || 'abstract technology'}
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold flex items-center gap-1.5">
              <Link href={`/agents/${agent.id}`} className="hover:text-primary transition-colors truncate">
                {agent.name}
              </Link>
              {agent.verified && (
                <span className="text-primary shrink-0" title="Verified by AgentVerse">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground truncate mt-0.5">
              By {agent.developer}
            </CardDescription>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <AgentRating rating={agent.rating} starSize={13} />
              <span className="text-xs text-muted-foreground">({agent.reviewsCount})</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2 flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {agent.shortDescription || agent.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {agent.capabilities && agent.capabilities.length > 0 && (
            <Badge variant="outline" size="sm" className="flex items-center gap-1 border-primary/30 text-primary">
              <Zap className="h-3 w-3" /> {agent.capabilities[0]}
            </Badge>
          )}
          {(agent.tags || []).slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" size="sm" className="capitalize">{tag}</Badge>
          ))}
        </div>

        {agent.autonomyLevel && (
          <div className="flex items-center gap-1.5 text-xs pt-1 text-muted-foreground">
            <BrainCircuit className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground/80">Autonomy:</span>
            <span className="truncate">{agent.autonomyLevel}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-5 py-3.5 border-t border-border/50 bg-muted/10 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1 text-xs font-medium text-foreground/90 truncate">
          <DollarSign className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="truncate">{startingPrice}</span>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 hover:border-primary hover:text-primary">
          <Link href={`/agents/${agent.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
