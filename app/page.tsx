"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to dashboard if logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-border">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 animate-fadeInUp">
              <Image
                src="/logo.png"
                alt="kindred"
                width={32}
                height={32}
                priority
              />
              <span className="text-2xl font-display font-bold tracking-tight">kindred</span>
            </div>
          </Link>
          <div className="flex gap-3 animate-fadeInUp animate-delay-100">
            <Link
              href="/auth/login"
              className="px-5 py-2 text-sm font-medium hover:text-primary transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-display font-bold mb-8 leading-[0.95] letterpress animate-fadeInUp animate-delay-200">
              Connect through
              <br />
              <span className="text-primary">what you love</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animate-delay-300">
              Aggregate your tracked activity from Goodreads, MyAnimeList,
              Letterboxd, and Spotify. Discover people who share your tastes.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fadeInUp animate-delay-400">
              <Link
                href="/demo"
                className="group stamp bg-primary text-primary-foreground text-base hover:bg-primary/90 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                Try Demo
                <ArrowRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/waitlist"
                className="stamp border-2 border-secondary text-secondary hover:bg-secondary/10 transition-all hover:-translate-y-1"
              >
                Join Waitlist
              </Link>
            </div>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto corner-brackets animate-fadeInUp animate-delay-500">
            {["Goodreads", "MyAnimeList", "Letterboxd", "Spotify"].map(
              (platform, index) => (
                <div
                  key={platform}
                  className={`paper-card card-tactile p-8 text-center animate-fadeInUp animate-delay-${600 + index * 100}`}
                >
                  <div className="font-mono text-sm font-medium tracking-wider uppercase text-primary">
                    {platform}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Value Props */}
          <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fadeInUp animate-delay-800">
            <div className="text-center space-y-3">
              <div className="font-display text-4xl text-primary">∞</div>
              <h3 className="font-display text-xl font-semibold">Endless Discovery</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Find kindred spirits across your favorite media
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="font-display text-4xl text-secondary">⚡</div>
              <h3 className="font-display text-xl font-semibold">AI-Powered Matches</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Smart compatibility scoring based on taste overlap
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="font-display text-4xl text-accent">✦</div>
              <h3 className="font-display text-xl font-semibold">Import Everything</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sync your libraries from all your favorite platforms
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
