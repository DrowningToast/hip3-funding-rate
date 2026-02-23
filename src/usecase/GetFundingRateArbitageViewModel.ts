import type { FundingRateViewModel } from "../services/FundingRateService";
import { services } from "../services";

export const GetFundingRateArbitageViewModel = async () => {
	const dexes = await services.dexService.GetDexes();
	const fundingRatesByDex = await Promise.all(
		dexes.map(async (dex) => {
			return {
				dex,
				fundingRates:
					await services.fundingRateService.GetFundingRatesViewModel(dex),
			};
		}),
	);
	const parsedFundingRatesByDex = fundingRatesByDex.reduce(
		(acc: { [dex: string]: FundingRateViewModel[] }, { dex, fundingRates }) => {
			acc[dex] = fundingRates;
			return acc;
		},
		{},
	);
	return services.arbitageService.GetArbitageViewModel(parsedFundingRatesByDex);
};
