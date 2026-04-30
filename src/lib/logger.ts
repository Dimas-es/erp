type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function minLevel(): number {
  const env = (process.env.LOG_LEVEL ?? "info").toLowerCase() as Level;
  return levelOrder[env] ?? 1;
}

function log(level: Level, msg: string, extra?: Record<string, unknown>) {
  if (levelOrder[level] < minLevel()) return;
  const line = `[${level.toUpperCase()}] ${msg}`;
  if (extra && Object.keys(extra).length > 0) {
    console[level === "error" ? "error" : "log"](line, extra);
  } else {
    console[level === "error" ? "error" : "log"](line);
  }
}

export const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => log("debug", msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => log("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => log("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => log("error", msg, extra),
};
