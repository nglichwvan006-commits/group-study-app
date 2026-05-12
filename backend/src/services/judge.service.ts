import { runInSandbox, SandboxOptions, SandboxResult } from '../judge/sandbox';

export interface JudgeRequest {
    language: string;
    sourceCode: string;
    stdin: string;
    timeLimit: number; // ms
    memoryLimit: number; // MB
}

export interface JudgeResponse {
    stdout: string;
    stderr: string;
    exitCode: number;
    runtimeMs: number;
    memoryKb: number;
    compileError: string | null;
    runtimeError: string | null;
    timeout: boolean;
    status: 'ACCEPTED' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'WRONG_ANSWER' | 'PENDING';
}

export class JudgeService {
    /**
     * Thực thi mã nguồn người dùng trong môi trường Sandbox
     */
    public static async executeCode(request: JudgeRequest): Promise<JudgeResponse> {
        const { language, sourceCode, stdin, timeLimit, memoryLimit } = request;

        try {
            const sandboxOptions: SandboxOptions = {
                language: language.toLowerCase(),
                code: sourceCode,
                input: stdin,
                timeLimitMs: timeLimit,
                memoryLimitMb: memoryLimit
            };

            const result: SandboxResult = await runInSandbox(sandboxOptions);

            // Mapping SandboxResult sang JudgeResponse chuẩn production
            const response: JudgeResponse = {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
                runtimeMs: result.runtime,
                memoryKb: result.memory,
                compileError: result.status === 'CE' ? result.compileOutput || result.stderr : null,
                runtimeError: result.status === 'RE' ? result.stderr : null,
                timeout: result.status === 'TLE',
                status: this.mapSandboxStatus(result.status)
            };

            return response;
        } catch (error: any) {
            console.error('[JudgeService] Execution Error:', error);
            return {
                stdout: '',
                stderr: error.message,
                exitCode: -1,
                runtimeMs: 0,
                memoryKb: 0,
                compileError: null,
                runtimeError: error.message,
                timeout: false,
                status: 'RUNTIME_ERROR'
            };
        }
    }

    /**
     * Chuyển đổi trạng thái từ Sandbox sang trạng thái chuẩn của hệ thống Judge
     */
    private static mapSandboxStatus(status: string): JudgeResponse['status'] {
        switch (status) {
            case 'AC': return 'ACCEPTED';
            case 'CE': return 'COMPILE_ERROR';
            case 'RE': return 'RUNTIME_ERROR';
            case 'TLE': return 'TIME_LIMIT_EXCEEDED';
            case 'MLE': return 'MEMORY_LIMIT_EXCEEDED';
            default: return 'RUNTIME_ERROR';
        }
    }

    /**
     * So sánh output người dùng với output mong đợi
     * (Hỗ trợ bỏ qua khoảng trắng thừa và ký tự xuống dòng ở cuối)
     */
    public static compareOutput(actual: string, expected: string): boolean {
        const cleanActual = actual.trim().split(/\r?\n/).map(line => line.trim()).join('\n');
        const cleanExpected = expected.trim().split(/\r?\n/).map(line => line.trim()).join('\n');
        return cleanActual === cleanExpected;
    }
}
