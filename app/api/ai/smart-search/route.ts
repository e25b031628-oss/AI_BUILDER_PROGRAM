import { NextResponse } from "next/server";
import { callAI } from "../../../../lib/ai_service";

type SmartSearchRequest = {
	query: string;
	productNames: string[];
};

function buildPrompt(query: string, productNames: string[]) {
	return [
		"You are helping map a shopper's natural-language search to exact product names in a grocery catalog.",
		`User query: ${query}`,
		`Available product names: ${JSON.stringify(productNames)}`,
		"Return ONLY a raw JSON array containing the exact product names from the provided list that are genuinely relevant to the query.",
		"Do not invent product names not present in the list.",
		"Do not include loosely related items.",
		"If nothing matches well, return [].",
		"Do not include explanation, markdown, code fences, or extra text.",
	].join("\n");
}

function parseProductArray(value: unknown): string[] | null {
	if (!Array.isArray(value)) {
		return null;
	}

	if (!value.every((item) => typeof item === "string")) {
		return null;
	}

	return value;
}

function uniqueByLowercase(values: string[]) {
	const seen = new Set<string>();
	const result: string[] = [];

	for (const value of values) {
		const normalized = value.toLowerCase();

		if (seen.has(normalized)) {
			continue;
		}

		seen.add(normalized);
		result.push(value);
	}

	return result;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<SmartSearchRequest>;
		const query = typeof body.query === "string" ? body.query : "";
		const productNames = Array.isArray(body.productNames)
			? body.productNames.filter(
				(productName): productName is string => typeof productName === "string",
			)
			: [];

		const aiResponse = await callAI(buildPrompt(query, productNames));
		const parsed = JSON.parse(aiResponse) as unknown;
		const matchedProducts = parseProductArray(parsed);

		if (!matchedProducts) {
			return NextResponse.json({ matchedProducts: [], fallback: true }, { status: 200 });
		}

		const validLookup = new Map(productNames.map((name) => [name.toLowerCase(), name]));
		const validatedMatches = uniqueByLowercase(
			matchedProducts
				.map((name) => validLookup.get(name.toLowerCase()))
				.filter((name): name is string => typeof name === "string"),
		);

		if (validatedMatches.length === 0) {
			return NextResponse.json({ matchedProducts: [], fallback: true }, { status: 200 });
		}

		return NextResponse.json(
			{ matchedProducts: validatedMatches, fallback: false },
			{ status: 200 },
		);
	} catch {
		return NextResponse.json({ matchedProducts: [], fallback: true }, { status: 200 });
	}
}