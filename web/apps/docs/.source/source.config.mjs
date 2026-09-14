// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";

// lib/remark-mermaid.ts
import { visit } from "unist-util-visit";
function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "mermaid" || !parent || index === void 0) return;
      const element = {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: [{ type: "mdxJsxAttribute", name: "chart", value: node.value }],
        children: []
      };
      parent.children[index] = element;
    });
  };
}

// source.config.ts
var docs = defineDocs({
  dir: "content/docs"
});
var source_config_default = defineConfig({
  mdxOptions: {
    // Appended, not replacing the defaults — Fumadocs' own remark plugins
    // (frontmatter, GFM, etc.) still need to run.
    remarkPlugins: (v) => [...v, remarkMermaid]
  }
});
export {
  source_config_default as default,
  docs
};
