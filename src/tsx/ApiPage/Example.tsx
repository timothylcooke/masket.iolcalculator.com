import { PageProps } from './ApiPageProps';

export default function Example(props: PageProps) {
	const postop = {
		request: '{"KIndex":1.3375,"V":12,"UseModifiedMasket":false,"SurgeonFactor":1.9,"Optimize":false,"Eyes":[{"AL":23.60,"K1":44.12,"K2":44.12,"IolPower":20,"PreLasikSphere":-6,"PreLasikCyl":2,"PostLasikSphere":-1,"PostLasikCyl":2},{"AL":20.29,"K1":44.12,"K2":44.12,"IolPower":30,"PreLasikSphere":-3,"PreLasikCyl":1,"PostLasikSphere":0,"PostLasikCyl":1}]}',
		response: '{"SurgeonFactor":1.9,"Predictions":[1.3115,2.8712]}'
	};

	const preop = {
		request: '{"KIndex":1.3375,"V":12,"UseModifiedMasket":false,"PredictionsPerIol":7,"IOLs":[{"SurgeonFactor":1.8,"Powers":[{"From":6,"To":30,"By":0.5}]}],"Eyes":[{"TgtRx":-1,"K1":40,"K2":42,"AL":24,"PreLasikSphere":-6,"PreLasikCyl":2,"PostLasikSphere":-1,"PostLasikCyl":2}]}',
		response: '[{"IOLs":[{"Predictions":[{"IOL":24,"Rx":0.213},{"IOL":24.5,"Rx":-0.136},{"IOL":25,"Rx":-0.4891},{"IOL":25.5,"Rx":-0.8465,"IsBestOption":true},{"IOL":26,"Rx":-1.2081},{"IOL":26.5,"Rx":-1.5741},{"IOL":27,"Rx":-1.9446}]}]}]'
	};

	const { request, response } = (props.page === 'postop' ? postop : preop);

	const prettyRequest = JSON.stringify(JSON.parse(request), null, 4);
	const prettyResponse = JSON.stringify(JSON.parse(response), null, 4);

	return (
		<>
			<h1 className="display-4">Example</h1>
			<p className="lead">Request:</p>
			<pre className="bg-dark text-light py-2"><code>
				curl -X POST {window.location.origin}{new URL(window.location.href).pathname}<br />
				&nbsp;    -H &apos;Content-Type: application/json&apos;<br />
				&nbsp;    -d &apos;{request}&apos;
			</code></pre>
			<p className="lead">Formatted request:</p>
			<pre className="bg-dark text-light py-2"><code>
				POST {window.location.pathname} HTTP/1.1<br />
				Host: {window.location.host}<br />
				Content-Type: application/json<br />
				Content-Length: {prettyRequest.replaceAll('\n', '\r\n').length}<br />
				<br />
				{prettyRequest}
			</code></pre>
			<p className="lead">Formatted response:</p>
			<pre className="bg-dark text-light py-2"><code>
				HTTP/1.1 200 OK<br />
				Content-Type: application/json<br />
				Content-Length: {prettyResponse.replaceAll('\n', '\r\n').length}<br />
				<br />
				{prettyResponse}
			</code></pre>
		</>
	);
}
