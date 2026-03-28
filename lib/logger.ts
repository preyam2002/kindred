// Structured logger for production
// In production, logs JSON for ingestion by log aggregators
// In development, logs human-readable format

const isProduction = process.env.NODE_ENV === "production";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  error?: string;
  stack?: string;
  meta?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify(entry);
  }
  const prefix = `[${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ""}`;
  const errorInfo = entry.error ? ` | ${entry.error}` : "";
  return `${prefix} ${entry.message}${errorInfo}`;
}

function log(level: LogLevel, message: string, context?: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    meta,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "debug":
      if (!isProduction) console.debug(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  debug: (message: string, context?: string, meta?: Record<string, unknown>) =>
    log("debug", message, context, meta),
  info: (message: string, context?: string, meta?: Record<string, unknown>) =>
    log("info", message, context, meta),
  warn: (message: string, context?: string, meta?: Record<string, unknown>) =>
    log("warn", message, context, meta),
  error: (message: string, context?: string, error?: unknown) => {
    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    if (error instanceof Error) {
      entry.error = error.message;
      if (!isProduction) entry.stack = error.stack;
    } else if (error && typeof error === "object") {
      entry.error = JSON.stringify(error);
    }
    const formatted = formatEntry(entry);
    console.error(formatted);
  },
};
