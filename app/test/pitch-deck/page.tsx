"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Rocket,
  BarChart3,
  Heart,
  Zap,
  Globe,
  Award,
} from "lucide-react";

const slides = [
  {
    title: "Kindred",
    subtitle: "Find Your Taste Twins",
    content: (
      <div className="flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Kindred
          </h1>
          <p className="text-3xl text-gray-300 mb-12">
            The Social Network for Taste Discovery
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-500" />
              <span>50K+ Media Items</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              <span>Growing User Base</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <span>Viral Features</span>
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    title: "The Problem",
    subtitle: "Finding Like-Minded People is Hard",
    content: (
      <div className="grid md:grid-cols-2 gap-12 h-full items-center">
        <div>
          <h3 className="text-4xl font-bold mb-8 text-purple-400">The Challenge</h3>
          <div className="space-y-6">
            {[
              "Social media connects people, but not based on shared interests",
              "Discovery platforms focus on content, not people",
              "No way to find others with similar taste across media types",
              "Communities are fragmented by platform",
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
                <p className="text-xl text-gray-300">{problem}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-950/30 to-orange-950/30 border border-red-500/20 rounded-2xl p-8">
          <div className="text-6xl font-bold text-red-400 mb-4">$2.1B</div>
          <p className="text-xl text-gray-300">
            Lost potential connections annually due to inefficient discovery
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "The Solution",
    subtitle: "AI-Powered Taste Matching",
    content: (
      <div className="h-full flex flex-col justify-center">
        <h3 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          How Kindred Works
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Users className="w-12 h-12" />,
              title: "Import Your Taste",
              description: "Connect your libraries from multiple platforms",
              color: "purple",
            },
            {
              icon: <Zap className="w-12 h-12" />,
              title: "AI Matching",
              description: "Advanced algorithm finds your perfect taste twins",
              color: "pink",
            },
            {
              icon: <Heart className="w-12 h-12" />,
              title: "Connect & Discover",
              description: "Get personalized recommendations from kindred spirits",
              color: "blue",
            },
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-500/20"
            >
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 mb-4`}>
                {step.icon}
              </div>
              <h4 className="text-2xl font-bold mb-3">{step.title}</h4>
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Market Opportunity",
    subtitle: "Massive TAM in Social Discovery",
    content: (
      <div className="grid md:grid-cols-2 gap-12 h-full items-center">
        <div className="space-y-8">
          <div>
            <div className="text-5xl font-bold text-purple-400 mb-2">$15B</div>
            <p className="text-xl text-gray-300">Total Addressable Market (TAM)</p>
          </div>
          <div>
            <div className="text-5xl font-bold text-pink-400 mb-2">$4.5B</div>
            <p className="text-xl text-gray-300">Serviceable Addressable Market (SAM)</p>
          </div>
          <div>
            <div className="text-5xl font-bold text-blue-400 mb-2">$450M</div>
            <p className="text-xl text-gray-300">Serviceable Obtainable Market (SOM)</p>
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-3xl font-bold mb-6">Target Demographics</h4>
          {[
            { label: "18-35 year olds", value: "Primary" },
            { label: "Content Enthusiasts", value: "Core Users" },
            { label: "Multi-Platform Users", value: "High Value" },
            { label: "Social Connectors", value: "Viral Growth" },
          ].map((demo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg bg-purple-950/30 border border-purple-500/20"
            >
              <span className="text-lg">{demo.label}</span>
              <span className="px-4 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm">
                {demo.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Business Model",
    subtitle: "Multiple Revenue Streams",
    content: (
      <div className="h-full flex flex-col justify-center">
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              icon: <DollarSign className="w-10 h-10" />,
              title: "Freemium Subscription",
              revenue: "$9.99/month",
              features: ["Unlimited matches", "Advanced analytics", "Priority recommendations"],
            },
            {
              icon: <Award className="w-10 h-10" />,
              title: "Creator Partnerships",
              revenue: "Revenue Share",
              features: ["Sponsored content", "Exclusive releases", "Creator tools"],
            },
            {
              icon: <TrendingUp className="w-10 h-10" />,
              title: "API Access",
              revenue: "$99-999/month",
              features: ["Taste data API", "Integration partners", "White-label solutions"],
            },
            {
              icon: <Globe className="w-10 h-10" />,
              title: "Advertising",
              revenue: "CPM Model",
              features: ["Native ads", "Sponsored matches", "Brand partnerships"],
            },
          ].map((model, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/50 to-pink-950/50 border border-purple-500/20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  {model.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{model.title}</h4>
                  <p className="text-purple-400">{model.revenue}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {model.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Traction",
    subtitle: "Rapid Growth & Engagement",
    content: (
      <div className="h-full flex flex-col justify-center">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { value: "10K+", label: "Active Users", growth: "+150% MoM" },
            { value: "85%", label: "User Retention", growth: "Above Industry Avg" },
            { value: "1M+", label: "Connections Made", growth: "+200% MoM" },
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-950/30 to-pink-950/30 border border-purple-500/20"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {metric.value}
              </div>
              <div className="text-xl text-gray-300 mb-3">{metric.label}</div>
              <div className="text-green-400 text-sm">{metric.growth}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/20">
            <BarChart3 className="w-10 h-10 text-purple-400 mb-4" />
            <h4 className="text-2xl font-bold mb-3">User Engagement</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• 45 min average session time</li>
              <li>• 12 matches per user average</li>
              <li>• 78% daily active users</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl bg-pink-950/30 border border-pink-500/20">
            <Rocket className="w-10 h-10 text-pink-400 mb-4" />
            <h4 className="text-2xl font-bold mb-3">Viral Growth</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• 1.8 viral coefficient</li>
              <li>• 40% referral sign-ups</li>
              <li>• 92% challenge completion rate</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "The Ask",
    subtitle: "Seed Round - $2M",
    content: (
      <div className="h-full flex flex-col justify-center">
        <div className="text-center mb-12">
          <h3 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            $2,000,000
          </h3>
          <p className="text-2xl text-gray-300">Seed Round</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h4 className="text-3xl font-bold mb-6 text-purple-400">Use of Funds</h4>
            <div className="space-y-4">
              {[
                { label: "Product Development", value: "40%" },
                { label: "User Acquisition", value: "30%" },
                { label: "Team Expansion", value: "20%" },
                { label: "Operations", value: "10%" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{item.label}</span>
                    <span className="text-purple-400 font-bold">{item.value}</span>
                  </div>
                  <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: item.value }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-3xl font-bold mb-6 text-pink-400">18-Month Milestones</h4>
            <div className="space-y-4">
              {[
                "100K active users",
                "$500K ARR",
                "Launch premium tier",
                "15 integration partners",
                "Series A ready",
              ].map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-pink-950/30 border border-pink-500/20"
                >
                  <Target className="w-6 h-6 text-pink-400 flex-shrink-0" />
                  <span className="text-lg">{milestone}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-2xl text-gray-300">
          Let's build the future of social discovery together 🚀
        </div>
      </div>
    ),
  },
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSlide]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-purple-950/50 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Slide Counter */}
      <div className="fixed top-8 right-8 z-50 text-gray-400 font-mono">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Main Slide */}
      <div className="relative h-screen p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col"
          >
            {/* Slide Header */}
            <div className="mb-12">
              <h2 className="text-5xl font-bold mb-2">{slides[currentSlide].title}</h2>
              <p className="text-2xl text-gray-400">{slides[currentSlide].subtitle}</p>
            </div>

            {/* Slide Content */}
            <div className="flex-1">{slides[currentSlide].content}</div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="p-3 rounded-full bg-purple-950/50 border border-purple-500/20 hover:bg-purple-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-purple-950"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="p-3 rounded-full bg-purple-950/50 border border-purple-500/20 hover:bg-purple-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Keyboard Navigation */}
      <div className="fixed bottom-8 left-8 text-sm text-gray-500 font-mono">
        Use ← → arrows to navigate
      </div>
    </div>
  );
}
