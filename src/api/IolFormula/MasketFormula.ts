import BaseFormula from './BaseFormula';
import { EyeObject, IolObject, IolPowers, PostopApiInputs, PostopApiOutput, PostopEyeObject, PostopFormula, PreopApiError, PreopApiIols, PreopEyeObject } from './ApiTypes';
import { IolPropertyNames, PreopEyeVariableNames } from './ApiVariables';
import Settings, { IolConstantNames, IolConstantValues, PreopVariableNames } from '../Settings';

const enumeratePowers = (powers: Array<IolPowers> | undefined): Array<number> | undefined => {
	if (typeof powers === 'undefined') {
		return undefined;
	}

	const answer: Array<number> = [];

	for (const i in powers) {
		const pow = powers[Number(i)];
		for (let p = pow.From; p <= pow.To; p += pow.By) {
			answer.push(p);
		}
	}

	// Return each power only once.
	return answer.filter((v, i, a) => a.indexOf(v) === i);
};

const allowedPostopEyeProperties = Object.keys(Settings.variables).concat('IolPower', 'Ref');

export default class MasketFormula extends BaseFormula {
	v: number;
	useModifiedMasket: boolean;

	constructor(eye: EyeObject, kIndex: number, v: number, useModifiedMasket: boolean) {
		super(eye, kIndex);
		this.v = v;
		this.useModifiedMasket = useModifiedMasket;
	}


	calculate(iolConstants: IolConstantValues, iolPower: number): string | number {
		// This is the guts of the formula.
		// Change it as necessary to output the value requested by the user.

		// Basic validation has already been performed.
		// All IOL constants and all eye variables are verified to be within appropriate limits.
		// All required variables are present.

		const vertex = this.v;

		const preSphereAtCornea = 1000 * this.variables.PreLasikSphere! / (1000 - this.variables.PreLasikSphere! * vertex);
		const preCylAtCornea = 1000000 * this.variables.PreLasikCyl! / ((1000 - this.variables.PreLasikSphere! * vertex) * (1000 - this.variables.PreLasikSphere! * vertex - this.variables.PreLasikCyl! * vertex))
		const preSeAtCornea = preSphereAtCornea + preCylAtCornea / 2;

		const postSphereAtCornea = 1000 * this.variables.PostLasikSphere! / (1000 - this.variables.PostLasikSphere! * vertex);
		const postCylAtCornea = 1000000 * this.variables.PostLasikCyl! / ((1000 - this.variables.PostLasikSphere! * vertex) * (1000 - this.variables.PostLasikSphere! * vertex - this.variables.PostLasikCyl! * vertex))
		const postSeAtCornea = postSphereAtCornea + postCylAtCornea / 2;

		const refChangeAtCornealPlane = preSeAtCornea - postSeAtCornea;

		// Keratometry values are already converted to 1.3375 keratometric index (since Settings.convertKIndex = 1.3375)
		// The Masket formula is a tweaked version of Holladay 1, which is itself a general vergence formula.
		// There are basically just three variables: K0, TCP, and ELP
		const aveK = (this.variables.K1! + this.variables.K2!) / 2;
		const k0 = 1000 / 1012.5 * aveK; // (1000/3) / 337.5 * aveK
		const al = this.variables.AL! + 0.2;

		const rag = Math.max(7, 337.5 / aveK);
		const ag = Math.min(13.5, 12.5 * this.variables.AL! / 23.45);
		const elp = 0.56 + rag - Math.sqrt(rag*rag - ag*ag/4) + iolConstants.SurgeonFactor;

		const changedIolPower = iolPower + (this.useModifiedMasket ? 0.4385 * refChangeAtCornealPlane - 0.0295 : 0.326 * refChangeAtCornealPlane - 0.101);

		return 1000 / (1000 / (1336 / (1336 / (1336 / (al - elp) - changedIolPower) + elp) - k0) + vertex);
	}


	// The only preoperative variables that are valid are...
	static allValidPreopVariables: Array<string> = 
		// Any that are not variable names,
		PreopEyeVariableNames.filter(x => (PreopVariableNames.concat() as string[]).indexOf(x) < 0)
			// or any variable names explicitly referenced in Settings.variables
			.concat(PreopVariableNames.filter(x => Settings.variables[x]));

	static calculatePreOp(kIndex: number, v: number, useModifiedMasket: boolean, predictionsPerIol: number, iols: IolObject[] | undefined, eye: PreopEyeObject): PreopApiError | PreopApiIols {
		// Let's start by making sure the values of the eye are all acceptable.
		const invalidProp = Object.keys(eye).find(x => MasketFormula.allValidPreopVariables.indexOf(x) < 0);
		if (invalidProp) {
			return {
				Error: `Invalid property: "${invalidProp}"`
			};
		}

		const formula = new MasketFormula(eye, kIndex, v, useModifiedMasket);

		if (formula.error || typeof eye.TgtRx !== 'number' || isNaN(eye.TgtRx) || eye.TgtRx < Settings.tgtRx.min || eye.TgtRx > Settings.tgtRx.max) {
			return {
				Error: formula.error || `TgtRx must be a valid number between ${Settings.tgtRx.min} and +${Settings.tgtRx.max}.`
			};
		}

		iols = eye.IOLs || iols;
		if (!Array.isArray(iols) || iols.length < Settings.iolsPerEye.min || iols.length > Settings.iolsPerEye.max) {
			return {
				Error: `This eye does not have a valid amount of IOLs. You can specify default IOLs in the root "IOLs" property, and you can override it within individual eyes. You must specify between ${Settings.iolsPerEye.min} and ${Settings.iolsPerEye.max} IOLs.`
			};
		}

		return {
			IOLs: iols.map(iol => {
				const invalidProp = Object.keys(iol).find(x => (IolPropertyNames as Array<string>).indexOf(x) < 0);
				if (invalidProp) {
					return {
						Error: `Invalid property: "${invalidProp}"`
					};
				}

				// We don't have any extra properties.
				// Let's validate the lens constants.
				const iolConstants = IolConstantNames.map(x => ({ name: x, settings: Settings.iolConstants[x], value: iol[x] }));

				const invalidConstant = iolConstants.find(x => typeof x.value !== 'number' || Number.isNaN(x.value) || x.value < x.settings.min || x.value > x.settings.max);
				if (invalidConstant) {
					return {
						Error: `${invalidConstant.name} must be between ${invalidConstant.settings.min} and ${invalidConstant.settings.max}`
					};
				}

				// Round IOL constants where necessary
				iolConstants.filter(x => typeof x.settings.roundedToSigFigs === 'number')
					.map(x => iol[x.name] = Math.round(x.value * Math.pow(10, x.settings.roundedToSigFigs!)) / Math.pow(10, x.settings.roundedToSigFigs!));

				// Finally, validate the lens powers.
				if ((typeof iol.Powers !== 'undefined' && !Array.isArray(iol.Powers)) || (Array.isArray(iol.Powers) && (iol.Powers.length === 0 || iol.Powers.length >= 100))) {
					return {
						Error: 'If you specify Powers, you must specify an array with at least one range'
					};
				} else if (Array.isArray(iol.Powers) && iol.Powers.filter(x => typeof x.From !== 'number' || isNaN(x.From) || typeof x.To !== 'number' || isNaN(x.To) || typeof x.By !== 'number' || isNaN(x.By) || x.From > x.To || x.From < Settings.iolPower.min || x.To > Settings.iolPower.max || x.By < 0.1).length) {
					return {
						Error: `At least one power range is invalid: they must specify valid numbers for "From," "To," and "By." "From" cannot be greater than "To," "From" and "To" must be between ${Settings.iolPower.min} and ${Settings.iolPower.max}, and "By" must be at least 0.1.`
					};
				}

				try {
					let powers: Array<number> = [];

					if (typeof iol.Powers !== 'undefined') {
						powers = enumeratePowers(iol.Powers)!.sort((a, b) => a - b);
					}

					if (powers.length === 0) {
						powers = enumeratePowers([{ From: Settings.iolPower.min, To: 0, By: 1 }, { From: 0.5, To: 33.5, By: 0.5 }, { From: 34, To: Settings.iolPower.max, By: 1 }])!;
					}

					type inlinePrediction = { power: number, prediction: number, index: number };

					const predictionsOrErrors = powers.map((power: number, index: number): inlinePrediction | string => {
						const prediction = formula.calculate(iol, power);
						if (typeof prediction === 'string') {
							return prediction;
						} else {
							return { power: power, prediction: prediction, index: index };
						}
					});

					const predictions = predictionsOrErrors.filter(x => typeof x !== 'string') as Array<inlinePrediction>;

					const reduceToBest = (prev: inlinePrediction, next: inlinePrediction): inlinePrediction => Math.abs(next.prediction - eye.TgtRx) < Math.abs(prev.prediction - eye.TgtRx) ? next : prev;
					const bestPrediction = predictions.reduce(reduceToBest);

					const answers = [bestPrediction];
					let bestIndex = 0;

					const nextOptions = [predictions[bestPrediction.index - 1], predictions[bestPrediction.index + 1]];
					for (let i = 1; i < predictionsPerIol; i++) {
						const nextBest = typeof nextOptions[0] === 'undefined' && typeof nextOptions[1] !== 'undefined' ? 1 :
							typeof nextOptions[0] !== 'undefined' && typeof nextOptions[1] === 'undefined' ? 0 :
								typeof nextOptions[0] !== 'undefined' && typeof nextOptions[1] !== 'undefined' ?
									Math.abs(nextOptions[0].prediction - eye.TgtRx) <= Math.abs(nextOptions[1].prediction - eye.TgtRx) ? 0 : 1
									: -1;

						if (nextBest < 0) {
							break;
						} else {
							(nextBest === 0 ? answers.unshift : answers.push).call(answers, nextOptions[nextBest]);
							bestIndex += 1 - nextBest;
							nextOptions[nextBest] = predictions[nextOptions[nextBest].index + (2 * nextBest - 1)];
						}
					}

					return {
						Predictions: answers.map((x, i) => ({
							IOL: x.power,
							Rx: Math.round(x.prediction * Math.pow(10, Settings.roundAnswerSigFigs)) / Math.pow(10, Settings.roundAnswerSigFigs),
							IsBestOption: i === bestIndex ? true : undefined
						}))
					};
				} catch {
					return {
						Error: 'An unknown error occurred while calculating.'
					};
				}
			})
		};
	}

	static calculatePostopEyes(inputs: PostopApiInputs): string | PostopApiOutput {
		const answer = { } as PostopApiOutput;

		IolConstantNames.map(x => ({ name: x, roundTo: Settings.iolConstants[x].roundedToSigFigs, value: inputs[x] }))
			.map(x => answer[x.name] = typeof x.roundTo === 'number' && !Number.isNaN(x.roundTo) ? Math.round(x.value * Math.pow(10, x.roundTo)) / Math.pow(10, x.roundTo) : x.value);

		let numIterations = 0;

		if (inputs.Optimize) {
			if (inputs.Eyes.find(x => typeof x.Ref !== 'number' || Number.isNaN(x.Ref))) {
				return 'Ref is required for every eye because Optimize is true.';
			}

			const allEyes = inputs.Eyes.map(eye => MasketFormula.getPostopFormula(inputs.KIndex, inputs.V, inputs.UseModifiedMasket, eye, false));

			const guesses = (allEyes.filter(x => typeof x !== 'string') as Array<PostopFormula>)
				.map(x => ({ gatinelFkp: x.gatinelFkp, ref: x.ref!, calculate: x.calculate, guess: x.calculate(answer) as number }))
				.filter(x => typeof x.guess === 'number');

			if (guesses.length < Settings.optimizeEyes.minEyes || guesses.length > Settings.postopEyes.max) {
				return `Bad Request:\nWhen optimizing lens constants, you must provide between ${Settings.optimizeEyes.minEyes} and ${Settings.postopEyes.max} eyes with valid data.`;
			}

			const currentGuess = {
				constants: answer,
				numIterations: 1,
				totalError: guesses.reduce((a, b) => a + b.guess - b.ref, 0),
				totalFkp: guesses.reduce((a, b) => a + b.gatinelFkp, 0)
			};

			const variableToAlter = Settings.iolConstants.constantToOptimizeVariableName;
			const roundTo = Math.pow(10, Settings.iolConstants[variableToAlter].roundedToSigFigs || 10);

			while (Math.abs(currentGuess.totalError / guesses.length) >= 1 / roundTo && currentGuess.numIterations < 20) {
				currentGuess.numIterations++;
				const deltaElp = currentGuess.totalError / currentGuess.totalFkp;

				// delta SF = delta ELP
				currentGuess.constants[variableToAlter] = currentGuess.constants[variableToAlter] - deltaElp;
				currentGuess.totalError = guesses.reduce((a, b) => a + (x => typeof x === 'number' ? x - b.ref : 0)(b.calculate(currentGuess.constants)), 0);
			}

			numIterations = currentGuess.numIterations;
			answer[variableToAlter] = Math.round(currentGuess.constants[variableToAlter] * roundTo) / roundTo;
		}

		answer.Predictions = inputs.Eyes.map(eye => MasketFormula.calculatePostop(answer, inputs.KIndex, inputs.V, inputs.UseModifiedMasket, eye))

		return answer;
	}

	static calculatePostop(constants: IolConstantValues, kIndex: number, v: number, useModifiedMasket: boolean, eye: PostopEyeObject): string | number {
		const formula = MasketFormula.getPostopFormula(kIndex, v, useModifiedMasket, eye, true);

		if (typeof formula === 'string') {
			return formula;
		}

		return formula.calculate(constants);
	};

	static getPostopFormula(kIndex: number, v: number, useModifiedMasket: boolean, eye: PostopEyeObject, round: boolean): string | PostopFormula {
		const invalidProp = Object.keys(eye).find(x => allowedPostopEyeProperties.indexOf(x) < 0);

		if (invalidProp) {
			return `Invalid property: "${invalidProp}"`;
		}

		const formula = new MasketFormula(eye, kIndex, v, useModifiedMasket);
		const error = formula.error || (typeof eye.IolPower !== 'number' || isNaN(eye.IolPower) || eye.IolPower < Settings.iolPower.min || eye.IolPower > Settings.iolPower.max ? `IolPower must be a number between ${Settings.iolPower.min} and ${Settings.iolPower.max}` : undefined);

		if (error !== undefined) {
			return error;
		}

		return {
			gatinelFkp: round ? 0 : 0.0006 * (eye.IolPower * eye.IolPower + (eye.K1! + eye.K2!) * eye.IolPower),
			ref: round ? undefined : eye.Ref,
			calculate: (constants: IolConstantValues) => {
				try {
					const prediction = formula.calculate(constants, eye.IolPower);
					if (typeof prediction === 'string') {
						return prediction;
					}
					return round ? Math.round(prediction * 10000) / 10000 : prediction;
				} catch {
					return 'An unknown error occurred while calculating.';
				}
			}
		};
	}
}
