/**
 * API Configuration
 * Optimized for Zero-Budget deployment in restricted network environments (China)
 */

import { browser } from '$app/environment';

/**
 * Finnhub API key
 * Get your free key at: https://finnhub.io/
 */
export const FINNHUB_API_KEY = browser
	? (import.meta.env?.VITE_FINNHUB_API_KEY ?? '')
	: (process.env.VITE_FINNHUB_API_KEY ?? '');

export const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * FRED API key (St. Louis Fed)
 */
export const FRED_API_KEY = browser
	? (import.meta.env?.VITE_FRED_API_KEY ?? '')
	: (process.env.VITE_FRED_API_KEY ?? '');

export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

/**
 * Check if we're in development mode
 */
const isDev = browser ? (import.meta.env?.DEV ?? false) : false;

/**
 * Fetch with Smart Proxy Failover
 * Now uses the built-in server-side proxy for maximum reliability
 */
export async function fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
	// Rule 1: Chinese sources go DIRECT from browser if possible (Maximum speed)
	if (url.includes('sourcelang:chinese') || url.includes('.cn')) {
		try {
			const res = await fetch(url, options);
			if (res.ok) return res;
		} catch {
			// Fallback to internal proxy if browser fetch fails
		}
	}

	// Use our internal Node.js proxy route
	// This solves CORS and allows the server to handle the proxy failover chain
	const internalProxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

	try {
		const res = await fetch(internalProxyUrl, options);
		if (res.ok) return res;
		throw new Error(`Internal proxy returned ${res.status}`);
	} catch {
		logger.error(
			'API',
			`Internal proxy failed for ${url}, trying direct browser fallback as last resort`
		);
		// Last resort: try to fetch directly from browser (will likely fail CORS but better than nothing)
		return fetch(url, options);
	}
}

/**
 * API request delays (ms) to avoid rate limiting
 */
export const API_DELAYS = {
	betweenCategories: 500,
	betweenRetries: 1000
} as const;

/**
 * Cache TTLs (ms)
 */
export const CACHE_TTLS = {
	weather: 10 * 60 * 1000,
	news: 5 * 60 * 1000,
	markets: 60 * 1000,
	default: 5 * 60 * 1000
} as const;

/**
 * Debug/logging configuration
 */
export const DEBUG = {
	enabled: isDev,
	logApiCalls: isDev,
	logCacheHits: false
} as const;

/**
 * Conditional logger
 */
export const logger = {
	log: (prefix: string, ...args: unknown[]) => {
		if (DEBUG.logApiCalls) {
			console.log(`[${prefix}]`, ...args);
		}
	},
	warn: (prefix: string, ...args: unknown[]) => {
		console.warn(`[${prefix}]`, ...args);
	},
	error: (prefix: string, ...args: unknown[]) => {
		console.error(`[${prefix}]`, ...args);
	}
};
