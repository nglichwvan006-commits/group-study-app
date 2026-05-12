import { ProblemJudgeService } from '../services/problem-judge.service';
import { JudgeService } from '../services/judge.service';
import prisma from '../utils/prisma';

// Mock JudgeService and Prisma
jest.mock('../services/judge.service');
jest.mock('../utils/prisma', () => ({
    __esModule: true,
    default: {
        submission: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        submissionResult: {
            create: jest.fn(),
        },
    },
}));

describe('ProblemJudgeService Integration Tests (Mocked DB)', () => {
    const mockSubmissionId = 'test-submission-id';
    
    const mockSubmissionData = {
        id: mockSubmissionId,
        language: 'cpp',
        content: 'source code',
        assignment: {
            timeLimit: 1000,
            memoryLimit: 128,
            testCases: [
                { id: 'tc1', input: '1', expectedOutput: '2', weight: 50, isHidden: false, order: 1 },
                { id: 'tc2', input: '2', expectedOutput: '4', weight: 50, isHidden: true, order: 2 },
            ]
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Full Accepted (AC) flow', async () => {
        (prisma as any).submission.findUnique.mockResolvedValue(mockSubmissionData);
        
        // Mocking JudgeService.executeCode for both test cases
        (JudgeService.executeCode as jest.Mock)
            .mockResolvedValueOnce({ status: 'ACCEPTED', stdout: '2', stderr: '', runtimeMs: 10, memoryKb: 1024, exitCode: 0 })
            .mockResolvedValueOnce({ status: 'ACCEPTED', stdout: '4', stderr: '', runtimeMs: 15, memoryKb: 2048, exitCode: 0 });

        (JudgeService.compareOutput as any).mockReturnValue(true);

        const result = await ProblemJudgeService.judgeSubmission(mockSubmissionId);

        expect(result.overallStatus).toBe('ACCEPTED');
        expect(result.totalScore).toBe(100);
        expect(result.testResults.length).toBe(2);
        expect(prisma.submission.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'ACCEPTED', score: 100 })
        }));
    });

    test('2. Compile Error (CE) flow', async () => {
        (prisma as any).submission.findUnique.mockResolvedValue(mockSubmissionData);
        
        (JudgeService.executeCode as jest.Mock).mockResolvedValue({
            status: 'COMPILE_ERROR',
            compileError: 'Syntax error',
            stdout: '',
            stderr: '',
            runtimeMs: 0,
            memoryKb: 0,
            exitCode: 200
        });

        const result = await ProblemJudgeService.judgeSubmission(mockSubmissionId);

        expect(result.overallStatus).toBe('COMPILE_ERROR');
        expect(result.totalScore).toBe(0);
        expect(prisma.submission.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'COMPILE_ERROR' })
        }));
    });

    test('3. One test case fails (Wrong Answer)', async () => {
        (prisma as any).submission.findUnique.mockResolvedValue(mockSubmissionData);
        
        (JudgeService.executeCode as jest.Mock)
            .mockResolvedValueOnce({ status: 'ACCEPTED', stdout: '3', stderr: '', runtimeMs: 10, memoryKb: 1024, exitCode: 0 }) // WA because 3 != 2
            .mockResolvedValueOnce({ status: 'ACCEPTED', stdout: '4', stderr: '', runtimeMs: 15, memoryKb: 2048, exitCode: 0 });

        // First call WA, second call AC
        (JudgeService.compareOutput as any)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        const result = await ProblemJudgeService.judgeSubmission(mockSubmissionId);

        expect(result.overallStatus).toBe('WRONG_ANSWER');
        expect(result.totalScore).toBe(50); // Only second test case passed
        expect(prisma.submission.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'WRONG_ANSWER', score: 50 })
        }));
    });

    test('4. Time Limit Exceeded (TLE) on first test case', async () => {
        (prisma as any).submission.findUnique.mockResolvedValue(mockSubmissionData);
        
        (JudgeService.executeCode as jest.Mock).mockResolvedValue({
            status: 'TIME_LIMIT_EXCEEDED',
            stdout: '',
            stderr: '',
            runtimeMs: 1000,
            memoryKb: 1024,
            exitCode: 137
        });

        const result = await ProblemJudgeService.judgeSubmission(mockSubmissionId);

        expect(result.overallStatus).toBe('TIME_LIMIT_EXCEEDED');
        expect(prisma.submission.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'TIME_LIMIT_EXCEEDED' })
        }));
    });

    test('5. Runtime Error (RE)', async () => {
        (prisma as any).submission.findUnique.mockResolvedValue(mockSubmissionData);
        
        (JudgeService.executeCode as jest.Mock).mockResolvedValue({
            status: 'RUNTIME_ERROR',
            runtimeError: 'Crash',
            stdout: '',
            stderr: '',
            runtimeMs: 50,
            memoryKb: 5000,
            exitCode: 1
        });

        const result = await ProblemJudgeService.judgeSubmission(mockSubmissionId);

        expect(result.overallStatus).toBe('RUNTIME_ERROR');
        expect(prisma.submission.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: 'RUNTIME_ERROR' })
        }));
    });
});
