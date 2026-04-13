import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="border border-border bg-card p-8">
      <h2 className="type-display-lg text-foreground">
        Start <span className="font-editorial">giving</span>
      </h2>
      <p className="mb-8 mt-2 type-body text-muted-foreground">
        Create your account. A wallet is set up for you automatically.
      </p>
      <RegisterForm />
    </div>
  );
}
