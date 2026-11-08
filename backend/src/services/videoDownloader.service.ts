import { spawn } from 'node:child_process';
import { IVideoInfo } from "@/types/IVideo.interface";
import { YTDLP_ARG_DUMP_SINGLE_JSON, YTDLP_ARG_FORMAT, YTDLP_ARG_MERGE_OUTPUT_FORMAT, YTDLP_ARG_NO_DOWNLOAD, YTDLP_ARG_NO_PLAYLIST, YTDLP_ARG_NO_WARNINGS, YTDLP_ARG_OUTPUT, YTDLP_ARG_PRINT_JSON, YTDLP_PARAM_BEST_QUALITY, YTDLP_PARAM_MP4 } from "@/utils/constants";

export class VideoDownloaderService {
	private readonly binary: string;
	private readonly timeoutMs: number;

	constructor() {
		this.binary = process.env.YTDLP_BINARY!;
		this.timeoutMs = 60_000;
	}

	async getInfo(url: string): Promise<IVideoInfo> {

		const args = [
			YTDLP_ARG_NO_WARNINGS,
			YTDLP_ARG_NO_PLAYLIST,
			YTDLP_ARG_DUMP_SINGLE_JSON,
			YTDLP_ARG_NO_DOWNLOAD,
			url,
		];

		const stdout = await this.execute(args);

		try {
			const data = JSON.parse(stdout);
			return this.normalizeInfo(data);
		} catch (err) {
			throw new Error(`Error in getInfo ${(err as Error).message}`);
		}
	}

	private execute(args: string[]): Promise<string> {
		return new Promise((resolve, reject) => {

			const proc = spawn(this.binary, args, {
				stdio: ['ignore', 'pipe', 'pipe'],
			});

			let stdout = '';
			let stderr = '';

			proc.stdout.on('data', (chunk) => {
				stdout += chunk.toString();
			});

			proc.stderr.on('data', (chunk) => {
				stderr += chunk.toString();
			});

			const timer = setTimeout(() => {
				proc.kill('SIGKILL');
				reject(new Error(`Timeout error, max time ${this.timeoutMs}`));
			}, this.timeoutMs);

			proc.on('close', (code) => {
				clearTimeout(timer);
				if (code === 0) {
					resolve(stdout);
				} else {
					reject(new Error(`Execute error with code ${code}`));
				}
			});

			proc.on('error', (err) => {
				clearTimeout(timer);
				reject(`Process not working ${err.message}`);
			});
		});
	}

	async download(url: string, downloadDir: string, jobId: string): Promise<string> {
		const { mkdir } = await import('node:fs/promises');
		await mkdir(downloadDir, { recursive: true });

		const args = [
			YTDLP_ARG_NO_WARNINGS,
			YTDLP_ARG_NO_PLAYLIST,
			YTDLP_ARG_FORMAT, YTDLP_PARAM_BEST_QUALITY,
			YTDLP_ARG_OUTPUT, `${downloadDir}/${jobId}.%(ext)s`,
			YTDLP_ARG_MERGE_OUTPUT_FORMAT, YTDLP_PARAM_MP4,
			YTDLP_ARG_PRINT_JSON,
			url,
		];

		try {
			const stdout = await this.execute(args);

			const lines = stdout.trim().split('\n');
			const lastLine = lines[lines.length - 1]!;

			let filePath = '';

			const info = JSON.parse(lastLine);
			filePath = info._filename || info.filepath || `${downloadDir}/${jobId}.${info.ext}`;

			return filePath;
		} catch (err) {
			throw new Error(`Error in download ${(err as Error).message}`);
		}
	}

	private normalizeInfo(raw: any): IVideoInfo {
		return {
			id: raw.id,
			title: raw.title,
			duration: raw.duration ?? 0,
			thumbnail: raw.thumbnail ?? null,
			uploader: raw.uploader ?? raw.channel ?? 'Unknown',
			url: raw.url,
			formats: (raw.formats ?? []).map((f: any) => ({
				format_id: f.format_id,
				ext: f.ext,
				resolution: f.resolution ?? null,
				filesize: f.filesize ?? f.filesize_approx ?? null,
				vcodec: f.vcodec ?? null,
				acodec: f.acodec ?? null,
			})),
		};
	}
}

export const videoDownloader = new VideoDownloaderService();