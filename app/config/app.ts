/**
 * Application configuration.
 * These values override the core defaults.
 */

import { env } from "@yoeast/core";

export default {
  name: env("APP_NAME", "My App"),
  version: "1.0.0",
};
