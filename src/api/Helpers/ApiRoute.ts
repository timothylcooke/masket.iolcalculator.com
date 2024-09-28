import { PostopApiInputs, PreopApiInputs } from '../IolFormula/ApiTypes';
import { validateInputs } from '../IolFormula/ApiVariables';
import MasketFormula from '../IolFormula/MasketFormula';
import Env from './Env';
import statusCodeResponse from './statusCodeResponse';


export default class ApiRoute {
	static Preop = async function(inputs: PreopApiInputs, request: Request, env: Env): Promise<Response> {
		const requestError = await validateInputs(inputs, true, request, env);

		if (requestError) {
			return requestError;
		}

		// At this point, we know we have acceptable values for PredictionsPerIol, KIndex, and we know we have a valid number of Eyes and IOLs.
		// That means we've got enough for a 200 response. If there are any problems with individual eyes or IOLs, we'll return errors on an individual basis.
		return new Response(JSON.stringify((inputs.Eyes).map(eye => MasketFormula.calculatePreOp(inputs.KIndex, inputs.V, inputs.PredictionsPerIol, inputs.IOLs, eye))), { headers: { 'content-type': 'application/json' } });
	}

	static Postop = async function(inputs: PostopApiInputs, request: Request, env: Env): Promise<Response> {
		const requestError = await validateInputs(inputs, false, request, env);

		if (requestError) {
			return requestError;
		}

		const answer = MasketFormula.calculatePostopEyes(inputs);

		if (typeof answer === 'string') {
			return await statusCodeResponse(request, env, 400, 'Bad Request', answer);
		}

		return new Response(JSON.stringify(answer), { headers: { 'content-type': 'application/json' } });
	}
};
