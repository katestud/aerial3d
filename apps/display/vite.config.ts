import { ViteDevServer, defineConfig } from "vite";

import fs from "fs";
import path from "path";
import react from "@vitejs/plugin-react";

function recordingsMiddleware() {
  return {
    name: "recordings-middleware",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/recordings", (req, res) => {
        const recordingsDir = path.join(__dirname, "public/recordings");
        try {
          const files = fs
            .readdirSync(recordingsDir)
            .filter((file: string) => file.endsWith(".csv"));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
        } catch (error) {
          console.error("Error reading recordings directory:", error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to load recordings" }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), recordingsMiddleware()],
});
