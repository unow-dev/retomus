import Ctx from "./Ctx";
declare class SharedCtx extends Ctx {
    flagBus: Record<string, boolean>;
    constructor(id: string, states: Record<string, any>, refs: Record<string, any>);
    createHooks(): {
        useState: (key: string) => any;
        useRef: (key: string) => import("react").MutableRefObject<any>;
        useFlag: (key: string) => any;
    };
}
export default SharedCtx;
