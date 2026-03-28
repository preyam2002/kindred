import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};

  // Check Supabase connection
  const dbStart = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    checks.database = error
      ? { status: "error", error: error.message }
      : { status: "ok", latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check environment variables
  const requiredEnvVars = [
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
  checks.environment = missingEnvVars.length === 0
    ? { status: "ok" }
    : { status: "error", error: `Missing: ${missingEnvVars.join(", ")}` };

  // Optional service checks
  checks.openai = process.env.OPENAI_API_KEY
    ? { status: "ok" }
    : { status: "error", error: "Not configured" };
  checks.anthropic = process.env.ANTHROPIC_API_KEY
    ? { status: "ok" }
    : { status: "error", error: "Not configured" };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
