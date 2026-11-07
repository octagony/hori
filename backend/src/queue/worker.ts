import { DOWNLOADS_WORKER_NAME } from "@/utils/constants";
import { Worker } from "bullmq";

const downloadWorker = new Worker(DOWNLOADS_WORKER_NAME, async (job) => {
	console.log('Download Worker START');

	await new Promise((res) => setTimeout(res, 3000));

	return {
		status: 'Completed',
		message: 'Mock video'
	}
}, {
	connection: {
		url: process.env.REDIS_URL
	}
});

downloadWorker.on('completed', (job) => {
	console.log(`Worker Completed with jobId ${job.id}, value = ${job.returnvalue}`)
})

downloadWorker.on('failed', (job, err) => {
	console.log(`Worker Failed with jobId ${job?.id}, error = ${err}`)
})

console.log('Worker started')