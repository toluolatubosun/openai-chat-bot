"use client";

import React from "react";
import Image from 'next/image'
import parse from 'html-react-parser';

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

import Languages from "@/constants/languages"

export default function Home() {
	const { toast } = useToast();

	const [language, setLanguage] = React.useState("English");
	const [isLoading, setIsLoading] = React.useState(false);

	const inputRef = React.useRef<HTMLInputElement>(null);

	const [messages, setMessages] = React.useState<{ source: string; message: string; imageBase64?: string; }[]>([
		{
			source: "system",
			message: "Hi friend 👋, Welcome to <b>Polly Glot</b>, your multilingual chatbot and image generator"
		},
		{
			source: "system",
			message: "Select a language from the top you want me to respond in, and start chatting with me 😃"
		},
		{
			source: "system",
			message: "If you want to generate an image, just type <b>gen-img:</b> and the text you want to generate the image for 😎"
		}
	]);

	const handleSendMessage = async () => {
		setIsLoading(true);

		if (!inputRef.current?.value) {
			setIsLoading(false);
			toast({ title: "Message cannot be empty", variant: "destructive" });
			return;
		}

		const message = { source: "user", message: inputRef.current?.value };
		const previousMessages = messages.filter((msg) => msg.source === 'user');

		const response = await fetch("/api/send-message", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				language,
				message,
				prev_messages: previousMessages,
			}),
		})

		const data = await response.json();

		if (!response.ok || !data.success) {
			toast({ title: "Error getting response", description: data.message, variant: "destructive" });
		} else {
			inputRef.current.value = "";
			setMessages((messages) => [...messages, message, { source: "system", message: data.message, imageBase64: data.image_base64 }]);
		}

		setIsLoading(false);
	}

	return (
		<div className="bg-[#03a9f4] h-screen w-screen p-4">
			<div className="bg-gray-50 h-full w-full lg:max-w-lg rounded-md flex flex-col p-2 mx-auto">
				<div className="flex items-center justify-between p-2 rounded-t-md bg-[#03a9f4]/50 -mx-2 -mt-2 -mb-1">
					{Languages.map((lang) => (
						<div
							key={lang.name}
							className={`cursor-pointer ${language === lang.name ? 'border-2 border-[#03a9f4] p-1 rounded-md' : ''}`}
							onClick={() => setLanguage(lang.name)}
						>
							<Image
								src={lang.flag}
								alt={lang.name}
								width={32}
								height={32}
								className="w-16"
							/>
						</div>
					))}
				</div>

				<Separator className="my-1 -mx-2" />

				<ScrollArea className="h-full">
					<div className="space-y-3">
						{messages.map((msg, index) => (
							<div
								key={index}
								className={`p-2 rounded-md w-fit break-words max-w-60 lg:max-w-96 ${msg.source === 'user' ? 'bg-blue-200 text-blue-900 ml-auto' : 'bg-gray-200 text-gray-900 mr-auto'}`}
							>
								{parse(msg.message)}
								{msg.imageBase64 && <img src={`data:image/png;base64,${msg.imageBase64}`} alt="Generated Image" className="w-full h-auto mt-2" />}
							</div>
						))}
					</div>

				</ScrollArea>

				<Separator className="my-1 -mx-2" />

				<div className="flex w-full items-center space-x-2 mt-auto">
					<Input ref={inputRef} type="text" placeholder="Enter message" />
					<Button disabled={isLoading} onClick={handleSendMessage}>{isLoading ? "..." : "Send"}</Button>
				</div>
			</div>
		</div>
	);
}
