"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function MashRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const targetUsername = params.username as string;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Redirect to login with return URL
      const returnUrl = `/mash/${targetUsername}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (status === "authenticated" && session?.user?.username) {
      // Redirect to comparison page with current user and target user
      router.push(`/${session.user.username}/${targetUsername}`);
    }
  }, [status, session, targetUsername, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">
        {status === "loading" ? "Loading..." : "Redirecting..."}
      </div>
    </div>
  );
}

