import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3100;

// Dynamic configuration endpoint for frontend injection
app.get("/config.js", (req, res) => {
  const apiUrl =
    process.env.VITE_API_URL || "https://paperplayground.onrender.com/api/v1";
  res.type("application/javascript");
  res.send(`window.APP_CONFIG = { BASE_URL: "${apiUrl}" };`);
});

// Serve static files from the current directory
app.use(express.static(__dirname));

const server = app.listen(PORT, () => {
  console.log(`\x1b[36m%s\x1b[0m`, `-----------------------------------------`);
  console.log(`\x1b[32m%s\x1b[0m`, `  PaperPlayground Dev Server Running  `);
  console.log(`\x1b[36m%s\x1b[0m`, `  URL: http://localhost:${PORT}        `);
  console.log(`\x1b[36m%s\x1b[0m`, `-----------------------------------------`);
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
});
