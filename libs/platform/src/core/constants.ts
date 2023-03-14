import type { ThreadPoolSettings } from '../index.js'

export enum ThreadMessageType {
  RunTask = 1,
  ReadTaskResult
}

export enum TaskType {
  InvokeFunction = 1,
  GetStaticProperty,
  SetStaticProperty,
  InvokeStaticMethod,
  InstantiateObject,
  GetInstanceProperty,
  SetInstanceProperty,
  InvokeInstanceMethod,
  DisposeObject
}

export const ErrorMessage = {
  InternalError: { code: 500, text: 'Internal error has occurred.' },
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{0}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{0}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{0}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{0}'" },
  NotRunningOnWorker: { code: 506, text: 'This module must be run on a worker.' },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 508, text: 'Thread allocation failed due to timeout.' },
  MethodAssignment: { code: 509, text: "Can't assign a method." },
  NotAccessibleExport: { code: 510, text: "Can't access an export of type '%{0}'. Only top level functions and classes are imported." },
  ThreadPoolTerminated: { code: 511, text: 'Thread pool has been terminated.' },
  ThreadTerminated: { code: 512, text: 'Thread has been terminated.' }
}

export const ValueType = {
  undefined: 1,
  boolean: 2,
  number: 3,
  bigint: 4,
  string: 5,
  symbol: 6,
  function: 7,
  object: 8
}

export const defaultThreadPoolSettings: ThreadPoolSettings = {
  maxThreads: 1,
  minThreads: 0,
  threadIdleTimeout: Infinity
}

export const defaultConcurrencySettings = Object.assign(
  {
    disabled: false
  },
  defaultThreadPoolSettings
)
