import Machine from './Machine';
const createMachineApi = (machine) => {
    const hooks = machine.createHooks();
    return {
        setup: ({ ctx, actionHandlers, options }) => {
            machine.dynamicSetup(ctx, actionHandlers, options);
        },
        useStatus: hooks.useStatus,
        useAction: hooks.useAction,
        useState: hooks.useState,
        useRef: hooks.useRef,
        useFlag: hooks.useFlag,
    };
};
export { createMachineApi, Machine };
