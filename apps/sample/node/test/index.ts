import { concurrent } from '@bitair/concurrent.js'
import { expect } from 'chai'

import type * as MathModule from 'extra-bigint'
let Math: typeof MathModule

describe('Testing Node Sample', () => {
  before(async () => {
    Math = await concurrent.import<typeof MathModule>('extra-bigint').load()
  })

  after(async () => {
    await concurrent.terminate()
  })

  it('should invoke an exported function', async () => {
    const result = await Math.isPrime(5n)
    expect(result).to.be.equal(true)
  })
})
