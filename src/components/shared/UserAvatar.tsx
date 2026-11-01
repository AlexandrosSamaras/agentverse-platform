
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string; // Initials or short name for fallback
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dataAiHint?: string;
}

export function UserAvatar({ src, alt = "User Avatar", fallback, size = 'md', className, dataAiHint }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const fallbackText = fallback || (alt && alt.length >= 2 ? alt.substring(0, 2).toUpperCase() : <User className="h-1/2 w-1/2" />);

  return (
    <Avatar className={`${sizeClasses[size]} ${className || ''}`}>
      {/* AvatarImage will attempt to load src. If src is null, undefined, or an empty string,
          or if the image fails to load, AvatarFallback will be shown.
          We pass src || undefined to ensure that if src is an empty string, AvatarImage treats it as missing.
      */}
      <AvatarImage 
        src={src || undefined} 
        alt={alt} 
        data-ai-hint={dataAiHint || 'person portrait'} 
      />
      <AvatarFallback className="text-sm bg-muted text-muted-foreground">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}
