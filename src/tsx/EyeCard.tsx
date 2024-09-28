import { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { EyeHistoryState } from './HomePage';
import NumberTextBox, { NumberTextBoxHandle } from './NumberTextBox';
import Settings from '../api/Settings';
import HtmlSettings, { rWarning, kToR } from './HtmlSettings';

export type EyeCardHandle = {
	validate: () => EyeHistoryState | undefined | string,
};

type EyeCardProps = {
	title: string,
	historyState: EyeHistoryState | undefined,
	useKs: boolean,
	kIndex: number,
	idPrefix: 'od' | 'os',
};

const EyeCard = forwardRef<EyeCardHandle, EyeCardProps>(function EyeCard(props, ref) {
	const [surgeonFactor, setSurgeonFactor] = useState(Number.isNaN(Number(props.historyState?.surgeonFactor)) ? '' : Number(props.historyState?.surgeonFactor).toString());
	const [tgtRx, setTgtRx] = useState(Number.isNaN(Number(props.historyState?.tgtRx)) ? '' : Number(props.historyState?.tgtRx).toString());
	const [preLasikSphere, setPreLasikSphere] = useState(Number.isNaN(Number(props.historyState?.preLasikSphere)) ? '' : Number(props.historyState?.preLasikSphere).toString());
	const [preLasikCyl, setPreLasikCyl] = useState(Number.isNaN(Number(props.historyState?.preLasikCyl)) ? '' : Number(props.historyState?.preLasikCyl).toString());
	const [postLasikSphere, setPostLasikSphere] = useState(Number.isNaN(Number(props.historyState?.postLasikSphere)) ? '' : Number(props.historyState?.postLasikSphere).toString());
	const [postLasikCyl, setPostLasikCyl] = useState(Number.isNaN(Number(props.historyState?.postLasikCyl)) ? '' : Number(props.historyState?.postLasikCyl).toString());
	const [k1, setK1] = useState(Number.isNaN(Number(props.historyState?.k1)) ? '' : (props.useKs ? Number(props.historyState?.k1) : kToR(props.kIndex, Number(props.historyState?.k1))).toString());
	const [k2, setK2] = useState(Number.isNaN(Number(props.historyState?.k2)) ? '' : (props.useKs ? Number(props.historyState?.k2) : kToR(props.kIndex, Number(props.historyState?.k2))).toString());
	const [al, setAL] = useState(Number.isNaN(Number(props.historyState?.al)) ? '' : Number(props.historyState?.al).toString());

	const surgeonFactorRef = useRef<NumberTextBoxHandle>(null);
	const tgtRxRef = useRef<NumberTextBoxHandle>(null);
	const preLasikSphereRef = useRef<NumberTextBoxHandle>(null);
	const preLasikCylRef = useRef<NumberTextBoxHandle>(null);
	const postLasikSphereRef = useRef<NumberTextBoxHandle>(null);
	const postLasikCylRef = useRef<NumberTextBoxHandle>(null);
	const k1Ref = useRef<NumberTextBoxHandle>(null);
	const k2Ref = useRef<NumberTextBoxHandle>(null);
	const alRef = useRef<NumberTextBoxHandle>(null);

	const required = surgeonFactor || tgtRx || preLasikSphere || preLasikCyl || postLasikSphere || postLasikCyl || k1 || k2 || al ? true : false;

	const [wasUseKs, setWasUseKs] = useState(props.useKs);

	if (props.useKs !== wasUseKs) {
		setWasUseKs(props.useKs);
		const parsed = {
			k1: k1 ? Number(k1) : Number.NaN,
			k2: k2 ? Number(k2) : Number.NaN
		};

		if (!Number.isNaN(parsed.k1)) {
			setK1(kToR(props.kIndex, parsed.k1).toString());
		}

		if (!Number.isNaN(parsed.k2)) {
			setK2(kToR(props.kIndex, parsed.k2).toString());
		}
	}

	const kLimits = props.useKs ? Settings.variables.K1! : { max: kToR(props.kIndex, Settings.variables.K1!.min), min: kToR(props.kIndex, Settings.variables.K1!.max) };
	const kValidationInfo = props.useKs ? HtmlSettings.validationInfo.K1 : rWarning(props.kIndex);

	useImperativeHandle(ref, () => ({
		validate() {
			const surgeonFactor = surgeonFactorRef.current!.validate();
			const tgtRx = tgtRxRef.current!.validate();
			const preLasikSphere = preLasikSphereRef.current!.validate();
			const preLasikCyl = preLasikCylRef.current!.validate();
			const postLasikSphere = postLasikSphereRef.current!.validate();
			const postLasikCyl = postLasikCylRef.current!.validate();
			const k1 = k1Ref.current!.validate();
			const k2 = k2Ref.current!.validate();
			const al = alRef.current!.validate();

			const error = [ surgeonFactor, tgtRx, preLasikSphere, preLasikCyl, postLasikSphere, postLasikCyl, k1, k2, al ].find(x => typeof x === 'string') as string;

			if (required) {
				return error || {
					// If there is no error, then we must be a valid EyeHistoryState
					tgtRx: tgtRx as number,
					surgeonFactor: surgeonFactor as number,
					preLasikSphere: preLasikSphere as number,
					preLasikCyl: preLasikCyl as number,
					postLasikSphere: postLasikSphere as number,
					postLasikCyl: postLasikCyl as number,
					k1: props.useKs ? k1 as number : kToR(props.kIndex, k1 as number),
					k2: props.useKs ? k2 as number : kToR(props.kIndex, k2 as number),
					al: al as number
				};
			}

			// No error; no data.
			return undefined;
		},
	}));

	return (
		<div className="col-sm card-deck mt-4">
			<div className="card">
				<h3 className="card-header">{props.title}</h3>
				<div className="card-body pt-0 pb-4">
					<NumberTextBox ref={surgeonFactorRef} id={`${props.idPrefix}-surgeon-factor`} displayName="Surgeon Factor" limits={Settings.iolConstants.SurgeonFactor} validationInfo={HtmlSettings.validationInfo.SurgeonFactor} value={surgeonFactor} setValue={setSurgeonFactor} required={required} />
					<NumberTextBox ref={tgtRxRef} id={`${props.idPrefix}-tgt-rx`} displayName="Target Refraction" limits={Settings.tgtRx} validationInfo={HtmlSettings.validationInfo.TgtRx} value={tgtRx} setValue={setTgtRx} required={required} />
					<NumberTextBox ref={preLasikSphereRef} id={`${props.idPrefix}-pre-lasik-sphere`} displayName="Pre-LASIK Gl Rx Sph" limits={Settings.variables.PreLasikSphere!} validationInfo={HtmlSettings.validationInfo.PreLasikSphere} value={preLasikSphere} setValue={setPreLasikSphere} required={required} />
					<NumberTextBox ref={preLasikCylRef} id={`${props.idPrefix}-pre-lasik-cyl`} displayName="Pre-LASIK Gl Rx Cyl" limits={Settings.variables.PreLasikCyl!} validationInfo={HtmlSettings.validationInfo.PreLasikCyl} value={preLasikCyl} setValue={setPreLasikCyl} required={required} />
					<NumberTextBox ref={postLasikSphereRef} id={`${props.idPrefix}-post-lasik-sphere`} displayName="Post-LASIK/Pre-Cat Gl Rx Sph" limits={Settings.variables.PostLasikSphere!} validationInfo={HtmlSettings.validationInfo.PostLasikSphere} value={postLasikSphere} setValue={setPostLasikSphere} required={required} />
					<NumberTextBox ref={postLasikCylRef} id={`${props.idPrefix}-post-lasik-cyl`} displayName="Post-LASIK/Pre-Cat Gl Rx Cyl" limits={Settings.variables.PostLasikCyl!} validationInfo={HtmlSettings.validationInfo.PostLasikCyl} value={postLasikCyl} setValue={setPostLasikCyl} required={required} />
					<NumberTextBox ref={k1Ref} id={`${props.idPrefix}-k1`} displayName={`Current ${props.useKs ? 'K1' : 'R1'}`} limits={kLimits} validationInfo={kValidationInfo} value={k1} setValue={setK1} required={required} />
					<NumberTextBox ref={k2Ref} id={`${props.idPrefix}-k2`} displayName={`Current ${props.useKs ? 'K2' : 'R2'}`} limits={kLimits} validationInfo={kValidationInfo} value={k2} setValue={setK2} required={required} />
					<NumberTextBox ref={alRef} id={`${props.idPrefix}-al`} displayName="Axial Length" limits={Settings.variables.AL!} validationInfo={HtmlSettings.validationInfo.AL} value={al} setValue={setAL} required={required} />
				</div>
			</div>
		</div>
	);
});

export default EyeCard;
