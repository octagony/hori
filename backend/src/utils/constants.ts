export const DOWNLOADS_WORKER_NAME = 'downloads';

export const INFO_TIMEOUT_MS = Number(process.env.YTDLP_INFO_TIMEOUT_MS ?? 30_000);
export const DOWNLOAD_TIMEOUT_MS = Number(process.env.YTDLP_DOWNLOAD_TIMEOUT_MS ?? 900_000);