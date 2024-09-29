import Settings, { IolConstantNames, PreopVariableNames } from '../Settings';
import arrayOfAll from '../Helpers/arrayOfAll';
import statusCodeResponse from '../Helpers/statusCodeResponse';
import Env from '../Helpers/Env';
import { IolObject, IolPowers, PostopApiInputs, PreopApiInputs, PreopEyeObject } from './ApiTypes';

export const PreopApiInputNames = arrayOfAll<keyof PreopApiInputs>()('KIndex', 'V', 'UseModifiedMasket', 'Eyes', 'PredictionsPerIol', 'IOLs'); // This won't compile if we miss every single property of PreopApiInputs.
export const PostopApiInputNames = arrayOfAll<keyof PostopApiInputs>()('SurgeonFactor', 'Eyes', 'KIndex', 'V', 'UseModifiedMasket', 'Optimize'); // This won't compile if we miss every single property of PostopApiInputs.
export const IolPropertyNames = arrayOfAll<keyof IolObject>()('SurgeonFactor', 'Powers'); // This won't compile if we miss every single property of PostopApiInputs.
export const IolPowerPropertyNames = arrayOfAll<keyof IolPowers>()('From', 'To', 'By'); // This won't compile if we miss every single property of PostopApiInputs.

export const PreopEyeVariableNames = (PreopVariableNames.concat([]) as Array<keyof PreopEyeObject>).concat(['TgtRx', 'IOLs']) as Array<keyof PreopEyeObject>;

async function ensureNoExtraProperties(inputs: PreopApiInputs | PostopApiInputs, isPreop: boolean, request: Request, env: Env): Promise<Response | undefined> {
	const allowedProperties: Array<string> = isPreop ? PreopApiInputNames : PostopApiInputNames;
	const invalidProp = Object.keys(inputs).find(x => allowedProperties.indexOf(x) < 0);

	if (invalidProp) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "${invalidProp}" is not a valid property.`);
	}

	return undefined;
}

async function validateEyesIsProperlySizedArray(inputs: PreopApiInputs | PostopApiInputs, isPreop: boolean, request: Request, env: Env): Promise<Response | undefined> {
	const { min, max } = (isPreop ? Settings.preopEyes : Settings.postopEyes);

	if (!Array.isArray(inputs.Eyes) || inputs.Eyes.length < min || inputs.Eyes.length > max) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "Eyes" must be an array containing between ${min} and ${max} eyes.`);
	}

	return undefined;
}

async function validateKIndex(inputs: PreopApiInputs | PostopApiInputs, request: Request, env: Env): Promise<Response | undefined> {
	if (typeof inputs.KIndex !== 'number' || isNaN(inputs.KIndex) || inputs.KIndex < Settings.kIndex.min || inputs.KIndex > Settings.kIndex.max) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "KIndex" must be a number between ${Settings.kIndex.min} and ${Settings.kIndex.max}.`);
	}

	return undefined;
}

async function validateV(inputs: PreopApiInputs | PostopApiInputs, request: Request, env: Env): Promise<Response | undefined> {
	if (typeof inputs.V !== 'number' || isNaN(inputs.V) || inputs.V < Settings.v.min || inputs.V > Settings.v.max) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "V" must be a number between ${Settings.v.min} and ${Settings.v.max}.`);
	}
	return undefined;
}

async function validateUseModifiedMasket(inputs: PreopApiInputs | PostopApiInputs, request: Request, env: Env): Promise<Response | undefined> {
	if (typeof inputs.UseModifiedMasket !== 'boolean') {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "UseModifiedMasket" is a required boolean.`);
	}
	return undefined;
}

async function validatePreopInputs(inputs: PreopApiInputs, request: Request, env: Env): Promise<Response | undefined> {
	if (typeof inputs.PredictionsPerIol !== 'number' || isNaN(inputs.PredictionsPerIol) || !Number.isInteger(inputs.PredictionsPerIol) || inputs.PredictionsPerIol < Settings.predictionsPerIol.min || inputs.PredictionsPerIol > Settings.predictionsPerIol.max) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "PredictionsPerIol" is a required integer between ${Settings.predictionsPerIol.min} and ${Settings.predictionsPerIol.max}`);
	}

	if (typeof inputs.IOLs !== 'undefined' && (!Array.isArray(inputs.IOLs) || inputs.IOLs.length < Settings.iolsPerEye.min || inputs.IOLs.length > Settings.iolsPerEye.max)) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "IOLs" (if specified) must contain between ${Settings.iolsPerEye.min} and ${Settings.iolsPerEye.max}.`);
	}

	return undefined;
}

async function validatePostopInputs(inputs: PostopApiInputs, request: Request, env: Env): Promise<Response | undefined> {
	if (typeof inputs.Optimize !== 'boolean') {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "Optimize" must be a boolean.`);
	}

	const lensConstants = IolConstantNames.map(x => ({ name: x, value: inputs[x], requirements: Settings.iolConstants[x] }));

	const missingIolConstant = lensConstants.find(x => typeof x.requirements !== 'object' || typeof x.requirements.max !== 'number' || typeof x.requirements.max !== 'number');

	if (missingIolConstant) {
		return await statusCodeResponse(request, env, 500, 'Bad Configuration', `Source code is not valid:\nRoot property "Settings.tsx must specify a ${missingIolConstant.name}" property with valid min and max values in the 'Settings' object.`);
	}

	const invalidLensConstant = lensConstants
		.find(x => typeof x.value !== 'number' || isNaN(x.value) || x.value < x.requirements.min || x.value > x.requirements.max);

	if (invalidLensConstant) {
		return await statusCodeResponse(request, env, 400, 'Bad Request', `Bad Request:\nRoot property "${invalidLensConstant.name}" is required and must be between ${invalidLensConstant.requirements.min} and ${invalidLensConstant.requirements.max}`);
	}

	return undefined;
}

export async function validateInputs(inputs: PreopApiInputs | PostopApiInputs, isPreop: boolean, request: Request, env: Env): Promise<Response | undefined> {
	return await ensureNoExtraProperties(inputs, isPreop, request, env) ||
		await validateKIndex(inputs, request, env) ||
		await validateV(inputs, request, env) ||
		await validateUseModifiedMasket(inputs, request, env) ||
		(isPreop && await validatePreopInputs(inputs as PreopApiInputs, request, env)) ||
		(!isPreop && await validatePostopInputs(inputs as PostopApiInputs, request, env)) ||
		await validateEyesIsProperlySizedArray(inputs, isPreop, request, env) ||
		undefined;
}
