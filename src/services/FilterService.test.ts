import { describe, it, expect, beforeEach } from "vitest";
import { FilterService } from "./FilterService";
import type { ArbitageViewModel, FilterConfiguration } from "./ArbitageService";

// Fixture: BTC has 3 DEXes, ETH has 2, SOL has 1
const mockData: ArbitageViewModel = {
	BTC: { hyperliquid: 0.001, dex1: 0.002, dex2: 0.0015 },
	ETH: { hyperliquid: 0.0005, dex1: 0.0008 },
	SOL: { dex1: 0.0003 },
};

const baseConfig: FilterConfiguration = {
	dexCountGreaterThan: 0,
	dexFilter: "EXCLUDE",
	dexFilterList: [],
};

describe("FilterService", () => {
	describe("dexCountGreaterThan", () => {
		it("keeps all assets when threshold is 0", () => {
			const svc = new FilterService({ ...baseConfig, dexCountGreaterThan: 0 });
			expect(Object.keys(svc.Filter(mockData))).toHaveLength(3);
		});

		it("excludes assets with 1 or fewer DEXes when threshold is 1", () => {
			const svc = new FilterService({ ...baseConfig, dexCountGreaterThan: 1 });
			const result = svc.Filter(mockData);
			expect(result).toHaveProperty("BTC");
			expect(result).toHaveProperty("ETH");
			expect(result).not.toHaveProperty("SOL");
		});

		it("keeps only assets with more than 2 DEXes when threshold is 2", () => {
			const svc = new FilterService({ ...baseConfig, dexCountGreaterThan: 2 });
			const result = svc.Filter(mockData);
			expect(result).toHaveProperty("BTC");
			expect(result).not.toHaveProperty("ETH");
			expect(result).not.toHaveProperty("SOL");
		});

		it("returns empty when threshold exceeds all DEX counts", () => {
			const svc = new FilterService({ ...baseConfig, dexCountGreaterThan: 99 });
			expect(Object.keys(svc.Filter(mockData))).toHaveLength(0);
		});
	});

	describe("dexCountLessThan", () => {
		it("excludes assets at or above the upper bound", () => {
			const svc = new FilterService({
				...baseConfig,
				dexCountLessThan: 3,
			});
			const result = svc.Filter(mockData);
			expect(result).not.toHaveProperty("BTC"); // 3 DEXes — not less than 3
			expect(result).toHaveProperty("ETH"); // 2 DEXes
			expect(result).toHaveProperty("SOL"); // 1 DEX
		});

		it("combined with dexCountGreaterThan creates a range", () => {
			const svc = new FilterService({
				...baseConfig,
				dexCountGreaterThan: 1,
				dexCountLessThan: 3,
			});
			const result = svc.Filter(mockData);
			expect(result).toHaveProperty("ETH"); // exactly 2 DEXes
			expect(result).not.toHaveProperty("BTC"); // 3 — not < 3
			expect(result).not.toHaveProperty("SOL"); // 1 — not > 1
		});
	});

	describe("dexFilter EXCLUDE", () => {
		it("no-ops when dexFilterList is empty", () => {
			const svc = new FilterService({
				...baseConfig,
				dexFilter: "EXCLUDE",
				dexFilterList: [],
			});
			expect(Object.keys(svc.Filter(mockData))).toHaveLength(3);
		});

		it("strips the excluded DEX from each asset's rates", () => {
			const svc = new FilterService({
				...baseConfig,
				dexFilter: "EXCLUDE",
				dexFilterList: ["dex1"],
			});
			const result = svc.Filter(mockData);
			// SOL's only DEX was dex1 → nothing left → asset dropped
			expect(result).not.toHaveProperty("SOL");
			// BTC keeps hyperliquid and dex2 (dex1 stripped)
			expect(result).toHaveProperty("BTC");
			expect(result["BTC"]).not.toHaveProperty("dex1");
			expect(result["BTC"]).toHaveProperty("hyperliquid");
			expect(result["BTC"]).toHaveProperty("dex2");
			// ETH keeps hyperliquid (dex1 stripped)
			expect(result).toHaveProperty("ETH");
			expect(result["ETH"]).not.toHaveProperty("dex1");
			expect(result["ETH"]).toHaveProperty("hyperliquid");
		});

		it("only drops assets that have no remaining DEXes after exclusion", () => {
			const svc = new FilterService({
				...baseConfig,
				dexFilter: "EXCLUDE",
				dexFilterList: ["hyperliquid"],
			});
			const result = svc.Filter(mockData);
			// BTC and ETH lose hyperliquid but keep their other rates
			expect(result).toHaveProperty("BTC");
			expect(result["BTC"]).not.toHaveProperty("hyperliquid");
			expect(result["BTC"]).toHaveProperty("dex1");
			expect(result).toHaveProperty("ETH");
			expect(result["ETH"]).not.toHaveProperty("hyperliquid");
			expect(result["ETH"]).toHaveProperty("dex1");
			// SOL never had hyperliquid — unaffected
			expect(result).toHaveProperty("SOL");
		});
	});

	describe("dexFilter INCLUDE", () => {
		it("keeps only rates from included DEXes and drops assets with no match", () => {
			const svc = new FilterService({
				...baseConfig,
				dexFilter: "INCLUDE",
				dexFilterList: ["hyperliquid"],
			});
			const result = svc.Filter(mockData);
			// BTC and ETH have hyperliquid → kept with only that rate
			expect(result).toHaveProperty("BTC");
			expect(result["BTC"]).toHaveProperty("hyperliquid");
			expect(result["BTC"]).not.toHaveProperty("dex1");
			expect(result).toHaveProperty("ETH");
			expect(result["ETH"]).toHaveProperty("hyperliquid");
			expect(result["ETH"]).not.toHaveProperty("dex1");
			// SOL has no hyperliquid rate → excluded
			expect(result).not.toHaveProperty("SOL");
		});

		it("returns empty when no asset has rates from included DEXes", () => {
			const svc = new FilterService({
				...baseConfig,
				dexFilter: "INCLUDE",
				dexFilterList: ["nonexistent"],
			});
			expect(Object.keys(svc.Filter(mockData))).toHaveLength(0);
		});
	});

	describe("UpdateConfiguration", () => {
		it("applies a partial config update and re-filters correctly", () => {
			const svc = new FilterService({ ...baseConfig, dexCountGreaterThan: 1 });
			// Before update: ETH and BTC pass
			expect(svc.Filter(mockData)).toHaveProperty("ETH");

			svc.UpdateConfiguration({ dexCountGreaterThan: 2 });
			// After update: only BTC (3 DEXes) passes
			const result = svc.Filter(mockData);
			expect(result).toHaveProperty("BTC");
			expect(result).not.toHaveProperty("ETH");
		});

		it("preserves unchanged config fields during a partial update", () => {
			const svc = new FilterService({
				...baseConfig,
				dexCountGreaterThan: 1,
				dexFilter: "EXCLUDE",
				dexFilterList: ["dex1"],
			});
			// Only change the count — EXCLUDE filter should still be active
			svc.UpdateConfiguration({ dexCountGreaterThan: 0 });
			const result = svc.Filter(mockData);
			expect(result).not.toHaveProperty("SOL"); // still excluded by dexFilter
			expect(result).toHaveProperty("BTC");
			expect(result).toHaveProperty("ETH");
		});
	});

	describe("does not mutate the input", () => {
		it("returns a new object and leaves the original unchanged", () => {
			const svc = new FilterService({ ...baseConfig, dexCountGreaterThan: 1 });
			const original = { ...mockData };
			svc.Filter(mockData);
			expect(Object.keys(mockData)).toEqual(Object.keys(original));
		});
	});
});
