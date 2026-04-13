import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="border border-border bg-card p-8">
      <h2 className="type-display-lg text-foreground">
        <span className="font-editorial">Welcome</span> back
      </h2>
      <p className="mb-8 mt-2 type-body text-muted-foreground">
        Sign in to continue giving.
      </p>
      <LoginForm />
    </div>
  );
}
