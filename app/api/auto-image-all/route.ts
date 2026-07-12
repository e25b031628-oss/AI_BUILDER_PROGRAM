import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

function cleanProductNameForImage(name: string) {
	const cleaned = name
		.toLowerCase()
		.replace(/\b\d+(?:\.\d+)?\s*(?:g|kg|ml|l|pieces?|pcs?)\b/gi, "")
		.replace(/\(([^)]*)\)/g, "$1")
		.replace(/[^a-z0-9\s,]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	const words = cleaned
		.split(" ")
		.filter(Boolean)
		.slice(0, 3);

	return words.join(",");
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
			const cleanName = cleanProductNameForImage(productName);
			const imageUrl = `https://loremflickr.com/400/400/${cleanName}`;

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
		console.error("Auto image generation failed:", error);
		return NextResponse.json(
			{ error: "Auto image generation failed" },
			{ status: 500 },
		);
	}
}
