import Settings from '../../api/Settings';
import HtmlSettings from '../HtmlSettings';
import LensConstants from './LensConstants';
import { PageProps } from './ApiPageProps';

export default function Properties(props: PageProps) {
	let otherProperties;

	if (props.page === 'preop') {
		otherProperties = <>
			<tr>
				<td><code id="predictions-per-iol">PredictionsPerIol</code></td>
				<td>Required</td>
				<td>
					<p>The number of predictions that should be shown for each IOL. In most IOL calculators, this number is 5 or 7. However, you can specify any number between {Settings.predictionsPerIol.min} and {Settings.predictionsPerIol.max}.</p>
					<p>Suppose you specify <code>PredictionsPerIol = 7</code>.</p><p>In most cases, the API will return the IOL power with the closest predicted refraction to the target refraction (the &quot;best option&quot;), as well as the three IOL powers on either side of the best option.</p>
					<p>If there are not enough IOL powers available to fill the list of predictions, it may add additional options that are less than ideal. For example, if you request 5 IOLs per eye, but the best option is 29.5 D, and IOL powers are only available from 6 to 30 D, the API will return 29.5 D, as well as only one option greater than 29.5 D, and three options less than 29.5 D.</p>
				</td>
			</tr>
			<tr>
				<td><code>Eyes</code></td>
				<td>Required</td>
				<td>
					<p>Specify a list of <a href="#eyes">eye objects.</a></p>
					<p>The list of eyes that should be calculated. Most IOL calculators would specify just one or two eyes at a time (right eye, left eye, or both eyes).</p>
					<p>You are required to specify at least one eye, but you are permitted to specify up to {Settings.preopEyes.max} eyes per API call.</p>
				</td>
			</tr>
			<tr>
				<td><code id="root-iols">IOLs</code></td>
				<td>Optional<abbr title="If the global iols property is not specified, then each individual eye must specify iols.">*</abbr></td>
				<td>
					<p>Specify a list of {Settings.iolsPerEye.min == 1 ? 'one' : Settings.iolsPerEye.min} or more <a href="#iols">IOL objects.</a></p>
					<p>The <code>IOLs</code> property specifies a <i>default</i> list of IOL objects that will be used for every single eye (except for eyes that explicitly override this default list).</p>
					<p>While you <i>can</i> specify a list of IOL objects for every individual eye, it is usually easier to specify just this default list of IOL objects to be used.</p>
					<p>You cannot specify more than {Settings.iolsPerEye.max} IOL objects.</p>
					<p><strong>Important:</strong> While this property is optional, if it is omitted, then you must specify a custom list of IOL objects to be used on each individual eye. In other words, if you do not specify a global list of default IOL objects, each individual eye <i>must</i> specify its own list of IOL objects).</p>
				</td>
			</tr>
		</>;
	} else {
		otherProperties = <>
			<LensConstants />
			<tr>
				<td><code id="optimize">Optimize</code></td>
				<td>Required</td>
				<td>
					<p>Specify whether or not to optimize the {Settings.iolConstants.constantToOptimizeDisplayName}: either <code>true</code> or <code>false</code>.</p>
					<p>If you specify <code>false</code>, we will use the <code>{Settings.iolConstants.constantToOptimizeVariableName}</code> variable as-is.</p>
					<p>If you specify <code>true</code>, we will use the Gatinel method to optimize the {Settings.iolConstants.constantToOptimizeDisplayName} iteratively (starting with the value you specify with the <code>{Settings.iolConstants.constantToOptimizeVariableName}</code> property), returning the first {Settings.iolConstants.constantToOptimizeDisplayName} that yields a mean predictive error less than 10<sup>-{Settings.optimizeEyes.mpeSigFigs}</sup>. If such {/^[aeiou]/i.test(Settings.iolConstants.constantToOptimizeDisplayName) ? 'an' : 'a'} {Settings.iolConstants.constantToOptimizeDisplayName} is not found within {Settings.optimizeEyes.maxIterations} iterations, we will use the best {Settings.iolConstants.constantToOptimizeDisplayName} we could find within {Settings.optimizeEyes.maxIterations} iterations.</p>
					<p><strong>Important:</strong> In order to optimize the {Settings.iolConstants.constantToOptimizeDisplayName}, you must specify at least {Settings.optimizeEyes.minEyes} eyes{Settings.optimizeEyes.minEyes < Settings.optimizeEyes.idealMinEyes ? ` (ideally at least ${Settings.optimizeEyes.idealMinEyes})` : ''}.</p>
				</td>
			</tr>
			<tr>
				<td><code>Eyes</code></td>
				<td>Required</td>
				<td>
					<p>Specify a list of <a href="#eyes">eye objects.</a></p>
					<p>The list of eyes that should be calculated. You are required to specify at least one eye, but you are permitted to specify up to {Settings.postopEyes.max.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} eyes per API call.</p>
				</td>
			</tr>
		</>;
	}

	return (
		<>
			<h1 className="display-4">Properties</h1>
			<p className="lead">There are {props.page === 'preop' ? 'five' : 'five required'} properties to the {HtmlSettings.formulaName} {props.page} API:</p>
			<table className="table">
				<thead>
					<tr>
						<th scope="col">Name</th>
						<th scope="col">Usage</th>
						<th scope="col">Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><abbr title="Keratometric Index"><code id="k-index">KIndex</code></abbr></td>
						<td>Required</td>
						<td>
							<p>The Keratometric Index, sometimes referred to as the &quot;Javal Index&quot; is the &quot;fictitious&quot; refractive index of the cornea, for the purposes of converting the corneal radius (measured in millimeters) to a corneal refractive power (measured in Diopters).</p>
							<p>The number specified here should be the same as that specified in the settings of your keratometer.<br /></p>
							{props.page === 'postop' ? <p><strong>Important:</strong> All eyes should specify Ks measured with the same keratometric index.</p> : undefined}
						</td>
					</tr>
					<tr>
						<td><abbr title="Vertex Distance"><code>V</code></abbr></td>
						<td>Required</td>
						<td>
							<p>The vertex distance, or the distance between the anterior cornea and the spectacle, measured im millimeters. Often assumed to be between 12 and 14 millimeters, this value must be between {Settings.v.min} and {Settings.v.max} millimeters.</p>
						</td>
					</tr>
					{otherProperties}
				</tbody>
			</table>
		</>
	);
}
