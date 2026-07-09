import { NextResponse } from "next/server";
import { callAI } from "../../../../lib/ai_service";

type RecipeToCartRequest = {
	dishName: string;
	productNames: string[];
};

const KNOWN_DISHES = [
	"paneer butter masala",
	"butter chicken",
	"chole bhature",
	"rajma chawal",
	"dal makhani",
	"palak paneer",
	"biryani",
	"chicken biryani",
	"veg biryani",
	"pulao",
	"vegetable pulao",
	"chicken curry",
	"fish curry",
	"aloo gobi",
	"aloo paratha",
	"paneer tikka",
	"chicken tikka",
	"tandoori chicken",
	"dosa",
	"masala dosa",
	"idli sambar",
	"vada",
	"upma",
	"poha",
	"chana masala",
	"malai kofta",
	"kadai paneer",
	"shahi paneer",
	"matar paneer",
	"baingan bharta",
	"bhindi masala",
	"mixed vegetable curry",
	"sambhar",
	"rasam",
	"pav bhaji",
	"vada pav",
	"samosa",
	"pakora",
	"dhokla",
	"khichdi",
	"curd rice",
	"lemon rice",
	"tomato rice",
	"fried rice",
	"hakka noodles",
	"manchurian",
	"spring rolls",
	"pizza",
	"pasta",
	"white sauce pasta",
	"red sauce pasta",
	"macaroni",
	"burger",
	"sandwich",
	"grilled sandwich",
	"omelette",
	"scrambled eggs",
	"egg curry",
	"egg fried rice",
	"chowmein",
	"noodles",
	"soup",
	"tomato soup",
	"sweet corn soup",
	"salad",
	"fruit salad",
	"pancakes",
	"waffles",
	"french toast",
	"cake",
	"brownie",
	"cookies",
	"kheer",
	"halwa",
	"gulab jamun",
	"rasgulla",
	"gajar ka halwa",
	"payasam",
	"cheela",
	"besan cheela",
	"stuffed paratha",
	"gobi paratha",
	"paneer paratha",
	"chapati",
	"roti",
	"naan",
	"butter naan",
	"raita",
	"kadhi",
	"kadhi chawal",
	"dal tadka",
	"dal fry",
	"mixed dal",
	"rajma",
	"chole",
	"kofta curry",
	"navratan korma",
	"veg korma",
	"chicken korma",
	"mutton curry",
	"keema",
	"kebab",
	"seekh kebab",
	"fish fry",
	"prawn curry",
	"chicken 65",
	"gobi manchurian",
	"paneer 65",
];

function buildPrompt(dishName: string) {
	return [
		"Given this dish name, list the typical grocery ingredients needed to cook it.",
		`Dish name: ${dishName}`,
		"Return 5-8 ingredients.",
		"Use common grocery names.",
		"Return lowercase names.",
		"Do not include quantities or measurements.",
		"Return ONLY a raw JSON array of strings.",
		"No explanation, no markdown, no code fences.",
	].join("\n");
}

function parseIngredientArray(value: unknown): string[] | null {
	if (!Array.isArray(value)) {
		return null;
	}

	if (!value.every((item) => typeof item === "string")) {
		return null;
	}

	const ingredients = value
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	return ingredients.length > 0 ? ingredients : null;
}

function findClosestProduct(ingredient: string, productNames: string[]) {
	const normalizedIngredient = ingredient.toLowerCase();

	for (const productName of productNames) {
		const normalizedProductName = productName.toLowerCase();

		if (
			normalizedIngredient.includes(normalizedProductName) ||
			normalizedProductName.includes(normalizedIngredient)
		) {
			return productName;
		}
	}

	return null;
}

function findMatchingDish(inputDishName: string) {
	const normalizedInput = inputDishName.trim().toLowerCase();

	if (!normalizedInput) {
		return null;
	}

	for (const knownDish of KNOWN_DISHES) {
		if (
			normalizedInput === knownDish ||
			normalizedInput.includes(knownDish) ||
			knownDish.includes(normalizedInput)
		) {
			return knownDish;
		}
	}

	return null;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<RecipeToCartRequest>;
		const dishName = typeof body.dishName === "string" ? body.dishName : "";
		const productNames = Array.isArray(body.productNames)
			? body.productNames.filter(
					(productName): productName is string => typeof productName === "string",
				)
			: [];
		const normalizedDishName = dishName.trim().toLowerCase();

		if (!normalizedDishName) {
			return NextResponse.json(
				{ matched: [], unmatched: [], fallback: true, error: "Could not generate recipe" },
				{ status: 200 },
			);
		}

		const matchedDishName = findMatchingDish(normalizedDishName);

		if (!matchedDishName) {
			return NextResponse.json(
				{
					matched: [],
					unmatched: [],
					fallback: true,
					error: "That doesn't look like a dish we recognize — try something like 'paneer butter masala' or 'chicken biryani'.",
				},
				{ status: 200 },
			);
		}

		const aiResponse = await callAI(buildPrompt(matchedDishName));
		const parsed = JSON.parse(aiResponse) as unknown;
		const ingredients = parseIngredientArray(parsed);

		if (!ingredients || ingredients.length === 0) {
			throw new Error("Could not generate recipe");
		}

		const matched: Array<{ ingredient: string; productName: string }> = [];
		const unmatched: string[] = [];

		for (const ingredient of ingredients) {
			const productName = findClosestProduct(ingredient, productNames);

			if (productName) {
				matched.push({ ingredient, productName });
			} else {
				unmatched.push(ingredient);
			}
		}

		return NextResponse.json({ matched, unmatched, fallback: false }, { status: 200 });
	} catch {
		return NextResponse.json(
			{ matched: [], unmatched: [], fallback: true, error: "Could not generate recipe" },
			{ status: 200 },
		);
	}
}
