import { describe, it, expect } from "vitest";
import { AliasService } from "./AliasService";

const testAliases = {
	"s&p500": ["SP500", "USA500", "US500"],
	nasdaq: ["USA100", "USTECH"],
	nikkei: ["JP225", "JPN225"],
};

describe("AliasService", () => {
	const svc = new AliasService(testAliases);

	describe("resolveTerms", () => {
		it("resolves alias key to all values in the group", () => {
			const terms = svc.resolveTerms("S&P500");
			expect(terms).toContain("sp500");
			expect(terms).toContain("usa500");
			expect(terms).toContain("us500");
		});

		it("resolves a value back to all other group members (bidirectional)", () => {
			const terms = svc.resolveTerms("USA500");
			expect(terms).toContain("sp500");
			expect(terms).toContain("us500");
			expect(terms).toContain("s&p500");
		});

		it("always includes the normalised original search term", () => {
			const terms = svc.resolveTerms("BTC");
			expect(terms).toContain("btc");
		});

		it("is case-insensitive", () => {
			const terms = svc.resolveTerms("nasdaq");
			expect(terms).toContain("usa100");
			expect(terms).toContain("ustech");
		});

		it("partial key match expands the group", () => {
			const terms = svc.resolveTerms("nikkei");
			expect(terms).toContain("jp225");
			expect(terms).toContain("jpn225");
		});

		it("partial value match expands the group", () => {
			// "500" appears in SP500, USA500, US500 — all in the same group
			const terms = svc.resolveTerms("US500");
			expect(terms).toContain("sp500");
			expect(terms).toContain("usa500");
		});

		it("returns empty array for empty search", () => {
			expect(svc.resolveTerms("")).toHaveLength(0);
		});

		it("returns empty array for whitespace-only search", () => {
			expect(svc.resolveTerms("   ")).toHaveLength(0);
		});

		it("no duplicates in result", () => {
			const terms = svc.resolveTerms("nasdaq");
			expect(terms.length).toBe(new Set(terms).size);
		});
	});
});
