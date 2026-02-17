import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-lg font-semibold">BrainBolt</span>
            <nav className="hidden items-center gap-4 text-sm text-muted md:flex">
              <Link href="/">Quiz</Link>
              <Link href="/leaderboard">Leaderboards</Link>
            </nav>
          </div>
          <ThemeToggle />
        </Container>
      </header>
      <main className="py-10">{children}</main>
    </div>
  );
}
