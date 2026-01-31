import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const FREE_PROXY_POOL = [
	'https://api.allorigins.win/raw?url=',
	'https://corsproxy.io/?url=',
	'https://proxy.cors.sh/',
	'https://thingproxy.freeboard.io/fetch/',
	'https://cors-anywhere.herokuapp.com/'
];

export const GET: RequestHandler = async ({ url }) => {
	let targetUrl = url.searchParams.get('url');

	if (!targetUrl) {
		return json({ error: 'Missing url parameter' }, { status: 400 });
	}

	// Inject Finnhub Token if missing (compatible with both dev and prod)
	if (targetUrl.includes('finnhub.io') && !targetUrl.includes('token=')) {
		const token = env.VITE_FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY || '';
		if (token) {
			const separator = targetUrl.includes('?') ? '&' : '?';
			targetUrl += `${separator}token=${token}`;
		}
	}

	// Mimic a real browser
	const browserHeaders = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*',
		'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
		'Cache-Control': 'no-cache',
		'Pragma': 'no-cache'
	};

	// For Chinese sources, GDELT, CDNs, or Finance APIs, try direct fetch first (server-side)
	if (
		targetUrl.includes('gdelt') ||
		targetUrl.includes('finnhub.io') ||
		targetUrl.includes('coingecko.com') ||
		targetUrl.includes('jsdelivr.net') ||
		targetUrl.includes('open-meteo.com') ||
		targetUrl.includes('sourcelang:chinese') ||
		targetUrl.includes('.cn')
	) {
		try {
			const res = await fetch(targetUrl, {
				headers: browserHeaders,
				signal: AbortSignal.timeout(5000)
			});
			if (res.ok) {
				const data = await res.text();
				return new Response(data, {
					headers: {
						'Content-Type': res.headers.get('Content-Type') || 'application/json',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
		} catch {
			// Fail silently and move to proxy pool
		}
	}

	let lastError: Error | null = null;

	// Try each proxy in the pool
	for (const proxyBase of FREE_PROXY_POOL) {
		try {
			const proxyRequestUrl = proxyBase.includes('?')
				? `${proxyBase}${encodeURIComponent(targetUrl)}`
				: `${proxyBase}${targetUrl}`;

			const response = await fetch(proxyRequestUrl, {
				headers: browserHeaders,
				signal: AbortSignal.timeout(10000)
			});

			if (response.ok) {
				const contentType = response.headers.get('Content-Type');
				const data = await response.text();

				return new Response(data, {
					headers: {
						'Content-Type': contentType || 'text/plain',
						'Cache-Control': 'public, max-age=300',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
		} catch (error) {
			lastError = error as Error;
			console.warn(`Server proxy ${proxyBase} failed for ${targetUrl}, trying next...`);
		}
	}

	// Final last resort: direct fetch without special headers
	try {
		const res = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
		if (res.ok) {
			const data = await res.text();
			return new Response(data, {
				headers: {
					'Content-Type': res.headers.get('Content-Type') || 'text/plain',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}
	} catch {
		// ignore
	}

	return json({ error: 'All proxies failed', details: lastError?.message }, { status: 502 });
};
