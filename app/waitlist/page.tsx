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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-2">You're on the list!</h1>
              <p className="text-muted-foreground text-lg">
                Thanks for joining the Kindred waitlist
              </p>
            </div>

            {/* Position Card */}
            <Card className="p-8 mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  #{status.position}
                </div>
                <p className="text-muted-foreground">
                  Your position out of {status.totalWaitlist} people
                </p>
              </div>
            </Card>

            {/* Referral Section */}
            <Card className="p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
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
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Your Referral Code
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={status.referralCode}
                          readOnly
                          className="font-mono font-bold text-lg"
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
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Your Referral Link
                      </label>
                      <Input
                        value={`${window.location.origin}/waitlist?ref=${status.referralCode}`}
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Referral Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">
                      {status.referralCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Friends invited
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">
                      {status.referralCount * 5}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Spots jumped
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Referrals List */}
            {status.referrals.length > 0 && (
              <Card className="p-6 mb-6">
                <h3 className="font-semibold mb-4">Your Referrals</h3>
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
              </Card>
            )}

            {/* What's Next */}
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    We'll send invites every Friday to the top 50 people
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    The more friends you invite, the faster you'll get access
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    We'll email you when you're selected for early access
                  </span>
                </li>
              </ul>
            </Card>

            <div className="text-center mt-8">
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                ← Back to home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            🎉 Limited Beta Access
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Join the Kindred Waitlist
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with people through your shared media taste. Be among the
            first to discover your kindred spirits.
          </p>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-8 mb-12"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">1,247</div>
            <div className="text-sm text-muted-foreground">People waiting</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">50</div>
            <div className="text-sm text-muted-foreground">
              Invites per week
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">4.2</div>
            <div className="text-sm text-muted-foreground">
              Avg. referrals/user
            </div>
          </div>
        </motion.div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 max-w-md mx-auto">
            {referralCode && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  🎁 You've been invited! Using code: {referralCode}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
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
                <label className="text-sm font-medium mb-2 block">
                  Name (optional)
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>

              <Button
                onClick={handleJoin}
                disabled={loading || !email}
                className="w-full"
                size="lg"
              >
                {loading ? "Joining..." : "Join Waitlist"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By joining, you'll get early access and can skip the line by
                inviting friends.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 mt-12"
        >
          <Card className="p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Find Your Match</h3>
            <p className="text-sm text-muted-foreground">
              Discover people with similar taste across books, anime, movies,
              and music
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized recommendations based on your compatibility with
              others
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Skip the Line</h3>
            <p className="text-sm text-muted-foreground">
              Invite friends to jump ahead in the queue and get early access
              faster
            </p>
          </Card>
        </motion.div>

        <div className="text-center mt-12">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
