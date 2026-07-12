import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

function buildPlaceholderUrl(name: string, category: string) {
	const colorMap: Record<string, string> = {
		dairy: "60a5fa",
		vegetables: "4ade80",
		fruits: "fb923c",
		snacks: "f472b6",
		beverages: "38bdf8",
		spices: "f87171",
		pulses: "a78bfa",
		"rice-and-grains": "fbbf24",
		millets: "facc15",
		bakery: "fdba74",
		"cooking-oil": "fde047",
		household: "94a3b8",
	};

	const color = colorMap[category] || "64748b";
	const cleanedName = name
		.toLowerCase()
		.replace(/\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|pieces?|pcs?)\b/gi, "")
		.replace(/\(([^)]*)\)/g, "$1")
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	const encodedName = encodeURIComponent(cleanedName).replace(/%20/g, "+");
	return `https://placehold.co/400x400/${color}/ffffff?text=${encodedName}`;
}

export async function GET() {
	try {
		const productsSnapshot = await getDocs(collection(db, "products"));
		const products = productsSnapshot.docs;
		let updated = 0;
		const sampleUrls: string[] = [];

		for (const productDoc of products) {
			const productData = productDoc.data() as Record<string, unknown>;
			const productName = typeof productData.name === "string" ? productData.name : "";
			const productCategory = typeof productData.category === "string" ? productData.category : "";
			const imageUrl = buildPlaceholderUrl(productName, productCategory);

			await updateDoc(doc(db, "products", productDoc.id), {
				imageUrl,
			});

			updated += 1;
			if (sampleUrls.length < 5) {
				sampleUrls.push(imageUrl);
			}
		}

		return NextResponse.json(
			{
				totalProducts: products.length,
				updated,
				sampleUrls,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Placeholder image generation failed:", error);
		return NextResponse.json(
			{ error: "Placeholder image generation failed" },
			{ status: 500 },
		);
	}
}
