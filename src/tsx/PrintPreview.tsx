import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BaseProps } from './BaseProps';
import { HistoryState } from './HomePage';
import HtmlSettings from './HtmlSettings';
import PrintPreviewEye from './PrintPreviewEye';
import { PreopApiError, PreopApiInputs, PreopApiOutput, PreopApiSuccess } from '../api/IolFormula/ApiTypes';
import Settings from '../api/Settings';
import replaceBrowserHistory from './replaceBrowserHistory';

export default function PrintPreview(props: BaseProps) {
	const [historyState, setHistoryState] = useState(window.history.state?.usr?.state as HistoryState);

	if (!historyState) {
		window.location.assign('/');
	}

	const [isQuerying, setIsQuerying] = useState(false);

	const convertToApiInput: (state: HistoryState) => PreopApiInputs = state => {
		return {
			KIndex: state.kIndex,
			V: state.v,
			PredictionsPerIol: 7,
			Eyes: [state.od, state.os].filter(x => x)
				.map(x => ({
					AL: x.al,
					K1: x.k1,
					K2: x.k2,
					PreLasikSphere: x.preLasikSphere,
					PreLasikCyl: x.preLasikCyl,
					PostLasikSphere: x.postLasikSphere,
					PostLasikCyl: x.postLasikCyl,
					TgtRx: x.tgtRx,
					IOLs: [{
						SurgeonFactor: x.surgeonFactor,
					}]
				}))
		};
	};

	const fetchApiData = async () => {
		const newState = Object.assign({}, historyState) as HistoryState;

		if (!newState) {
			return;
		}

		if (typeof newState.fatalError === 'string') {
			newState.fatalError = undefined;
		}

		setIsQuerying(true);
		setHistoryState(newState);

		try {
			const response = await fetch(`${Settings.apiUrl}/preop`, {
				method: 'post',
				mode: 'same-origin',
				cache: 'no-cache',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				referrerPolicy: 'no-referrer',
				body: JSON.stringify(convertToApiInput(newState))
			});

			newState.fatalError = response.ok === true ? undefined : `${response.status} ${response.statusText || 'Unknown error'}`;
			if (newState.fatalError) {
				if (response.headers.get('content-type') === 'application/json') {
					// Give a more specific error if possible
					const json = await response.json();
					const err = (json as PreopApiError).Error;
					if (err) {
						newState.fatalError = err;
					}
				}
			} else {
				const apiResponse: PreopApiOutput | undefined = response.ok ? await response.json() : undefined;
				newState.fatalError = (apiResponse as PreopApiError).Error;
				if (!newState.fatalError) {
					const success = apiResponse as PreopApiSuccess;

					if (!newState.fatalError && !Array.isArray(success) || success.length !== (historyState.od && historyState.os ? 2 : 1)) {
						newState.fatalError = 'Predictions are invalid.';
						newState.responseOD = newState.responseOS = undefined;
					} else {
						newState.responseOD = newState.od ? success[0] : undefined;
						newState.responseOS = newState.os ? success[newState.od ? 1 : 0] : undefined;
					}
				}
			}

			replaceBrowserHistory(newState);
			setIsQuerying(false);
			setHistoryState(newState);
		}
		catch (exception: unknown) {
			newState.fatalError = `Unknown error loading predictions${(exception as DOMException || { }).message ? `: ${(exception as DOMException || { }).message}` : ''}`;
			newState.responseOD = newState.responseOS = undefined;

			replaceBrowserHistory(newState);
			setIsQuerying(false);
			setHistoryState(newState);
		}
	};

	useEffect(() => {
		// If we already fetch the predictions, we don't need to fetch them again.
		if (historyState.fatalError || (!historyState.responseOD && !historyState.responseOS)) {
			fetchApiData();
		}
	}, []);

	return (
		<>
			<div id="buttons" className="text-center mb-2 mt-3">
				<button type="button" className="btn btn-warning" onClick={() => window.history.back()}>Edit</button>
				<button type="button" className="btn btn-success mx-3" onClick={() => window.print()}>Print</button>
				<Link type="button" className="btn btn-primary" to="/" state={{ eula: props.eula }} >New Patient</Link>
			</div>
			<div id="page-parent">
				<div id="page">
					<h1 className="text-center display-4">{HtmlSettings.formulaName} Formula</h1>
					<table className="mx-auto patient">
						<tbody>
							<tr>
								<th colSpan={2}>
									<h3 className="text-center">Patient</h3>
									<svg fill='#007bff'>
										<path d="M0,0h275v1H0" />
									</svg>
								</th>
							</tr>
							<tr>
								<td>Last Name</td>
								<td className="text-end">{historyState.last}</td>
							</tr>
							<tr>
								<td>First Name</td>
								<td className="text-end">{historyState.first || '-'}</td>
							</tr>
							<tr>
								<td>DOB</td>
								<td className="text-end">{historyState.dob || '-'}</td>
							</tr>
							<tr>
								<td>Surgeon</td>
								<td className="text-end">{historyState.surgeon || '-'}</td>
							</tr>
							<tr>
								<td>Keratometric Index</td>
								<td className="text-end">{historyState.kIndex}</td>
							</tr>
							<tr>
								<td>Vertex Distance</td>
								<td className="text-end">{historyState.v}</td>
							</tr>
						</tbody>
					</table>
					<table className="mx-auto">
						<tbody>
							<tr>
								<PrintPreviewEye label="OD - Right" isQuerying={isQuerying} useKs={historyState.useKs} kIndex={historyState.kIndex} data={historyState.od} predictions={historyState.responseOD} />
								<td className="middle">&nbsp;</td>
								<PrintPreviewEye label="OS - Left" isQuerying={isQuerying} useKs={historyState.useKs} kIndex={historyState.kIndex} data={historyState.os} predictions={historyState.responseOS} />
							</tr>
						</tbody>
					</table>
					{(typeof historyState.fatalError === 'undefined' ? null : <table className="mx-auto">
						<tbody>
							<tr>
								<td className="text-danger" style={{ textAlign: 'center', fontStyle: 'italic' }}>{historyState.fatalError}</td>
							</tr>
							<tr>
								<td style={{ textAlign: 'center' }}><a href="#" className="btn btn-danger" onClick={e => { e.preventDefault(); fetchApiData(); return false; }}>Retry</a></td>
							</tr>
						</tbody>
					</table>)}
				</div>
			</div>
		</>
	);
}
