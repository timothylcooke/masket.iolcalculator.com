import Settings from '../../api/Settings';

export default function LensConstants() {
	return (
		<tr>
			<td><code>SurgeonFactor</code></td>
			<td>Required</td>
			<td>
				<p>The Surgeon Factor of the specified IOL. This must be a number between {Settings.iolConstants.SurgeonFactor.min} and {Settings.iolConstants.SurgeonFactor.max}, and is rounded to the nearest 10<sup>-{Settings.iolConstants.SurgeonFactor.roundedToSigFigs}</sup>.</p>
				<p>If it is not known, Surgeon Factor can be converted from A-constant using the formula: <code>SF = 0.5663 × A − 65.6</code></p>
				<p><strong>Important:</strong> All eyes being calculated must use the same Surgeon Factor.</p>
			</td>
		</tr>
	);
}
