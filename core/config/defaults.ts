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

  cache: {
    default: env("CACHE_DRIVER", "lru"),
    enabled: env("CACHE_ENABLED", true), // Set to false to disable caching
    prefix: env("CACHE_PREFIX", "yoeast:"),
    ttl: env("CACHE_TTL", 3600), // Default TTL in seconds
    stores: {
      lru: {
        max: env("CACHE_LRU_MAX", 10000),
        ttl: env("CACHE_LRU_TTL", 3600),
      },
      redis: {
        host: env("REDIS_HOST", "localhost"),
        port: env("REDIS_PORT", 6379),
        password: env("REDIS_PASSWORD", ""),
        db: env("REDIS_DB", 0),
      },
    },
  },

  api: {
    tokenHeader: env("API_TOKEN_HEADER", "X-API-Token"),
    rateLimit: {
      enabled: env("API_RATE_LIMIT_ENABLED", false),
      windowMs: env("API_RATE_LIMIT_WINDOW", 60000), // 1 minute
      maxRequests: env("API_RATE_LIMIT_MAX", 100),
    },
  },

  cors: {
    origin: env("CORS_ORIGIN", "*"),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: [],
    credentials: env("CORS_CREDENTIALS", false),
    maxAge: env("CORS_MAX_AGE", 86400), // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  hints: {
    /** Resources to preload on every page */
    preload: [],
    /** Origins to preconnect to */
    preconnect: [],
    /** Resources to prefetch */
    prefetch: [],
    /** DNS to prefetch */
    dnsPrefetch: [],
  },
};
