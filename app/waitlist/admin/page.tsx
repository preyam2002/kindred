"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Crown,
  Mail,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WaitlistData {
  entries: Array<{
    id: string;
    email: string;
    name: string;
    position: number;
    referral_code: string;
    referral_count: number;
    status: string;
    created_at: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    pending: number;
    approved: number;
    converted: number;
    total: number;
    avgReferrals: number;
  };
  topReferrers: Array<{
    email: string;
    referral_count: number;
    position: number;
  }>;
}

export default function WaitlistAdminPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<WaitlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const res = await fetch(
        `/api/waitlist/admin?status=${statusFilter}&limit=100`
      );
      if (res.ok) {
        const responseData = await res.json();
        setData(responseData);
      }
    } catch (error) {
      console.error("Error fetching waitlist data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBatch = async (batchSize: number) => {
    if (
      !confirm(
        `Are you sure you want to approve the top ${batchSize} users?`
      )
    ) {
      return;
    }

    setApproving(true);

    try {
      const res = await fetch("/api/waitlist/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve_batch",
          batchSize,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Successfully approved ${result.approved} users!`);
        fetchData();
      } else {
        alert("Failed to approve users");
      }
    } catch (error) {
      console.error("Error approving batch:", error);
      alert("An error occurred");
    } finally {
      setApproving(false);
    }
  };

  const exportCSV = () => {
    if (!data?.entries) return;

    const csv = [
      ["Email", "Name", "Position", "Referrals", "Status", "Created At"].join(
        ","
      ),
      ...data.entries.map((entry) =>
        [
          entry.email,
          entry.name || "",
          entry.position,
          entry.referral_count,
          entry.status,
          new Date(entry.created_at).toISOString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${statusFilter}-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Unable to load data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-2">Waitlist Admin</h1>
        <p className="text-muted-foreground">
          Manage your waitlist and approve users for early access
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
      >
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{data.stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{data.stats.approved}</div>
              <div className="text-xs text-muted-foreground">Invited</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{data.stats.converted}</div>
              <div className="text-xs text-muted-foreground">Converted</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{data.stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">
                {data.stats.avgReferrals.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg Referrals
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3 mb-8"
      >
        <Button
          onClick={() => handleApproveBatch(50)}
          disabled={approving || data.stats.pending === 0}
          className="gap-2"
        >
          <Mail className="w-4 h-4" />
          Invite Top 50
        </Button>

        <Button
          onClick={() => handleApproveBatch(25)}
          disabled={approving || data.stats.pending === 0}
          variant="outline"
          className="gap-2"
        >
          Invite Top 25
        </Button>

        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>

        {/* Status Filter */}
        <div className="ml-auto flex gap-2">
          {["pending", "approved", "converted"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Waitlist Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              Waitlist Entries ({data.pagination.total})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">#</th>
                    <th className="text-left py-3 px-2 font-medium">Email</th>
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-right py-3 px-2 font-medium">
                      Referrals
                    </th>
                    <th className="text-left py-3 px-2 font-medium">Code</th>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium">
                        {entry.position}
                      </td>
                      <td className="py-3 px-2">{entry.email}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {entry.name || "-"}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            entry.referral_count > 0
                              ? "text-primary font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {entry.referral_count > 0 && (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          {entry.referral_count}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs">
                        {entry.referral_code}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.entries.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No entries found
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Top Referrers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Top Referrers
            </h2>
            <div className="space-y-3">
              {data.topReferrers.map((referrer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-500"
                          : index === 1
                          ? "bg-gray-400/20 text-gray-400"
                          : index === 2
                          ? "bg-orange-500/20 text-orange-500"
                          : "bg-muted"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {referrer.email.substring(0, 20)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Position #{referrer.position}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {referrer.referral_count}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      referrals
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
