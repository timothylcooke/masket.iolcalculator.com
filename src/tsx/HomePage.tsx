import { BaseProps } from './BaseProps';
import { PreopApiError, PreopApiIols } from '../api/IolFormula/ApiTypes';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { useState, useRef, useEffect, SyntheticEvent } from 'react';
import { Button, FormControl, FormControlLabel, FormHelperText, InputLabel, MenuItem, Select, Switch, TextField } from '@mui/material';
import HtmlSettings from './HtmlSettings';
import EyeCard, { EyeCardHandle } from './EyeCard';
import { useNavigate } from 'react-router-dom';
import replaceBrowserHistory from './replaceBrowserHistory';
import Settings from '../api/Settings';

export type EyeHistoryState = {
	tgtRx: number,
	surgeonFactor: number,
	preLasikSphere: number,
	preLasikCyl: number,
	postLasikSphere: number,
	postLasikCyl: number
	k1: number,
	k2: number,
	al: number,
}

export type HistoryState = {
	last: string,
	first: string,
	dob: string,
	surgeon: string,
	kIndex: number,
	v: number,
	useModifiedMasket: boolean,
	useKs: boolean,
	od: EyeHistoryState,
	os: EyeHistoryState,
	fatalError: string | undefined,
	responseOD: PreopApiError | PreopApiIols | undefined
	responseOS: PreopApiError | PreopApiIols | undefined
};

export default function HomePage(props: BaseProps) {
	const historyState = window.history.state?.usr?.state as HistoryState;

	const newNamePopover = (id: string) => <Popover id={id}>
		<Popover.Header>
			<strong>Worried about privacy?</strong>
		</Popover.Header>
		<Popover.Body>
			Name and DOB are only used for printing. We never send them outside your browser.
		</Popover.Body>
	</Popover>;

	const [lastName, setLastName] = useState(historyState?.last ?? '');
	const [firstName, setFirstName] = useState(historyState?.first ?? '');
	const [dob, setDOB] = useState(historyState?.dob ?? '');
	const [surgeon, setSurgeon] = useState(historyState?.surgeon ?? '');
	const [kIndex, setKIndex] = useState(historyState?.kIndex ?? HtmlSettings.kIndex.default);
	const [v, setV] = useState(historyState?.v ?? HtmlSettings.v.default);
	const [useModifiedMasket, setUseModifiedMasket] = useState(historyState?.useModifiedMasket ?? true);
	const [useKs, setUseKs] = useState(historyState?.useKs ?? HtmlSettings.useKsByDefault);
	const [lastNameError, setLastNameError] = useState(undefined as string | undefined);
	const [kIndexError, setKIndexError] = useState(undefined as string | undefined);
	const [vError, setVError] = useState(undefined as string | undefined);
	const [showOneEyeRequired, setShowOneEyeRequired] = useState(false);
	const od = useRef<EyeCardHandle>(null);
	const os = useRef<EyeCardHandle>(null);

	const validateLastName = (newValue?: string) => {
		if (newValue !== undefined) {
			setLastName(newValue);
		}

		newValue ??= lastName;

		const error = newValue ? undefined : 'Last name is required';
		setLastNameError(error);
		return error;
	};

	const validateKIndex = (newValue?: number) => {
		if (newValue !== undefined) {
			setKIndex(newValue);
		}

		newValue ??= kIndex;

		const error = newValue ? (newValue < 1 || newValue > 2 ? 'Keratometric Index must be between 1 and 2' : undefined) : 'Keratometric Index is required';
		setKIndexError(error);
		return error;
	};

	const validateV = (newValue?: number) => {
		if (newValue !== undefined) {
			setV(newValue);
		}
		newValue ??= v;
		const error = newValue ? (newValue < Settings.v.min || newValue > Settings.v.max ? `Vertex Distance must be between ${Settings.v.min} and ${Settings.v.max}` : undefined) : 'Vertex Distance is required';
		setVError(error);
		return error;
	};

	const navigate = useNavigate();

	const onContinue = (e: SyntheticEvent<EventTarget>) => {
		e.preventDefault();

		const odValidation = od.current!.validate();
		const osValidation = os.current!.validate();

		const errorElements = [
			validateLastName() ? 'last-name' : undefined,
			validateKIndex() ? 'k-index' : undefined,
			validateV() ? 'v' : undefined,
			odValidation,
			osValidation,
		];

		const firstError = errorElements.find(x => typeof x === 'string') as string;

		if (firstError) {
			document.getElementById(firstError)?.focus();
			return;
		}

		if (typeof odValidation === 'undefined' && typeof osValidation === 'undefined') {
			document.getElementById('submit')?.focus();
			setShowOneEyeRequired(true);
			return;
		}

		const state: HistoryState = {
			last: lastName,
			first: firstName,
			dob,
			surgeon,
			kIndex,
			v,
			useModifiedMasket,
			useKs,
			od: odValidation as EyeHistoryState,
			os: osValidation as EyeHistoryState,
			fatalError: undefined,
			responseOD: undefined,
			responseOS: undefined
		};

		// Edit the current history so that if we navigate back to this page, we keep our inputs.
		replaceBrowserHistory(state);

		navigate('/PrintPreview', { state: { state, eula: props.eula } });
	};

	const onRefresh = () => {
		replaceBrowserHistory(undefined);
	};

	useEffect(() => {
		window.addEventListener('beforeunload', onRefresh);
		return () => window.removeEventListener('beforeunload', onRefresh);
	}, []);

	return (
		<form className="container py-4">
			<div className="row">
				<h1 id="bd-title">IOLCalculator.com</h1>
			</div>
			<div className="row">
				<p className="lead">This is an example website and API page showcasing how to set up a website with a functional IOL calculator API.</p>
			</div>
			<div className="row">
				<p>This site has a working implementation of an IOL calculator and API a for the Masket Holladay 1 formula. <a href="https://github.com/timothylcooke/masket.iolcalculator.com">All of the code for this website can be found on GitHub.</a></p>
			</div>
			<div className="row justify-content-center mt-4">
				<div className="col">
					<div className="card mx-auto px-0">
						<h3 className="card-header text-center">Patient</h3>
						<div className="card-body pt-0 pb-4">
							<OverlayTrigger trigger="focus" placement="bottom" overlay={newNamePopover('name-1')}>
								<div className="row">
									<div className="col-sm pt-4">
										<TextField id="last-name" fullWidth label="Last Name" error={lastNameError !== undefined} helperText={lastNameError} value={lastName} onChange={e => validateLastName(e.target.value)} onBlur={() => validateLastName()} placeholder="(Required)" />
									</div>
									<div className="col-sm pt-4">
										<TextField fullWidth label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="(Optional)" />
									</div>
								</div>
							</OverlayTrigger>
							<div className="row">
								<OverlayTrigger trigger="focus" placement="bottom" overlay={newNamePopover('name-2')}>
									<div className="col-sm pt-4">
										<TextField fullWidth label="Date of Birth" value={dob} onChange={e => setDOB(e.target.value)} placeholder="(Optional)" />
									</div>
								</OverlayTrigger>
								<div className="col-sm pt-4">
									<TextField fullWidth label="Surgeon" value={surgeon} onChange={e => setSurgeon(e.target.value)} placeholder="(Optional)" />
								</div>
							</div>
							<div className="row">
								<div className="col-sm pt-4">
									<FormControl fullWidth>
										<InputLabel id="k-index-label" error={kIndexError !== undefined}>Keratometric Index</InputLabel>
										<Select id="k-index" labelId='k-index-label' value={kIndex} onChange={e => validateKIndex(e.target.value as number)} label="Keratometric Index" error={kIndexError !== undefined} onBlur={() => validateKIndex()}>
											{HtmlSettings.kIndex.options.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
										</Select>
										<FormHelperText error={kIndexError !== undefined}>{kIndexError}</FormHelperText>
									</FormControl>
								</div>
								<div className="col-sm pt-4">
									<FormControl fullWidth>
										<InputLabel id="v-label" error={kIndexError !== undefined}>Vertex Distance</InputLabel>
										<Select id="v" labelId='v-label' value={v} onChange={e => validateV(e.target.value as number)} label="Vertex Distance" error={vError !== undefined} onBlur={() => validateV()}>
											{HtmlSettings.v.options.map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
										</Select>
										<FormHelperText error={vError !== undefined}>{vError}</FormHelperText>
									</FormControl>
								</div>
							</div>
							<div className="row">
								<div className="col-sm pt-4 text-center">
									<FormControlLabel control={<Switch checked={useKs} onChange={e => setUseKs(e.target.checked)} />} label={useKs ? 'Use Ks' : 'Use Rs'}  />
								</div>
								<div className="col-sm pt-4 text-center">
									<FormControlLabel control={<Switch checked={useModifiedMasket} onChange={e => setUseModifiedMasket(e.target.checked)} />} label={useModifiedMasket ? 'Use Modified Masket' : 'Use Original Masket'}  />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className='row'>
				<EyeCard ref={od} title="OD - Right" idPrefix="od" historyState={historyState?.od} useKs={useKs} kIndex={kIndex ?? HtmlSettings.kIndex.default} />
				<EyeCard ref={os} title="OS - Left" idPrefix="os" historyState={historyState?.os} useKs={useKs} kIndex={kIndex ?? HtmlSettings.kIndex.default} />
			</div>

			<div className="row justify-content-center">
				<div className='col pt-4 text-center'>
					<OverlayTrigger placement="top" show={showOneEyeRequired} overlay={<Popover><Popover.Header><strong>Missing Data</strong></Popover.Header><Popover.Body>You must enter at least one eye.</Popover.Body></Popover>}>
						<Button type="submit" id="submit" variant="contained" onClick={onContinue} onBlur={() => setShowOneEyeRequired(false)}>Continue</Button>
					</OverlayTrigger>
				</div>
			</div>
		</form>
	);
}
