<script lang="ts">
	import { Panel, MarketItem } from '$lib/components/common';
	import { commodities, vix } from '$lib/stores';
	import { t } from 'svelte-i18n';

	const items = $derived($commodities.items);
	const loading = $derived($commodities.loading);
	const error = $derived($commodities.error);

	// VIX status for panel header
	const vixStatus = $derived(getVixStatus($vix?.price));
	const vixClass = $derived(getVixClass($vix?.price));

	function getVixStatus(level: number | undefined): string {
		if (level === undefined) return '';
		if (level >= 30) return $t('vix.high');
		if (level >= 20) return $t('vix.elevated');
		return $t('vix.low');
	}

	function getVixClass(level: number | undefined): string {
		if (level === undefined) return '';
		if (level >= 30) return 'critical';
		if (level >= 20) return 'elevated';
		return 'monitoring';
	}
</script>

<Panel id="commodities" status={vixStatus} statusClass={vixClass} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">
			{$t('common.empty_state', { values: { type: $t('panels.commodities') } })}
		</div>
	{:else}
		<div class="commodities-list">
			{#each items as item (item.symbol)}
				<MarketItem {item} currencySymbol={item.symbol === '^VIX' ? '' : '$'} />
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.commodities-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
