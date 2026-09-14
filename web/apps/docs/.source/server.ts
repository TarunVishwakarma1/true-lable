// @ts-nocheck
import * as __fd_glob_23 from "../content/docs/backend/api-reference/products.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/backend/api-reference/ocr.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/backend/api-reference/me.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/backend/api-reference/admin.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/web/index.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/ios/networking.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/ios/index.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/ios/building.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/dashboard/index.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/backend/rate-limiting.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/backend/index.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/backend/database-schema.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/backend/authentication.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/getting-started.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/deployment.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/contributing.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/architecture.mdx?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/backend/api-reference/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/web/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/ios/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/dashboard/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/backend/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "backend/meta.json": __fd_glob_1, "dashboard/meta.json": __fd_glob_2, "ios/meta.json": __fd_glob_3, "web/meta.json": __fd_glob_4, "backend/api-reference/meta.json": __fd_glob_5, }, {"architecture.mdx": __fd_glob_6, "contributing.mdx": __fd_glob_7, "deployment.mdx": __fd_glob_8, "getting-started.mdx": __fd_glob_9, "index.mdx": __fd_glob_10, "backend/authentication.mdx": __fd_glob_11, "backend/database-schema.mdx": __fd_glob_12, "backend/index.mdx": __fd_glob_13, "backend/rate-limiting.mdx": __fd_glob_14, "dashboard/index.mdx": __fd_glob_15, "ios/building.mdx": __fd_glob_16, "ios/index.mdx": __fd_glob_17, "ios/networking.mdx": __fd_glob_18, "web/index.mdx": __fd_glob_19, "backend/api-reference/admin.mdx": __fd_glob_20, "backend/api-reference/me.mdx": __fd_glob_21, "backend/api-reference/ocr.mdx": __fd_glob_22, "backend/api-reference/products.mdx": __fd_glob_23, });