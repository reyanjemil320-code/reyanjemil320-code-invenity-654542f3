import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Lightbulb, Network, Trophy, Brain, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import Particles from "@/components/vfx/Particles";
import { fetchJson, type SiteStats } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: Lightbulb,
    title: "Showcase Your Ideas",
    desc: "Post inventions with images and full technical details. Get discovered by collaborators and investors.",
  },
  {
    icon: Network,
    title: "Connect with Inventors",
    desc: "Join The Network — a feed, profiles, and direct messages built for the inventor community.",
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

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-hero">
        {/* interactive antigravity particles — they drift and dodge the cursor */}
        <Particles
          className="absolute inset-0"
          particleColors={["#5B8CFF", "#F5C242", "#8FB3FF"]}
          particleCount={90}
          speed={0.35}
          particleBaseSize={70}
          moveParticlesOnHover
        />
        <div className="absolute inset-0 starfield pointer-events-none opacity-70" />
        <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

        {/* drifting nebulae */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary-glow/10 blur-3xl animate-blob" style={{ animationDelay: "8s" }} />

        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32 lg:py-40">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide gold-text">
                <Sparkles className="h-3.5 w-3.5" />
                WHERE INVENTORS CONNECT
              </div>
              <h1 className="text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
                Invent. <span className="gradient-text animate-gradient">Connect.</span>
                <br />
                <span className="gold-text">Inspire.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Invenity is the home for breakthrough thinkers. Share your inventions, find collaborators, get AI-powered feedback, and bring world-changing ideas to life — together.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg" className="btn-shine gap-2 rounded-full bg-gradient-primary px-8 text-base font-bold glow-shadow hover:opacity-90">
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
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-accent/50 px-8 text-base font-semibold text-accent transition-smooth hover:border-accent hover:bg-accent/10 hover:text-accent hover:glow-gold"
                >
                  <Link to="/browse">
                    <Lightbulb className="h-4 w-4" /> Explore Inventions
                  </Link>
                </Button>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4 text-sm sm:flex sm:flex-wrap sm:gap-10">
                {[
                  { n: stats.inventors.toLocaleString(), l: "Inventors" },
                  { n: stats.ideas.toLocaleString(), l: "Ideas posted" },
                  { n: stats.collabs.toLocaleString(), l: "Connections" },
                ].map((s) => (
                  <div key={s.l} className="hover-lift cursor-default">
                    <div className="text-xl text-shine font-bold sm:text-3xl">{s.n}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider sm:text-sm">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Antigravity orbital system */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute inset-0 scale-150 bg-glow-radial blur-3xl" />
              <div className="relative aspect-square w-full max-w-md">
                {/* orbital rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border border-primary/25"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full border border-accent/35 border-dashed"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                />

                {/* orbiting invention icons */}
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
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, delay, ease: "easeInOut" }}
                      className="card-lift flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-card/80 text-primary backdrop-blur-md"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  </div>
                ))}

                {/* center emblem */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="animate-invenity-pulse bg-glow-radial rounded-full p-20">
                    <Logo showText={false} size="lg" />
                  </div>
                </motion.div>

                {/* gold spark particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`spark-${i}`}
                    className="absolute h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ left: `${18 + i * 9}%`, top: `${12 + (i % 3) * 28}%` }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.6, 0],
                      y: [0, -24, -48],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="divider-gold" />
      </section>

      {/* ================= FEATURES ================= */}
      <section className="relative px-4 py-20 md:px-6 md:py-28">
        <div className="absolute inset-0 starfield opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold md:text-5xl">
              Everything inventors need, <span className="gold-text">in one place</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From spark to prototype, Invenity gives you the tools and community to make it real.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="animate-antigravity h-full"
                style={{ animationDelay: `${i * 1.2}s` }}
              >
                <Card className="card-lift group h-full cursor-default bg-card/70 p-6 backdrop-blur-sm">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent transition-smooth group-hover:scale-110 group-hover:glow-gold">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="relative px-4 py-20 md:px-6 md:py-28">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold md:text-5xl">
              From idea to impact in <span className="gradient-text">3 steps</span>
            </h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="mb-4 text-6xl font-bold text-shine">{s.num}</div>
                <h3 className="mb-2 text-xl font-bold">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="relative overflow-hidden border-accent/30 p-10 text-center elegant-shadow md:p-16">
              <div className="absolute inset-0 bg-gradient-primary opacity-[0.06] pointer-events-none" />
              <div className="absolute inset-0 starfield opacity-50 pointer-events-none" />
              <div className="pointer-events-none absolute -top-24 right-1/4 h-56 w-56 rounded-full bg-accent/15 blur-3xl animate-blob" />
              <div className="relative">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <Rocket className="mx-auto mb-6 h-12 w-12 text-accent" />
                </motion.div>
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                  Ready to share your <span className="gold-text">breakthrough?</span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
                  Join thousands of inventors building the future. Free to start.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="btn-shine gap-2 rounded-full bg-gradient-gold px-8 text-base font-bold text-[hsl(228_60%_6%)] glow-gold hover:opacity-90">
                    <Link to="/auth">
                      Create your account <Zap className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-accent/50 px-8 text-base font-semibold text-accent hover:border-accent hover:bg-accent/10 hover:text-accent">
                    <Link to="/ai-brainstorm">Try AI Brainstorm</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
