import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

app.get('/', (c) => {
  return c.json({
    text: 'Test text'
  })
});

const port = Number(process.env.PORT) || 3000;

console.log(`Hori API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
