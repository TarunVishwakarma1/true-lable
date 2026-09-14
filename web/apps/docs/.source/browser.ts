// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "contributing.mdx": () => import("../content/docs/contributing.mdx?collection=docs"), "deployment.mdx": () => import("../content/docs/deployment.mdx?collection=docs"), "getting-started.mdx": () => import("../content/docs/getting-started.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "backend/authentication.mdx": () => import("../content/docs/backend/authentication.mdx?collection=docs"), "backend/database-schema.mdx": () => import("../content/docs/backend/database-schema.mdx?collection=docs"), "backend/index.mdx": () => import("../content/docs/backend/index.mdx?collection=docs"), "backend/rate-limiting.mdx": () => import("../content/docs/backend/rate-limiting.mdx?collection=docs"), "dashboard/index.mdx": () => import("../content/docs/dashboard/index.mdx?collection=docs"), "web/index.mdx": () => import("../content/docs/web/index.mdx?collection=docs"), "ios/building.mdx": () => import("../content/docs/ios/building.mdx?collection=docs"), "ios/index.mdx": () => import("../content/docs/ios/index.mdx?collection=docs"), "ios/networking.mdx": () => import("../content/docs/ios/networking.mdx?collection=docs"), "backend/api-reference/admin.mdx": () => import("../content/docs/backend/api-reference/admin.mdx?collection=docs"), "backend/api-reference/me.mdx": () => import("../content/docs/backend/api-reference/me.mdx?collection=docs"), "backend/api-reference/ocr.mdx": () => import("../content/docs/backend/api-reference/ocr.mdx?collection=docs"), "backend/api-reference/products.mdx": () => import("../content/docs/backend/api-reference/products.mdx?collection=docs"), }),
};
export default browserCollections;