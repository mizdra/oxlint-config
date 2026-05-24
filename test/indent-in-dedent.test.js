// @ts-check

import { describe, it } from "node:test";
import { RuleTester } from "oxlint/plugins-dev";
import rule from "../src/plugin/rules/indent-in-dedent.js";

// oxlint-disable-next-line typescript/no-misused-promises
RuleTester.describe = describe;
// oxlint-disable-next-line typescript/no-misused-promises
RuleTester.it = it;

const tester = new RuleTester();

/** @param {string[]} rows */
function lines(...rows) {
  return rows.join("\n");
}

tester.run("indent-in-dedent", rule, {
  valid: [
    {
      name: "accepts top-level dedent with default indent",
      code: lines("const x = dedent`", "  foo", "`;"),
    },
    {
      name: "accepts nested dedent aligned to the enclosing block",
      code: lines("function f() {", "  return dedent`", "    foo", "    bar", "  `;", "}"),
    },
    {
      name: "allows content lines to exceed the minimum indent",
      code: lines("const x = dedent`", "  foo", "   bar", "`;"),
    },
    {
      name: "ignores single-line dedent",
      code: "const x = dedent`foo`;",
    },
    {
      name: "ignores tags other than dedent",
      code: lines("const x = html`", "foo", "`;"),
    },
    // oxlint-disable no-template-curly-in-string -- intentional ${...} text in fixture code
    {
      name: "ignores templates containing multi-line interpolation",
      code: lines("const x = dedent`", "  ${{", "    a: 1,", "  }}", "  foo", "`;"),
    },
    {
      name: "checks templates containing single-line interpolation",
      code: lines("const x = dedent`", "  ${y} foo", "  bar", "`;"),
    },
    // oxlint-enable no-template-curly-in-string
    {
      name: "respects the configured indent option",
      code: lines("const x = dedent`", "    foo", "`;"),
      options: [{ indent: 4 }],
    },
    {
      name: "accepts a template body consisting only of blank lines",
      code: lines("const x = dedent`", "", "`;"),
    },
    {
      name: "accepts an empty template body",
      code: lines("const x = dedent`", "`;"),
    },
    {
      name: "excludes whitespace-only lines from the min indent calculation",
      code: lines("const x = dedent`", "  foo", "    ", "  bar", "`;"),
    },
  ],
  invalid: [
    {
      name: "reports noContentAfterOpening when content follows the opening backtick",
      code: lines("const x = dedent`bad", "  foo", "`;"),
      errors: [{ messageId: "noContentAfterOpening" }],
      output: null,
    },
    {
      name: "reports noContentBeforeClosing when content precedes the closing backtick",
      code: lines("const x = dedent`", "  foo", "bad`;"),
      errors: [{ messageId: "noContentBeforeClosing" }],
      output: null,
    },
    {
      name: "fixes an over-indented closing backtick and reports closingIndentMismatch",
      code: lines("const x = dedent`", "  foo", "  `;"),
      errors: [{ messageId: "closingIndentMismatch" }],
      output: lines("const x = dedent`", "  foo", "`;"),
    },
    {
      name: "fixes over-indented content and reports contentIndentMismatch",
      code: lines("const x = dedent`", "    foo", "`;"),
      errors: [{ messageId: "contentIndentMismatch" }],
      output: lines("const x = dedent`", "  foo", "`;"),
    },
    {
      name: "fixes under-indented content and reports contentIndentMismatch",
      code: lines("const x = dedent`", " foo", "`;"),
      errors: [{ messageId: "contentIndentMismatch" }],
      output: lines("const x = dedent`", "  foo", "`;"),
    },
    {
      name: "preserves relative extra indent when fixing contentIndentMismatch",
      code: lines("function f() {", "  return dedent`", "      foo", "       bar", "  `;", "}"),
      errors: [{ messageId: "contentIndentMismatch" }],
      output: lines("function f() {", "  return dedent`", "    foo", "     bar", "  `;", "}"),
    },
    {
      name: "reports and fixes closingIndentMismatch and contentIndentMismatch together",
      code: lines(
        "const obj = {",
        "  'src/a.module.css': dedent`",
        "      @import './b.module.css';",
        "      .a_1 { color: red; }",
        "    `,",
        "};",
      ),
      errors: [{ messageId: "contentIndentMismatch" }, { messageId: "closingIndentMismatch" }],
      output: lines(
        "const obj = {",
        "  'src/a.module.css': dedent`",
        "    @import './b.module.css';",
        "    .a_1 { color: red; }",
        "  `,",
        "};",
      ),
    },
    {
      name: "applies the configured indent option when fixing contentIndentMismatch",
      code: lines("const x = dedent`", "  foo", "`;"),
      options: [{ indent: 4 }],
      errors: [{ messageId: "contentIndentMismatch" }],
      output: lines("const x = dedent`", "    foo", "`;"),
    },
  ],
});
