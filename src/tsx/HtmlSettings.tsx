import Settings, { IolConstantName, PreopVariableName } from '../api/Settings';

export type ValidationInfo = {
	warnIfLessThan: number,
	warnIfGreaterThan: number,
	units: string | undefined,
	unitsAbbreviation: string | undefined,
	tooLowWord?: string,
	tooHighWord?: string,
	tooLowWarning?: string,
	tooHighWarning?: string
};

const kWarning: ValidationInfo = {
	warnIfLessThan: 39,
	warnIfGreaterThan: 46,
	tooLowWord: 'flat',
	tooHighWord: 'steep',
	units: 'Diopters',
	unitsAbbreviation: 'D',
};

export const kToR: (kIndex: number, k: number) => number = (kIndex, k) => {
	return (kIndex - 1) * 1000 / k;
};

export const rWarning: (kIndex: number) => ValidationInfo = kIndex => ({
	warnIfLessThan: kToR(kIndex, kWarning.warnIfGreaterThan),
	warnIfGreaterThan: kToR(kIndex, kWarning.warnIfLessThan),
	tooLowWord: kWarning.tooHighWord,
	tooHighWord: kWarning.tooLowWord,
	units: 'millimeters',
	unitsAbbreviation: 'mm'
});

const sphereWarning: ValidationInfo = {
	warnIfLessThan: -8,
	warnIfGreaterThan: +8,
	tooLowWord: 'myopic',
	tooHighWord: 'hyperopic',
	units: 'Diopters',
	unitsAbbreviation: 'D'
};

const cylWarning: ValidationInfo = {
	warnIfLessThan: -4,
	warnIfGreaterThan: +4,
	tooLowWord: 'low',
	tooHighWord: 'high',
	units: 'Diopters',
	unitsAbbreviation: 'D'
};

const HtmlSettings = {
	formulaName: <>{Settings.formulaName}</>,

	kIndex: {
		default: 1.3375,
		options: [1.3315, 1.332, 1.336, 1.3375, 1.338],
	},

	v: {
		default: 12,
		options: [12, 12.5, 13, 13.5, 14],
	},

	validationInfo: {
		TgtRx: {
			warnIfLessThan: -2,
			warnIfGreaterThan: 1,
			tooLowWarning: 'Do you really intend to shoot for such a myopic refraction?',
			tooHighWarning: 'Do you really intend to shoot for such a hyperopic refraction?',
			units: 'Diopters',
			unitsAbbreviation: 'D',
		},
		SurgeonFactor: {
			warnIfLessThan: -0.50,
			warnIfGreaterThan: 2.35,
			tooLowWord: 'low',
			tooHighWord: 'high',
			units: undefined,
			unitsAbbreviation: undefined,
		},
		AL: {
			warnIfLessThan: 19.74,
			warnIfGreaterThan: 28.19,
			tooLowWord: 'short',
			tooHighWord: 'long',
			units: 'millimeters',
			unitsAbbreviation: 'mm'
		},
		ACD: {
			warnIfLessThan: 1.6,
			warnIfGreaterThan: 4.97,
			tooLowWord: 'small',
			tooHighWord: 'big',
			units: 'millimeters',
			unitsAbbreviation: 'mm'
		},
		K1: kWarning,
		K2: kWarning,
		PreLasikSphere: sphereWarning,
		PreLasikCyl: cylWarning,
		PostLasikSphere: sphereWarning,
		PostLasikCyl: cylWarning,
	} as
	{ [key in PreopVariableName]: ValidationInfo } &
	{ [key in IolConstantName]: ValidationInfo } &
	{ TgtRx: ValidationInfo },

	useKsByDefault: true, // true to use "K1/K2" by default; false to use "R1/R2"

	variableDescriptions: {
		K1: (isPreop: boolean) => <p>One {isPreop ? '' : 'preoperative '}meridian specified by the keratometer. This can be the steep K, or the flat K. This is the current (post-LASIK, pre-cataract-extraction) K value. Keratometry values must be between {Settings.variables.K1?.min} and {Settings.variables.K1?.max} Diopters, and you must specify the <a href="#k-index">keratometric index</a> in the request.</p>,
		K2: (isPreop: boolean) => <p>The second {isPreop ? '' : 'preoperative '}meridian specified by the keratometer. This can be the steep K, or the flat K. This is the current (post-LASIK, pre-cataract-extraction) K value. Keratometry values must be between {Settings.variables.K2?.min} and {Settings.variables.K2?.max} Diopters, and you must specify the <a href="#k-index">keratometric index</a> in the request.</p>,
		AL: (isPreop: boolean) => <p>The {isPreop ? '' : 'preoperative '}axial length, measured by optical biometry. This value must be between {Settings.variables.AL?.min} and {Settings.variables.AL?.max} millimeters.</p>,
		PreLasikSphere: () => <p>The pre-LASIK glasses refraction sphere. This value must be between {Settings.variables.PreLasikSphere?.min} and {Settings.variables.PreLasikSphere?.max} Diopters.</p>,
		PreLasikCyl: () => <p>The pre-LASIK glasses refraction cylinder. This value must be between {Settings.variables.PreLasikCyl?.min} and {Settings.variables.PreLasikCyl?.max} Diopters.</p>,
		PostLasikSphere: () => <p>The post-LASIK, pre-cataract glasses refraction sphere. This value must be between {Settings.variables.PostLasikSphere?.min} and {Settings.variables.PostLasikSphere?.max} Diopters.</p>,
		PostLasikCyl: () => <p>The post-LASIK, pre-cataract glasses refraction cylinder. This value must be between {Settings.variables.PostLasikCyl?.min} and {Settings.variables.PostLasikCyl?.max} Diopters.</p>,
	} as { [key in PreopVariableName]: (isPreop: boolean) => JSX.Element }
};

export default HtmlSettings;
