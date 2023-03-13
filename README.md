# Intro

At the highest level of its design, Concurrent.js is a module loader like `require` and `import`, but instead of loading a module into the main thread, it loads the module into a worker. It injects the concurrent behavior into the imported classes and functions so they can be used as usual. Concurrent.js works on Node.js, Deno, and web browsers.

Important notes

- This is a helper library not a new implementation of Web Workers.
- This is an early version of the library and must not be used in a real project.

# Features

- [x] Supporting Node.js
- [x] Supporting browser
- [x] Supporting Deno
- [x] Executing JavaScript (ECMAScript & CommonJS)
- [ ] Executing TypeScript
- [ ] Executing WebAssembly
- [x] Accessing exported functions
- [x] Accessing exported classes
  - [x] Instantiation
  - [x] Instance members
    - [x] Fields
    - [x] Getters and setters
    - [x] Methods
  - [x] Static members
    - [x] Fields
    - [x] Getters and setters
    - [x] Methods
- [x] Parallel execution
- [ ] Reactive concurrency
  - [ ] Inter-worker communication
  - [ ] Event sourcing
  - [ ] Data sharing
- [ ] Dependency injection
- [ ] Sandboxing
- [ ] Language interoperability (Server-side)
  - [ ] C
  - [ ] Rust
  - [ ] Python

# Technical facts

- Built upon web workers (a.k.a. worker threads).
- Creates a worker once and reuses it.
- Automatically cleans up a worker's memory.
- Automatically creates and terminates workers.
- Has no runtime dependency.
- Written in TypeScript with the strictest ESNext config.
- Strictly designed to support strongly-typed programming.
- Packaged as platform-specific bundles that target ES2020.

# Hello World!

Save and run the [hello world](./scripts/hello_world.sh) script to see it in action:

```bash
bash hello_world.sh
```

# Usage

```js
// load a module into a worker
const { SampleObject, sampleFunction } = await concurrent.module('sample-module').load()

// access a function
const result = await sampleFunction(/*...args*/) // call the function

// access a class
const obj = await new SampleObject(/*...args*/) // instantiate
const value = await obj.sampleProp // get a field or getter
await ((obj.sampleProp = 1), obj.sampleProp) // set a field or setter
const result = await obj.sampleMethod(/*...args*/) // call a method

// access static members of a class
const value = await SampleObject.sampleStaticProp // get a static field or getter
await ((SampleObject.sampleStaticProp = 1), SampleObject.sampleStaticProp) // set a static field or setter
const result = await SampleObject.sampleStaticMethod(/*...args*/) // call a static method

// terminate Concurrent.js
await concurrent.terminate()
```

## Sample

### Node.js (ECMAScript)

```bash
npm i @bitair/concurrent.js@latest
```

`index.js`

```js
import { concurrent } from '@bitair/concurrent.js'
const { factorial } = await concurrent.module('extra-bigint').load()
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`package.json`

```json
{
  "type": "module",
  "dependencies": {
    "@bitair/concurrent.js": "^0.5.13",
    "extra-bigint": "^1.1.10"
  }
}
```

```bash
node .
```

### Deno

`index.ts`

```js
import { concurrent } from 'https://deno.land/x/concurrentjs@v0.5.13/mod.ts'
const { factorial } = await concurrent.module(new URL('services/index.ts', import.meta.url)).load()
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`services/index.ts`

```js
export { factorial } from 'extra-bigint'
```

`deno.json`

```json
{
  "imports": {
    "extra-bigint": "npm:extra-bigint@^1.1.10"
  }
}
```

```bash
deno run --allow-read --allow-net index.ts
```

### Browser

```
.
├── src
    ├── services
        ├── index.js
    ├── app.js
    ├── worker_script.js
    .
├── static
    ├── index.html
.
```

`app.js`

```js
import { concurrent } from '@bitair/concurrent.js'
const { factorial } = await concurrent.module(new URL('services/index.js', import.meta.url)).load()
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`services/index.js`

```js
export { factorial } from 'extra-bigint'
```

`worker_script.js`

```js
import '@bitair/concurrent.js/worker_script'
```

`index.html`

```html
<!DOCTYPE html>
<html>
  <body>
    <script type="module" src="scripts/main.js"></script>
  </body>
</html>
```

`build.sh`

```bash
#!/bin/bash
npx esbuild src/app.js --bundle --format=esm --platform=browser --target=esnext --outfile=static/scripts/main.js
npx esbuild src/worker_script.js --bundle --format=esm --platform=browser --target=esnext --outfile=static/scripts/worker_script.js
npx esbuild src/services/index.js --bundle --format=esm --platform=browser --target=esnext --outfile=static/scripts/services/index.js
```

`package.json`

```json
{
  "type": "module",
  "dependencies": {
    "@bitair/concurrent.js": "^0.5.13",
    "http-server": "^14.1.1",
    "extra-bigint": "^1.1.10"
  },
  "devDependencies": {
    "esbuild": "^0.17.8"
  }
}
```

```bash
bash ./build.sh && npx http-server static
```

#### Base URL

Concurrent.js uses the `import.meta.url` property as the base URL to resolve the scripts. It's also possible to provide a custom base URL:

```bash
npx esbuild src/app.js --target=es6 --define:process.env.BASE_URL=\"http://127.0.0.1:8080/scripts/\" --bundle --format=esm --platform=browser --outfile=static/scripts/main.js
```

# Parallelism

```js
import { concurrent } from '@bitair/concurrent.js'

const extraBigint = concurrent.module('extra-bigint')

concurrent.config({ maxThreads: 16 }) // Instead of a hardcoded value use os.availableParallelism() in Node.js v19.4.0 or later

const ops = []
for (let i = 0; i <= 100; i++) {
  const { factorial } = await extraBigint.load()
  ops.push(factorial(i))
}

const results = await Promise.all(ops)
// ...rest of the code

await concurrent.terminate()
```

# API

```ts
concurrent.module<T>(moduleSrc: string | URL): IConcurrentModule<T>
```

Creates a concurrent module.

- `src: string`

  The path or URL of the module. Its value must be either an absolute path/URL or a package name.

```ts
IConcurrentModule<T>.load() : Promise<T>
```

Loads the module into a worker.

```ts
concurrent.config(settings: ConcurrencySettings): void
```

Configs the global settings of Concurrent.js.

- `settings: ConcurrencySettings`

  - `settings.disabled: boolean [default=false]`

    Setting it would disable Concurrent.js without the requirement to change any other code.

  - `settings.maxThreads: number [default=1]`

    The max number of available threads to be spawned.

  - `settings.threadIdleTimeout: number | typeof Infinity [default=Infinity]`

    Number of minutes that Concurrent.js would be waiting before terminating an idle thread.

  - `settings.minThreads: number [default=0]`

    The number of threads that must be created when Concurrent.js starts and also kept from being terminated when are idle.

```ts
concurrent.terminate(force?: boolean): Promise<void>
```

Terminates Concurrent.js.

- `force?: boolean [Not implemented]`

  Forces Concurrent.js to exit immediately without waiting for workers to finish their tasks.

# License

[MIT License](README.md)