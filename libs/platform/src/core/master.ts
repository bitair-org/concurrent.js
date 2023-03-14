import { ConcurrentModule } from './concurrent_module.js'
import { ThreadPool } from './thread_pool.js'
import { getBoolean, getNumber } from './utils.js'

import type { ConcurrencySettings, IConcurrent, IConcurrentModule } from '../index.d.js'
import type { IWorkerFactory } from './types.js'
import { defaultConcurrencySettings } from './constants.js'

export class Master implements IConcurrent {
  private settings: ConcurrencySettings
  private pool?: ThreadPool | undefined
  private started = false

  constructor(private workerFactory: IWorkerFactory) {
    this.settings = defaultConcurrencySettings
  }

  config(settings: Partial<ConcurrencySettings>): void {
    settings = settings ?? {}
    this.settings = {
      disabled: getBoolean(settings.disabled) ?? this.settings.disabled,
      maxThreads: getNumber(settings.maxThreads) || this.settings.maxThreads,
      minThreads: getNumber(settings.minThreads) ?? this.settings.minThreads,
      threadIdleTimeout: getNumber(settings.threadIdleTimeout) || this.settings.threadIdleTimeout
    }
    if (this.started) (this.pool as ThreadPool).config(this.settings)
  }

  import<T>(moduleSrc: string | URL): IConcurrentModule<T> {
    if (!this.settings.disabled && !this.started) this.start()

    const module = this.settings.disabled
      ? {
          load: () => import(moduleSrc.toString())
        }
      : new ConcurrentModule<T>(this.pool as ThreadPool, moduleSrc.toString())

    return module
  }

  async terminate(force?: boolean) {
    if (this.started) {
      await (this.pool as ThreadPool).terminate(!!force)
      this.pool = undefined
      this.started = false
    }
  }

  private start() {
    this.pool = new ThreadPool(this.workerFactory, this.settings)
    this.started = true
  }
}
