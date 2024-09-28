import { PreopVariableName, IolConstantName, IolConstantValues } from "../Settings";

export type PreopApiError = {
	Error: string
}

export type PreopApiPredictions = {
	Predictions: Array<{
		IOL: number,
		Rx: number,
		IsBestOption?: boolean
	}>
}

export type PreopApiIols = {
	IOLs: Array<PreopApiError | PreopApiPredictions>
}

export type PreopApiSuccess = Array<PreopApiError | PreopApiIols>

export type PreopApiOutput = PreopApiError | PreopApiSuccess;

export type EyeObject = {
	[key in PreopVariableName]?: number | undefined
};

export type IolPowers = {
	From: number,
	To: number,
	By: number
}

export type IolObject = {
	[key in IolConstantName]: number
} & {
	Powers?: Array<IolPowers>
};

export type PreopEyeObject = EyeObject & {
	TgtRx: number,
	IOLs?: Array<IolObject>
};

export type PostopEyeObject = EyeObject & {
	IolPower: number,
	Ref?: number
};

export type BaseApiInputs = {
	KIndex: number,
	V: number
};

export type PreopApiInputs = BaseApiInputs & {
	PredictionsPerIol: number,
	Eyes: Array<PreopEyeObject>,
	IOLs?: Array<IolObject>
};

export type PostopApiInputs = BaseApiInputs & {
	[key in IolConstantName]: number
} & {
	Optimize: boolean,
	Eyes: Array<PostopEyeObject>
};

export type PostopFormula = {
	gatinelFkp: number,
	ref: number | undefined,
	calculate: (constants: IolConstantValues) => string | number
};

export type PostopApiOutput = {
	[key in IolConstantName]: number
} & {
	Predictions: Array<string | number>
};

