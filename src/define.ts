/* eslint-disable @typescript-eslint/no-explicit-any */

import { type FnRecord, type ModuleDefinition, type VarRecord } from './types';

export function defineModule<
  V extends VarRecord<V>,
  F extends FnRecord<any, V>,
>(variables: V, functions?: F): ModuleDefinition<V, F> {
  return { variables, functions: functions || ({} as F) };
}
