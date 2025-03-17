import { join } from "path";
import { readdir } from "fs/promises";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  try {
    const recordingsDir = join(process.cwd(), "public/recordings");
    const files = await readdir(recordingsDir);
    const csvFiles = files.filter((file) => file.endsWith(".csv"));

    return new Response(JSON.stringify(csvFiles), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error reading recordings directory:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load recordings" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
