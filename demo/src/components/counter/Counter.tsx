import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';
import Card from '../Card';

const retomus = createRetomus();

const counterMachine = retomus.createMachine(
  createMachineConfig({
    id: 'counter',
    status: ['idle', 'active'],
    actions: ['increment', 'decrement', 'reset'],
    transitions: {
      idle: {
        increment: 'active',
        decrement: 'active',
      },
      active: {
        increment: 'active',
        decrement: 'active',
        reset: 'idle',
      },
    },
    actionHandlers: {
      increment: ({ ctx, done }) => {
        ctx.state.count++;
        done();
      },
      decrement: ({ ctx, done }) => {
        ctx.state.count--;
        done();
      },
      reset: ({ ctx, done }) => {
        ctx.state.count = 0;
        done();
      },
    },
    initialStatus: {
      status: 'idle',
    },
    ctx: {
      state: { count: 0 },
    },
  }),
);

const CounterComponent = ({ counterMachine }) => {
  const count = counterMachine.useState('count');
  const status = counterMachine.useStatus();
  const increment = counterMachine.useAction('increment');
  const decrement = counterMachine.useAction('decrement');
  const reset = counterMachine.useAction('reset');

  return (
    <div className='flex flex-col space-y-4'>
      <p>Status: {status}</p>
      <p>Count: {count}</p>
      <div className='flex space-x-4 justify-center'>
        <button
          onClick={() => {
            increment();
          }}
        >
          increment
        </button>
        <button
          onClick={() => {
            decrement();
          }}
        >
          decrement
        </button>
        <button
          onClick={() => {
            reset();
          }}
        >
          reset
        </button>
      </div>
    </div>
  );
};

const Counter = () => {
  return (
    <Card>
      <CounterComponent counterMachine={counterMachine} />
    </Card>
  );
};

export default Counter;
