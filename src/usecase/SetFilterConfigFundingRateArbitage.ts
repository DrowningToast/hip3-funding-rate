import { services } from "../services";
import type { FilterConfiguration } from "../services/ArbitageService";

export const SetFilterConfigFundingRateArbitage = async (
	config: FilterConfiguration,
) => {
	services.filterService.UpdateConfiguration(config);
};
