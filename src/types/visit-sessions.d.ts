export { };

declare global {
    // Shared in-process store used by record-visit streaming routes
    // Holds partial + final transcripts, plus optional runtime handles.
    // eslint-disable-next-line no-var
    var __visitSessions:
        | Map<
            string,
            {
                final: string;
                interim: string;
                transcriber?: unknown;
                recording?: unknown;
            }
        >
        | undefined;
}
