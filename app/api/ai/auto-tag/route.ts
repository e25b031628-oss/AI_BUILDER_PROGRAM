import { NextResponse } from "next/server";
import { callAI } from "../../../../lib/ai_service";
import { db } from "../../../../lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

const ALLOWED_TAGS = [
	"Healthy",
	"Vegan",
	"Organic",
	"Snack",
	"Breakfast",
	"Beverage",
	"Household",
	"New",
	"Bestseller",
] as const;

function getProductValue(product: Record<string, unknown>, keys: string[]) {
	for (const key of keys) {
		const value = product[key];
		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return "";
}

function normalizeTagPayload(payload: unknown) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return null;
	}

	const candidate = payload as Record<string, unknown>;
	const rawTags = Array.isArray(candidate.tags) ? candidate.tags : [];
	const tags = rawTags
		.filter((tag): tag is string => typeof tag === "string")
		.map((tag) => tag.trim())
		.filter((tag) => ALLOWED_TAGS.includes(tag as (typeof ALLOWED_TAGS)[number]))
		.filter((tag, index, values) => values.indexOf(tag) === index)
		.slice(0, 4);

	const ecoHealthTag =
		candidate.ecoHealthTag === "Eco-friendly" || candidate.ecoHealthTag === "Healthy Pick"
			? candidate.ecoHealthTag
			: null;

	return {
		tags,
		ecoHealthTag,
	};
}

export async function GET() {
	try {
		const productsSnapshot = await getDocs(collection(db, "products"));
		const products = productsSnapshot.docs;
		let updated = 0;
		let skipped = 0;

		for (const productDoc of products) {
			const productId = productDoc.id;
			const productData = productDoc.data() as Record<string, unknown>;
			const productName = getProductValue(productData, ["name", "title", "productName"]);
			const category = getProductValue(productData, ["category", "categoryName", "type"]);

			const prompt = [
				"You are tagging grocery products for a smart shopping app.",
				`Product name: ${productName || "Unknown"}`,
				`Category: ${category || "Unknown"}`,
				"Return ONLY a raw JSON object with these exact fields:",
				'"tags": an array of 2-4 short relevant tags chosen only from this fixed set: ["Healthy","Vegan","Organic","Snack","Breakfast","Beverage","Household","New","Bestseller"]',
				'"ecoHealthTag": either "Eco-friendly", "Healthy Pick", or null',
				"Only include tags that genuinely apply. Do not force tags for every item.",
				"Do not include markdown, explanations, or extra text.",
			].join("\n");

			try {
				const aiResponse = await callAI(prompt);
				const parsed = JSON.parse(aiResponse) as unknown;
				const normalized = normalizeTagPayload(parsed);

				if (!normalized) {
					throw new Error("Invalid AI payload");
				}

				await updateDoc(doc(db, "products", productId), {
					tags: normalized.tags,
					ecoHealthTag: normalized.ecoHealthTag,
				});

				updated += 1;
			} catch (error) {
				console.warn(`Skipping product ${productId}:`, error);
				skipped += 1;
			}
		}

		return NextResponse.json(
			{
				totalProducts: products.length,
				updated,
				skipped,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Auto-tagging failed:", error);
		return NextResponse.json(
			{ error: "Auto-tagging failed" },
			{ status: 500 },
		);
	}
}
