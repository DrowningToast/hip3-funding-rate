import type { InfoClient } from "@nktkas/hyperliquid";

export interface FundingHistoryPoint {
	time: number;
	fundingRate: number;
	apr: number;
}

export interface IFundingHistoryService {
	GetHistory(
		asset: string,
		dex: string,
		startTime: number,
		endTime?: number,
	): Promise<FundingHistoryPoint[]>;
}

// 3 funding periods per day × 365 days = 1095 periods per year
const PERIODS_PER_YEAR = 3 * 365;

export class FundingHistoryService implements IFundingHistoryService {
	constructor(private readonly hlInfo: InfoClient) {}

	getCoinName(asset: string, dex: string): string {
		return dex === "hyperliquid" ? asset : `${dex}:${asset}`;
	}

	async GetHistory(
		asset: string,
		dex: string,
		startTime: number,
		endTime?: number,
	): Promise<FundingHistoryPoint[]> {
		const coin = this.getCoinName(asset, dex);
		const history = await this.hlInfo.fundingHistory({
			coin,
			startTime,
			endTime,
		});
		return history.map((h) => {
			const fundingRate = parseFloat(h.fundingRate);
			return {
				time: h.time,
				fundingRate,
				apr: fundingRate * PERIODS_PER_YEAR,
			};
		});
	}
}
