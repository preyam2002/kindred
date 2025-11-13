"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, TrendingUp, Users, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface LeaderboardData {
  leaderboard: Array<{
    rank: number;
    email: string;
    referralCount: number;
    position: number;
    joinedDaysAgo: number;
  }>;
  stats: {
    totalUsers: number;
    totalReferrals: number;
    avgReferrals: string;
  };
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/waitlist/leaderboard");
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Unable to load leaderboard</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Waitlist Leaderboard
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Top referrers get early access to Kindred
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <Users className="w-8 h-8 text-primary mb-2" />
              <div className="text-3xl font-bold">{data.stats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
              <div className="text-3xl font-bold">
                {data.stats.totalReferrals}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Referrals
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <Crown className="w-8 h-8 text-yellow-500 mb-2" />
              <div className="text-3xl font-bold">{data.stats.avgReferrals}</div>
              <div className="text-xs text-muted-foreground">
                Avg Referrals
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Top 3 Podium */}
        {data.leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-end justify-center gap-4 mb-12"
          >
            {/* 2nd Place */}
            <Card className="p-6 flex-1 max-w-xs bg-gradient-to-br from-gray-400/10 to-gray-400/5 border-gray-400/20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-400/20 flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-5xl font-bold mb-1">2</div>
                <div className="text-sm font-mono mb-2">
                  {data.leaderboard[1].email}
                </div>
                <div className="text-3xl font-bold text-gray-400">
                  {data.leaderboard[1].referralCount}
                </div>
                <div className="text-xs text-muted-foreground">referrals</div>
              </div>
            </Card>

            {/* 1st Place */}
            <Card className="p-8 flex-1 max-w-xs bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-10 h-10 text-yellow-500" />
                </div>
                <div className="text-6xl font-bold mb-2">1</div>
                <div className="text-sm font-mono mb-3">
                  {data.leaderboard[0].email}
                </div>
                <div className="text-4xl font-bold text-yellow-500">
                  {data.leaderboard[0].referralCount}
                </div>
                <div className="text-xs text-muted-foreground">referrals</div>
              </div>
            </Card>

            {/* 3rd Place */}
            <Card className="p-6 flex-1 max-w-xs bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-5xl font-bold mb-1">3</div>
                <div className="text-sm font-mono mb-2">
                  {data.leaderboard[2].email}
                </div>
                <div className="text-3xl font-bold text-orange-500">
                  {data.leaderboard[2].referralCount}
                </div>
                <div className="text-xs text-muted-foreground">referrals</div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Full Leaderboard</h2>
            <div className="space-y-2">
              {data.leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.03 }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    entry.rank <= 3
                      ? "bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        entry.rank === 1
                          ? "bg-yellow-500/20 text-yellow-500"
                          : entry.rank === 2
                          ? "bg-gray-400/20 text-gray-400"
                          : entry.rank === 3
                          ? "bg-orange-500/20 text-orange-500"
                          : "bg-muted"
                      }`}
                    >
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-mono font-medium">
                        {entry.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Position #{entry.position} • Joined{" "}
                        {entry.joinedDaysAgo} days ago
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {entry.referralCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      referrals
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <h3 className="text-2xl font-bold mb-2">Want to join them?</h3>
            <p className="text-muted-foreground mb-6">
              Join the waitlist and start inviting friends to climb the
              leaderboard
            </p>
            <Link
              href="/waitlist"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Join Waitlist
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
