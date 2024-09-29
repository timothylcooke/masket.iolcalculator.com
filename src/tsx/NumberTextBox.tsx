import { useState, forwardRef, useImperativeHandle } from 'react';
import { FormHelperText, TextField } from '@mui/material';
import { ValidationInfo } from './HtmlSettings';

export type NumberTextBoxHandle = {
	validate: () => number | string | undefined
};

type NumberTextBoxProps = {
	id: string,
	displayName: string,
	limits: {
		min: number,
		max: number
	},
	required: boolean,
	validationInfo: ValidationInfo,
	value: string,
	setValue: (newValue: string) => void
};

function tooExtremeWarning(displayName: string, tooExtremeWarning: string | undefined, tooExtremeWord: string | undefined) {
	if (tooExtremeWarning) {
		return tooExtremeWarning;
	}
	return eval('(function (displayName, extremeWord) { return `The ${displayName} is unusually ${extremeWord}. Are you sure this value is correct?`; })')(displayName, tooExtremeWord);
}

const NumberTextBox = forwardRef<NumberTextBoxHandle, NumberTextBoxProps>(function NumberTextBox(props, ref) {
	const [error, setError] = useState(undefined as string | undefined);
	const [warning, setWarning] = useState(undefined as string | undefined);

	const validate = () => {
		const number = parseFloat(props.value);

		const error = typeof props.value !== 'string' || props.value.trim() === '' ? (props.required === false ? undefined : `You must specify the ${props.displayName}`) :
			isNaN(number) ? `The ${props.displayName} must be a number.` :
				number < props.limits.min || number > props.limits.max ? `The ${props.displayName} must be between ${(props.limits.min == Math.round(props.limits.min) ? props.limits.min : Number(Math.ceil(props.limits.min * 100) / 100).toFixed(2))} and ${(props.limits.min < 0 && props.limits.max > 0 ? '+' : '')}${(props.limits.max == Math.round(props.limits.max) ? props.limits.max : Number(Math.floor(props.limits.max * 100) / 100).toFixed(2))}${(props.validationInfo.units === undefined ? '' : ` ${props.validationInfo.units}.`)}` :
					undefined;

		const warn = typeof error === 'undefined' && !isNaN(number) ?
			number < props.validationInfo.warnIfLessThan ?
				tooExtremeWarning(props.displayName, props.validationInfo.tooLowWarning, props.validationInfo.tooLowWord) :
				number > props.validationInfo.warnIfGreaterThan ?
					tooExtremeWarning(props.displayName, props.validationInfo.tooHighWarning, props.validationInfo.tooHighWord) :
					undefined
			: undefined;

		setWarning(warn);
		setError(error);

		return error ? props.id : (typeof props.value !== 'string' || props.value.trim() === '' ? undefined : number);
	};

	useImperativeHandle(ref, () => ({ validate }));

	return (
		<div className="row">
			<div className="col pt-4">
				<TextField id={props.id} fullWidth label={`${props.displayName}${props.validationInfo.unitsAbbreviation ? ` (${props.validationInfo.unitsAbbreviation})` : ''}`} focused={warning !== undefined || undefined} error={error !== undefined} color={warning !== undefined ? 'warning' : undefined} value={props.value} onChange={e => props.setValue(e.target.value)} onBlur={validate} placeholder="(Required)"  />
				<FormHelperText error={error !== undefined} sx={warning !== undefined ? {color: '#ed6c02'} : undefined}>{error ?? warning}</FormHelperText>
			</div>
		</div>
	);
});

export default NumberTextBox;
