import prisma from "../utils/prisma";
import { JudgeService, JudgeResponse } from "./judge.service";

export interface TestDetail {
    testCaseId: string;
    status: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE';
    runtime: number;
    memory: number;
    message?: string;
}

export interface ProblemJudgeResult {
    overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILE_ERROR' | 'RUNTIME_ERROR';
    runtimeMax: number;
    memoryMax: number;
    totalScore: number;
    testResults: TestDetail[];
    compileLog?: string;
}

export class ProblemJudgeService {
    /**
     * Quy trình chấm bài kiểu LeetCode cho một Submission
     */
    public static async judgeSubmission(submissionId: string): Promise<ProblemJudgeResult> {
        // 1. Lấy thông tin Submission, Problem và Test Cases
        const submission = await (prisma as any).submission.findUnique({
            where: { id: submissionId },
            include: {
                assignment: {
                    include: { testCases: { orderBy: { order: 'asc' } } }
                }
            }
        });

        if (!submission) {
            throw new Error(`Submission ${submissionId} not found`);
        }

        const problem = submission.assignment;
        const testCases = problem.testCases;

        let overallStatus: ProblemJudgeResult['overallStatus'] = 'ACCEPTED';
        let runtimeMax = 0;
        let memoryMax = 0;
        let totalScore = 0;
        const testResults: TestDetail[] = [];

        // 2. Chạy từng Test Case
        for (const tc of testCases) {
            const execution: JudgeResponse = await JudgeService.executeCode({
                language: submission.language,
                sourceCode: submission.content,
                stdin: tc.input,
                timeLimit: problem.timeLimit,
                memoryLimit: problem.memoryLimit
            });

            // Cập nhật tài nguyên tiêu thụ tối đa
            runtimeMax = Math.max(runtimeMax, execution.runtimeMs);
            memoryMax = Math.max(memoryMax, execution.memoryKb);

            // Kiểm tra Compile Error (Dừng ngay lập tức)
            if (execution.status === 'COMPILE_ERROR') {
                const ceResult = {
                    overallStatus: 'COMPILE_ERROR' as const,
                    runtimeMax: 0,
                    memoryMax: 0,
                    totalScore: 0,
                    testResults: [],
                    compileLog: execution.compileError || 'Unknown compile error'
                };

                await (prisma as any).submission.update({
                    where: { id: submissionId },
                    data: {
                        status: 'COMPILE_ERROR',
                        score: 0,
                        runtime: 0,
                        memory: 0,
                        gradedAt: new Date(),
                        feedback: `❌ Lỗi biên dịch (Compile Error):\n\n${ceResult.compileLog}`
                    }
                });

                return ceResult;
            }

            let currentStatus: TestDetail['status'] = 'AC';

            // Kiểm tra Runtime, Time, Memory
            if (execution.status === 'TIME_LIMIT_EXCEEDED') currentStatus = 'TLE';
            else if (execution.status === 'MEMORY_LIMIT_EXCEEDED') currentStatus = 'MLE';
            else if (execution.status === 'RUNTIME_ERROR') currentStatus = 'RE';
            else {
                // Nếu thực thi thành công -> So sánh Output
                const isCorrect = JudgeService.compareOutput(execution.stdout, tc.expectedOutput);
                if (!isCorrect) {
                    currentStatus = 'WA';
                }
            }

            // Cập nhật trạng thái tổng quát (Nếu đã có lỗi trước đó thì giữ nguyên lỗi đầu tiên tìm thấy)
            if (overallStatus === 'ACCEPTED' && currentStatus !== 'AC') {
                overallStatus = this.mapToOverallStatus(currentStatus);
            }

            // Cộng điểm nếu đạt AC
            if (currentStatus === 'AC') {
                totalScore += tc.weight;
            }

            testResults.push({
                testCaseId: tc.id,
                status: currentStatus,
                runtime: execution.runtimeMs,
                memory: execution.memoryKb,
                message: currentStatus === 'WA' && !tc.isHidden ? `Expected: ${tc.expectedOutput}, Got: ${execution.stdout}` : undefined
            });

            // Lưu chi tiết kết quả vào DB
            await (prisma as any).submissionResult.create({
                data: {
                    submissionId: submission.id,
                    testCaseId: tc.id,
                    status: currentStatus,
                    runtime: execution.runtimeMs,
                    memory: execution.memoryKb,
                    userOutput: tc.isHidden ? null : execution.stdout
                }
            });
        }

        // 3. Tổng hợp Feedback kỹ thuật (Miễn phí, không dùng AI)
        let feedback = "";
        const passedTests = testResults.filter(r => r.status === 'AC').length;
        const totalTests = testCases.length;

        if (overallStatus === 'ACCEPTED') {
            feedback = `✅ Tuyệt vời! Bạn đã vượt qua tất cả ${totalTests}/${totalTests} bộ kiểm thử.\nĐộ phức tạp mong đợi: ${problem.complexity || 'O(n)'}`;
        } else if (overallStatus === 'COMPILE_ERROR') {
            // Hiển thị lỗi biên dịch thực tế từ stderr
            feedback = `❌ Lỗi biên dịch (Compile Error):\n\n${testResults[0]?.message || 'Vui lòng kiểm tra lại cú pháp.'}`;
        } else if (overallStatus === 'TIME_LIMIT_EXCEEDED') {
            feedback = `⏳ Quá thời gian (Time Limit Exceeded): Thuật toán của bạn quá chậm hoặc rơi vào vòng lặp vô hạn (Giới hạn: ${problem.timeLimit}ms).\nHãy thử tối ưu hóa cấu trúc dữ liệu hoặc giảm bớt các vòng lặp lồng nhau.`;
        } else if (overallStatus === 'MEMORY_LIMIT_EXCEEDED') {
            feedback = `📦 Quá bộ nhớ (Memory Limit Exceeded): Chương trình của bạn sử dụng quá nhiều tài nguyên RAM (Giới hạn: ${problem.memoryLimit}MB).`;
        } else if (overallStatus === 'RUNTIME_ERROR') {
            const firstError = testResults.find(r => r.status === 'RE');
            feedback = `💥 Lỗi thực thi (Runtime Error):\n\n${firstError?.message || 'Chương trình bị crash khi đang chạy.'}`;
        } else if (overallStatus === 'WRONG_ANSWER') {
            const firstFail = testResults.find(r => r.status === 'WA');
            const tc = testCases.find((t: any) => t.id === firstFail?.testCaseId);
            
            if (tc && !tc.isHidden) {
                feedback = `❌ Kết quả sai (Wrong Answer) tại Test Case #${testCases.indexOf(tc) + 1}:\n\n- Input: ${tc.input}\n- Mong đợi (Expected): ${tc.expectedOutput}\n- Thực tế (Actual): ${firstFail?.message?.split('Got: ')[1] || 'Output không khớp'}`;
            } else {
                feedback = `❌ Kết quả sai (Wrong Answer) tại một Test Case ẩn.\nĐã vượt qua: ${passedTests}/${totalTests} tests.`;
            }
        }

        // Bổ sung Hint mặc định nếu có
        if (overallStatus !== 'ACCEPTED' && problem.hint1) {
            feedback += `\n\n💡 Gợi ý:\n${problem.hint1}`;
        }

        // 4. Cập nhật kết quả cuối cùng vào DB Submission
        await (prisma as any).submission.update({
            where: { id: submissionId },
            data: {
                status: overallStatus,
                score: totalScore,
                runtime: runtimeMax,
                memory: memoryMax,
                gradedAt: new Date(),
                feedback: feedback
            }
        });

        return {
            overallStatus,
            runtimeMax,
            memoryMax,
            totalScore,
            testResults
        };
    }

    private static mapToOverallStatus(testStatus: TestDetail['status']): ProblemJudgeResult['overallStatus'] {
        switch (testStatus) {
            case 'WA': return 'WRONG_ANSWER';
            case 'TLE': return 'TIME_LIMIT_EXCEEDED';
            case 'MLE': return 'MEMORY_LIMIT_EXCEEDED';
            case 'RE': return 'RUNTIME_ERROR';
            default: return 'ACCEPTED';
        }
    }
}
