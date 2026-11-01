import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
  starSize?: number;
}

export function AgentRating({ rating, maxRating = 5, className, starSize = 16 }: AgentRatingProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="hsl(var(--accent))" strokeWidth={0} style={{ width: starSize, height: starSize }} className="text-accent" />
      ))}
      {halfStar && <StarHalf fill="hsl(var(--accent))" strokeWidth={0} style={{ width: starSize, height: starSize }} className="text-accent" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} fill="hsl(var(--muted))" strokeWidth={0} style={{ width: starSize, height: starSize }} className="text-muted-foreground/50" />
      ))}
    </div>
  );
}
