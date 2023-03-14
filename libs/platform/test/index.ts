import { assert, expect } from 'chai'
import { cpus } from 'node:os'
import { ErrorMessage } from '../src/core/constants.js'
import type { ConcurrencyError } from '../src/core/error.js'
import { getProperties } from '../src/core/utils.js'

import { concurrent } from '../src/node/index.js'

import * as sampleServices from './sample_services/index.js'

const THREAD_INSTANTIATION_DELAY = 0.5
const NOT_RUNNING_ON_WORKER = 'Not running on a worker'
const SERVICES_SRC = new URL('../build/services/index.js', import.meta.url)

concurrent.config({
  maxThreads: 2
})

const services = await concurrent.import<typeof sampleServices>(SERVICES_SRC).load()

describe('Testing Node.js platform ', () => {
  before(async () => {
    process.env['BASE_URL'] = new URL('../build/', import.meta.url).href
  })

  after(async () => {
    await concurrent.terminate()
  })

  beforeEach(async () => {
    assert(await services.isWorker, NOT_RUNNING_ON_WORKER)
  })

  it('should not alter static members', async () => {
    expect(getProperties(services.isPrime)).deep.equal(getProperties(sampleServices.isPrime))
    expect(getProperties(services.SampleObject)).deep.equal(getProperties(sampleServices.SampleObject))
  })

  it('should not alter instance members', async () => {
    const obj = await new services.SampleObject()
    expect(await obj.isWorker).true
    expect(getProperties(obj)).deep.equal(getProperties(new sampleServices.SampleObject()))
  })

  it('should throw an exception when loading a non-function type export', async () => {
    let error
    try {
      await services.Math.isPrime(3)
    } catch (_error) {
      error = _error
    }
    expect((error as ConcurrencyError).code).equal(ErrorMessage.NotAccessibleExport.code)
  })

  it('should invoke an exported function', async () => {
    expect(await services.isPrime(3)).equal(true)
  })

  it('should instantiate an exported class', async () => {
    const obj = await new services.SampleObject()
    expect(await obj.isWorker).true
  })

  it('should instantiate an exported class with args', async () => {
    const obj = await new services.SampleObject([1])
    expect(await obj._data).deep.equal([1])
  })

  it('should access an instance field', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj._data).deep.equal([])
    await ((obj._data = [1]), obj._data)
    expect(await obj._data).deep.equal([1])
  })

  it('should access an instance getter/setter', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj.data).deep.equal([])
    await ((obj.data = [1]), obj.data)
    expect(await obj.data).deep.equal([1])
  })

  it('should access an instance method', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj.getData()).deep.equal([])
    await obj.setData([1])
    expect(await obj.getData()).deep.equal([1])
  })

  it('should access an inherited field', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj._baseData).deep.equal([])
    await ((obj._baseData = [1]), obj._baseData)
    expect(await obj._baseData).deep.equal([1])
  })

  it('should access an inherited getter/setter', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj.baseData).deep.equal([])
    await ((obj.baseData = [1]), obj.baseData)
    expect(await obj.baseData).deep.equal([1])
  })

  it('should access an inherited method', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj.getBaseData()).deep.equal([])
    await obj.setBaseData([1])
    expect(await obj.getBaseData()).deep.equal([1])
  })

  it('should access a static field', async () => {
    expect(await services.SampleObject._staticData).deep.equal(undefined)
    await ((services.SampleObject._staticData = [1]), services.SampleObject._staticData)
    expect(await services.SampleObject._staticData).deep.equal([1])
  })

  it('should access a static getter/setter', async () => {
    await ((services.SampleObject._staticData = [1]), services.SampleObject._staticData)
    expect(await services.SampleObject.staticData).deep.equal([1])
    await ((services.SampleObject.staticData = [2]), services.SampleObject.staticData)
    expect(await services.SampleObject.staticData).deep.equal([2])
  })

  it('should access a static method', async () => {
    await ((services.SampleObject._staticData = [1]), services.SampleObject._staticData)
    expect(await services.SampleObject.getStaticData()).deep.equal([1])
    await services.SampleObject.setStaticData([2])
    expect(await services.SampleObject.getStaticData()).deep.equal([2])
  })

  it('should access an async method', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj.getDataAsync()).deep.equal([])
    await obj.setDataAsync([1])
    expect(await obj.getDataAsync()).deep.equal([1])
  })

  it('should access an overridden method', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    await obj.setBaseData([1])
    expect(await obj.getBaseData()).deep.equal([1])
    expect(await obj.overridableGetBaseData()).deep.equal([])
  })

  it('should throw an exception when assigning a method', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    let error
    try {
      await ((obj.setData = () => undefined), obj.setData)
    } catch (_error) {
      error = _error
    }
    expect((error as ConcurrencyError).code).equal(ErrorMessage.MethodAssignment.code)
  })

  it('should throw an exception when accessing an undefined method', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    let error
    try {
      expect(await Reflect.get(obj, 'getData2')()).deep.equal([])
    } catch (_error) {
      error = _error
    }
    expect((error as Error) instanceof TypeError).true
  })

  it('should access an external module', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    const result = await obj.format('%s %s', 'hello', 'world')
    expect(result).equal('hello world')
  })

  it('should access a local module', async () => {
    const obj = await new services.SampleObject([])
    expect(await obj.isWorker).true

    expect(await obj.isPrime(3)).equal(true)
    expect(await obj.isPrime(4)).equal(false)
  })

  it('should run multiple functions in parallel', async () => {
    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      const services = await concurrent.import<typeof sampleServices>(SERVICES_SRC).load()

      ops.push(Promise.resolve(services.isPrime(i)))
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    expect((endTime - startTime) / 1000).lessThan(ops.length + cpus().length * THREAD_INSTANTIATION_DELAY)
  })

  it('should run multiple instance methods in parallel', async () => {
    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      const services = await concurrent.import<typeof sampleServices>(SERVICES_SRC).load()

      const obj = await new services.SampleObject()
      expect(await obj.isWorker).true

      ops.push(Promise.resolve(obj.isPrime(i)))
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    expect((endTime - startTime) / 1000).lessThan(ops.length + cpus().length * THREAD_INSTANTIATION_DELAY)
  })

  it('should bubble up an unhandled exception', async () => {
    let error
    try {
      await services.divide(1, 0)
    } catch (_error) {
      error = _error
    }
    expect((error as Error).message).equal('Division by zero')
  })

  it('should be disabled when the disabled flag is on', async () => {
    concurrent.config({ disabled: true })

    const services = await concurrent.import<typeof sampleServices>(SERVICES_SRC).load()
    const obj = await new services.SampleObject([1])

    expect(await obj.isWorker).false
    expect(await services.isWorker()).false

    concurrent.config({ disabled: false })
  })
})
