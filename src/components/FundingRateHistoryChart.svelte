<script lang="ts">
	import type { FundingHistoryPoint } from "../services/FundingHistoryService";

	interface Props {
		token: string;
		leftDex: string;
		rightDex: string;
		leftHistory: FundingHistoryPoint[];
		rightHistory: FundingHistoryPoint[];
	}

	let { token, leftDex, rightDex, leftHistory, rightHistory }: Props = $props();

	type Mode = "fundingRate" | "apr";
	let mode = $state<Mode>("fundingRate");

	// ── Derived display data ─────────────────────────────────────────────────────
	const leftPoints = $derived(
		leftHistory.map((p) => ({ time: p.time, value: p[mode] })),
	);
	const rightPoints = $derived(
		rightHistory.map((p) => ({ time: p.time, value: p[mode] })),
	);

	const allPoints = $derived([...leftPoints, ...rightPoints]);

	const timeMin = $derived(
		allPoints.length ? Math.min(...allPoints.map((p) => p.time)) : 0,
	);
	const timeMax = $derived(
		allPoints.length ? Math.max(...allPoints.map((p) => p.time)) : 1,
	);
	const valueMin = $derived(
		allPoints.length ? Math.min(...allPoints.map((p) => p.value)) : -0.01,
	);
	const valueMax = $derived(
		allPoints.length ? Math.max(...allPoints.map((p) => p.value)) : 0.01,
	);

	// ── Chart layout ─────────────────────────────────────────────────────────────
	const PAD = { top: 24, right: 24, bottom: 48, left: 72 };
	const W = 800;
	const H = 360;
	const chartW = $derived(W - PAD.left - PAD.right);
	const chartH = $derived(H - PAD.top - PAD.bottom);

	function toX(time: number): number {
		if (timeMax === timeMin) return PAD.left;
		return PAD.left + ((time - timeMin) / (timeMax - timeMin)) * chartW;
	}

	function toY(value: number): number {
		const range = valueMax - valueMin;
		if (range === 0) return PAD.top + chartH / 2;
		return PAD.top + ((valueMax - value) / range) * chartH;
	}

	function toPath(pts: { time: number; value: number }[]): string {
		if (pts.length === 0) return "";
		return pts
			.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.time)} ${toY(p.value)}`)
			.join(" ");
	}

	const leftPath = $derived(toPath(leftPoints));
	const rightPath = $derived(toPath(rightPoints));

	// ── Y-axis ticks ─────────────────────────────────────────────────────────────
	const yTicks = $derived((): { y: number; label: string }[] => {
		const count = 5;
		return Array.from({ length: count }, (_, i) => {
			const frac = i / (count - 1);
			const val = valueMax - frac * (valueMax - valueMin);
			return {
				y: PAD.top + frac * chartH,
				label: fmtVal(val),
			};
		});
	});

	// ── X-axis ticks ─────────────────────────────────────────────────────────────
	const xTicks = $derived((): { x: number; label: string }[] => {
		const count = 6;
		return Array.from({ length: count }, (_, i) => {
			const frac = i / (count - 1);
			const t = timeMin + frac * (timeMax - timeMin);
			return { x: toX(t), label: fmtTime(t) };
		});
	});

	// ── Formatters ───────────────────────────────────────────────────────────────
	function fmtVal(v: number): string {
		if (mode === "apr") return (v * 100).toFixed(1) + "%";
		return (v * 100).toFixed(4) + "%";
	}

	function fmtTime(ms: number): string {
		const d = new Date(ms);
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	}

	// ── Tooltip ──────────────────────────────────────────────────────────────────
	let tooltipX = $state<number | null>(null);

	function nearestPoint(
		pts: { time: number; value: number }[],
		x: number,
	): { time: number; value: number } | null {
		if (!pts.length) return null;
		// find index by x position
		const times = pts.map((p) => toX(p.time));
		let nearest = 0;
		let minDist = Infinity;
		times.forEach((tx, i) => {
			const d = Math.abs(tx - x);
			if (d < minDist) {
				minDist = d;
				nearest = i;
			}
		});
		return pts[nearest];
	}

	const tooltipLeft = $derived(
		tooltipX !== null ? nearestPoint(leftPoints, tooltipX) : null,
	);
	const tooltipRight = $derived(
		tooltipX !== null ? nearestPoint(rightPoints, tooltipX) : null,
	);
	const tooltipDate = $derived(
		tooltipLeft ? fmtTime(tooltipLeft.time) : tooltipRight ? fmtTime(tooltipRight.time) : "",
	);

	function onMouseMove(e: MouseEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const scaleX = W / rect.width;
		const rawX = (e.clientX - rect.left) * scaleX;
		if (rawX >= PAD.left && rawX <= W - PAD.right) {
			tooltipX = rawX;
		} else {
			tooltipX = null;
		}
	}

	function onMouseLeave() {
		tooltipX = null;
	}

	// ── Stats ─────────────────────────────────────────────────────────────────
	function avg(pts: FundingHistoryPoint[], key: keyof FundingHistoryPoint): number {
		if (!pts.length) return 0;
		return pts.reduce((s, p) => s + (p[key] as number), 0) / pts.length;
	}

	const leftLatest = $derived(leftHistory.at(-1));
	const rightLatest = $derived(rightHistory.at(-1));
	const leftAvgApr = $derived(avg(leftHistory, "apr"));
	const rightAvgApr = $derived(avg(rightHistory, "apr"));
</script>

<div class="flex flex-col gap-6">
	<!-- ── Header card ─────────────────────────────────────────────────────── -->
	<div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
		<div class="flex items-center justify-between flex-wrap gap-3">
			<div>
				<h2 class="text-xl font-bold text-slate-100">
					{token}
					<span class="text-slate-500 font-normal text-base ml-2">Funding Rate History</span>
				</h2>
				<p class="text-slate-500 text-sm mt-0.5">7-day historical comparison</p>
			</div>
			<!-- Mode toggle -->
			<div class="flex rounded-lg border border-slate-700 overflow-hidden text-sm">
				<button
					class="px-4 py-1.5 transition-colors {mode === 'fundingRate'
						? 'bg-blue-600 text-white'
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
					onclick={() => (mode = "fundingRate")}
				>
					Funding Rate
				</button>
				<button
					class="px-4 py-1.5 transition-colors {mode === 'apr'
						? 'bg-blue-600 text-white'
						: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
					onclick={() => (mode = "apr")}
				>
					APR
				</button>
			</div>
		</div>

		<!-- Legend -->
		<div class="flex gap-6 mt-4">
			<div class="flex items-center gap-2">
				<span class="w-8 h-0.5 bg-blue-400 rounded"></span>
				<span class="text-slate-300 text-sm font-medium">{leftDex}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-8 h-0.5 bg-purple-400 rounded"></span>
				<span class="text-slate-300 text-sm font-medium">{rightDex}</span>
			</div>
		</div>
	</div>

	<!-- ── Chart card ──────────────────────────────────────────────────────── -->
	<div class="bg-slate-900 border border-slate-800 rounded-xl p-5 relative">
		<!-- Tooltip overlay -->
		{#if tooltipX !== null && (tooltipLeft || tooltipRight)}
			<div
				class="absolute top-5 right-5 z-10 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs pointer-events-none"
			>
				<p class="text-slate-400 mb-1">{tooltipDate}</p>
				{#if tooltipLeft}
					<p class="text-blue-400">
						{leftDex}: <span class="font-mono">{fmtVal(tooltipLeft.value)}</span>
					</p>
				{/if}
				{#if tooltipRight}
					<p class="text-purple-400">
						{rightDex}: <span class="font-mono">{fmtVal(tooltipRight.value)}</span>
					</p>
				{/if}
			</div>
		{/if}

		<!-- SVG Line Chart -->
		<svg
			viewBox="0 0 {W} {H}"
			class="w-full"
			role="img"
			aria-label="{token} funding rate comparison chart"
			onmousemove={onMouseMove}
			onmouseleave={onMouseLeave}
		>
			<!-- Grid lines -->
			{#each yTicks() as tick}
				<line
					x1={PAD.left}
					y1={tick.y}
					x2={W - PAD.right}
					y2={tick.y}
					stroke="#1e293b"
					stroke-width="1"
				/>
				<text
					x={PAD.left - 8}
					y={tick.y}
					text-anchor="end"
					dominant-baseline="middle"
					font-size="11"
					fill="#64748b"
				>
					{tick.label}
				</text>
			{/each}

			<!-- Zero line -->
			{#if valueMin < 0 && valueMax > 0}
				<line
					x1={PAD.left}
					y1={toY(0)}
					x2={W - PAD.right}
					y2={toY(0)}
					stroke="#334155"
					stroke-width="1"
					stroke-dasharray="4 4"
				/>
			{/if}

			<!-- X-axis labels -->
			{#each xTicks() as tick}
				<text
					x={tick.x}
					y={H - PAD.bottom + 18}
					text-anchor="middle"
					font-size="11"
					fill="#64748b"
				>
					{tick.label}
				</text>
			{/each}

			<!-- Left DEX line -->
			{#if leftPath}
				<path
					d={leftPath}
					fill="none"
					stroke="#60a5fa"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
			{/if}

			<!-- Right DEX line -->
			{#if rightPath}
				<path
					d={rightPath}
					fill="none"
					stroke="#c084fc"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
			{/if}

			<!-- Tooltip crosshair -->
			{#if tooltipX !== null}
				<line
					x1={tooltipX}
					y1={PAD.top}
					x2={tooltipX}
					y2={H - PAD.bottom}
					stroke="#475569"
					stroke-width="1"
					stroke-dasharray="4 4"
				/>
				{#if tooltipLeft}
					<circle
						cx={tooltipX}
						cy={toY(tooltipLeft.value)}
						r="4"
						fill="#60a5fa"
						stroke="#0f172a"
						stroke-width="2"
					/>
				{/if}
				{#if tooltipRight}
					<circle
						cx={tooltipX}
						cy={toY(tooltipRight.value)}
						r="4"
						fill="#c084fc"
						stroke="#0f172a"
						stroke-width="2"
					/>
				{/if}
			{/if}

			<!-- Empty state -->
			{#if allPoints.length === 0}
				<text
					x={W / 2}
					y={H / 2}
					text-anchor="middle"
					dominant-baseline="middle"
					font-size="14"
					fill="#475569"
				>
					No data available
				</text>
			{/if}
		</svg>
	</div>

	<!-- ── Stats cards ─────────────────────────────────────────────────────── -->
	<div class="grid grid-cols-2 gap-4">
		{#each [
			{ dex: leftDex, latest: leftLatest, avgApr: leftAvgApr, color: "blue" },
			{ dex: rightDex, latest: rightLatest, avgApr: rightAvgApr, color: "purple" },
		] as stat}
			{@const isBlue = stat.color === "blue"}
			<div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
				<div class="flex items-center gap-2 mb-4">
					<span
						class="w-3 h-3 rounded-full {isBlue ? 'bg-blue-400' : 'bg-purple-400'}"
					></span>
					<h3 class="text-slate-300 font-semibold text-sm uppercase tracking-wide">
						{stat.dex}
					</h3>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-slate-500 text-xs mb-1">Latest Rate</p>
						<p
							class="font-mono font-bold text-lg {stat.latest && stat.latest.fundingRate >= 0
								? 'text-emerald-400'
								: 'text-red-400'}"
						>
							{stat.latest ? (stat.latest.fundingRate * 100).toFixed(4) + "%" : "—"}
						</p>
					</div>
					<div>
						<p class="text-slate-500 text-xs mb-1">Latest APR</p>
						<p
							class="font-mono font-bold text-lg {stat.latest && stat.latest.apr >= 0
								? 'text-emerald-400'
								: 'text-red-400'}"
						>
							{stat.latest ? (stat.latest.apr * 100).toFixed(2) + "%" : "—"}
						</p>
					</div>
					<div>
						<p class="text-slate-500 text-xs mb-1">Avg APR (7d)</p>
						<p
							class="font-mono text-base {stat.avgApr >= 0
								? 'text-slate-300'
								: 'text-slate-400'}"
						>
							{(stat.avgApr * 100).toFixed(2)}%
						</p>
					</div>
					<div>
						<p class="text-slate-500 text-xs mb-1">Data Points</p>
						<p class="font-mono text-base text-slate-300">
							{stat.dex === leftDex ? leftHistory.length : rightHistory.length}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
