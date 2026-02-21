import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`\x1b[36m%s\x1b[0m`, `-----------------------------------------`);
    console.log(`\x1b[32m%s\x1b[0m`, `  PaperPlayground Dev Server Running  `);
    console.log(`\x1b[36m%s\x1b[0m`, `  URL: http://localhost:${PORT}        `);
    console.log(`\x1b[36m%s\x1b[0m`, `-----------------------------------------`);
});
