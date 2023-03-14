import { expect } from 'chai'

import * as Utils from '../../src/core/utils.js'
import { SampleObject } from '../sample_services/index.js'

import { ValueType } from '../../src/core/constants.js'
import { createSampleValueDict } from './common/helpers.js'

const SAMPLE_VALUES = createSampleValueDict()

describe('Testing Utils', () => {
  it('isBoolean', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('boolean')) expect(Utils.isBoolean(value)).true
        else expect(Utils.isBoolean(value)).false
      }
    }
  })

  it('isNumber', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('number') || key === 'NaN' || key === 'Infinity') expect(Utils.isNumber(value)).true
        else expect(Utils.isNumber(value)).false
      }
    }
  })

  it('isString', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('string')) expect(Utils.isString(value)).true
        else expect(Utils.isString(value)).false
      }
    }
  })

  it('isSymbol', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('symbol')) expect(Utils.isSymbol(value)).true
        else expect(Utils.isSymbol(value)).false
      }
    }
  })

  it('isObject', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key === 'object' || key === 'null') expect(Utils.isObject(value)).true
        else expect(Utils.isObject(value)).false
      }
    }
  })

  it('isFunction', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('function')) expect(Utils.isFunction(value)).true
        else expect(Utils.isFunction(value)).false
      }
    }
  })

  it('format', () => {
    let text = 'An error occurred when calling %{0}(%{1}, %{2}).'
    expect(Utils.format(text, ['add', 1, 2])).equal('An error occurred when calling add(1, 2).')
    text = 'An error occurred.'
    expect(Utils.format(text, [])).equal('An error occurred.')
  })

  it('getNumber', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('number') || key === 'Infinity') expect(Utils.getNumber(value)).equal(value)
        else if (key.startsWith('stringNumber')) expect(Utils.getNumber(value)).equal(parseFloat(value as string))
        else expect(Utils.getNumber(value)).equal(undefined)
      }
    }
  })

  it('getBoolean', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('boolean')) expect(Utils.getBoolean(value)).equal(value)
        else expect(Utils.getBoolean(value)).equal(undefined)
      }
    }
  })

  it('getProperties', () => {
    expect(Utils.getProperties(new SampleObject())).deep.equal({
      _baseData: ValueType.undefined,
      baseData: ValueType.undefined,
      setBaseData: ValueType.function,
      getBaseData: ValueType.function,
      overridableGetBaseData: ValueType.function,
      setBaseDataAsync: ValueType.function,
      getBaseDataAsync: ValueType.function,
      isWorker: ValueType.boolean,
      _data: ValueType.undefined,
      data: ValueType.undefined,
      setData: ValueType.function,
      getData: ValueType.function,
      setDataAsync: ValueType.function,
      getDataAsync: ValueType.function,
      isPrime: ValueType.function,
      format: ValueType.function
    })
  })

  it('createObject', () => {
    const properties = Utils.getProperties(SAMPLE_VALUES)
    expect(Utils.getProperties(Utils.createObject(properties))).deep.equal(properties)
  })
})
