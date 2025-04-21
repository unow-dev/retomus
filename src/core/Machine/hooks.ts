import { createValueHooks } from '../../common/hooks';

const createMachineValueHooks = (machine, categories): Record<string, any> => {
   console.log('machine', machine);
   console.log('categories', categories);
   return createValueHooks(machine, categories);
};

export { createMachineValueHooks };
