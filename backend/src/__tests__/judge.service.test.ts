import { JudgeService } from '../services/judge.service';
import * as sandbox from '../judge/sandbox';

// Mock the runInSandbox function to avoid actual Docker calls during unit tests
jest.mock('../judge/sandbox');
const mockedRunInSandbox = sandbox.runInSandbox as jest.MockedFunction<typeof sandbox.runInSandbox>;

describe('JudgeService Unit Tests', () => {
    const defaultRequest = {
        language: 'cpp',
        sourceCode: '#include <iostream>\nint main() { return 0; }',
        stdin: '',
        timeLimit: 1000,
        memoryLimit: 128
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Compile Error scenario', async () => {
        mockedRunInSandbox.mockResolvedValue({
            status: 'CE',
            stdout: '',
            stderr: 'Syntax error: expected ";"',
            compileOutput: 'Syntax error: expected ";"',
            runtime: 0,
            memory: 0,
            exitCode: 200
        });

        const response = await JudgeService.executeCode(defaultRequest);

        expect(response.status).toBe('COMPILE_ERROR');
        expect(response.compileError).toContain('Syntax error');
        expect(response.exitCode).toBe(200);
    });

    test('2. Wrong Answer scenario (handled by compareOutput)', async () => {
        const actualOutput = '10';
        const expectedOutput = '20';

        const isCorrect = JudgeService.compareOutput(actualOutput, expectedOutput);
        expect(isCorrect).toBe(false);
    });

    test('3. Runtime Error scenario', async () => {
        mockedRunInSandbox.mockResolvedValue({
            status: 'RE',
            stdout: '',
            stderr: 'Segmentation fault',
            runtime: 100,
            memory: 5000,
            exitCode: 139
        });

        const response = await JudgeService.executeCode(defaultRequest);

        expect(response.status).toBe('RUNTIME_ERROR');
        expect(response.runtimeError).toBe('Segmentation fault');
    });

    test('4. Time Limit Exceeded (TLE) scenario', async () => {
        mockedRunInSandbox.mockResolvedValue({
            status: 'TLE',
            stdout: '',
            stderr: '',
            runtime: 1000,
            memory: 2000,
            exitCode: 137
        });

        const response = await JudgeService.executeCode(defaultRequest);

        expect(response.status).toBe('TIME_LIMIT_EXCEEDED');
        expect(response.timeout).toBe(true);
    });

    test('5. Memory Limit Exceeded (MLE) scenario', async () => {
        mockedRunInSandbox.mockResolvedValue({
            status: 'MLE',
            stdout: '',
            stderr: '',
            runtime: 100,
            memory: 150000, // > 128MB
            exitCode: 0
        });

        const response = await JudgeService.executeCode(defaultRequest);

        expect(response.status).toBe('MEMORY_LIMIT_EXCEEDED');
    });

    test('6. Accepted (AC) scenario', async () => {
        mockedRunInSandbox.mockResolvedValue({
            status: 'AC',
            stdout: 'Hello World',
            stderr: '',
            runtime: 50,
            memory: 4096,
            exitCode: 0
        });

        const response = await JudgeService.executeCode(defaultRequest);

        expect(response.status).toBe('ACCEPTED');
        expect(response.stdout).toBe('Hello World');
        
        const isCorrect = JudgeService.compareOutput(response.stdout, 'Hello World\n');
        expect(isCorrect).toBe(true);
    });
});
