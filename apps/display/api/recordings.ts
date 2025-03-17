import { join } from "path";
import { readdirSync } from "fs";

export default function handler(req, res) {
  try {
    const recordingsDir = join(process.cwd(), "public/recordings");
    const files = readdirSync(recordingsDir).filter((file) =>
      file.endsWith(".csv")
    );
    res.json(files);
  } catch (error) {
    console.error("Error reading recordings directory:", error);
    res.status(500).json({ error: "Failed to load recordings" });
  }
}
