import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as https from 'https';

dotenv.config();

const prisma = new PrismaClient();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is not set in .env file');
    process.exit(1);
}

async function callGemini(prompt: string): Promise<string> {
    const data = JSON.stringify({
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        }
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.error) {
                        reject(new Error(json.error.message));
                    } else {
                        const text = json.candidates[0].content.parts[0].text;
                        resolve(text);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('🚀 Starting Test Case Generation...');

    const assignments = await prisma.assignment.findMany({
        where: {
            testCases: {
                none: {}
            }
        }
    });

    console.log(`Found ${assignments.length} assignments without test cases.`);

    for (const assignment of assignments) {
        console.log(`\nProcessing Assignment: ${assignment.title} (ID: ${assignment.id})`);
        
        const prompt = `
            Bạn là một chuyên gia thiết kế bài tập lập trình. 
            Hãy tạo 5 test case cho bài tập sau đây.
            
            Tiêu đề: ${assignment.title}
            Mô tả: ${assignment.description}
            Ngôn ngữ: ${assignment.language}
            
            Yêu cầu:
            1. Các test case phải bao quát các trường hợp: cơ bản, biên (edge cases), và dữ liệu lớn (nếu cần).
            2. Định dạng trả về phải là một mảng JSON các đối tượng có cấu trúc:
               [
                 { "input": "chuỗi input", "expectedOutput": "chuỗi output mong đợi", "isHidden": false, "weight": 20 },
                 ...
               ]
            3. Chỉ trả về JSON, không kèm giải thích.
            4. Input và Output phải là chuỗi (string).
        `;

        try {
            const aiResponse = await callGemini(prompt);
            const testCases = JSON.parse(aiResponse);

            if (Array.isArray(testCases)) {
                console.log(`Generated ${testCases.length} test cases for "${assignment.title}"`);
                
                await prisma.testCase.createMany({
                    data: testCases.map((tc, index) => ({
                        assignmentId: assignment.id,
                        input: String(tc.input),
                        expectedOutput: String(tc.expectedOutput),
                        isHidden: tc.isHidden || false,
                        weight: tc.weight || 20,
                        order: index
                    }))
                });
                
                console.log(`✅ Successfully saved test cases to database.`);
            } else {
                console.warn(`⚠️ AI did not return a valid array for "${assignment.title}"`);
            }
        } catch (error) {
            console.error(`❌ Failed to process assignment "${assignment.title}":`, error);
        }
    }

    console.log('\n✅ All assignments processed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
