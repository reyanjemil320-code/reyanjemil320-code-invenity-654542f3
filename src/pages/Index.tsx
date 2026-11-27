import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Lightbulb, Network, Trophy, Brain, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchJson, type SiteStats } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/invenity-logo.png";

const features = [
  {
    icon: Lightbulb,
    title: "Showcase Your Ideas",
    desc: "Post inventions with images, videos, and full technical details. Get discovered by collaborators and investors.",
  },
  {
    icon: Network,
    title: "Connect with Inventors",
    desc: "Join The Network — a feed, profiles, reels, and direct messages built for the inventor community.",
  },
  {
    icon: Brain,
    title: "AI Brainstorm",
    desc: "Bounce ideas off our AI co-creator. Refine concepts, explore use cases, and uncover blind spots instantly.",
  },
  {
    icon: Trophy,
    title: "Spark Arena",
    desc: "Battle ideas head-to-head. The community votes — best inventions rise to the top of the leaderboard.",
  },
];

const steps = [
  { num: "01", title: "Sign up", desc: "Create your inventor profile in under a minute." },
  { num: "02", title: "Share an idea", desc: "Post your invention with photos, videos, and details." },
  { num: "03", title: "Connect & grow", desc: "Get feedback, collaborators, and recognition." },
];

export default function Index() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ inventors: 0, ideas: 0, collabs: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await fetchJson<SiteStats>("/api/stats");
        setStats({ inventors: s.inventors, ideas: s.ideas, collabs: s.collabs });
      } catch {
        setStats({ inventors: 0, ideas: 0, collabs: 0 });
      }
    };
    void loadStats();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-primary-glow/20 blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "3s" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32 lg:py-40">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Where inventors connect
              </div>
              <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
                Invent. <span className="gradient-text">Connect.</span><br />
                Inspire.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl max-w-xl">
                Invenity is the home for breakthrough thinkers. Share your inventions, find collaborators, get AI-powered feedback, and bring world-changing ideas to life — together.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full text-base font-semibold gap-2 glow-shadow">
                  {user ? (
                    <Link to="/post">
                      Post Your Idea <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to="/auth">
                      Join Invenity <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full text-base font-semibold gap-2">
                  <Link to="/browse">
                    <Lightbulb className="h-4 w-4" /> Explore Inventions
                  </Link>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-8 text-sm">
                {[
                  { n: stats.inventors.toLocaleString(), l: "Inventors" },
                  { n: stats.ideas.toLocaleString(), l: "Ideas posted" },
                  { n: stats.collabs.toLocaleString(), l: "Connections" },
                ].map((s) => (
                  <div key={s.l} className="hover-lift cursor-default">
                    <div className="text-xl sm:text-2xl font-bold gradient-text">{s.n}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-glow-radial blur-3xl scale-150" />
              <div className="relative w-full max-w-md aspect-square">
                {/* Orbital rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full border border-primary/30 border-dashed"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                />

                {/* Orbiting invention icons */}
                {[
                  { Icon: Lightbulb, angle: 0, delay: 0 },
                  { Icon: Brain, angle: 72, delay: 0.4 },
                  { Icon: Zap, angle: 144, delay: 0.8 },
                  { Icon: Rocket, angle: 216, delay: 1.2 },
                  { Icon: Network, angle: 288, delay: 1.6 },
                ].map(({ Icon, angle, delay }, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 -ml-6 -mt-6"
                    style={{ transform: `rotate(${angle}deg) translateY(-180px) rotate(-${angle}deg)` }}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay, ease: "easeInOut" }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card/80 backdrop-blur-md border border-primary/30 text-primary shadow-[var(--shadow-glow)]"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  </div>
                ))}

                {/* Center logo with pulse */}
                <motion.img
                  src={logo}
                  alt="Invenity logo"
                  className="relative w-full h-full object-contain animate-invenity-pulse p-16"
                  animate={{ rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Spark particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`spark-${i}`}
                    className="absolute h-1.5 w-1.5 rounded-full bg-primary"
                    style={{ left: `${20 + i * 12}%`, top: `${15 + (i % 3) * 25}%` }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      y: [0, -20, -40],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold md:text-5xl">
              Everything inventors need, <span className="gradient-text">in one place</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              From spark to prototype, Invenity gives you the tools and community to make it real.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full p-6 hover-lift hover:border-primary/50 transition-smooth group cursor-default bg-card/60 backdrop-blur-sm">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-smooth">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/30 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold md:text-5xl">From idea to impact in 3 steps</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-bold gradient-text mb-4">{s.num}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl">
          <Card className="p-10 md:p-16 text-center elegant-shadow border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5 pointer-events-none" />
            <div className="relative">
              <Rocket className="mx-auto h-12 w-12 text-primary mb-6" />
              <h2 className="text-3xl font-bold md:text-4xl mb-4">
                Ready to share your breakthrough?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of inventors building the future. Free to start.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full text-base font-semibold gap-2 glow-shadow">
                  <Link to="/auth">
                    Create your account <Zap className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full text-base font-semibold">
                  <Link to="/ai-brainstorm">Try AI Brainstorm</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
