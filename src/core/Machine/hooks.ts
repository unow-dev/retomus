import { createValueHooks } from '../../common/hooks';

const createMachineValueHooks = (machine, categories): Record<string, any> => {


   return createValueHooks(machine, categories);
};

export { createMachineValueHooks };
