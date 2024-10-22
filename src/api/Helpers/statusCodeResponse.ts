import Env from './Env';

export default async function statusCodeResponse(request: Request, env: Env, statusCode: number, statusText: string, statusDescription?: string): Promise<Response> {
	if (typeof request.headers.get('accept') === 'string' && ((request.headers.get('accept') + '').indexOf('*/*') >= 0 || ((request.headers.get('accept') + '').indexOf('text/html') >= 0 && (request.headers.get('accept') + '').indexOf('text/html') > (request.headers.get('accept') + ';application/json').indexOf('application/json')))) {
		const response: Response = await env.ASSETS.fetch(new Request('https://fakehost.invalid/statusCodeResponse.html', { cf: request.cf, headers: request.headers }));
		const headers = new Headers(response.headers);
		headers.append('Access-Control-Allow-Origin', '*');
		return new Response((await response.text()).replace(/@@STATUSCODE@@/, `${statusCode}`).replace(/@@STATUSTEXT@@/, statusDescription || statusText), {
			cf: response.cf,
			headers: headers,
			statusText: statusText,
			status: statusCode
		});
	}

	return new Response(JSON.stringify({ Error: statusDescription || statusText }), { status: statusCode, statusText: statusText, headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
};
