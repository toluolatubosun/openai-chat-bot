import OpenAI from "openai/index.mjs";
import Languages from "@/constants/languages";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

interface UserMessage {
	source: string;
	message: string;
}

export async function POST(req: NextRequest) {
	const body: { language: string; message: UserMessage; prev_messages: UserMessage[] } = await req.json();

	const promptMessages = [
		{
			role: "system",
			content: `
                You are a friendly chatbot called Polly Glot that speaks multiple languages. You respond to messages in the language that the user selects
                You can speak ${Languages.map((lang) => lang.name).join(", ")}.
            `,
		},
		{
			role: "assistant",
			content: `I currently respond only in ${body.language}.`,
		},
		{
			role: "user",
			content: `Here are the previous messages I sent for context: ${body.prev_messages
				.map((msg) => msg.message)
				.join("###")}`,
		},
		{
			role: "user",
			content: body.message.message,
		},
	];

	try {
		const moderation = await openai.moderations.create({ input: body.message.message })

		if (moderation.results[0].flagged) {
			const categories = moderation.results[0].categories;
			//@ts-ignore
			return NextResponse.json({ success: false, message: `Your message was flagged as ${Object.keys(categories).filter(category => categories[category]).join(", ")}` });
		}

		if (body.message.message.startsWith("gen-img:")) {
			const response = await openai.images.generate({
				model: "dall-e-3",
				prompt: body.message.message.replace("gen-img:", ""),
				n: 1,
				size: "1024x1024",
				style: "vivid",
				response_format: "b64_json",
			});

			const revisedPrompt = response.data[0].revised_prompt;
			const imageBase64 = response.data[0].b64_json

			return NextResponse.json({ success: true, message: revisedPrompt, image_base64: imageBase64 });
		} else {
			const response = await openai.chat.completions.create({
				model: "gpt-3.5-turbo",
				//@ts-ignore
				messages: promptMessages,
				temperature: 1,
			});

			const reply = response.choices[0].message.content;

			return NextResponse.json({ success: true, message: reply });
		}
	} catch (error: any) {
		return NextResponse.json({ success: false, message: error.message });
	}
}
