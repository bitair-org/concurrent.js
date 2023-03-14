declare const concurrent: IConcurrent
export { concurrent }

export declare interface IConcurrent {
  config(settings: Partial<ConcurrencySettings>): void
  import<T>(moduleSrc: string | URL): IConcurrentModule<T>
  terminate(force?: boolean): Promise<void>
}

export declare type ConcurrencySettings = {
  disabled: boolean
} & ThreadPoolSettings

export declare type ThreadPoolSettings = {
  maxThreads: number
  minThreads: number
  threadIdleTimeout: number | typeof Infinity
}

export declare interface IConcurrentModule<T> {
  load: () => Promise<T>
}
