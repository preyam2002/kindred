"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignupForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/settings";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <BackButton href="/" label="Back to home" className="mb-8" />

        <div className="border border-border rounded-lg p-8 bg-card">
          <h1 className="text-3xl font-bold mb-2">Create account</h1>
          <p className="text-muted-foreground mb-8">
            Join kindred and connect through what you love
          </p>

          <div className="space-y-4">
            <button
              onClick={() =>
                signIn("twitter", {
                  redirect: true,
                  callbackUrl: redirect,
                })
              }
              className="w-full px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Continue with X
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
