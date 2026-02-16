# @mizdra/oxlint-config

Oxlint config for @mizdra

## Installation

```bash
npm i -D @mizdra/oxlint-config
```

## Usage

```ts
import { defineConfig } from 'oxlint';
import mizdra from '@mizdra/oxlint-config';

export default defineConfig({
  extends: [
    mizdra.base,
    mizdra.typescript,
    mizdra.node,
    mizdra.react,
  ],
});
```

## Design

- Enable all rules in the `correctness` category
- Do not use `warn` severity; use `error` severity.
  - Allowing both creates uncertainty about which one to use.
  - For consistency, we standardize on `error`.
- Do not enable rules that conflict with oxfmt
- Do not enable rules that can be replaced by TypeScript
  - Examples: `getter-return`, `no-undef`, `no-unreachable`, `react/no-unknown-property`
  - Today, TypeScript is easy to introduce. You can get started quickly with `tsc --init` or `node main.ts`.
  - As a principle, we reduce the number of enabled rules assuming TypeScript is adopted in the project.
- Do not enable rules that get in the way of trial-and-error coding
  - Examples: `no-empty`, `no-empty-function`
  - Code like `() => {}` is undesirable in production, but it appears frequently while coding. Warning on such code often feels noisy to developers.
  - ref: https://www.mizdra.net/entry/2023/01/31/012705
- Do not enable rules that warn about code complexity
  - Examples: `complexity`, `max-nested-callbacks`, `max-params`
  - These rules are intended to encourage refactoring by warning about complexity, but in most cases @mizdra ignores those warnings.
    - Refactoring is not done when a warning appears; it is done when code becomes hard to change without refactoring, or when a better design comes to mind.
  - There is little value in enabling rules that are mostly disabled anyway.
- Do not narrow lint targets with `overrides[].files`
  - Rules from the `typescript` plugin are often limited with `files: ["*.ts"]`, but that should be avoided because code in one language can be embedded in files of another language.
    - For example, `*.vue` can embed TypeScript code inside `<script lang="ts">`.
    - With `files: ["*.ts"]`, those embedded scripts are not covered by the rules.
  - Also, if `"checkJs": true` is set in `tsconfig.json`, `*.js` can be linted with type information as well.
    - Rules from the `typescript` plugin should apply to `*.js`, too.
  - As a principle, it is better to apply all rules to all files.
    - `typescript` plugin rules may run even on `*.vue` files without `<script lang="ts">`, which may slightly increase execution time. But the impact should be minor.
- Do not enable outdated rules
  - Examples: `react/jsx-no-target-blank`, `react/react-in-jsx-scope`
