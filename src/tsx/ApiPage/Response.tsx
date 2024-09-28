import { PageProps } from './ApiPageProps';

export default function Response(props: PageProps) {
	const okResponse = props.page === 'preop' ?
		<li>
			<p><code>200 OK</code>:
				200 generally means you specified a valid request, however, you may still have some errors.
				A 200 response will return an array of responses. You will get one entry in the array per <a href="#eyes">eye object</a> you specified in the request.</p>
			<p>Each eye is a JSON object that will either specify:</p>
			<ol>
				<li><p><code>&quot;Error&quot;</code>: if one of the values for the eye was not valid, this will be a string that explains what is wrong for the given eye, or:</p></li>
				<li>
					<p><code>&quot;IOLs&quot;</code>: If all values for the eye are valid, this will be an array with one result per IOL specified by the request (whether <a href="#overridden-iols">overridden for the specified eye</a>, or specified in <a href="#root-iols">the default root <code>IOLs</code> property</a>).</p>
					<p>Each entry in the list of <code>&quot;IOLs&quot;</code> is a JSON object that will either specify:</p>
					<ol>
						<li><p><code>&quot;Error&quot;</code>: if one of the values for the IOL was not valid, this will be a string that explains what is wrong for the given IOL, or:</p></li>
						<li>
							<p><code>&quot;Predictions&quot;</code>: if all values for the IOL are valid, this will be an array of prediction results.</p>
							<p>Unless there are not enough IOL options, the list of <code>&quot;Predictions&quot;</code> will be an array containing the specified number of prediction results (See <a href="#predictions-per-iol">the PredictionsPerIol request property</a>).</p>
							<p>Each prediction includes the IOL power, called <code>&quot;IOL&quot;</code>, and the predicted postoperative spherical equivalent refraction, called <code>&quot;Rx&quot;</code>.
							The best option (whose <code>&quot;Rx&quot;</code> is closest to the <a href="#tgt-rx">request&apos;s <code>&quot;TgtRx&quot;</code> property</a> will also include <code>&quot;IsBestOption&quot;: true</code>). Whenever possible, this prediction will be the middle option in the array. Other options will omit the <code>&quot;IsBestOption&quot;</code> parameter.</p>
							The predictions returned will be sorted by their <code>&quot;IOL&quot;</code> property, with lower IOL powers specified first.
						</li>
					</ol>
				</li>
			</ol>
		</li> :
		<li>
			<p><code>200 OK</code>:
				200 generally means you specified a valid request, however, you may still have some errors. A 200 response will return two properties:</p>
			<ol>
				<li>
					<p><code>&quot;SurgeonFactor&quot;</code> will be the Surgeon Factor used for the request. If you specified an <code>Optimize</code> value of <code>false</code>, then this will simply be the <code>SurgeonFactor</code> value you specified in the request. However, if you specified an <code>Optimize</code> value of <code>true</code>, we will return the optimized Surgeon Factor.</p>
					<p>See <a href="#optimize">the documentation of the <code>Optimize</code> property</a> for details of how lens constant optimization is performed.</p>
				</li>
				<li>
					<p><code>&quot;Predictions&quot;</code> will specify an array of results, with one result per <a href="#eyes">eye object</a> you specified in the request. Each result will be either:</p>
					<ol>
						<li><p>A string, which describes a problem with the eye&apos;s data, or:</p></li>
						<li><p>A number, which is the predicted postoperative spherical equivalent refraction, given the specified preoperative data and IOL.</p></li>
					</ol>
				</li>
			</ol>
		</li>;

	return (
		<>
			<h1 className="display-4">Response</h1>
			<p className="lead">The API will return one of the following response codes:</p>
			<div>
				<ul>
					<li><p><code>400 Bad Request</code>: Your request is not valid JSON, or specifies an invalid value for one or more property. The response&apos;s body will specify what is wrong.</p></li>
					<li><p><code>405 Method Not Allowed</code>: The request method must be <code>POST</code></p></li>
					<li><p><code>415 Unsupported Media Type</code>: You must specify a <code>Content-Type</code> header of <code>application/json</code></p></li>
					{okResponse}
				</ul>
			</div>
		</>
	);
}
