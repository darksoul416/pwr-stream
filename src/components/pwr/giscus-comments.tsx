"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

interface GiscusCommentsProps {
  // GitHub repo in format "owner/repo"
  repo: string;
  // Repository ID (get from https://giscus.app)
  repoId: string;
  // Discussion category name (e.g., "General Comments")
  category: string;
  // Category ID (get from giscus.app)
  categoryId: string;
  // Optional title for the comments section
  title?: string;
}

/**
 * Giscus comments component — embeds GitHub Discussions as a comment system.
 *
 * Setup (one-time):
 * 1. Go to https://giscus.app
 * 2. Enter your GitHub repo (darksoul416/mobiman)
 * 3. Enable GitHub Discussions on your repo
 * 4. Pick a category (e.g., "General Comments")
 * 5. Copy the repoId, category, and categoryId from the generated config
 * 6. Pass them as props to this component
 *
 * Free, open-source, no ads, uses GitHub login (users trust it).
 * Comments are stored in your GitHub repo's Discussions tab.
 */
export function GiscusComments({
  repo,
  repoId,
  category,
  categoryId,
  title = "Discuss this title",
}: GiscusCommentsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Clear any existing giscus instance
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "dark_dimmed");
    script.setAttribute("data-lang", "en");
    script.setAttribute("data-loading", "lazy");
    script.async = true;

    ref.current.appendChild(script);
  }, [repo, repoId, category, categoryId]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border/40">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div ref={ref} className="giscus min-h-[200px]" />
    </div>
  );
}

/**
 * Placeholder Giscus component for when GitHub Discussions is not yet set up.
 * Shows a friendly "coming soon" message with setup instructions.
 */
export function GiscusCommentsPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border/40 bg-card/40 p-6 text-center">
      <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm font-bold mb-1">Comments coming soon</p>
      <p className="text-xs text-muted-foreground">
        We&apos;re setting up community discussions. Stay tuned!
      </p>
    </div>
  );
}
