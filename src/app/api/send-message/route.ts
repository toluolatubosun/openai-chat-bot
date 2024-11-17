import OpenAI from "openai/index.mjs";
import Languages from "@/constants/languages";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

export async function POST(req: NextRequest) {
    const { prev_messages, language, message }: { language: string; message: { source: string; message: string }; prev_messages: { source: string; message: string }[] } = await req.json();
   
    const promptMessages = [
        {
            role: "system",
            content: `
                You are a friendly chatbot called Polly Glot that speaks multiple languages. You respond to messages in the language that the user selects
                You can speak ${Languages.map((lang) => lang.name).join(", ")}.
            `
        },
        {
            role: "assistant",
            content: `I currently respond only in ${language}.`
        },
        {
            role: "user",
            content: `Here are the previous messages I sent for context: ${prev_messages.map((msg) => msg.message).join("###")}`
        },
        {
            role: "user",
            content: message.message
        }
    ]

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            //@ts-ignore
            messages: promptMessages,
            temperature: 1,
        });

        const reply = response.choices[0].message.content;

        return NextResponse.json({ success: true, message: reply });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message });
    }

}