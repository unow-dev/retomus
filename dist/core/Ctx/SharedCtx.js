import { useState, useMemo, useEffect, useRef } from "react";
import Ctx from "./Ctx";
class SharedCtx extends Ctx {
    constructor(id, states, refs) {
        super(id, states, refs);
        this.flagBus = {
            isReady: false,
        };
    }
    // --- hooks ---
    // createHooks(): MachineHooks {
    //    const useMachineStatusIn = machine => () => {
    //       const [status, setStatus] = useState(machine.status);
    //       const unsubscribe = useMemo(
    //          () => machine.subscribeStatus(setStatus),
    //          [setStatus],
    //       );
    //       useEffect(() => {
    //          return unsubscribe;
    //       }, [unsubscribe]);
    //       return status;
    //    };
    //    const useMachineStateIn = machine => key => {
    //       const [state, setState] = useState(
    //          machine.ctx[machine.typeBus.ctx].getValue(key, 'states'),
    //       );
    //       const unsubscribe = useMemo(
    //          () =>
    //             machine.ctx[machine.typeBus.ctx].subscribeState(key, setState),
    //          [setState],
    //       );
    //       useEffect(() => {
    //          return unsubscribe;
    //       }, [unsubscribe]);
    //       return state;
    //    };
    //    const useMachineRefIn = machine => key => {
    //       const ref = useRef(
    //          machine.ctx[machine.typeBus.ctx].getValue(key, 'refs'),
    //       );
    //       return ref;
    //    };
    //    const useMachineActionIn = machine => key => {
    //       return (payload: any) => machine._executeAction(key, payload);
    //    };
    //    const useMachineFlagIn = machine => key => {
    //       const [flag, setFlag] = useState(machine.flagBus[key]);
    //       const unsubscribe = useMemo(
    //          () => machine._subscribeFlag(key, setFlag),
    //          [setFlag],
    //       );
    //       useEffect(() => {
    //          return unsubscribe;
    //       }, [unsubscribe]);
    //       return flag;
    //    };
    //    return {
    //       useStatus: useMachineStatusIn(this),
    //       useAction: useMachineActionIn(this),
    //       useState: useMachineStateIn(this),
    //       useRef: useMachineRefIn(this),
    //       useFlag: useMachineFlagIn(this),
    //    };
    // }
    createHooks() {
        const useCtxStateIn = ctx => (key) => {
            const [state, setState] = useState(ctx.getValue(key, 'states'));
            const unsubscribe = useMemo(() => ctx.subscribeState(key, setState), [setState]);
            useEffect(() => {
                return unsubscribe;
            }, [unsubscribe]);
            return state;
        };
        const useCtxRefIn = ctx => (key) => {
            const ref = useRef(ctx.getValue(key, 'refs'));
            return ref;
        };
        const useCtxFlagIn = ctx => (key) => {
            const [flag, setFlag] = useState(ctx.flagBus[key]);
            const unsubscribe = useMemo(() => ctx.subscribeFlag(key, setFlag), [setFlag]);
            useEffect(() => {
                return unsubscribe;
            }, [unsubscribe]);
            return flag;
        };
        return {
            useState: useCtxStateIn(this),
            useRef: useCtxRefIn(this),
            useFlag: useCtxFlagIn(this),
        };
    }
}
export default SharedCtx;
