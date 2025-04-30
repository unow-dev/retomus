import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';
import Card from '../Card';

const retomus = createRetomus();

const sharedCtx = retomus.createCtx('global', {
  state: { theme: 'light' },
  ref: { scrollPos: 0 },
});

const themeSwitchMachine = retomus.createMachine(
  createMachineConfig({
    id: 'themeSwitch',
    status: ['light', 'dark'],
    actions: ['toggle'],
    transitions: {
      light: { toggle: 'dark' },
      dark: { toggle: 'light' },
    },
    actionHandlers: {
      toggle: ({ ctx, done }) => {
        console.log('toggleTheme');
        ctx.state.theme = ctx.state.theme === 'light' ? 'dark' : 'light';
        done();
      },
    },
    initialStatus: { status: 'light' },
    ctx: { },
    options: { sharedCtxIds: ['global'] },
  }),
);

const ThemeSwitcherComponent = ({ machine, sharedCtx }) => {
  const theme = sharedCtx.useState('theme');
  const status = machine.useStatus();
  const toggle = machine.useAction('toggle');

  const handleClick = () => {
    console.log('handleClick');
    toggle();
  };

  return (
    <div className='flex flex-col space-y-4'>
      <h2>ThemeSwitcher</h2>
      <p>Status: {status}</p>
      <p>Theme in Global Store: {theme}</p>
      <button onClick={handleClick}>Toggle Theme</button>
    </div>
  );
};

const GlobalStore = () => {
  return (
    <Card>
      <ThemeSwitcherComponent
        machine={themeSwitchMachine}
        sharedCtx={sharedCtx}
      />
    </Card>
  );
};

export default GlobalStore;
