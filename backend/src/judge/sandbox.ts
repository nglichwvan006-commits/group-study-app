import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface SandboxOptions {
    language: string;
    code: string;
    input: string;
    timeLimitMs: number;
    memoryLimitMb: number;
}

export interface SandboxResult {
    status: 'AC' | 'WA' | 'CE' | 'RE' | 'TLE' | 'MLE';
    stdout: string;
    stderr: string;
    compileOutput?: string;
    runtime: number; // in milliseconds
    memory: number; // in Kilobytes
    exitCode: number;
}

const getFileExt = (lang: string) => {
    switch(lang) {
        case 'cpp': return 'cpp';
        case 'python': return 'py';
        case 'java': return 'java';
        case 'csharp': return 'cs';
        default: return 'txt';
    }
};

const getFileName = (lang: string) => {
    // Với Java, Class public chứa hàm main phải trùng tên file
    if (lang === 'java') return 'Main.java';
    return `solution.${getFileExt(lang)}`;
};

/**
 * Hàm khởi chạy Code Sandbox
 */
export const runInSandbox = async (options: SandboxOptions): Promise<SandboxResult> => {
    const { language, code, input, timeLimitMs, memoryLimitMb } = options;
    const runId = crypto.randomUUID();
    // Tạo thư mục tạm trên Host để chứa file code
    const tmpDir = path.join(__dirname, '../../tmp/judge', runId);

    try {
        await fs.mkdir(tmpDir, { recursive: true });
        
        const fileName = getFileName(language);
        const sourcePath = path.join(tmpDir, fileName);
        
        // Ghi mã nguồn người dùng vào file tạm
        await fs.writeFile(sourcePath, code);

        // Security constraints cực kỳ quan trọng
        const dockerArgs = [
            'run',
            '--rm',                     // Tự động xóa container sau khi chạy xong
            '-i',                       // Keep STDIN open
            '--network', 'none',        // Không cho phép truy cập Internet
            '--read-only',              // Không cho phép ghi đè lên file hệ thống
            '--tmpfs', '/tmp:exec',     // Cho phép ghi vào thư mục tạm /tmp bên trong container để biên dịch
            '-m', `${memoryLimitMb + 200}m`, // Giới hạn RAM của Docker (Cộng thêm 200MB bù đắp overhead của OS/Docker)
            '--cpus', '1.0',            // Giới hạn 1 CPU Core
            '--pids-limit', '64',       // Ngăn chặn tấn công Fork Bomb (Tạo quá nhiều tiến trình)
            '-v', `${tmpDir}:/workspace:ro`, // Mount mã nguồn vào container dưới quyền Read-Only
            'judge-sandbox',            // Tên image
            language,                   // Tham số 1 cho runner.sh
            `/workspace/${fileName}`    // Tham số 2 cho runner.sh
        ];

        return await new Promise<SandboxResult>((resolve) => {
            const child = spawn('docker', dockerArgs);
            
            let stdout = '';
            let stderr = '';
            
            // Thu thập output
            child.stdout.on('data', (data) => stdout += data.toString());
            child.stderr.on('data', (data) => stderr += data.toString());
            
            // Gửi dữ liệu Input qua STDIN
            child.stdin.write(input);
            child.stdin.end();

            let isTle = false;
            // Timeout bảo vệ Host: Nếu Docker bị kẹt, ép buộc tắt sau khoảng buffer time
            const timeout = setTimeout(() => {
                isTle = true;
                child.kill('SIGKILL');
            }, timeLimitMs + 3000); 

            child.on('close', (code) => {
                clearTimeout(timeout);
                
                if (isTle) {
                    return resolve({ status: 'TLE', stdout, stderr, runtime: timeLimitMs, memory: 0, exitCode: 137 });
                }

                // Mã 200 do script runner.sh trả về đại diện cho Compile Error
                if (code === 200) {
                    return resolve({ status: 'CE', stdout, stderr, compileOutput: stderr, runtime: 0, memory: 0, exitCode: code });
                }

                // Phân tích Runtime và Memory từ Stderr
                let runtime = 0;
                let memory = 0;
                let cleanedStderr = stderr;

                const timeRegex = /%%TIME:([\d.]+)%%/;
                const memRegex = /%%MEM:(\d+)%%/;

                const timeMatch = stderr.match(timeRegex);
                const memMatch = stderr.match(memRegex);

                if (timeMatch) {
                    runtime = Math.round(parseFloat(timeMatch[1]) * 1000);
                    cleanedStderr = cleanedStderr.replace(timeMatch[0], '');
                }
                
                if (memMatch) {
                    memory = parseInt(memMatch[1], 10);
                    cleanedStderr = cleanedStderr.replace(memMatch[0], '');
                }

                // Xác định trạng thái cuối
                let status: SandboxResult['status'] = 'AC'; // Giả định thành công, việc so sánh AC/WA sẽ do Compare function xử lý sau
                
                if (code !== 0) status = 'RE'; // Bị crash, Runtime Error
                else if (runtime > timeLimitMs) status = 'TLE';
                else if (memory > memoryLimitMb * 1024) status = 'MLE';

                resolve({
                    status,
                    stdout: stdout.trim(),
                    stderr: cleanedStderr.trim(),
                    runtime,
                    memory,
                    exitCode: code || 0
                });
            });
        });
    } catch (error: any) {
        return { status: 'RE', stdout: '', stderr: error.message, runtime: 0, memory: 0, exitCode: -1 };
    } finally {
        // Dọn dẹp thư mục tạm ngay sau khi thực thi xong
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (e) {
            console.error('[Sandbox] Failed to cleanup tmp dir', e);
        }
    }
};
