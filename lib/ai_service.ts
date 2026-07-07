type OpenRouterChatMessage = {
	content?: string | null;
};

type OpenRouterChatResponse = {
	choices?: Array<{
		message?: OpenRouterChatMessage;
	}>;
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "anthropic/claude-4.6-sonnet";
const REQUEST_TIMEOUT_MS = 15000;

export async function callAI(prompt: string): Promise<string> {
	const apiKey = process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		throw new Error("AI service unavailable");
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(OPENROUTER_API_URL, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${apiKey}`,
				"HTTP-Referer": "http://localhost:3000",
				"X-OpenRouter-Title": "Smart Cart",
			},
			body: JSON.stringify({
				model: OPENROUTER_MODEL,
				max_tokens: 1000,
				messages: [{ role: "user", content: prompt }],
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error("AI service unavailable");
		}

		const data = (await response.json()) as OpenRouterChatResponse;
		const text = data.choices?.[0]?.message?.content ?? "";

		if (!text) {
			throw new Error("AI service unavailable");
		}

		return text;
	} catch {
		throw new Error("AI service unavailable");
	} finally {
		clearTimeout(timeoutId);
	}
}
