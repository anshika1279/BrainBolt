import { AppShell } from "@/components/layout/AppShell";
import { Container } from "@/components/ui/Container";
import { QuizShell } from "@/components/quiz/QuizShell";

export default function Home() {
  return (
    <AppShell>
      <Container>
        <QuizShell />
      </Container>
    </AppShell>
  );
}
