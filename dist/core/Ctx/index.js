import SharedCtx from './SharedCtx';
import MergedCtx from './MergedCtx';
import Ctx from './Ctx';
const createCtxApi = (ctx) => {
    const hooks = ctx.createHooks();
    return {
        setup: ({ ctx, options }) => {
            ctx.dynamicSetup(ctx, options);
        },
        useState: hooks.useState,
        useRef: hooks.useRef,
        useFlag: hooks.useFlag,
    };
};
export { createCtxApi, SharedCtx, MergedCtx, Ctx };
