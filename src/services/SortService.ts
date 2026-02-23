import type { ArbitageRow } from "./ArbitageService";

export type SortColumn = "asset" | "spread" | "apr" | (string & {});
export type SortDirection = "asc" | "desc";

export interface SortConfiguration {
	column: SortColumn;
	direction: SortDirection;
}

export interface ISortService {
	Toggle(column: SortColumn): void;
	Sort(rows: ArbitageRow[]): ArbitageRow[];
	GetConfiguration(): SortConfiguration;
}

export class SortService implements ISortService {
	private config: SortConfiguration;

	constructor(defaultConfig: SortConfiguration) {
		this.config = { ...defaultConfig };
	}

	Toggle(column: SortColumn): void {
		if (this.config.column === column) {
			this.config = {
				column,
				direction: this.config.direction === "asc" ? "desc" : "asc",
			};
		} else {
			this.config = { column, direction: "desc" };
		}
	}

	Sort(rows: ArbitageRow[]): ArbitageRow[] {
		const { column, direction } = this.config;
		return [...rows].sort((a, b) => {
			let av: number | string;
			let bv: number | string;

			if (column === "asset") {
				av = a.asset;
				bv = b.asset;
			} else if (column === "spread" || column === "apr") {
				av = a.spread;
				bv = b.spread;
			} else {
				av = a.rates[column] ?? -Infinity;
				bv = b.rates[column] ?? -Infinity;
			}

			if (av < bv) return direction === "asc" ? -1 : 1;
			if (av > bv) return direction === "asc" ? 1 : -1;
			return 0;
		});
	}

	GetConfiguration(): SortConfiguration {
		return { ...this.config };
	}
}
