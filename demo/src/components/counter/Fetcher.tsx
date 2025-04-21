import { useState } from 'react';
import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';
import Card from '../Card';

const retomus = createRetomus();

const fetchMachine = retomus.createMachine(
  createMachineConfig({
    id: 'fetchMachine',
    status: ['idle', 'success', 'error'],
    actions: ['fetch', 'reset'],
    transitions: {
      idle: { fetch: ['success', 'error'] },
      success: { reset: 'idle' },
      error: { reset: 'idle' },
    },
    router: {
      fetch: ctx => (ctx.state.data ? 'success' : 'error'),
    },
    actionHandlers: {
      fetch: async ({ ctx, done }) => {
        try {
          const res = await fetch(
            'https://jsonplaceholder.typicode.com/todos/1',
          );
          ctx.state.data = await res.json();
        } catch (err) {
          ctx.state.error = err.message;
        }
        done();
      },
      reset: ({ ctx, done }) => {
        ctx.state.data = null;
        ctx.state.error = null;
        done();
      },
    },
    initialStatus: { status: 'idle' },
    ctx: {
      state: {
        data: null,
        error: null,
      },
    },
  }),
);

export const FetcherComponent = () => {
  const status = fetchMachine.useStatus();
  const data = fetchMachine.useState('data');
  const error = fetchMachine.useState('error');
  const fetch = fetchMachine.useAction('fetch');
  const reset = fetchMachine.useAction('reset');

  const [loading, setLoading] = useState(false);
  const handleClickFetch = async () => {
    if (!loading) {
      setLoading(true);
      await fetch();
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col space-y-4'>
      <h2>Status: {status}</h2>

      {status === 'success' && <pre>Fetched data: {JSON.stringify(data, null, 2)}</pre>}
      {status === 'error' && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Loading...</p>}

      <div className='flex space-x-4 justify-center'>
        <button onClick={handleClickFetch} disabled={loading}>
          Fetch
        </button>
        <button onClick={() => reset()}>Reset</button>
      </div>
    </div>
  );
};

const Fetcher = () => {
  return (
    <Card>
      <FetcherComponent />
    </Card>
  );
};

export default Fetcher;
