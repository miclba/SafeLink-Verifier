import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for VirusTotal data
  app.post("/api/vt-data", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }

      let vtResult = null;
      const vtApiKey = process.env.VIRUSTOTAL_API_KEY;

      if (vtApiKey) {
        try {
          // VirusTotal v3 API
          const urlBase64 = Buffer.from(formattedUrl).toString('base64').replace(/=/g, '');
          
          const vtResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlBase64}`, {
            headers: {
              'x-apikey': vtApiKey
            }
          });

          if (vtResponse.ok) {
            vtResult = await vtResponse.json();
          } else if (vtResponse.status === 404) {
            const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
              method: 'POST',
              headers: {
                'x-apikey': vtApiKey,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({ url: formattedUrl })
            });
            
            if (submitResponse.ok) {
              vtResult = { status: "submitted", message: "URL submitted for scanning. Analysis in progress." };
            }
          }
        } catch (vtErr) {
          console.error("VirusTotal Error:", vtErr);
        }
      }

      res.json({ vtResult, formattedUrl });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch VT data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
