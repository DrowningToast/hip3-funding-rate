import type { ArbitageViewModel, FilterConfiguration } from "./ArbitageService";

export interface IFilterService {
	UpdateConfiguration(config: Partial<FilterConfiguration>): void;
	Filter(viewmodel: ArbitageViewModel): ArbitageViewModel;
}

export class FilterService implements IFilterService {
	private config: FilterConfiguration;

	constructor(defaultConfig: FilterConfiguration) {
		this.config = defaultConfig;
	}

	UpdateConfiguration(config: Partial<FilterConfiguration>): void {
		this.config = { ...this.config, ...config };
	}

	Filter(viewmodel: ArbitageViewModel): ArbitageViewModel {
		let result = viewmodel;

		if (this.config.dexCountGreaterThan !== undefined) {
			result = Object.fromEntries(
				Object.entries(result).filter(
					([_, value]) =>
						Object.keys(value).length > this.config.dexCountGreaterThan,
				),
			);
		}

		if (this.config.dexCountLessThan !== undefined) {
			result = Object.fromEntries(
				Object.entries(result).filter(
					([_, value]) =>
						Object.keys(value).length < this.config.dexCountLessThan!,
				),
			);
		}

		if (this.config.dexFilter === "EXCLUDE" && this.config.dexFilterList.length > 0) {
			result = Object.fromEntries(
				Object.entries(result)
					.map(([asset, rates]) => [
						asset,
						Object.fromEntries(
							Object.entries(rates).filter(
								([dex]) => !this.config.dexFilterList.includes(dex),
							),
						),
					])
					.filter(([_, rates]) => Object.keys(rates).length > 0),
			);
		} else if (this.config.dexFilter === "INCLUDE" && this.config.dexFilterList.length > 0) {
			result = Object.fromEntries(
				Object.entries(result)
					.map(([asset, rates]) => [
						asset,
						Object.fromEntries(
							Object.entries(rates).filter(([dex]) =>
								this.config.dexFilterList.includes(dex),
							),
						),
					])
					.filter(([_, rates]) => Object.keys(rates).length > 0),
			);
		}

		return result;
	}
}
