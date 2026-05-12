import { Queue, Worker, Job } from 'bullmq';
import { ProblemJudgeService } from './problem-judge.service';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const getRedisConfig = () => ({
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(REDIS_URL.startsWith('rediss') ? { tls: { rejectUnauthorized: false } } : {})
});

// Mỗi instance (Queue, Worker) nên có một connection riêng nếu dùng ioredis instance
export const judgeQueue = new Queue('judge-queue', { 
    connection: new IORedis(REDIS_URL, getRedisConfig()) 
});

// Cấu hình Worker
export const startJudgeWorker = () => {
    console.log(`[BullMQ] Initializing Worker with Redis: ${REDIS_URL.split('@').pop()} (maxRetriesPerRequest: null)`);
    
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
            connection: new IORedis(REDIS_URL, getRedisConfig()),
            concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10)
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
