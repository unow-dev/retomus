import { useCallback } from 'react';
import { createRetomus, createMachineConfig } from '../../../../dist/index.mjs';

const retomus = createRetomus();

const actionLoggerMachine = retomus.createMachine(
  createMachineConfig({
    id: 'actionLogger',
    status: ['idle'],
    actions: ['logAction', 'clearLogs'],
    transitions: {
      idle: {
        logAction: 'idle',
        clearLogs: 'idle',
      },
    },
    actionHandlers: {
      logAction: ({ ctx, payload, done }) => {
        console.log('Action:', payload.action, ctx.ref.logs);
        ctx.ref.logs.push({
          action: payload.action,
          timestamp: Date.now(),
        });
        done({});
      },
      clearLogs: ({ ctx, done }) => {
        ctx.ref.logs = [];
        done({});
      },
    },
    initialStatus: { status: 'idle' },
    ctx: {
      ref: {
        logs: [], // ← 非リアクティブな履歴
      },
    },
  }),
);

export const ActionLogger = () => {
  const logAction = actionLoggerMachine.useAction('logAction');
  const clearLogs = actionLoggerMachine.useAction('clearLogs');
  const logsRef = actionLoggerMachine.useRef('logs');
  const isReady = actionLoggerMachine.useFlag('isReady');

  const handleClick = (actionName: string) => {
    logAction({ action: actionName });
  };

  const handleConsoleLogs = useCallback(() => {
    if (isReady === false) return;
    console.log('Action Logs:', logsRef?.current);
  }, [isReady, logsRef]);

  return (
    <div>
      <h2>Action Logger</h2>

      <button onClick={() => handleClick('clickA')}>Button A</button>
      <button onClick={() => handleClick('clickB')}>Button B</button>
      <button onClick={() => clearLogs({})}>Clear Logs</button>
      <button onClick={handleConsoleLogs}>Console Logs</button>

      <h3>Logs:</h3>
      <ul>
        {logsRef?.current.map((log, index) => (
          <li key={index}>
            {log.action} - {new Date(log.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActionLogger;
