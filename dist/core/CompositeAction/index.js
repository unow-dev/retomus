const createCompositeActionApi = compositeAction => {
    const hooks = compositeAction.getHooks();
    return {
        use: hooks.use,
    };
};
export { createCompositeActionApi };
