import { ValueType } from './constants.js'

import type { Dict } from './types.js'

export function sleep(seconds: number | undefined = 0) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearInterval(timer)
      resolve(true)
    }, seconds * 1000)
  })
}

export function isBoolean(val: unknown) {
  return typeof val === 'boolean'
}

export function isNumber(val: unknown) {
  return typeof val === 'number'
}

export function isString(val: unknown) {
  return typeof val === 'string'
}

export function isSymbol(val: unknown) {
  return typeof val === 'symbol'
}

export function isFunction(val: unknown) {
  return typeof val === 'function'
}

export function isObject(val: unknown) {
  return typeof val === 'object'
}

export function format(str: string, args: unknown[]) {
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`%{${i}}`, args[i] as string)
  }
  return str
}

export function getNumber(val: unknown): number | undefined {
  val = isString(val)
    ? (val as string).indexOf('.') !== -1
      ? parseFloat(val as string)
      : parseInt(val as string)
    : val

  return !isNumber(val) || Number.isNaN(val) ? undefined : (val as number)
}

export function getBoolean(val: unknown): boolean | undefined {
  return !isBoolean(val) ? undefined : (val as boolean)
}

export function getProperties(obj: unknown) {
  const map: Dict<number> = {}

  while (obj) {
    const keys = Reflect.ownKeys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as never
      if (!isSymbol(key)) {
        if (!map[key]) {
          const descriptor = Reflect.getOwnPropertyDescriptor(obj, key) as PropertyDescriptor
          map[key] = Reflect.get(ValueType, typeof descriptor?.value)
        }
      }
    }
    obj = Reflect.getPrototypeOf(obj)
  }

  return map
}

export function createObject(properties: Dict<number>) {
  const obj: object = {}

  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const type = properties[key] as number
      const defaultValue = (() => {
        switch (type) {
          case 2:
            return false
          case 3:
            return 0
          case 4:
            return BigInt('0')
          case 5:
            return ''
          case 6:
            return Symbol()
          case 7:
            return new Function()
          case 8:
            return new Object()
          default:
            return undefined
        }
      })()

      Reflect.set(obj, key, defaultValue)
    }
  }

  return obj
}
