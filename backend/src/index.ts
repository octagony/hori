import { serve } from "@hono/node-server";
import { Queue } from "bullmq";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { DOWNLOADS_WORKER_NAME } from "./utils/constants";
import { videoDownloader } from "@/services/videoDownloader.service";
import { logger } from "hono/logger";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";

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
    const info = await videoDownloader.getInfo(url);
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

app.post('/api/download', async (c) => {
  const body = await c.req.json<{ url?: string; }>();
  const url = body.url?.trim();

  if (!url) {
    return c.json({ error: 'URL field is required' });
  }

  try {
    const info = await videoDownloader.getInfo(url);

    const queue = new Queue(DOWNLOADS_WORKER_NAME, {
      connection: { url: process.env.REDIS_URL }
    });

    const job = await queue.add('download-video', {
      url,
      title: info.title,
      status: 'queued'
    });

    return c.json({
      ok: true,
      jobId: job.id,
      message: 'Task added to queue',
      videoTitle: info.title
    });
  } catch (err) {
    return c.json({ ok: false, error: (err as Error).message }, 500);
  }
});

app.get('/api/download/:id', async (c) => {
  const jobId = c.req.param('id');

  const queue = new Queue(DOWNLOADS_WORKER_NAME, {
    connection: { url: process.env.REDIS_URL }
  });

  const job = await queue.getJob(jobId);

  if (!job) {
    return c.json({ error: 'Task not found' });
  }
  return c.json({
    ok: true,
    jobId: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
  });
});

app.get('/api/download/:id/file', async (c) => {
  const jobId = c.req.param('id');

  const queue = new Queue(DOWNLOADS_WORKER_NAME, {
    connection: { url: process.env.REDIS_URL }
  });

  const job = await queue.getJob(jobId);

  if (!job || !job.returnvalue?.filePath) {
    return c.json({ ok: false, error: 'File not ready or not found' }, 404);
  }

  const filePath = job.returnvalue.filePath;
  const fileName = job.returnvalue.filename || `${jobId}.mp4`;

  if (!existsSync(filePath)) {
    return c.json({ ok: false, error: 'File not found' }, 404);
  }

  c.header('X-Accel-Redirect', `/protected-downloads/${fileName}`);
  c.header('Content-Type', 'video/mp4');
  c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

  return c.body(null, 200);
});

const port = Number(process.env.PORT) || 3000;

console.log(`Hori API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
