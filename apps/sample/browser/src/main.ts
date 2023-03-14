import { concurrent } from '@bitair/concurrent.js'

import type * as Services from './services/index.js'

const main = async () => {
  const { factorial } = await concurrent.import<typeof Services>('./services/index.js').load()

  const progress = setInterval(() => console.log('⯀'), 100) // Using this to show that the main thread is not blocked

  const n = 50_000n
  const result = await factorial(n)
  console.log('\nThere are %d digits in %d factorial.', BigInt(result).toString().length, n.toString())

  clearInterval(progress)

  await concurrent.terminate()
}

main().finally()
