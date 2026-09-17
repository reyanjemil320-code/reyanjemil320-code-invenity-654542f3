import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The home for inventors. Share ideas, find collaborators, and bring breakthroughs to life.
            </p>
            <p className="mt-3 text-xs text-muted-foreground italic">Invent. Connect. Inspire.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-primary transition-smooth">Browse Inventions</Link></li>
              <li><Link to="/network" className="hover:text-primary transition-smooth">The Network</Link></li>
              <li><Link to="/spark-arena" className="hover:text-primary transition-smooth">Spark Arena</Link></li>
              <li><Link to="/ai-brainstorm" className="hover:text-primary transition-smooth">AI Brainstorm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Get started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary transition-smooth">Create account</Link></li>
              <li><Link to="/post" className="hover:text-primary transition-smooth">Post an idea</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Connect</h4>
            <div className="flex gap-3">
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-smooth"><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-smooth"><Github className="h-5 w-5" /></a>
              <a href="#" aria-label="Email" className="text-muted-foreground hover:text-primary transition-smooth"><Mail className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Invenity. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
