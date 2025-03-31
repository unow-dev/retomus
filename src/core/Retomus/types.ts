type RetomusCommandMap = {
   getMachine: (id: string) => any;
   getCtx: (id: string) => any;
};

type RetomusCommandHandler = (params) => void | any;


type RetomusEventMap = {
   machineIsReady: { machine: any };
   ctxIsReady: { ctx: any };
};

export { RetomusCommandMap, RetomusCommandHandler, RetomusEventMap };