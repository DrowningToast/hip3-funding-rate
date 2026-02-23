import { describe, it, expect } from "vitest";
import { SortService } from "./SortService";
import type { ArbitageRow } from "./ArbitageService";

const mockRows: ArbitageRow[] = [
	{ asset: "SOL", rates: { hyperliquid: 0.002, dex1: 0.004 }, spread: 0.002 },
	{ asset: "BTC", rates: { hyperliquid: 0.001, dex1: 0.003 }, spread: 0.002 },
	{ asset: "ARB", rates: { hyperliquid: 0.0008, dex1: 0.0018 }, spread: 0.001 },
	{ asset: "ETH", rates: { hyperliquid: 0.0005 }, spread: 0 },
];

describe("SortService", () => {
	describe("Sort by asset", () => {
		it("sorts alphabetically ascending", () => {
			const svc = new SortService({ column: "asset", direction: "asc" });
			expect(svc.Sort(mockRows).map((r) => r.asset)).toEqual([
				"ARB",
				"BTC",
				"ETH",
				"SOL",
			]);
		});

		it("sorts alphabetically descending", () => {
			const svc = new SortService({ column: "asset", direction: "desc" });
			expect(svc.Sort(mockRows).map((r) => r.asset)).toEqual([
				"SOL",
				"ETH",
				"BTC",
				"ARB",
			]);
		});
	});

	describe("Sort by spread", () => {
		it("sorts by spread descending (highest opportunity first)", () => {
			const svc = new SortService({ column: "spread", direction: "desc" });
			const result = svc.Sort(mockRows);
			expect(result[0].spread).toBeGreaterThanOrEqual(result[1].spread);
			expect(result[1].spread).toBeGreaterThanOrEqual(result[2].spread);
			expect(result[2].spread).toBeGreaterThanOrEqual(result[3].spread);
		});

		it("sorts by spread ascending", () => {
			const svc = new SortService({ column: "spread", direction: "asc" });
			const result = svc.Sort(mockRows);
			expect(result[0].spread).toBeLessThanOrEqual(result[1].spread);
		});
	});

	describe("Sort by APR", () => {
		it("produces the same order as sorting by spread (APR is proportional)", () => {
			const aprSvc = new SortService({ column: "apr", direction: "desc" });
			const spreadSvc = new SortService({ column: "spread", direction: "desc" });
			expect(aprSvc.Sort(mockRows).map((r) => r.asset)).toEqual(
				spreadSvc.Sort(mockRows).map((r) => r.asset),
			);
		});
	});

	describe("Sort by DEX column", () => {
		it("sorts by a specific DEX's rate", () => {
			const svc = new SortService({ column: "hyperliquid", direction: "desc" });
			const result = svc.Sort(mockRows);
			// SOL has the highest hyperliquid rate (0.002)
			expect(result[0].asset).toBe("SOL");
		});

		it("places assets missing the DEX rate at the bottom", () => {
			const svc = new SortService({ column: "dex1", direction: "desc" });
			const result = svc.Sort(mockRows);
			// ETH has no dex1 rate → last
			expect(result[result.length - 1].asset).toBe("ETH");
		});
	});

	describe("Toggle", () => {
		it("flips direction when toggling the active column", () => {
			const svc = new SortService({ column: "spread", direction: "desc" });
			svc.Toggle("spread");
			expect(svc.GetConfiguration()).toEqual({
				column: "spread",
				direction: "asc",
			});
		});

		it("resets to desc when switching to a different column", () => {
			const svc = new SortService({ column: "spread", direction: "asc" });
			svc.Toggle("asset");
			expect(svc.GetConfiguration()).toEqual({
				column: "asset",
				direction: "desc",
			});
		});

		it("toggling again after a column switch flips from desc to asc", () => {
			const svc = new SortService({ column: "spread", direction: "desc" });
			svc.Toggle("asset"); // → asset desc
			svc.Toggle("asset"); // → asset asc
			expect(svc.GetConfiguration().direction).toBe("asc");
		});
	});

	describe("does not mutate the input", () => {
		it("returns a new array and leaves the original order intact", () => {
			const svc = new SortService({ column: "asset", direction: "asc" });
			const originalOrder = mockRows.map((r) => r.asset);
			svc.Sort(mockRows);
			expect(mockRows.map((r) => r.asset)).toEqual(originalOrder);
		});
	});

	describe("GetConfiguration", () => {
		it("returns a snapshot of the current config", () => {
			const svc = new SortService({ column: "spread", direction: "desc" });
			expect(svc.GetConfiguration()).toEqual({
				column: "spread",
				direction: "desc",
			});
		});
	});
});
