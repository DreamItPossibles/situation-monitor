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

	// 1. Fix Finnhub Token: If token is missing or empty, inject from server environment
	if (targetUrl.includes('finnhub.io')) {
		const urlObj = new URL(targetUrl);
		const currentToken = urlObj.searchParams.get('token');
		
		if (!currentToken || currentToken === '') {
			const serverKey = env.VITE_FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY || '';
			if (serverKey) {
				urlObj.searchParams.set('token', serverKey);
				targetUrl = urlObj.toString();
			}
		}
	}

	const browserHeaders = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
		'Accept': 'application/json, text/plain, */*',
		'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
		'Cache-Control': 'no-cache'
	};

	// 2. Direct fetch for known sources
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
				signal: AbortSignal.timeout(8000)
			});
			if (res.ok) {
				const data = await res.text();
				return new Response(data, {
					headers: {
						'Content-Type': res.headers.get('Content-Type') || 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Cache-Control': 'public, max-age=60'
					}
				});
			}
		} catch (error) {
			// Silent fail, move to proxy pool if not a Chinese source
		}
	}

	// 3. Proxy pool fallback
	let lastError: Error | null = null;
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
				const data = await response.text();
				return new Response(data, {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
		} catch (error) {
			lastError = error as Error;
		}
	}

	return json({ error: 'All proxies failed', details: lastError?.message }, { status: 502 });
};
