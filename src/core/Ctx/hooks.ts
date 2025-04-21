import { createValueHooks } from "../../common/hooks";

const createSharedCtxValueHooks = (ctx, categories): Record<string, any> =>
   createValueHooks(ctx, categories);

export { createSharedCtxValueHooks };
