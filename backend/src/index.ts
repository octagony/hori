import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Queue } from 'bullmq';
import { existsSync } from 'node:fs';
import { videoDownloader } from '@/services/videoDownloader.service';
import { DOWNLOADS_WORKER_NAME } from '@/utils/constants';
import {
  previewCard, progressBlock, completedBlock, errorBlock,
} from '@/views/download.views';
import { isHtmx, readUrl } from "./utils/helpers";

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

const downloadQueue = new Queue(DOWNLOADS_WORKER_NAME, {
  connection: { url: process.env.REDIS_URL },
});

app.post('/api/download', async (c) => {
  const url = await readUrl(c);

  if (!url) {
    return isHtmx(c)
      ? c.html(errorBlock('Paste link to video'))
      : c.json({ ok: false, error: 'URL field is required' }, 400);
  }

  try {
    const info = await videoDownloader.getInfo(url);

    const job = await downloadQueue.add('download-video', {
      url,
      title: info.title,
      status: 'queued',
    });

    if (isHtmx(c)) {
      return c.html(
        previewCard({
          id: info.id,
          title: info.title,
          duration: info.duration,
          thumbnail: info.thumbnail,
          uploader: info.uploader,
          url,
        }) +
        `<div id="status">${progressBlock(String(job.id), 0, true)}</div>`,
      );
    }

    return c.json({
      ok: true,
      jobId: job.id,
      videoTitle: info.title
    });

  } catch (err) {
    const message = (err as Error).message;
    return isHtmx(c)
      ? c.html(errorBlock(message))
      : c.json({ ok: false, error: message }, 500);
  }
});

app.get('/api/download/:id', async (c) => {
  const jobId = c.req.param('id');
  const job = await downloadQueue.getJob(jobId);

  if (!job) {
    return c.json({
      ok: false,
      error: 'Task not found'
    }, 404);
  }

  const state = await job.getState();
  const progress = Number(job.progress) || 0;

  if (isHtmx(c)) {
    if (state === 'completed' && job.returnvalue?.filePath) {
      return c.html(completedBlock(jobId, job.returnvalue.filename ?? `${jobId}.mp4`));
    }

    if (state === 'failed') {
      return c.html(errorBlock(job.failedReason ?? 'The video could not be downloaded'));
    }

    return c.html(progressBlock(jobId, progress, state === 'waiting'));
  }

  return c.json({
    ok: true,
    jobId: job.id,
    status: state,
    progress,
    result: job.returnvalue,
    failedReason: job.failedReason,
  });
});

app.get('/api/download/:id/file', async (c) => {
  const jobId = c.req.param('id');
  const job = await downloadQueue.getJob(jobId);

  if (!job?.returnvalue?.filePath) {
    return c.json({ ok: false, error: 'File not ready or not found' }, 404);
  }

  const { filePath, filename } = job.returnvalue;

  if (!existsSync(filePath)) {
    return c.json({ ok: false, error: 'File not found on disk' }, 404);
  }

  c.header('X-Accel-Redirect', `/protected-downloads/${filename}`);
  c.header('Content-Type', 'video/mp4');
  c.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  return c.body(null, 200);
});

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });