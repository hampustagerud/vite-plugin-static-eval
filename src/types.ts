/* eslint-disable @typescript-eslint/no-explicit-any */

type ValidFn<V, A extends any[], R> = (vars: V, ...args: A) => R;

type NonFunctionSymbol<T> = T extends ((...args: any[]) => any) | symbol
  ? never
  : T;

type RemoveNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
} extends infer X
  ? X
  : never;

export type VarRecord<T> = {
  [K in keyof T]: NonFunctionSymbol<T[K]>;
};

export type FnRecord<T, V extends VarRecord<any>> = {
  [K in keyof T]: ValidFn<RemoveNever<V>, any, any>;
};

export interface ModuleDefinition<
  V extends VarRecord<V>,
  F extends FnRecord<any, V>,
> {
  variables: V;
  functions: F;
}
