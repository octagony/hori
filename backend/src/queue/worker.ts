import { videoDownloader } from "@/services/videoDownloader.service";
import { DOWNLOADS_WORKER_NAME } from "@/utils/constants";
import { Worker } from "bullmq";

const downloadWorker = new Worker(DOWNLOADS_WORKER_NAME, async (job) => {
	console.log('Download Worker START');

	try {
		await job.updateProgress(10);

		await job.updateData({ ...job.data, status: "preparing" });

		await job.updateProgress(50);

		const filePath = await videoDownloader.download(job.data.url, "/var/www/storage/downloads", job.id as string);

		await job.updateProgress(100);

		return {
			status: "[Worker] Completed",
			message: "[Worker] Video success downloaded",
			filePath: filePath,
			filename: filePath.split("/").pop(),
		};
	} catch (err) {
		throw new Error(`[Worker] Worker stop with error ${(err as Error).message}`);
	}
}, {
	connection: {
		url: process.env.REDIS_URL
	},
	concurrency: 2,
	removeOnComplete: { count: 100 },
	removeOnFail: { count: 100 }
});

downloadWorker.on('completed', (job) => {
	console.log(`Worker Completed with jobId ${job.id}, value = ${job.returnvalue}`);
});

downloadWorker.on('failed', (job, err) => {
	console.log(`Worker Failed with jobId ${job?.id}, error = ${err}`);
});

console.log('Worker started, awaited tasks');