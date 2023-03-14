import { concurrent } from '../../../../mod.ts'

const { factorial } = await concurrent.import(new URL('./services/index.ts', import.meta.url)).load()

const progress = setInterval(() => console.log('⯀'), 100)

const n = 50_000n
const result = await factorial(n)
console.log('\nThere are %d digits in %d factorial.', BigInt(result).toString().length, n.toString())

clearInterval(progress)

await concurrent.terminate()
