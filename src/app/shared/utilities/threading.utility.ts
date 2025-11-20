export abstract class ThreadingUtility {
    private static readonly MINIMUM_DELAY_FOR_LOADING_ANIMATION_IN_MS = 500;

    public static delay(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    public static async delayForLoadingAnimation<T>(
        promise: Promise<T>
    ): Promise<T> {
        const res = await Promise.all([
            ThreadingUtility.delay(
                ThreadingUtility.MINIMUM_DELAY_FOR_LOADING_ANIMATION_IN_MS
            ),
            promise,
        ]);

        return res[1];
    }

    public static async tryExecute<T>(
        func: () => Promise<T>
    ): Promise<boolean> {
        try {
            await func();

            return true;
        } catch (err) {
            return false;
        }
    }

    public static async tryExecuteAndCatch<T>(
        func: () => Promise<T>,
        catchFunc: (err: Error) => void
    ): Promise<boolean> {
        try {
            await func();

            return true;
        } catch (err: unknown) {
            catchFunc(err as Error);

            return false;
        }
    }
}
