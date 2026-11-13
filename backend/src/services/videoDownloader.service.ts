import { spawn } from 'node:child_process';
import { IVideoExecute, IVideoInfo } from "@/types/IVideo.interface";
import { DOWNLOAD_TIMEOUT_MS, INFO_TIMEOUT_MS } from "@/utils/constants";

export class VideoDownloaderService {
	private readonly binary: string;

	constructor() {
		this.binary = process.env.YTDLP_BINARY!;
	}

	async getInfo(url: string): Promise<IVideoInfo> {
		const args = [
			'--no-warnings',
			'--no-playlist',
			'--dump-single-json',
			url
		];

		const { stdout } = await this.execute(args, INFO_TIMEOUT_MS);

		try {
			return this.normalizeInfo(JSON.parse(stdout));
		} catch (err) {
			throw new Error(`Error in getInfo: ${(err as Error).message}`);
		}
	}

	private execute(
		args: string[],
		timeoutMs: number
	): Promise<IVideoExecute> {
		return new Promise((resolve, reject) => {
			const proc = spawn(this.binary, args, { stdio: ['ignore', 'pipe', 'pipe'] });

			let stdout = '';
			let stderr = '';

			proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
			proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

			const timer = setTimeout(() => {
				proc.kill('SIGTERM');
				setTimeout(() => proc.kill('SIGKILL'), 5_000);
				reject(new Error(`Timeout ${timeoutMs}ms`));
			}, timeoutMs);

			proc.on('close', (code) => {
				clearTimeout(timer);
				if (code === 0) {
					resolve({ stdout, stderr, code });
				}

				if (code !== 0) {
					reject(new Error(`yt-dlp close with code ${code}`));
				}
			});

			proc.on('error', (err) => {
				clearTimeout(timer);
				reject(new Error(`Cant start proccess: ${err.message}`));
			});
		});
	}

	async download(url: string, downloadDir: string, jobId: string): Promise<string> {
		const { mkdir } = await import('node:fs/promises');
		await mkdir(downloadDir, { recursive: true });

		const args = [
			'--no-warnings',
			'--no-playlist',
			'-f', 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]',
			'-o', `${downloadDir}/.tmp-${jobId}-${Date.now()}.%(ext)s`,
			'--merge-output-format', 'mp4',
			'--downloader', 'aria2c',
			'--downloader-args',
			'aria2c:-c -j16 -s16 -x16 -k1M --min-split-size=1M --max-connection-per-server=16 --summary-interval=0 --console-log-level=warn',
			'--concurrent-fragments', '16',
			'--throttled-rate', '750K',
			'--retries', '10',
			'--fragment-retries', '10',
			'--socket-timeout', '15',
			'--force-ipv4',
			'--print-json',
			url,
		];

		try {
			const { stdout } = await this.execute(args, DOWNLOAD_TIMEOUT_MS);

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