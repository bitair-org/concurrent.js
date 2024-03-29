import { concurrent } from '@bitair/concurrent.js'

import type * as Services from './services/index.js'

const MAX_THREADS = 10
const VALUE = 50_000n

concurrent.config({
  maxThreads: MAX_THREADS
})

const bodyElm = document.querySelector('body') as HTMLBodyElement

const progress = setInterval(() => (bodyElm.innerHTML += '■'), 1000) // Using this to show that the main thread is not blocked
const start = performance.now()

const tasks = []
for (let i = 0; i < MAX_THREADS; i++) {
  const { factorial } = await concurrent.import<typeof Services>(new URL('./services/index.js', import.meta.url)).load()
  tasks.push(factorial(VALUE))
}
await Promise.all(tasks)

const end = performance.now()
clearInterval(progress)

const duration = Math.trunc(end - start) / 1000
bodyElm.innerHTML += ` ${duration}s`
console.log("Execution Time: %s", duration)


await concurrent.terminate()
