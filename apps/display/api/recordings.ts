import { dirname } from "path";
import { fileURLToPath } from "url";
import { join } from "path";
import { readdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  try {
    const recordingsDir = join(process.cwd(), "public/recordings");
    const files = await readdir(recordingsDir);
    const csvFiles = files.filter((file) => file.endsWith(".csv"));
    return res.json(csvFiles);
  } catch (error) {
    console.error("Error reading recordings directory:", error);
    return res.status(500).json({ error: "Failed to load recordings" });
  }
}
