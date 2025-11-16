"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Target,
  Flame,
  Trophy,
  Calendar,
  CheckCircle2,
  Circle,
  Star,
  Zap,
  TrendingUp,
  Award,
  Lock,
  ArrowRight,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  current_progress: number;
  reward_points: number;
  completed: boolean;
  expires_at: string;
  icon: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  total_points: number;
  level: number;
  next_level_points: number;
}

export default function ChallengesPage() {
  const { data: session, status } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [challengesRes, streakRes] = await Promise.all([
        fetch("/api/challenges"),
        fetch("/api/challenges/streak"),
      ]);

      if (challengesRes.ok) {
        const data = await challengesRes.json();
        setChallenges(data.challenges || []);
      }

      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreak(data);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      target: Target,
      star: Star,
      zap: Zap,
      trending: TrendingUp,
      award: Award,
      trophy: Trophy,
    };
    return icons[iconName] || Target;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading challenges...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-block p-4 bg-primary/10 border-2 border-primary/20 mb-6">
            <Target className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-4 letterpress">
            Daily Challenges & Streaks
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Complete daily challenges, build streaks, and earn rewards for exploring new content!
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="paper-card p-6">
              <Target className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Daily Challenges</h3>
              <p className="text-sm text-muted-foreground">
                Fresh challenges every day to keep things interesting
              </p>
            </div>
            <div className="paper-card p-6">
              <Flame className="w-8 h-8 text-orange-500 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Build Streaks</h3>
              <p className="text-sm text-muted-foreground">
                Maintain your streak for bonus rewards
              </p>
            </div>
            <div className="paper-card p-6">
              <Trophy className="w-8 h-8 text-yellow-500 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Level up and unlock exclusive badges
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 stamp bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-1"
          >
            Sign In to Start Challenges
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const activeChallenges = challenges.filter((c) => !c.completed);
  const completedChallenges = challenges.filter((c) => c.completed);

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
          <Target className="w-4 h-4" />
          Gamification
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Daily Challenges & Streaks
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Complete challenges, maintain your streak, and level up to unlock exclusive rewards!
        </p>
      </motion.div>

      {/* Streak Card */}
      {streak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="paper-card p-8 corner-brackets bg-gradient-to-br from-orange-500/10 via-red-500/10 to-yellow-500/10">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Current Streak */}
              <div className="text-center">
                <Flame className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                <div className="font-display text-5xl font-bold mb-2">
                  {streak.current_streak}
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Day Streak
                </div>
              </div>

              {/* Longest Streak */}
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                <div className="font-display text-5xl font-bold mb-2">
                  {streak.longest_streak}
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Best Streak
                </div>
              </div>

              {/* Level */}
              <div className="text-center">
                <Star className="w-12 h-12 mx-auto mb-3 text-primary" />
                <div className="font-display text-5xl font-bold mb-2">
                  {streak.level}
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Level
                </div>
              </div>

              {/* Points */}
              <div className="text-center">
                <Zap className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                <div className="font-display text-5xl font-bold mb-2">
                  {streak.total_points}
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Total Points
                </div>
              </div>
            </div>

            {/* Progress to Next Level */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress to Level {streak.level + 1}</span>
                <span className="text-muted-foreground">
                  {streak.total_points} / {streak.next_level_points} points
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(streak.total_points / streak.next_level_points) * 100}%`,
                  }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Challenges */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Today's Challenges</h2>
        {activeChallenges.length === 0 ? (
          <div className="paper-card p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">All Challenges Complete!</h3>
            <p className="text-muted-foreground">
              Check back tomorrow for new challenges
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {activeChallenges.map((challenge, index) => {
              const Icon = getIconComponent(challenge.icon);
              const progress = (challenge.current_progress / challenge.target) * 100;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="paper-card p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold mb-1">
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {challenge.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {challenge.reward_points}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">
                        {challenge.current_progress} / {challenge.target}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Expires */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Expires {new Date(challenge.expires_at).toLocaleDateString()}</span>
                    </div>
                    {progress >= 100 && (
                      <span className="text-green-500 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready to claim!
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Completed Today</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {completedChallenges.map((challenge, index) => {
              const Icon = getIconComponent(challenge.icon);

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="paper-card p-4 opacity-60"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{challenge.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Completed</span>
                        <span>•</span>
                        <span className="text-yellow-600 font-medium">
                          +{challenge.reward_points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
