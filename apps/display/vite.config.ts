import { defineConfig } from "vite";
import { join } from "path";
import react from "@vitejs/plugin-react";
import { readdirSync } from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "recordings-list",
      resolveId(id) {
        if (id === "virtual:recordings-list") {
          return "\0virtual:recordings-list";
        }
      },
      load(id) {
        if (id === "\0virtual:recordings-list") {
          const recordingsDir = join(__dirname, "public/recordings");
          const files = readdirSync(recordingsDir).filter((file) =>
            file.endsWith(".csv")
          );
          return `export default ${JSON.stringify(files)}`;
        }
      },
    },
    react(),
  ],
});
