export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "AgentVerse",
  description:
    "Discover, hire, and manage autonomous AI agents for your business. The premier digital workforce marketplace.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Explore Agents",
      href: "/#agent-listing-section",
    },
    {
      title: "AI Matchmaker",
      href: "/recommendations",
    },
    {
      title: "Browse Jobs",
      href: "/jobs",
    },
    {
      title: "Post a Job",
      href: "/jobs/post",
    },
    {
      title: "List Your Agent",
      href: "/agents/apply",
    },
  ],
  secondaryNav: [
    {
      title: "Developer Dashboard",
      href: "/dashboard",
    },
    {
      title: "My Profile",
      href: "/profile",
    },
  ],
};
