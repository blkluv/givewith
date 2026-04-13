import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="border border-border bg-card p-8">
      <h2 className="type-display-lg text-foreground">
        <span className="font-editorial">Reset</span> password
      </h2>
      <p className="mb-8 mt-2 type-body text-muted-foreground">
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
