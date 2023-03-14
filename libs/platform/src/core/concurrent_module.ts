import { ErrorMessage } from './constants.js'
import { ConcurrencyError } from './error.js'
import { ThreadedFunction } from './threaded_function.js'
import { ThreadedObject } from './threaded_object.js'
import { isFunction } from './utils.js'

import type { IConcurrentModule } from '../index.js'
import type { ThreadPool } from './thread_pool.js'
import type { Thread } from './thread.js'

export class ConcurrentModule<T> implements IConcurrentModule<T> {
  constructor(private pool: ThreadPool, private src: string) {}

  async load(): Promise<T> {
    const moduleSrc = this.src
    const module = await import(this.src)
    const thread = await this.pool.getThread()

    const cache = {}
    return new Proxy(module, {
      get(obj, key) {
        const _export = Reflect.get(obj, key)

        if (!Reflect.has(obj, key)) return
        else if (!isFunction(_export)) throw new ConcurrencyError(ErrorMessage.NotAccessibleExport)
        else {
          if (!Reflect.has(cache, key)) Reflect.set(cache, key, createThreadedFunction(thread, moduleSrc, _export))
          return Reflect.get(cache, key)
        }
      }
    })
  }
}

function createThreadedFunction(
  thread: Thread,
  moduleSrc: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Function
) {
  const threadedFunction = new ThreadedFunction(thread, moduleSrc, target.name)

  return new Proxy(target, {
    get(target, key) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return
      else if (prop instanceof AsyncSetter) return prop.wait()
      else if (!isFunction(prop)) return threadedFunction.getStaticProperty(key as string)
      else return (...params: unknown[]) => threadedFunction.invokeStaticMethod(key as string, params)
    },

    set(target, key, value) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return false
      else if (isFunction(prop)) throw new ConcurrencyError(ErrorMessage.MethodAssignment)
      else {
        const setter = new AsyncSetter(() =>
          threadedFunction.setStaticProperty(key as string, value).then(() => {
            Reflect.set(target, key, undefined)
          })
        )

        Reflect.set(target, key, setter)
        return true
      }
    },

    construct(target, args) {
      return createThreadedObject(thread, moduleSrc, target.name, args)
    },

    apply(_target, _thisArg, args) {
      return threadedFunction.invoke(args)
    }
  })
}

async function createThreadedObject(thread: Thread, moduleSrc: string, exportName: string, args: unknown[]) {
  const threadedObject = await ThreadedObject.create(thread, moduleSrc, exportName, args)

  return new Proxy(threadedObject.target, {
    get(target, key) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return
      else if (prop instanceof AsyncSetter) return prop.wait()
      else if (isFunction(prop)) return (...params: unknown[]) => threadedObject.invoke(key as string, params)
      else return threadedObject.getProperty(key as string)
    },

    set(target, key, value) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return false
      else if (isFunction(prop)) throw new ConcurrencyError(ErrorMessage.MethodAssignment)
      else {
        const setter = new AsyncSetter(() =>
          threadedObject.setProperty(key as string, value).then(() => {
            Reflect.set(target, key, undefined)
          })
        )
        Reflect.set(target, key, setter)

        return true
      }
    }
  })
}

class AsyncSetter {
  constructor(private setter: () => Promise<void>) {}

  wait() {
    return this.setter()
  }
}
