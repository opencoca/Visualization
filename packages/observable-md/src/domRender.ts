import { OJSRuntime } from "./ojsRuntime";
import { OMDRuntime } from "./omdRuntime";

import "../src/domRender.css";

import "@observablehq/inspector/dist/inspector.css";

export function renderTo(domNode, languageId, ojs) {
    const compiler = languageId === "omd" ? new OMDRuntime(domNode) : new OJSRuntime(domNode);

    compiler.evaluate("", ojs);
}
