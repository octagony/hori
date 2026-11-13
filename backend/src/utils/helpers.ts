import { ESCAPE_MAP } from "@/types/IDownload.interface";
import { Context } from "hono";

export const esc = (value: unknown): string => {
	return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]!);
};

export const pad = (n: number) => String(n).padStart(2, '0');

export const formatDuration = (videoSeconds: number): string => {
	const total = Math.max(0, Math.floor(videoSeconds || 0));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;

	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
};

export const readUrl = async (c: Context): Promise<string> => {
	const type = (c.req.header('content-type') ?? '').toLowerCase();

	if (type.includes('application/json')) {
		const body: { url?: string; } = await c.req.json();
		return (body.url ?? '').trim();
	}

	if (type.includes('form-urlencoded') || type.includes('multipart/form-data')) {
		const body = await c.req.parseBody();
		return String(body.url ?? '').trim();
	}

	const raw = await c.req.text().catch(() => '');

	try {
		const parsed = JSON.parse(raw);
		if (parsed?.url) {
			return String(parsed.url).trim();
		}
	} catch (e) {
		throw new Error(`Error while read url - ${(e as Error).message}`);
	}

	return (new URLSearchParams(raw).get('url') ?? '').trim();
};

export const isHtmx = (c: Context): boolean => c.req.header('HX-Request') === 'true';