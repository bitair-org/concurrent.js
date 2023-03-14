mkdir concurrent.js
cd concurrent.js
npm init -y
npm i @bitair/concurrent.js@latest extra-bigint
touch index.mjs

cat >./index.mjs <<EOF
import { concurrent } from '@bitair/concurrent.js'

// Import it as usual to see the difference.
// import { factorial } from 'extra-bigint'

const { factorial } = await concurrent.import('extra-bigint').load()

// This would indicate whether the main process is blocked or not while calculating the n factorial.
const progress = setInterval(() => process.stdout.write('⯀'), 100)

const n = 50_000n
const result = await factorial(n)
console.log('\nThere are %d digits in %d factorial.', BigInt(result).toString().length, n.toString())

clearInterval(progress)

await concurrent.terminate()
EOF

node index.mjs
