import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';
import Card from '../Card';

const retomus = createRetomus();

const modalMachine = retomus.createMachine(
  createMachineConfig({
    id: 'modal',
    status: ['closed', 'opened'],
    actions: ['open', 'close', 'toggle'],
    transitions: {
      closed: { open: 'opened', toggle: 'opened' },
      opened: { close: 'closed', toggle: 'closed' },
    },
    actionHandlers: {
      open: ({ done }) => done(),
      close: ({ done }) => done(),
      toggle: ({ done }) => done(),
    },
    initialStatus: { status: 'closed' },
    ctx: {
      state: {},
    },
  }),
);

export const ModalComponent = () => {
  const status = modalMachine.useStatus();
  const open = modalMachine.useAction('open');
  const close = modalMachine.useAction('close');
  const toggle = modalMachine.useAction('toggle');

  return (
    <div>
      <div className='flex flex-col space-y-4'>
        <h2>Status: {status}</h2>
        <div className='flex space-x-4 justify-center'>
          <button onClick={open}>Open</button>
          <button onClick={close}>Close</button>
          <button onClick={toggle}>Toggle</button>
        </div>
      </div>

      {status === 'opened' && (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center'>
          <div className='flex flex-col space-y-4 bg-gray-800 text-white p-4'>
            <p>This is the modal content.</p>
            <div className='flex space-x-4 justify-center'>
              <button onClick={open}>Open</button>
              <button onClick={close}>Close</button>
              <button onClick={toggle}>Toggle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Modal = () => {
  return (
    <Card>
      <ModalComponent />
    </Card>
  );
};

export default Modal;
