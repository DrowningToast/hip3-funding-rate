import { describe, it, expect, vi } from "vitest";
import { FundingHistoryService } from "./FundingHistoryService";

const makeHlInfo = (records: object[] = []) => ({
	fundingHistory: vi.fn().mockResolvedValue(records),
});

describe("FundingHistoryService", () => {
	describe("getCoinName", () => {
		it("returns bare asset name for hyperliquid dex", () => {
			const svc = new FundingHistoryService({} as any);
			expect(svc.getCoinName("BTC", "hyperliquid")).toBe("BTC");
		});

		it("returns dex:asset for custom dex", () => {
			const svc = new FundingHistoryService({} as any);
			expect(svc.getCoinName("ETH", "customdex")).toBe("customdex:ETH");
		});
	});

	describe("GetHistory", () => {
		it("calls fundingHistory with correct coin and startTime", async () => {
			const hlInfo = makeHlInfo();
			const svc = new FundingHistoryService(hlInfo as any);
			await svc.GetHistory("BTC", "hyperliquid", 1_000_000);
			expect(hlInfo.fundingHistory).toHaveBeenCalledWith({
				coin: "BTC",
				startTime: 1_000_000,
				endTime: undefined,
			});
		});

		it("passes endTime when provided", async () => {
			const hlInfo = makeHlInfo();
			const svc = new FundingHistoryService(hlInfo as any);
			await svc.GetHistory("ETH", "hyperliquid", 1_000, 2_000);
			expect(hlInfo.fundingHistory).toHaveBeenCalledWith({
				coin: "ETH",
				startTime: 1_000,
				endTime: 2_000,
			});
		});

		it("uses prefixed coin name for custom dex", async () => {
			const hlInfo = makeHlInfo();
			const svc = new FundingHistoryService(hlInfo as any);
			await svc.GetHistory("BTC", "mydex", 1_000);
			expect(hlInfo.fundingHistory).toHaveBeenCalledWith({
				coin: "mydex:BTC",
				startTime: 1_000,
				endTime: undefined,
			});
		});

		it("maps records to FundingHistoryPoints with fundingRate and apr", async () => {
			const hlInfo = makeHlInfo([
				{
					coin: "BTC",
					fundingRate: "0.001",
					premium: "0.0005",
					time: 1_100_000,
				},
				{
					coin: "BTC",
					fundingRate: "-0.0002",
					premium: "0.0001",
					time: 1_200_000,
				},
			]);
			const svc = new FundingHistoryService(hlInfo as any);
			const result = await svc.GetHistory("BTC", "hyperliquid", 1_000_000);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				time: 1_100_000,
				fundingRate: 0.001,
				apr: 0.001 * 3 * 365,
			});
			expect(result[1].time).toBe(1_200_000);
			expect(result[1].fundingRate).toBeCloseTo(-0.0002);
			expect(result[1].apr).toBeCloseTo(-0.0002 * 3 * 365);
		});

		it("returns empty array when no history found", async () => {
			const hlInfo = makeHlInfo([]);
			const svc = new FundingHistoryService(hlInfo as any);
			const result = await svc.GetHistory("BTC", "hyperliquid", 1_000_000);
			expect(result).toEqual([]);
		});

		it("APR equals fundingRate * 1095", async () => {
			const hlInfo = makeHlInfo([
				{ coin: "BTC", fundingRate: "0.0001", premium: "0", time: 1_000 },
			]);
			const svc = new FundingHistoryService(hlInfo as any);
			const [point] = await svc.GetHistory("BTC", "hyperliquid", 0);
			expect(point.apr).toBeCloseTo(0.0001 * 1095);
		});
	});
});
