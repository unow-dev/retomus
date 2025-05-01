import SharedCtx from './SharedCtx';
import MergedCtx from './MergedCtx';
import Ctx from './Ctx';
import { CtxApi } from './types';

const createCtxApi = (ctx: SharedCtx): CtxApi => {
  const hooks = ctx.createHooks();
  return {
    setup: ({ ctx, options }) => {
      ctx.dynamicSetup(ctx, options);
    },
    ...hooks,
    useFlag: hooks.useFlag,
  };
};

export { createCtxApi, SharedCtx, MergedCtx, Ctx };
