"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Share2,
  MousePointerClick,
  Users,
  TrendingUp,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  Link2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  period: string;
  summary: {
    totalShares: number;
    totalClicks: number;
    totalReferrals: number;
    convertedReferrals: number;
    kFactor: string;
    conversionRate: string;
    uniqueSharers: number;
  };
  sharesByPlatform: Record<string, number>;
  sharesByType: Record<string, number>;
  dailyData: Array<{
    date: string;
    shares: number;
    clicks: number;
    conversions: number;
  }>;
  topSharers: Array<{ userId: string; count: number }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics/viral?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchAnalytics();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, period]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <Link href="/auth/login" className="text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Unable to load analytics</div>
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, typeof Share2> = {
      twitter: Twitter,
      facebook: Facebook,
      linkedin: Linkedin,
      whatsapp: MessageCircle,
      copy_link: Link2,
    };
    return icons[platform] || Share2;
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Viral Analytics</h1>
            <p className="text-muted-foreground">
              Track your sharing performance and viral coefficient
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2">
            {["7d", "30d", "90d"].map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
      >
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {analytics.summary.totalShares}
              </div>
              <div className="text-xs text-muted-foreground">Total Shares</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {analytics.summary.uniqueSharers} unique sharers
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {analytics.summary.totalClicks}
              </div>
              <div className="text-xs text-muted-foreground">
                Share Clicks
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {analytics.summary.totalShares > 0
              ? (
                  analytics.summary.totalClicks / analytics.summary.totalShares
                ).toFixed(1)
              : 0}{" "}
            clicks per share
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {analytics.summary.convertedReferrals}
              </div>
              <div className="text-xs text-muted-foreground">Conversions</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {analytics.summary.conversionRate} conversion rate
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {analytics.summary.kFactor}
              </div>
              <div className="text-xs text-muted-foreground">
                Viral Coefficient
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {parseFloat(analytics.summary.kFactor) >= 1
              ? "🚀 Viral growth!"
              : "📈 Growing"}
          </div>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Shares by Platform */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Shares by Platform</h2>
            <div className="space-y-4">
              {Object.entries(analytics.sharesByPlatform)
                .sort(([, a], [, b]) => b - a)
                .map(([platform, count]) => {
                  const Icon = getPlatformIcon(platform);
                  const percentage =
                    analytics.summary.totalShares > 0
                      ? ((count / analytics.summary.totalShares) * 100).toFixed(
                          1
                        )
                      : 0;
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {platform.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(analytics.sharesByPlatform).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No shares yet
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Shares by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Shares by Type</h2>
            <div className="space-y-4">
              {Object.entries(analytics.sharesByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage =
                    analytics.summary.totalShares > 0
                      ? ((count / analytics.summary.totalShares) * 100).toFixed(
                          1
                        )
                      : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {type}
                        </span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(analytics.sharesByType).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No shares yet
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Daily Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Daily Trend</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-4 font-medium">Date</th>
                  <th className="text-right py-2 px-4 font-medium">Shares</th>
                  <th className="text-right py-2 px-4 font-medium">Clicks</th>
                  <th className="text-right py-2 px-4 font-medium">
                    Conversions
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailyData
                  .slice()
                  .reverse()
                  .map((day) => (
                    <tr key={day.date} className="border-b border-border/50">
                      <td className="py-2 px-4">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-2 px-4">{day.shares}</td>
                      <td className="text-right py-2 px-4">{day.clicks}</td>
                      <td className="text-right py-2 px-4">
                        {day.conversions}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12"
      >
        <Card className="p-6 bg-muted/30">
          <h3 className="font-semibold mb-2">About Viral Coefficient</h3>
          <p className="text-sm text-muted-foreground">
            The viral coefficient (K-factor) measures how many new users each
            existing user brings. A K-factor of 1.0 means each user brings 1
            new user (viral growth). Above 1.0 is exponential growth, below 1.0
            requires additional marketing effort.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Formula:</strong> K = (unique sharers ÷ converted
            referrals)
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
