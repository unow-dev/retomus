import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';
import Card from '../Card';

const retomus = createRetomus();

const steps = ['step1', 'step2', 'step3'];

const multiStepMachine = retomus.createMachine(
  createMachineConfig({
    id: 'multiStep',
    status: [...steps],
    actions: ['next', 'prev', 'reset'],
    transitions: {
      step1: { next: 'step2' },
      step2: { next: 'step3', prev: 'step1' },
      step3: { prev: 'step2', reset: 'step1' },
    },
    actionHandlers: {
      next: ({ done }) => done({}),
      prev: ({ done }) => done({}),
      reset: ({ done }) => done({}),
    },
    initialStatus: { status: 'step1' },
    ctx: {
      state: {},
    },
  }),
);

export const MultiStepComponent = () => {
  const step = multiStepMachine.useStatus();
  const next = multiStepMachine.useAction('next');
  const prev = multiStepMachine.useAction('prev');
  const reset = multiStepMachine.useAction('reset');

  const stepContent = {
    step1: <p>Step 1: Personal Info</p>,
    step2: <p>Step 2: Contact Details</p>,
    step3: <p>Step 3: Confirmation</p>,
  };

  return (
    <div className='flex flex-col space-y-4'>
      <h2>Current Step: {step}</h2>
      {stepContent[step]}

      <div className='flex space-x-4 justify-end'>
        {step !== 'step1' && <button onClick={() => prev({})}>Back</button>}
        {step !== 'step3' && <button onClick={() => next({})}>Next</button>}
        {step === 'step3' && <button onClick={() => reset({})}>Reset</button>}
      </div>
    </div>
  );
};

const Step = () => {
  return (
    <Card>
      <MultiStepComponent />
    </Card>
  );
};

export default Step;
