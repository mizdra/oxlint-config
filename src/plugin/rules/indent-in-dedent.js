import { defineRule } from "@oxlint/plugins";

/**
 * @import { Diagnostic, ESTree } from "@oxlint/plugins"
 */

const DEFAULT_INDENT = 2;
const TAG_NAME = "dedent";

const rule = defineRule({
  meta: {
    type: "layout",
    fixable: "whitespace",
    docs: {
      description: "Enforce consistent indentation inside `dedent` tagged template literals.",
    },
    schema: [
      {
        type: "object",
        properties: {
          indent: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ indent: DEFAULT_INDENT }],
    messages: {
      noContentAfterOpening: "No content allowed after the opening backtick of `dedent`.",
      noContentBeforeClosing: "No content allowed before the closing backtick of `dedent`.",
      closingIndentMismatch:
        "The closing backtick must have the same indent as the opening line (expected {{expected}} chars, got {{actual}}).",
      contentIndentMismatch:
        "The minimum indent of `dedent` content must be {{expected}} (got {{actual}}).",
    },
  },
  create(context) {
    const opts = /** @type {{ indent?: number } | undefined} */ (context.options[0]) ?? {};
    const indentSize = opts.indent ?? DEFAULT_INDENT;
    const text = context.sourceCode.text;
    return {
      TaggedTemplateExpression(node) {
        if (node.tag.type !== "Identifier" || node.tag.name !== TAG_NAME) return;
        const quasi = node.quasi;
        if (quasi.loc.start.line === quasi.loc.end.line) return;
        for (const expr of quasi.expressions) {
          if (expr.loc.start.line !== expr.loc.end.line) return;
        }

        const layout = computeLayout(text, quasi);
        const diagnostics = [
          buildNoContentAfterOpeningDiagnostic(layout),
          buildNoContentBeforeClosingDiagnostic(layout),
          buildClosingIndentDiagnostic(layout),
          buildContentIndentDiagnostic(text, layout, indentSize),
        ];
        for (const diagnostic of diagnostics) {
          if (diagnostic !== null) context.report(diagnostic);
        }
      },
    };
  },
});

/**
 * @typedef {object} TemplateLayout
 * @property {number} startLine Line of the opening backtick (1-based).
 * @property {number} startColumn Column of the opening backtick (0-based).
 * @property {number} endLine Line of the closing backtick (1-based).
 * @property {number} endColumn Column right after the closing backtick (0-based).
 * @property {number} closeOffset Offset of the closing backtick.
 * @property {number} openLineEnd Offset of the newline that follows the opening backtick.
 * @property {number} closeLineStart Offset of the start of the closing backtick's line.
 * @property {string} openingLineIndent Leading whitespace of the opening line.
 * @property {string} afterOpening Text between the opening backtick and the next newline.
 * @property {string} beforeClosing Text on the closing line before the closing backtick.
 */

/**
 * @typedef {{ startOffset: number; indentLength: number }} NonBlankLine
 */

/**
 * @param {string} text
 * @param {ESTree.TemplateLiteral} quasi
 * @returns {TemplateLayout}
 */
function computeLayout(text, quasi) {
  const openOffset = quasi.range[0];
  const closeOffset = quasi.range[1] - 1;
  const openLineStart = text.lastIndexOf("\n", openOffset - 1) + 1;
  const openLineEnd = text.indexOf("\n", openOffset + 1);
  const closeLineStart = text.lastIndexOf("\n", closeOffset - 1) + 1;
  return {
    startLine: quasi.loc.start.line,
    startColumn: quasi.loc.start.column,
    endLine: quasi.loc.end.line,
    endColumn: quasi.loc.end.column,
    closeOffset,
    openLineEnd,
    closeLineStart,
    openingLineIndent: leadingWhitespace(text, openLineStart),
    afterOpening: text.slice(openOffset + 1, openLineEnd),
    beforeClosing: text.slice(closeLineStart, closeOffset),
  };
}

/**
 * @param {TemplateLayout} layout
 * @returns {Diagnostic | null}
 */
function buildNoContentAfterOpeningDiagnostic(layout) {
  const { afterOpening, startLine, startColumn } = layout;
  if (!/\S/u.test(afterOpening)) return null;
  return {
    messageId: "noContentAfterOpening",
    loc: {
      start: { line: startLine, column: startColumn },
      end: { line: startLine, column: startColumn + 1 + afterOpening.length },
    },
  };
}

/**
 * @param {TemplateLayout} layout
 * @returns {Diagnostic | null}
 */
function buildNoContentBeforeClosingDiagnostic(layout) {
  const { beforeClosing, endLine, endColumn } = layout;
  if (!/\S/u.test(beforeClosing)) return null;
  return {
    messageId: "noContentBeforeClosing",
    loc: {
      start: { line: endLine, column: 0 },
      end: { line: endLine, column: endColumn - 1 },
    },
  };
}

/**
 * @param {TemplateLayout} layout
 * @returns {Diagnostic | null}
 */
function buildClosingIndentDiagnostic(layout) {
  const { beforeClosing, openingLineIndent, endLine, endColumn, closeLineStart, closeOffset } =
    layout;
  // Skip when noContentBeforeClosing already reports the closing line.
  if (/\S/u.test(beforeClosing)) return null;
  if (beforeClosing === openingLineIndent) return null;
  return {
    messageId: "closingIndentMismatch",
    data: { expected: String(openingLineIndent.length), actual: String(beforeClosing.length) },
    loc: {
      start: { line: endLine, column: 0 },
      end: { line: endLine, column: endColumn - 1 },
    },
    fix(fixer) {
      return fixer.replaceTextRange([closeLineStart, closeOffset], openingLineIndent);
    },
  };
}

/**
 * @param {string} text
 * @param {TemplateLayout} layout
 * @param {number} indentSize
 * @returns {Diagnostic | null}
 */
function buildContentIndentDiagnostic(text, layout, indentSize) {
  const { openLineEnd, closeLineStart, openingLineIndent, startLine, startColumn, endLine, endColumn } =
    layout;
  const nonBlankLines = collectNonBlankLines(text, openLineEnd + 1, closeLineStart);
  if (nonBlankLines.length === 0) return null;

  const minIndent = Math.min(...nonBlankLines.map((l) => l.indentLength));
  const expectedIndent = openingLineIndent.length + indentSize;
  if (minIndent === expectedIndent) return null;

  const delta = expectedIndent - minIndent;
  return {
    messageId: "contentIndentMismatch",
    data: { expected: String(expectedIndent), actual: String(minIndent) },
    loc: {
      start: { line: startLine, column: startColumn },
      end: { line: endLine, column: endColumn },
    },
    fix(fixer) {
      if (delta > 0) {
        const pad = " ".repeat(delta);
        return nonBlankLines.map((line) =>
          fixer.insertTextBeforeRange([line.startOffset, line.startOffset], pad),
        );
      }
      const removeCount = -delta;
      return nonBlankLines.map((line) =>
        fixer.removeRange([line.startOffset, line.startOffset + removeCount]),
      );
    },
  };
}

/**
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {NonBlankLine[]}
 */
function collectNonBlankLines(text, start, end) {
  /** @type {NonBlankLine[]} */
  const lines = [];
  const slice = text.slice(start, end);
  for (const m of slice.matchAll(/^[ \t]*(?=\S)/gmu)) {
    lines.push({ startOffset: start + m.index, indentLength: m[0].length });
  }
  return lines;
}

/**
 * @param {string} text
 * @param {number} fromOffset
 * @returns {string}
 */
function leadingWhitespace(text, fromOffset) {
  let end = fromOffset;
  while (end < text.length) {
    const ch = text[end];
    if (ch !== " " && ch !== "\t") break;
    end++;
  }
  return text.slice(fromOffset, end);
}

export default rule;
