import { FundingRateService } from "./FundingRateService";
import { HLInfo } from "../clients/HLInfo";
import { DexService } from "./DexService";
import { ArbitageService } from "./ArbitageService";
import { FilterService } from "./FilterService";
import { SortService } from "./SortService";
import { filterConfig } from "./config";

export const services = {
	fundingRateService: new FundingRateService(HLInfo),
	dexService: new DexService(HLInfo),
	arbitageService: new ArbitageService(),
	filterService: new FilterService(filterConfig),
	sortService: new SortService({ column: "spread", direction: "desc" }),
};
