import { definePlugin } from "@oxlint/plugins";
import indentInDedent from "./rules/indent-in-dedent.js";

export default definePlugin({
  meta: { name: "mizdra" },
  rules: {
    "indent-in-dedent": indentInDedent,
  },
});
