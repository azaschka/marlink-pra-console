export type ModelModifier<T, R> = Omit<T, keyof R> & R;
