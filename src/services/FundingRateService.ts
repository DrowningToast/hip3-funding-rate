import type { InfoClient } from "@nktkas/hyperliquid";

export interface FundingRateViewModel {
	dex: (string & {}) | "hyperliquid";
	asset: string;
	name: `${string}:${string}`;
	fundingRate: number;
}

export interface IFundingRateService {
	GetFundingRatesViewModel(dex?: string): Promise<FundingRateViewModel[]>;
}

export class FundingRateService implements IFundingRateService {
	constructor(private readonly hlInfo: InfoClient) {}

	async GetFundingRatesViewModel(
		dex?: string,
	): Promise<FundingRateViewModel[]> {
		const perpCtx = await this.hlInfo.metaAndAssetCtxs({ dex });
		const [metas, rates] = perpCtx;
		const viewmodel: FundingRateViewModel[] = metas.universe.map(
			(meta, index) => ({
				dex: dex ?? "hyperliquid",
				name: meta.name as `${string}:${string}`,
				asset: meta.name.split(":")[1],
				fundingRate: parseFloat(rates[index].funding),
			}),
		);
		return viewmodel;
	}
}
