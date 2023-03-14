import { concurrent } from '@bitair/concurrent.js'

import type * as ExtraBigIntModule from 'extra-bigint'

async function main() {
  const { factorial } = await concurrent.import<typeof ExtraBigIntModule>('extra-bigint').load()

  const progress = setInterval(() => process.stdout.write('⯀'), 100) // Using this to show that the main thread is not blocked

  const n = 50_000n
  const result = await factorial(n)
  console.log('\nThere are %d digits in %d factorial.', BigInt(result).toString().length, n.toString())

  clearInterval(progress)

  await concurrent.terminate()
}

main().finally()
