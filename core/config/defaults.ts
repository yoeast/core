/**
 * Core framework default configuration.
 */

import { env } from "./env";

export default {
  app: {
    name: env("APP_NAME", "Core"),
    env: env("APP_ENV", "production"),
    debug: env("APP_DEBUG", false),
    url: env("APP_URL", "http://localhost:3000"),
    key: env("APP_KEY", ""),
  },

  server: {
    port: env("PORT", 3000),
    host: env("HOST", "0.0.0.0"),
  },

  database: {
    uri: env("MONGODB_URI", "mongodb://localhost:27017/core"),
  },

  views: {
    path: "app/views",
    cache: env("VIEW_CACHE", true),
    cachePath: "storage/views",
  },

  static: {
    path: "public",
    maxAge: env("STATIC_MAX_AGE", 86400), // 1 day in seconds
  },

  storage: {
    path: "storage",
    cache: "storage/cache",
    logs: "storage/logs",
    views: "storage/views",
  },

  logging: {
    path: "storage/logs",
    level: env("LOG_LEVEL", "info"),
  },
};
