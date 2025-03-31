import Machine from './Machine';
import { MachineApi } from './types';

const createMachineApi = (machine): MachineApi => {
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
