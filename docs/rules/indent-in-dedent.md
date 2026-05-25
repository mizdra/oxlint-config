# mizdra/indent-in-dedent

Enforce consistent indentation inside [`dedent`](https://www.npmjs.com/package/dedent) tagged template literals.

## Rule Details

This rule checks the layout of multi-line `` dedent`...` `` tagged template literals and reports the following violations:

- `noContentAfterOpening`: The opening backtick is followed by non-whitespace content on the same line.
- `noContentBeforeClosing`: The closing backtick is preceded by non-whitespace content on the same line.
- `closingIndentMismatch`: The closing backtick is indented differently from the opening line. Auto-fixable.
- `contentIndentMismatch`: The minimum indent of the content lines does not equal `<opening line indent> + indent`. Auto-fixable while preserving each line's relative extra indent.

Single-line `` dedent`...` ``, tags other than `dedent`, and templates containing multi-line `${...}` interpolations are ignored.

Examples of **incorrect** code for this rule:

```js
// noContentAfterOpening
const x = dedent`bad
  foo
`;

// noContentBeforeClosing
const x = dedent`
  foo
bad`;

// closingIndentMismatch
const x = dedent`
  foo
  `;

// contentIndentMismatch (over-indented)
const x = dedent`
    foo
`;

// contentIndentMismatch (under-indented)
const x = dedent`
 foo
`;
```

Examples of **correct** code for this rule:

```js
const x = dedent`
  foo
`;

function f() {
  return dedent`
    foo
    bar
  `;
}

// Lines may exceed the minimum indent; the extra indent is preserved by the fixer.
const x = dedent`
  foo
   bar
`;
```

## Options

This rule accepts an options object with the following property:

- `indent` (`integer`, default `2`): Number of spaces by which the content must be indented relative to the opening line.

Example configuration with `indent: 4`:

```js
// oxlint.config.js
export default {
  rules: {
    "mizdra/indent-in-dedent": ["error", { indent: 4 }],
  },
};
```

With the configuration above, the following becomes valid:

```js
const x = dedent`
    foo
`;
```

## When Not To Use It

If your project does not use the `dedent` tag, or if you intentionally allow inconsistent indentation inside `` dedent`...` ``, you can disable this rule.
