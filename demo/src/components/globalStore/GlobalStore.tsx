import { useAnimate } from 'motion/react';
import {
  createRetomus,
  createMachineConfig,
  ValueCategory,
  createRetomusConfig,
} from '../../../../dist/index.mjs';
import Card from '../Card';
import { useRef } from 'react';

const valueCategories: ValueCategory[] = [
  {
    id: 'animationRef',
    use: () => {
      const [scope, animate] = useAnimate();
      const animationRef = useRef({ scope, animate });
      return [
        animationRef,
        value => {
          if (!value) return;
          animationRef.current = { scope: value[0], animate: value[1] };
        },
      ];
    },
    setterType: 'ref',
    valuePropName: 'current',
  },
];

const retomus = createRetomus(createRetomusConfig({ valueCategories }));

const sharedCtx = retomus.createCtx('global', {
  state: { theme: 'light' },
  ref: { scrollPos: 0 },
  animationRef: { moveXAnimation: null },
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
        ctx.ref.theme = ctx.state.theme;
        done();
      },
    },
    initialStatus: { status: 'light' },
    ctx: {
      ref: {
        theme: 'light',
      },
    },
    options: { sharedCtxIds: ['global'] },
  }),
);

const createdAnimatedBoxMachine = () =>
  retomus.createMachine(
    createMachineConfig({
      id: 'animatedBox',
      status: ['center', 'left', 'right'],
      actions: ['moveCenter', 'moveLeft', 'moveRight'],
      actionHandlers: {
        moveCenter: ({ ctx, done }) => {
          console.log('moveCenter');
          console.log(ctx.animationRef.moveXAnimation);
          ctx.animationRef.moveXAnimation.animate('div', {
            x: 0,
          });
          done();
        },
        moveLeft: ({ ctx, done }) => {
          console.log('moveLeft');
          console.log(ctx.animationRef.moveXAnimation);
          ctx.animationRef.moveXAnimation.animate('div', {
            x: -100,
          });
          done();
        },
        moveRight: ({ ctx, done }) => {
          console.log('moveRight');
          console.log(ctx.animationRef.moveXAnimation);
          ctx.animationRef.moveXAnimation.animate('div', {
            x: 100,
          });
          done();
        },
      },
      transitions: {
        center: { moveLeft: 'left', moveRight: 'right' },
        left: { moveCenter: 'center', moveRight: 'right' },
        right: { moveCenter: 'center', moveLeft: 'left' },
      },
      initialStatus: { status: 'center' },
      ctx: {
        animationRef: {
          moveXAnimation: null,
        },
      },
      options: { sharedCtxIds: ['global'] },
    }),
  );

const ThemeSwitcherComponent = ({ machines, sharedCtx }) => {
  const { themeSwitchMachine, animatedBoxMachine } = machines;
  const theme = sharedCtx.useState('theme');
  const themeStatus = themeSwitchMachine.useStatus();
  const toggle = themeSwitchMachine.useAction('toggle');

  const handleClickToggleTheme = () => {
    console.log('handleClick');
    toggle();
  };

  const boxStatus = animatedBoxMachine.useStatus();
  const moveXAnimationRef = sharedCtx.useAnimationRef('moveXAnimation');
  const moveRight = animatedBoxMachine.useAction('moveRight');
  const moveLeft = animatedBoxMachine.useAction('moveLeft');
  const moveCenter = animatedBoxMachine.useAction('moveCenter');

  const handleClickMoveBox = direction => {
    switch (direction) {
      case 'right':
        moveRight();
        break;
      case 'left':
        moveLeft();
        break;
      case 'center':
        moveCenter();
        break;
    }
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        <h2>ThemeSwitcher</h2>
        <p>Status: {themeStatus}</p>
        <p>Theme in Global Store: {theme}</p>
        <button onClick={handleClickToggleTheme}>Toggle Theme</button>
      </div>
      <div className='flex flex-col space-y-4 mt-10'>
        <h2>AnimatedBox</h2>
        <p>Status: {boxStatus}</p>
        <div
          ref={moveXAnimationRef.current.scope}
          className='w-full h-10 bg-gray-800 flex items-center justify-center'
        >
          <div className='w-10 h-10 bg-red-500'></div>
        </div>
        <button
          onClick={() => {
            handleClickMoveBox('right');
          }}
        >
          Move Right
        </button>
        <button onClick={() => handleClickMoveBox('center')}>
          Move Center
        </button>
        <button
          onClick={() => {
            handleClickMoveBox('left');
          }}
        >
          Move Left
        </button>
      </div>
    </>
  );
};

const GlobalStore = () => {
  return (
    <Card>
      <ThemeSwitcherComponent
        machines={{
          themeSwitchMachine,
          animatedBoxMachine: createdAnimatedBoxMachine(),
        }}
        sharedCtx={sharedCtx}
      />
    </Card>
  );
};

export default GlobalStore;
