import express from "express";
import path from "path";
import cors from "cors";
import ytdl from "@distube/ytdl-core";
import { createServer as createViteServer } from "vite";
import https from "https";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Proxy for Internet Radio to bypass CORS for Web Audio API
  app.get("/api/proxy", (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) return res.status(400).send("No URL");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    let activeReq: any = null;

    function fetchStream(currentUrl: string, redirectsLeft: number) {
      try {
        const parsed = new URL(currentUrl);
        const client = parsed.protocol === "https:" ? https : http;
        activeReq = client.get(
          currentUrl,
          {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Accept": "*/*"
            }
          },
          (proxyRes) => {
            if (
              proxyRes.statusCode &&
              proxyRes.statusCode >= 300 &&
              proxyRes.statusCode < 400 &&
              proxyRes.headers.location &&
              redirectsLeft > 0
            ) {
              proxyRes.resume(); // consume response data to free up memory
              const nextUrl = new URL(proxyRes.headers.location, currentUrl).toString();
              return fetchStream(nextUrl, redirectsLeft - 1);
            }

            res.setHeader("Content-Type", proxyRes.headers["content-type"] || "audio/mpeg");
            proxyRes.pipe(res);
          }
        );

        activeReq.on("error", (e: any) => {
          if (!res.headersSent) {
            res.status(500).send(e.message);
          }
        });
      } catch (err: any) {
        if (!res.headersSent) {
          res.status(500).send(err.message);
        }
      }
    }

    req.on("close", () => {
      if (activeReq) {
        try {
          activeReq.destroy();
        } catch (_) {}
      }
    });

    fetchStream(streamUrl, 5);
  });

  // YT Audio Info Route
  app.get("/api/yt/info", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      // Check if YouTube playlist
      const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (listMatch && listMatch[1]) {
        try {
          const oeRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${listMatch[1]}&format=json`);
          if (oeRes.ok) {
            const data: any = await oeRes.json();
            return res.json({ title: data.title, author: data.author_name, playlistId: listMatch[1], isPlaylist: true });
          }
        } catch (e) {
          console.warn("oEmbed playlist fetch failed:", e);
        }
        return res.json({ title: `YT PLAYLIST: ${listMatch[1].slice(0, 12)}`, playlistId: listMatch[1], isPlaylist: true });
      }

      // Check if YouTube link or video ID
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
      const videoId = ytMatch ? ytMatch[1] : (/^[\w-]{11}$/.test(url.trim()) ? url.trim() : null);

      if (videoId) {
        try {
          const oeRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (oeRes.ok) {
            const data: any = await oeRes.json();
            return res.json({ title: data.title, author: data.author_name, videoId });
          }
        } catch (e) {
          console.warn("oEmbed fetch failed:", e);
        }
        return res.json({ title: `YOUTUBE: ${videoId}`, videoId });
      }

      // If it's another web stream or radio url
      return res.json({ title: "WEB AUDIO STREAM", url });
    } catch (err: any) {
      console.error("YT Info Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // YT Audio Streaming Route
  app.get("/api/yt", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url || !ytdl.validateURL(url)) {
        return res.status(400).send("Invalid YouTube URL");
      }

      const stream = ytdl(url, {
        filter: "audioonly",
        highWaterMark: 1 << 25, // 32MB buffer to prevent chunking issues
      });

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Transfer-Encoding", "chunked");

      stream.on("error", (err) => {
        console.error("YTDL Stream Error:", err);
        if (!res.headersSent) res.status(500).send("Stream error");
      });

      stream.pipe(res);
    } catch (err: any) {
      console.error(err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    }
  });

  // Serve static assets from public folder
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
