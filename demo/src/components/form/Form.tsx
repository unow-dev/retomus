import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';
import Card from '../Card';

// マシン定義
const retomus = createRetomus();

const formMachine = retomus.createMachine(
  createMachineConfig({
    id: 'form',
    status: ['idle', 'valid', 'invalid', 'submitted'],
    actions: ['update', 'submit', 'reset'],
    transitions: {
      idle: {
        update: ['valid', 'invalid'],
        reset: 'idle',
      },
      valid: {
        reset: 'idle',
        submit: 'submitted',
        update: ['valid', 'invalid'],
      },
      invalid: {
        update: ['valid', 'invalid'],
        reset: 'idle',
      },
      submitted: {
        reset: 'idle',
      },
    },
    router: {
      update: ctx => (ctx.state.isValid ? 'valid' : 'invalid'),
    },
    actionHandlers: {
      update: ({ ctx, payload, done }) => {
        const { value, field } = payload;
        ctx.state[field] = value;
        ctx.state.isValid =
          ctx.state.name.length > 0 && ctx.state.email.includes('@');
        done();
      },
      submit: ({ done }) => done(),
      reset: ({ ctx, done }) => {
        ctx.state.name = '';
        ctx.state.email = '';
        ctx.state.isValid = false;
        done();
      },
    },
    initialStatus: { status: 'idle' },
    ctx: {
      state: {
        name: '',
        email: '',
        isValid: false,
      },
    },
  }),
);

// フォームコンポーネント
export const FormComponent = ({ formMachine }) => {
  const name = formMachine.useState('name');
  const email = formMachine.useState('email');
  const isValid = formMachine.useState('isValid');
  const status = formMachine.useStatus();

  const update = formMachine.useAction('update');
  const submit = formMachine.useAction('submit');
  const reset = formMachine.useAction('reset');

  const handleInputChange =
    (field: 'name' | 'email') => (e: React.ChangeEvent<HTMLInputElement>) => {
      update({ value: e.target.value, field });
    };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
    >
      <h2>Status: {status}</h2>

      <div className='flex flex-col space-y-4 my-4'>
        <input
          type='text'
          placeholder='Name'
          value={name}
          onChange={handleInputChange('name')}
          className='bg-black p-1'
        />
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={handleInputChange('email')}
          className='bg-black p-1'
        />
      </div>

      <div className='flex space-x-4 justify-center'>
        <button type='submit' disabled={!isValid}>
          Submit
        </button>
        <button type='button' onClick={reset}>
          Reset
        </button>
      </div>
    </form>
  );
};

// 外部用ラッパー
const Form = () => (
  <Card>
    <FormComponent formMachine={formMachine} />
  </Card>
);

export default Form;
