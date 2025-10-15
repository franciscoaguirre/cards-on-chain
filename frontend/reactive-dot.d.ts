import type { config } from "./config.js";

declare module "@reactive-dot/core" {
  // Augment ReactiveDOT types with our app config
  interface Register {
    config: typeof config;
  }
}
