import { NextResponse } from "next/server";
import { callAI } from "../../../lib/ai_service";

export async function GET() {
	try {
		const result = await callAI("Say hello in one short sentence");

		return NextResponse.json({ result });
	} catch {
		return NextResponse.json(
			{ error: "AI service unavailable" },
			{ status: 500 },
		);
	}
}
