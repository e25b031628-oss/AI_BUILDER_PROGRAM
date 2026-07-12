import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

const IMAGE_UPDATES = {
	"mango 1kg": "https://images.unsplash.com/photo-1524807621076-c7ba046f3f3a?w=400",
	"watermelon 1pc": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
	"pomegranate 1kg": "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=400",
	"carrot 500g": "https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400",
	"cucumber 500g": "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400",
	"beetroot 500g": "https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400",
	"brinjal 500g": "https://images.unsplash.com/photo-1659261200833-ec8761558af7?w=400",
	"okra 500g": "https://images.unsplash.com/photo-1631206691852-6cee9f753c5a?w=400",
	"cabbage 1pc": "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400",
	"corn kernels 500g": "https://images.unsplash.com/photo-1601593768799-76c1b6b40e0f?w=400",
	"britannia bread 400g": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
	"harvest gold bread 400g": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
	"modern bread 400g": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
	"bread 400g": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
	"foxtail millet 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"little millet 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"barnyard millet 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"kodo millet 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"proso millet 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"whole bajra 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"whole jowar 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"whole ragi 1kg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
	"toor dal 1kg": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
	"moong dal split 1kg": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
	"masoor dal 1kg": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
	"urad dal split 1kg": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
	"chana dal 1kg": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400",
	"rajma 1kg": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
	"white rajma 1kg": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
	"kabuli chana 1kg": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
	"turmeric powder 100g": "https://images.unsplash.com/photo-1615485291234-4b2f0a5b4f6c?w=400",
	"red chilli powder 100g": "https://images.unsplash.com/photo-1583119912267-cc97c911e416?w=400",
	"coriander powder 100g": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
	"garam masala 100g": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
	"cumin seeds 100g": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400",
} as const;

export async function GET() {
	try {
		const productsSnapshot = await getDocs(collection(db, "products"));
		const products = productsSnapshot.docs;
		let totalChecked = 0;
		let updated = 0;
		const notMatched: string[] = [];

		for (const productDoc of products) {
			const productData = productDoc.data() as Record<string, unknown>;
			const productName = typeof productData.name === "string" ? productData.name.trim() : "";
			totalChecked += 1;

			const matchingKey = Object.keys(IMAGE_UPDATES).find(
				(key) => key.toLowerCase() === productName.toLowerCase(),
			);

			if (!matchingKey) {
				notMatched.push(productName || productDoc.id);
				continue;
			}

			await updateDoc(doc(db, "products", productDoc.id), {
				imageUrl: IMAGE_UPDATES[matchingKey as keyof typeof IMAGE_UPDATES],
			});
			updated += 1;
		}

		return NextResponse.json(
			{
				totalChecked,
				updated,
				notMatched,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Updating unbranded images failed:", error);
		return NextResponse.json(
			{ error: "Updating unbranded images failed" },
			{ status: 500 },
		);
	}
}
