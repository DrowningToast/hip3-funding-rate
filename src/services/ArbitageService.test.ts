import { describe, it, expect } from "vitest";
import { ArbitageService } from "./ArbitageService";

const svc = new ArbitageService();

describe("ArbitageService.ToRows", () => {
	it("returns one row per asset", () => {
		const vm = {
			BTC: { hyperliquid: 0.001, dex1: 0.003 },
			ETH: { hyperliquid: 0.0005 },
		};
		expect(svc.ToRows(vm)).toHaveLength(2);
	});

	it("preserves asset name and rates on each row", () => {
		const vm = { BTC: { hyperliquid: 0.001, dex1: 0.003 } };
		const [row] = svc.ToRows(vm);
		expect(row.asset).toBe("BTC");
		expect(row.rates).toEqual({ hyperliquid: 0.001, dex1: 0.003 });
	});

	it("calculates spread as max − min when more than one DEX", () => {
		const vm = { BTC: { hyperliquid: 0.001, dex1: 0.003 } };
		const [row] = svc.ToRows(vm);
		expect(row.spread).toBeCloseTo(0.002);
	});

	it("sets spread to 0 when only one DEX is present", () => {
		const vm = { SOL: { hyperliquid: 0.0005 } };
		const [row] = svc.ToRows(vm);
		expect(row.spread).toBe(0);
	});

	it("returns an empty array for an empty viewmodel", () => {
		expect(svc.ToRows({})).toEqual([]);
	});
});
