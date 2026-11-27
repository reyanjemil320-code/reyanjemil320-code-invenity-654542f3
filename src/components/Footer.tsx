import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-accent/15 bg-background">
      <div className="divider-gold" />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The home for inventors. Share ideas, find collaborators, and bring breakthroughs to life.
            </p>
            <p className="mt-3 text-xs italic gold-text">Invent. Connect. Inspire.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/browse" className="link-gold hover:text-accent">Browse Inventions</Link></li>
              <li><Link to="/network" className="link-gold hover:text-accent">The Network</Link></li>
              <li><Link to="/spark-arena" className="link-gold hover:text-accent">Spark Arena</Link></li>
              <li><Link to="/ai-brainstorm" className="link-gold hover:text-accent">AI Brainstorm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider">Get started</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/auth" className="link-gold hover:text-accent">Create account</Link></li>
              <li><Link to="/post" className="link-gold hover:text-accent">Post an idea</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider">Connect</h4>
            <div className="flex gap-3">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="rounded-full border border-border/60 p-2.5 text-muted-foreground transition-smooth hover:border-accent/60 hover:text-accent hover:glow-gold"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-semibold gold-text">Invenity</span>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
