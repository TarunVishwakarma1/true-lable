import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

/// Fumadocs' rehype-based syntax highlighter (Shiki) runs after remark and
/// rebuilds every code block into its own richly-structured HTML on the way
/// through — by the time mdx-components.tsx's `pre` override would see a
/// ```mermaid fence, Shiki has already consumed the language and there's no
/// "language-mermaid" class left to check (confirmed by inspecting the
/// actual rendered DOM: the <code> element's className comes out empty).
///
/// Swapping the node out here, at the remark stage — before Shiki ever
/// runs — sidesteps that entirely: a mermaid fence becomes a <Mermaid
/// chart="..."/> JSX node, and Shiki never sees a code block to highlight.
export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || !parent || index === undefined) return;

      const element: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: [{ type: "mdxJsxAttribute", name: "chart", value: node.value }],
        children: [],
      };
      parent.children[index] = element;
    });
  };
}
