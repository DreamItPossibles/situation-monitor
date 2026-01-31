<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { waitLocale } from 'svelte-i18n';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

{#await waitLocale()}
	<div class="min-h-screen bg-bg flex items-center justify-center">
		<div class="text-accent animate-pulse">Loading...</div>
	</div>
{:then}
	<div class="min-h-screen bg-bg text-text-primary">
		{@render children()}
	</div>
{/await}
