"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-destructive" />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1 className="text-4xl font-bold mb-4">Something Went Wrong</h1>
          <p className="text-lg text-muted-foreground mb-4">
            We encountered an unexpected error. Don&apos;t worry, our team has been notified
            and we're working on fixing it.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-left">
              <p className="font-mono text-sm text-destructive break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
        >
          <button
            onClick={reset}
            className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 p-6 border border-border rounded-lg bg-card"
        >
          <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
          <p className="text-sm text-muted-foreground">
            If this error persists, please contact support with the error ID above.
            We're here to help!
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
