import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-md">
          <Construction className="mx-auto h-14 w-14 text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">Coming in the next build pass.</p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
