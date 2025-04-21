import Machine from './Machine';
import { MachineApi } from './types';

const createMachineApi = (machine: Machine): MachineApi => {
   const hooks = machine.createHooks();
   return {
      setup: ({ ctx, actionHandlers, options }) => {
         machine.dynamicSetup(ctx, actionHandlers, options);
      },
      ...hooks,
   };
};

export { createMachineApi, Machine };
