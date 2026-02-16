const _val1 = 0 === -0; // default rule (eslint/no-compare-neg-zero)
({}).toString(); // default rule (typescript/no-base-to-string)
const _val2 = 0 == 1; // non-default rule (eslint/eqeqeq)
'str'.blink(); // non-default rule (typescript/no-deprecated)
