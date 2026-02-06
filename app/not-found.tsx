"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        {/* 404 Illustration */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-9xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            404
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Oops! The page you&apos;re looking for seems to have wandered off into the void.
            It might have been moved, deleted, or never existed in the first place.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>

          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
            className="group flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Link>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 p-6 border border-border rounded-lg bg-card"
        >
          <h2 className="text-lg font-semibold mb-4">Popular Pages</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/library"
              className="p-3 rounded-md hover:bg-accent transition-colors text-sm"
            >
              Library
            </Link>
            <Link
              href="/recommendations"
              className="p-3 rounded-md hover:bg-accent transition-colors text-sm"
            >
              Recommendations
            </Link>
            <Link
              href="/taste-match"
              className="p-3 rounded-md hover:bg-accent transition-colors text-sm"
            >
              Taste Match
            </Link>
            <Link
              href="/social-feed"
              className="p-3 rounded-md hover:bg-accent transition-colors text-sm"
            >
              Social Feed
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
