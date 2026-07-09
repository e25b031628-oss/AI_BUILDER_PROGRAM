import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

const productsToSeed = [
	{ name: "Paneer 200g", category: "dairy", price: 90, stock: 40, imageUrl: "" },
	{ name: "Tomato 1kg", category: "vegetables", price: 35, stock: 60 },
	{ name: "Onion 1kg", category: "vegetables", price: 30, stock: 80 },
	{ name: "Ginger Garlic Paste 200g", category: "vegetables", price: 45, stock: 25 },
	{ name: "Fresh Cream 200ml", category: "dairy", price: 60, stock: 30 },
	{ name: "Garam Masala 100g", category: "spices", price: 55, stock: 40 },
	{ name: "Coriander Powder 100g", category: "spices", price: 30, stock: 40 },
	{ name: "Cumin Seeds 100g", category: "spices", price: 40, stock: 40 },
	{ name: "Turmeric Powder 100g", category: "spices", price: 25, stock: 40 },
	{ name: "Red Chili Powder 100g", category: "spices", price: 35, stock: 40 },
	{ name: "Ghee 500ml", category: "dairy", price: 250, stock: 20 },
	{ name: "Sunflower Oil 1L", category: "cooking-oil", price: 140, stock: 35 },
	{ name: "Wheat Flour 5kg", category: "rice-and-grains", price: 220, stock: 25 },
	{ name: "Sugar 1kg", category: "household", price: 45, stock: 50 },
	{ name: "Salt 1kg", category: "household", price: 20, stock: 60 },
	{ name: "Potato 1kg", category: "vegetables", price: 25, stock: 70 },
	{ name: "Capsicum 500g", category: "vegetables", price: 40, stock: 30 },
	{ name: "Cauliflower 1pc", category: "vegetables", price: 35, stock: 20 },
	{ name: "Spinach 250g", category: "vegetables", price: 20, stock: 25 },
	{ name: "Curd 400g", category: "dairy", price: 45, stock: 35 },
	{ name: "Cheese Slices 200g", category: "dairy", price: 110, stock: 25 },
	{ name: "Bread 400g", category: "bakery", price: 40, stock: 30 },
	{ name: "Eggs 6pc", category: "dairy", price: 60, stock: 40 },
	{ name: "Green Peas 500g", category: "vegetables", price: 45, stock: 25 },
	{ name: "Coriander Leaves 100g", category: "vegetables", price: 15, stock: 30 },
	{ name: "Green Chili 100g", category: "vegetables", price: 20, stock: 30 },
	{ name: "Lemon 500g", category: "fruits", price: 30, stock: 35 },
	{ name: "Cashew Nuts 200g", category: "snacks", price: 180, stock: 20 },
	{ name: "Yogurt 500g", category: "dairy", price: 55, stock: 30 },
	{ name: "Mustard Oil 1L", category: "cooking-oil", price: 150, stock: 20 },
] as const;

export async function GET() {
	try {
		const existingProductsSnapshot = await getDocs(collection(db, "products"));
		const existingNames = new Set(
			existingProductsSnapshot.docs.map((doc) => String(doc.data().name || "").toLowerCase()),
		);

		let added = 0;
		let skippedAsDuplicate = 0;

		for (const product of productsToSeed) {
			const normalizedName = product.name.toLowerCase();

			if (existingNames.has(normalizedName)) {
				skippedAsDuplicate += 1;
				continue;
			}

			await addDoc(collection(db, "products"), {
				name: product.name,
				category: product.category,
				price: product.price,
				stock: product.stock,
				imageUrl: product.imageUrl ?? "",
				tags: [],
				ecoHealthTag: null,
			});

			existingNames.add(normalizedName);
			added += 1;
		}

		return NextResponse.json(
			{
				totalInList: productsToSeed.length,
				added,
				skippedAsDuplicate,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Seeding products failed:", error);
		return NextResponse.json({ error: "Seeding products failed" }, { status: 500 });
	}
}
