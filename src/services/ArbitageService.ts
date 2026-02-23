import type { FundingRateViewModel } from "./FundingRateService";

export interface FilterConfiguration {
	dexCountGreaterThan: number;
	dexCountLessThan?: number;
	dexFilter: "EXCLUDE" | "INCLUDE";
	dexFilterList: string[];
}

export interface ArbitageViewModel {
	[asset: string]: {
		[dex: string]: number;
	};
}

export interface ArbitageRow {
	asset: string;
	rates: Record<string, number>;
	spread: number;
}

export interface IArbitageService {
	GetArbitageViewModel(data: {
		[dex: string]: FundingRateViewModel[];
	}): ArbitageViewModel;
	ToRows(viewmodel: ArbitageViewModel): ArbitageRow[];
}

export class ArbitageService implements IArbitageService {
	ToRows(viewmodel: ArbitageViewModel): ArbitageRow[] {
		return Object.entries(viewmodel).map(([asset, rates]) => {
			const values = Object.values(rates);
			const spread =
				values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
			return { asset, rates, spread };
		});
	}

	GetArbitageViewModel(data: {
		[dex: string]: FundingRateViewModel[];
	}): ArbitageViewModel {
		const arbitageViewModel: ArbitageViewModel = {};
		for (const [dex, fundingRates] of Object.entries(data)) {
			for (const fundingRate of fundingRates) {
				if (fundingRate.asset in arbitageViewModel) {
					arbitageViewModel[fundingRate.asset][dex] = fundingRate.fundingRate;
				} else {
					arbitageViewModel[fundingRate.asset] = {
						[dex]: fundingRate.fundingRate,
					};
				}
			}
		}
		return arbitageViewModel;
	}
}
