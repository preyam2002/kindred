"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  TrendingUp,
  Gift,
  Copy,
  Check,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/share-utils";
import Link from "next/link";

interface WaitlistStatus {
  position: number;
  totalWaitlist: number;
  referralCode: string;
  referralCount: number;
  status: string;
  referrals: Array<{
    email: string;
    created_at: string;
    status: string;
  }>;
}

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState<WaitlistStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleJoin = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          referredBy: referralCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJoined(true);

        // Fetch full status
        const statusResponse = await fetch(
          `/api/waitlist?email=${encodeURIComponent(email)}`
        );
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setStatus(statusData);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to join waitlist");
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = async () => {
    if (!status) return;

    const referralUrl = `${window.location.origin}/waitlist?ref=${status.referralCode}`;
    const success = await copyToClipboard(referralUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (joined && status) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="animate-fadeInUp">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-5xl font-bold mb-3 letterpress">You're on the list!</h1>
              <p className="text-muted-foreground text-lg">
                Thanks for joining the Kindred waitlist
              </p>
            </div>

            {/* Position Card */}
            <div className="paper-card p-10 mb-6 corner-brackets">
              <div className="text-center">
                <div className="font-mono text-7xl font-bold text-primary mb-3 animate-countUp">
                  #{status.position}
                </div>
                <p className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Your position out of {status.totalWaitlist} people
                </p>
              </div>
            </div>

            {/* Referral Section */}
            <div className="paper-card p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-bold mb-2">
                    Skip the line - Invite friends!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For every friend who joins with your link, you both move up
                    in the queue. Invite 3 friends and jump to the front of the
                    line!
                  </p>

                  <div className="space-y-3">
                    {/* Referral Code */}
                    <div>
                      <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                        Your Referral Code
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={status.referralCode}
                          readOnly
                          className="font-mono font-bold text-lg bg-muted/50 border-2"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyReferral}
                        >
                          {copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Referral Link */}
                    <div>
                      <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                        Your Referral Link
                      </label>
                      <Input
                        value={`${window.location.origin}/waitlist?ref=${status.referralCode}`}
                        readOnly
                        className="font-mono text-sm bg-muted/50 border-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="paper-card p-5 card-tactile">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-mono text-3xl font-bold">
                      {status.referralCount}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Friends invited
                    </div>
                  </div>
                </div>
              </div>

              <div className="paper-card p-5 card-tactile">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                  <div>
                    <div className="font-mono text-3xl font-bold text-secondary">
                      {status.referralCount * 5}
                    </div>
                    <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Spots jumped
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referrals List */}
            {status.referrals.length > 0 && (
              <div className="paper-card p-6 mb-6">
                <h3 className="font-display text-xl font-bold mb-4">Your Referrals</h3>
                <div className="space-y-2">
                  {status.referrals.map((referral, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm">
                        {referral.email.substring(0, 3)}***@
                        {referral.email.split("@")[1]}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          referral.status === "converted"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {referral.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="paper-card p-6">
              <h3 className="font-display text-xl font-bold mb-4">What happens next?</h3>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    We'll send invites every Friday to the top 50 people
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span>
                    The more friends you invite, the faster you'll get access
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span>
                    We'll email you when you're selected for early access
                  </span>
                </li>
              </ul>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/"
                className="font-mono text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-block stamp bg-primary text-primary-foreground mb-8">
            Limited Beta Access
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 letterpress">
            Join the Kindred Waitlist
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect with people through your shared media taste. Be among the
            first to discover your kindred spirits.
          </p>
        </div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-12 mb-12 animate-fadeInUp animate-delay-100">
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-primary mb-1">1,247</div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">People waiting</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-secondary mb-1">50</div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Invites per week
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-4xl font-bold text-accent mb-1">4.2</div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Avg. referrals/user
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="animate-fadeInUp animate-delay-200">
          <div className="paper-card p-8 max-w-md mx-auto corner-brackets">
            {referralCode && (
              <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/20">
                <p className="font-mono text-sm text-primary font-medium">
                  🎁 You've been invited! Using code: <span className="font-bold">{referralCode}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider font-medium mb-2 block">
                  Email *
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider font-medium mb-2 block">
                  Name (optional)
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="border-2"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading || !email}
                className="w-full stamp bg-primary text-primary-foreground text-base hover:bg-primary/90 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? "Joining..." : "Join Waitlist"}
              </button>

              <p className="font-mono text-xs text-muted-foreground text-center leading-relaxed">
                By joining, you'll get early access and can skip the line by
                inviting friends.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 animate-fadeInUp animate-delay-300">
          <div className="paper-card card-tactile p-6">
            <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Find Your Match</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover people with similar taste across books, anime, movies,
              and music
            </p>
          </div>

          <div className="paper-card card-tactile p-6">
            <div className="w-12 h-12 bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get personalized recommendations based on your compatibility with
              others
            </p>
          </div>

          <div className="paper-card card-tactile p-6">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">Skip the Line</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Invite friends to jump ahead in the queue and get early access
              faster
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
