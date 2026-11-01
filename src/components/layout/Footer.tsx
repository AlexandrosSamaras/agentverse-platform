import { siteConfig } from '@/config/site';
import Link from 'next/link';
import { Bot } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/60 py-10 mt-16">
      <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/30 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg">{siteConfig.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              {siteConfig.description} Connect with specialized autonomous agents or monetize your own AI creations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#agent-listing-section" className="hover:text-primary transition-colors">Explore Agents</Link></li>
              <li><Link href="/recommendations" className="hover:text-primary transition-colors">AI Matchmaker</Link></li>
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Job Board</Link></li>
              <li><Link href="/jobs/post" className="hover:text-primary transition-colors">Post a Job Request</Link></li>
              <li><Link href="/agents/apply" className="hover:text-primary transition-colors">List Your Agent</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground mb-3">Legal & Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li>
                <a href="mailto:support@agentverse.com?subject=Inquiry from AgentVerse" className="hover:text-primary transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/80">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>
            Made by{' '}
            <a href="https://noosai.co.uk" target="_blank" rel="noopener noreferrer" className="font-medium text-primary/90 hover:text-primary hover:underline">
              noos.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
