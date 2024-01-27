import { Router } from 'itty-router';
import { randomStr } from './util/string';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

const router = Router();

router.get('/analytics', async (_request, env: Env) => {
	const kvList = await env.CLOUDFLARE_KV_NAMESPACE.list();
	const kvEntries = await Promise.all(kvList.keys.map(async (key) => await env.CLOUDFLARE_KV_NAMESPACE.getWithMetadata(key.name)));
	const head = `<!DOCTYPE html><head><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/picocss/1.5.11/pico.min.css" integrity="sha512-OQffBFLKzDp5Jn8uswDOWJXFNcq64F0N2/Gqd3AtoJrVkSSMMCsB7K7UWRLFyXxm2tYUrNFTv/AX/nkS9zEfxA==" crossorigin="anonymous" referrerpolicy="no-referrer" /></head>`;
	let html = head;

	const entryRows = kvEntries
		.map((entry) => {
			if (entry.value) {
				const json = JSON.parse(entry.value);
				return `<tr><td>${json.id}</td><td>${new Date(json.time).toLocaleString()}</td><td>${json.country}</td><td>${json.city}</td><td>${
					json.regionCode
				}</td><td>${json.postalCode}</td><td>${json.timezone}</td><td>${json.colo}</td></tr>`;
			}
		})
		.toString()
		.replaceAll(',', '');

	if (kvEntries) {
		html = `${head}<body><main class="container"><h1>Pixel Tracker</h1><p>See all pixels created by id parameters in URLs.</p>
				<table>
					<tr>
						<th>ID</th>
						<th>Timestamp</ht>
						<th>Country</th>
						<th>City</th>
						<th>Region Code</th>
						<th>Postal Code</th>
						<th>Timezone</th>
						<th>Cloudflare Colo</th>
					</tr>
					${entryRows}
				</table>
			</main>
			</body>
		`;
	} else {
		html = `${head}<body><main class="container"><p>No entries found</p></main></body>`;
	}
	return new Response(html, {
		headers: {
			'content-type': 'text/html;charset=UTF-8',
		},
	});
});

router.get('/pixel', async (request, env: Env) => {
	const { country, colo, city, timezone, region, regionCode, postalCode } = request.cf;
	const url = new URL(request.url);
	const params = new URLSearchParams(url.searchParams);
	const id = params.get('id');
	const value = {
		id,
		time: new Date(),
		country,
		colo,
		city,
		timezone,
		region,
		regionCode,
		postalCode,
	};

	if (id) {
		try {
			await env.CLOUDFLARE_KV_NAMESPACE.put(randomStr(16), JSON.stringify(value), { expirationTtl: THIRTY_DAYS });
		} catch (e) {
			console.warn('There was an error saving KV information:', e);
		}
	} else {
		console.warn('You must pass an ID as a param in your URL request.');
	}

	const data = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
	const b64String = data.split(',')[1];
	const byteString = atob(b64String);
	const arrayBuffer = new ArrayBuffer(byteString.length);
	const intArray = new Uint8Array(arrayBuffer);
	for (let i = 0; i < byteString.length; i++) {
		intArray[i] = byteString.charCodeAt(i);
	}
	const imageBlob = new Blob([intArray], { type: 'image/png' });
	return new Response(imageBlob, {
		status: 200,
		statusText: 'OK',
		headers: {
			'Content-Type': 'image/png',
			'Content-Length': imageBlob.size.toString(),
		},
	});
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
