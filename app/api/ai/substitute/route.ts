import { callAI } from "../../../../lib/ai_service";

type Candidate = { name: string; stock: number };

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const outOfStockProductName = typeof body?.outOfStockProductName === "string" ? body.outOfStockProductName : "";
    const category = typeof body?.category === "string" ? body.category : "";
    const candidateProducts: Candidate[] = Array.isArray(body?.candidateProducts)
      ? body.candidateProducts.map((c: any) => ({ name: String(c?.name ?? ""), stock: Number(c?.stock ?? 0) }))
      : [];

    // Filter in-stock candidates
    const inStock = candidateProducts.filter((c) => Number(c.stock) > 0);

    if (inStock.length === 0) {
      return new Response(JSON.stringify({ substitute: null, fallback: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build prompt for the AI
    const listText = inStock.map((c, i) => `${i + 1}. ${c.name} (stock: ${c.stock})`).join("\n");

    const prompt = `You are a helpful assistant for an online grocery store. A product is out of stock: "${outOfStockProductName}" (category: "${category}"). Here are available in-stock alternatives from the same category:\n${listText}\n\nPick the single closest substitute a shopper would accept. Return ONLY a raw JSON object with exactly one key, \"substitute\". The value should be the exact product name from the list (string) if a reasonable substitute exists, or null if none are reasonable. DO NOT include any explanation, commentary, or additional fields.`;

    let aiText: string;

    try {
      aiText = await callAI(prompt);
    } catch (err) {
      // AI failed — fallback to first in-stock candidate
      const first = inStock[0];
      return new Response(JSON.stringify({ substitute: first.name, fallback: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try to extract JSON from AI response
    let parsed: any = null;
    try {
      const text = aiText.trim();
      // find first JSON object in the text
      const match = text.match(/\{[\s\S]*\}/);
      const jsonText = match ? match[0] : text;
      parsed = JSON.parse(jsonText);
    } catch (err) {
      parsed = null;
    }

    if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, "substitute")) {
      // invalid AI output — fallback
      const first = inStock[0];
      return new Response(JSON.stringify({ substitute: first.name, fallback: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const substitute = parsed.substitute;

    if (substitute === null) {
      return new Response(JSON.stringify({ substitute: null, fallback: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (typeof substitute !== "string") {
      const first = inStock[0];
      return new Response(JSON.stringify({ substitute: first.name, fallback: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate match (case-insensitive)
    const match = inStock.find((c) => c.name.toLowerCase() === substitute.trim().toLowerCase());

    if (!match) {
      const first = inStock[0];
      return new Response(JSON.stringify({ substitute: first.name, fallback: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success
    return new Response(JSON.stringify({ substitute: match.name, fallback: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ substitute: null, fallback: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const runtime = "edge";
