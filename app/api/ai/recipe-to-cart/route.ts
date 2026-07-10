import { NextResponse } from "next/server";
import { callAI } from "../../../../lib/ai_service";

type RecipeToCartRequest = {
	dishName: string;
	productNames: string[];
};

const KNOWN_DISHES = [
	"vada pav",
	"pav bhaji",
	"misal pav",
	"poha",
	"sabudana khichdi",
	"upma",
	"idli",
	"dosa",
	"masala dosa",
	"rava dosa",
	"uttapam",
	"medu vada",
	"pongal",
	"pesarattu",
	"appam",
	"puttu",
	"paratha",
	"aloo paratha",
	"gobi paratha",
	"paneer paratha",
	"thepla",
	"khakhra",
	"dhokla",
	"khandvi",
	"fafda",
	"jalebi",
	"samosa",
	"kachori",
	"pyaz kachori",
	"dal baati churma",
	"gatte ki sabzi",
	"chole bhature",
	"rajma chawal",
	"kadhi chawal",
	"sarson ka saag",
	"makki ki roti",
	"butter chicken",
	"chicken tikka",
	"paneer tikka",
	"tandoori chicken",
	"dal makhani",
	"shahi paneer",
	"palak paneer",
	"kadai paneer",
	"malai kofta",
	"aloo gobi",
	"bhindi masala",
	"mix veg",
	"baingan bharta",
	"dum aloo",
	"rogan josh",
	"yakhni",
	"hyderabadi biryani",
	"veg biryani",
	"egg biryani",
	"chicken biryani",
	"mutton biryani",
	"pulao",
	"vegetable pulao",
	"jeera rice",
	"lemon rice",
	"curd rice",
	"tamarind rice",
	"fried rice",
	"schezwan fried rice",
	"noodles",
	"hakka noodles",
	"schezwan noodles",
	"manchurian",
	"gobi manchurian",
	"paneer manchurian",
	"chilli paneer",
	"chilli chicken",
	"momos",
	"fried momos",
	"tandoori momos",
	"spring rolls",
	"sushi",
	"ramen",
	"kimchi",
	"bibimbap",
	"pizza",
	"margherita pizza",
	"farmhouse pizza",
	"burger",
	"veg burger",
	"chicken burger",
	"sandwich",
	"grilled sandwich",
	"club sandwich",
	"wrap",
	"burrito",
	"taco",
	"pasta",
	"white sauce pasta",
	"red sauce pasta",
	"mac and cheese",
	"lasagna",
	"shawarma",
	"falafel",
	"hummus",
	"pita bread",
	"kulcha",
	"naan",
	"butter naan",
	"roti",
	"chapati",
	"rumali roti",
	"bhatura",
	"puri",
	"litti chokha",
	"bhel puri",
	"sev puri",
	"pani puri",
	"dahi puri",
	"ragda pattice",
	"aloo tikki",
	"bread pakora",
	"onion pakoda",
	"mirchi bhajji",
	"corn chaat",
	"fruit chaat",
	"kulfi",
	"rabri",
	"rasmalai",
	"rasgulla",
	"gulab jamun",
	"kaju katli",
	"barfi",
	"mysore pak",
	"sandesh",
	"peda",
	"modak",
	"payasam",
	"kheer",
	"halwa",
	"gajar halwa",
	"moong dal halwa",
	"ice cream",
	"brownie",
	"cake",
	"donut",
	"waffle",
	"pancake",
	"smoothie",
	"milkshake",
	"lassi",
	"buttermilk",
	"lemonade",
	"tea",
	"coffee",
	"cold coffee",
	"hot chocolate",
	"paneer butter masala",
	"chana masala",
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
	"fish curry",
	"prawn curry",
	"chicken 65",
	"paneer 65",
	"dal tadka",
	"dal fry",
	"mixed dal",
	"khichdi",
	"curd rice",
	"tomato rice",
	"cheela",
	"besan cheela",
	"stuffed paratha",
	"raita",
	"kadhi",
	"navratan korma",
	"dal khichdi",
	"masala rice",
	"spaghetti",
	"vegetable soup",
	"tomato soup",
	"sweet corn soup",
	"omelette",
	"scrambled eggs",
	"egg curry",
	"egg fried rice",
	"chowmein",
	"french toast",
	"cookies",
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
