"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Users,
  Trophy,
  Check,
} from "lucide-react";

const steps = [
  {
    title: "Welcome to Kindred!",
    subtitle: "Find people who share your exact taste",
    content: (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-16 h-16 text-white" />
        </motion.div>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Let&apos;s set up your profile and find your kindred spirits
        </p>
      </div>
    ),
  },
  {
    title: "Rate Some Items",
    subtitle: "Help us understand your taste",
    content: (
      <div className="text-center">
        <Heart className="w-16 h-16 mx-auto mb-6 text-pink-500" />
        <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
          Rate at least 10 items to get started. The more you rate, the better your matches!
        </p>
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
            Start Rating Items
          </button>
          <p className="text-sm text-muted-foreground">
            Or connect your existing libraries to import ratings
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Find Your First Matches",
    subtitle: "Discover your taste twins",
    content: (
      <div className="text-center">
        <Users className="w-16 h-16 mx-auto mb-6 text-purple-500" />
        <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
          We&apos;ll find people with similar taste to yours. The more compatible you are, the better the recommendations!
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          {[70, 85, 92].map((score, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-500/20"
            >
              <div className="text-3xl font-bold text-primary mb-1">{score}%</div>
              <div className="text-xs text-muted-foreground">Match</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Try Viral Features",
    subtitle: "Engage with the community",
    content: (
      <div className="text-center">
        <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
        <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
          Challenge friends, create share cards, join leaderboards, and more!
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {[
            "Taste Challenge",
            "Year Wrapped",
            "Leaderboards",
            "AI Chat",
          ].map((feature, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors text-sm"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push("/dashboard");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
            <button
              onClick={skip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="paper-card p-12 mb-8"
          >
            <h1 className="text-4xl font-bold mb-3 text-center">
              {steps[currentStep].title}
            </h1>
            <p className="text-xl text-muted-foreground mb-12 text-center">
              {steps[currentStep].subtitle}
            </p>
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="w-5 h-5" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
