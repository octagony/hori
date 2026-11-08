import { serve } from "@hono/node-server";
import { Queue } from "bullmq";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { DOWNLOADS_WORKER_NAME } from "./utils/constants";
import { ytDlp } from "@/services/videoDownloader.service";
import { logger } from "hono/logger";

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

app.get('/', (c) => {
  return c.json({
    text: 'Test text'
  });
});


app.post('/api/test-queue', async (c) => {
  const queue = new Queue(DOWNLOADS_WORKER_NAME, { connection: { url: process.env.REDIS_URL } });

  const job = await queue.add('download-video', {
    url: 'https://www.youtube.com/watch?v=w-sQRS-Lc9k',
    format: 'mp4'
  });

  return c.json({
    message: 'Add task to worker',
    jobId: job.id
  });
});

app.post('/api/info', async (c) => {
  const body = await c.req.json<{ url?: string; }>();
  const url = body.url?.trim();

  if (!url) {
    return c.json({ error: 'URL field is required' });
  }

  try {
    const info = await ytDlp.getInfo(url);
    return c.json({
      data: {
        id: info.id,
        title: info.title,
        duration: info.duration,
        uploader: info.uploader,
        thumbnail: info.thumbnail,
        formatsCount: info.formats.length,
      }
    });
  } catch (err) {
    return c.json({ ok: false, error: (err as Error).message }, 500);
  }
});

const port = Number(process.env.PORT) || 3000;

console.log(`Hori API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
