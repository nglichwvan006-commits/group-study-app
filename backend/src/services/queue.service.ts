import { Queue, Worker, Job } from 'bullmq';
import { ProblemJudgeService } from './problem-judge.service';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Tạo Queue
export const judgeQueue = new Queue('judge-queue', { connection: redisConnection });

// Cấu hình Worker
export const startJudgeWorker = () => {
    const worker = new Worker(
        'judge-queue',
        async (job: Job) => {
            console.log(`[Worker] Starting job ${job.id} for submission ${job.data.submissionId}`);
            try {
                const result = await ProblemJudgeService.judgeSubmission(job.data.submissionId);
                console.log(`[Worker] Job ${job.id} completed with status: ${result.overallStatus}`);
                return result;
            } catch (error) {
                console.error(`[Worker] Job ${job.id} failed:`, error);
                throw error;
            }
        },
        { 
            connection: redisConnection,
            concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10) // Scale worker
        }
    );

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} marked as completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} has failed with ${err.message}`);
    });

    console.log('[Worker] Judge Worker started and listening for jobs...');
    return worker;
};
