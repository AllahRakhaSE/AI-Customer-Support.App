import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI-powered customer support assistant for HeadStartAI, a platform that conducts AI-powered interviews for software engineering (SWE) jobs. Your role is to assist users with various queries related to the platform, including account setup, interview scheduling, technical issues, and providing information about how AI interviews work. You should provide clear, concise, and accurate responses. Always be polite, professional, and helpful. If you do not have the exact information requested, guide the user on where they can find it or escalate the query to human support if necessary.`;

export async function POST(req) {
    const openai = new OpenAI();
    const data = await req.json();

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            ...data,
        ],
        model: "gpt-4o-mini",
        stream: true,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
        },
    });

    return new NextResponse(stream);
}
