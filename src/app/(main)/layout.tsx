import { AuthGuard } from "@/components/layout/auth-guard";
import { MainShell } from "@/components/layout/main-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <MainShell>{children}</MainShell>
    </AuthGuard>
  );
}
