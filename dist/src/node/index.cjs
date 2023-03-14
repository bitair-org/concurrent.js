"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// libs/platform/src/node/index.cts
var node_exports = {};
__export(node_exports, {
  concurrent: () => concurrent
});
module.exports = __toCommonJS(node_exports);

// libs/platform/src/node/worker.ts
var import_worker_threads = require("worker_threads");

// libs/platform/src/core/worker_base.ts
var WorkerBase = class {
  constructor(_worker) {
    this._worker = _worker;
  }
  messageHandler;
  errorHandler;
  postMessage(message) {
    this._worker.postMessage(message);
  }
  onmessage(handler) {
    this.messageHandler = handler;
  }
  onerror(handler) {
    this.errorHandler = handler;
  }
  terminate() {
    this._worker.terminate();
  }
};

// libs/platform/src/node/worker.ts
var NodeWorker = class extends WorkerBase {
  constructor(scriptSrc) {
    const worker = new import_worker_threads.Worker(scriptSrc);
    super(worker);
    worker.on("message", (message) => {
      if (this.messageHandler)
        this.messageHandler(message);
    });
    worker.on("error", (error) => {
      if (this.errorHandler)
        this.errorHandler(error);
    });
  }
};

// libs/platform/src/core/constants.ts
var TaskType = /* @__PURE__ */ ((TaskType2) => {
  TaskType2[TaskType2["InvokeFunction"] = 1] = "InvokeFunction";
  TaskType2[TaskType2["GetStaticProperty"] = 2] = "GetStaticProperty";
  TaskType2[TaskType2["SetStaticProperty"] = 3] = "SetStaticProperty";
  TaskType2[TaskType2["InvokeStaticMethod"] = 4] = "InvokeStaticMethod";
  TaskType2[TaskType2["InstantiateObject"] = 5] = "InstantiateObject";
  TaskType2[TaskType2["GetInstanceProperty"] = 6] = "GetInstanceProperty";
  TaskType2[TaskType2["SetInstanceProperty"] = 7] = "SetInstanceProperty";
  TaskType2[TaskType2["InvokeInstanceMethod"] = 8] = "InvokeInstanceMethod";
  TaskType2[TaskType2["DisposeObject"] = 9] = "DisposeObject";
  return TaskType2;
})(TaskType || {});
var ErrorMessage = {
  InternalError: { code: 500, text: "Internal error has occurred." },
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{0}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{0}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{0}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{0}'" },
  NotRunningOnWorker: { code: 506, text: "This module must be run on a worker." },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 508, text: "Thread allocation failed due to timeout." },
  MethodAssignment: { code: 509, text: "Can't assign a method." },
  NotAccessibleExport: { code: 510, text: "Can't access an export of type '%{0}'. Only top level functions and classes are imported." },
  ThreadPoolTerminated: { code: 511, text: "Thread pool has been terminated." },
  ThreadTerminated: { code: 512, text: "Thread has been terminated." }
};
var defaultThreadPoolSettings = {
  maxThreads: 1,
  minThreads: 0,
  threadIdleTimeout: Infinity
};
var defaultConcurrencySettings = Object.assign(
  {
    disabled: false
  },
  defaultThreadPoolSettings
);

// libs/platform/src/core/utils.ts
function isBoolean(val) {
  return typeof val === "boolean";
}
function isNumber(val) {
  return typeof val === "number";
}
function isString(val) {
  return typeof val === "string";
}
function isFunction(val) {
  return typeof val === "function";
}
function format(str, args) {
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`%{${i}}`, args[i]);
  }
  return str;
}
function getNumber(val) {
  val = isString(val) ? val.indexOf(".") !== -1 ? parseFloat(val) : parseInt(val) : val;
  return !isNumber(val) || Number.isNaN(val) ? void 0 : val;
}
function getBoolean(val) {
  return !isBoolean(val) ? void 0 : val;
}
function createObject(properties) {
  const obj = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const type = properties[key];
      const defaultValue = (() => {
        switch (type) {
          case 2:
            return false;
          case 3:
            return 0;
          case 4:
            return BigInt("0");
          case 5:
            return "";
          case 6:
            return Symbol();
          case 7:
            return new Function();
          case 8:
            return new Object();
          default:
            return void 0;
        }
      })();
      Reflect.set(obj, key, defaultValue);
    }
  }
  return obj;
}

// libs/platform/src/core/error.ts
var ConcurrencyError = class extends Error {
  code;
  constructor({ code, text }, ...params) {
    const message = format(`Concurrent.js Error: ${text}`, params);
    super(message);
    this.code = code;
  }
};

// libs/platform/src/core/task.ts
var Task = class {
  constructor(type, data) {
    this.type = type;
    this.data = data;
    if (!TaskType[type])
      throw new ConcurrencyError(ErrorMessage.InvalidTaskType, type);
  }
};

// libs/platform/src/core/threaded_function.ts
var ThreadedFunction = class {
  constructor(thread, moduleSrc, exportName) {
    this.thread = thread;
    this.moduleSrc = moduleSrc;
    this.exportName = exportName;
  }
  async invoke(args) {
    const task = new Task(1 /* InvokeFunction */, [this.moduleSrc, this.exportName, args]);
    const result = await this.thread.run(task);
    return result;
  }
  async getStaticProperty(propName) {
    const task = new Task(2 /* GetStaticProperty */, [
      this.moduleSrc,
      this.exportName,
      propName
    ]);
    const result = await this.thread.run(task);
    return result;
  }
  async setStaticProperty(propName, value) {
    const task = new Task(3 /* SetStaticProperty */, [
      this.moduleSrc,
      this.exportName,
      propName,
      value
    ]);
    const result = await this.thread.run(task);
    return result;
  }
  async invokeStaticMethod(methodName, args) {
    const task = new Task(4 /* InvokeStaticMethod */, [
      this.moduleSrc,
      this.exportName,
      methodName,
      args
    ]);
    const result = await this.thread.run(task);
    return result;
  }
};

// libs/platform/src/core/threaded_object.ts
var _ThreadedObject = class {
  constructor(thread, id, target) {
    this.thread = thread;
    this.id = id;
    this.target = target;
  }
  static async disposeObject(id, thread) {
    const task = new Task(9 /* DisposeObject */, [id]);
    await thread.run(task);
  }
  static async create(thread, moduleSrc, exportName, ctorArgs) {
    const task = new Task(5 /* InstantiateObject */, [moduleSrc, exportName, ctorArgs]);
    const [id, properties] = await thread.run(task);
    const obj = new _ThreadedObject(thread, id, createObject(properties));
    this.objectRegistry.register(obj, { id, threadRef: new WeakRef(thread) }, obj);
    return obj;
  }
  async getProperty(propName) {
    const task = new Task(6 /* GetInstanceProperty */, [this.id, propName]);
    const result = await this.thread.run(task);
    return result;
  }
  async setProperty(propName, value) {
    const task = new Task(7 /* SetInstanceProperty */, [this.id, propName, value]);
    const result = await this.thread.run(task);
    return result;
  }
  async invoke(methodName, args) {
    const task = new Task(8 /* InvokeInstanceMethod */, [this.id, methodName, args]);
    const result = await this.thread.run(task);
    return result;
  }
};
var ThreadedObject = _ThreadedObject;
__publicField(ThreadedObject, "objectRegistry", new FinalizationRegistry(({ id, threadRef }) => {
  const thread = threadRef.deref();
  if (thread)
    _ThreadedObject.disposeObject(id, thread).finally();
}));

// libs/platform/src/core/concurrent_module.ts
var ConcurrentModule = class {
  constructor(pool, src) {
    this.pool = pool;
    this.src = src;
  }
  async load() {
    const moduleSrc = this.src;
    const module2 = await import(this.src);
    const thread = await this.pool.getThread();
    const cache = {};
    return new Proxy(module2, {
      get(obj, key) {
        const _export = Reflect.get(obj, key);
        if (!Reflect.has(obj, key))
          return;
        else if (!isFunction(_export))
          throw new ConcurrencyError(ErrorMessage.NotAccessibleExport);
        else {
          if (!Reflect.has(cache, key))
            Reflect.set(cache, key, createThreadedFunction(thread, moduleSrc, _export));
          return Reflect.get(cache, key);
        }
      }
    });
  }
};
function createThreadedFunction(thread, moduleSrc, target) {
  const threadedFunction = new ThreadedFunction(thread, moduleSrc, target.name);
  return new Proxy(target, {
    get(target2, key) {
      const prop = Reflect.get(target2, key);
      if (!Reflect.has(target2, key))
        return;
      else if (prop instanceof AsyncSetter)
        return prop.wait();
      else if (!isFunction(prop))
        return threadedFunction.getStaticProperty(key);
      else
        return (...params) => threadedFunction.invokeStaticMethod(key, params);
    },
    set(target2, key, value) {
      const prop = Reflect.get(target2, key);
      if (!Reflect.has(target2, key))
        return false;
      else if (isFunction(prop))
        throw new ConcurrencyError(ErrorMessage.MethodAssignment);
      else {
        const setter = new AsyncSetter(
          () => threadedFunction.setStaticProperty(key, value).then(() => {
            Reflect.set(target2, key, void 0);
          })
        );
        Reflect.set(target2, key, setter);
        return true;
      }
    },
    construct(target2, args) {
      return createThreadedObject(thread, moduleSrc, target2.name, args);
    },
    apply(_target, _thisArg, args) {
      return threadedFunction.invoke(args);
    }
  });
}
async function createThreadedObject(thread, moduleSrc, exportName, args) {
  const threadedObject = await ThreadedObject.create(thread, moduleSrc, exportName, args);
  return new Proxy(threadedObject.target, {
    get(target, key) {
      const prop = Reflect.get(target, key);
      if (!Reflect.has(target, key))
        return;
      else if (prop instanceof AsyncSetter)
        return prop.wait();
      else if (isFunction(prop))
        return (...params) => threadedObject.invoke(key, params);
      else
        return threadedObject.getProperty(key);
    },
    set(target, key, value) {
      const prop = Reflect.get(target, key);
      if (!Reflect.has(target, key))
        return false;
      else if (isFunction(prop))
        throw new ConcurrencyError(ErrorMessage.MethodAssignment);
      else {
        const setter = new AsyncSetter(
          () => threadedObject.setProperty(key, value).then(() => {
            Reflect.set(target, key, void 0);
          })
        );
        Reflect.set(target, key, setter);
        return true;
      }
    }
  });
}
var AsyncSetter = class {
  constructor(setter) {
    this.setter = setter;
  }
  wait() {
    return this.setter();
  }
};

// libs/platform/src/core/coroutine.ts
var _Coroutine = class {
  constructor(id, callback) {
    this.id = id;
    this.callback = callback;
  }
  static create(callback) {
    this.lastCoroutineId += 1;
    return new _Coroutine(this.lastCoroutineId, callback);
  }
  done(error, result) {
    this.callback(error, result);
  }
};
var Coroutine = _Coroutine;
__publicField(Coroutine, "lastCoroutineId", 0);

// libs/platform/src/core/thread.ts
var Thread = class {
  constructor(workerFactory) {
    this.workerFactory = workerFactory;
    this.worker = workerFactory.create();
    this.initWorker();
  }
  coroutines = /* @__PURE__ */ new Map();
  worker;
  terminated = false;
  locked = false;
  refs = 0;
  async run(task) {
    if (this.terminated)
      throw new ConcurrencyError(ErrorMessage.ThreadTerminated);
    const result = new Promise((resolve, reject) => {
      const coroutine = Coroutine.create((error, result2) => {
        this.coroutines.delete(coroutine.id);
        if (error)
          reject(error);
        else
          resolve(result2);
      });
      const taskInfo = [coroutine.id, task.type, task.data];
      this.coroutines.set(coroutine.id, coroutine);
      const message = [1 /* RunTask */, taskInfo];
      this.postMessage(message);
    });
    return result;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async terminate(_force = false) {
    this.terminated = true;
    this.coroutines.clear();
    this.worker.terminate();
  }
  initWorker() {
    this.worker.onmessage((message) => {
      this.handleMessage(message);
    });
    this.worker.onerror((error) => {
      for (const coroutine of this.coroutines.values()) {
        coroutine.done(new ConcurrencyError(ErrorMessage.InternalError), void 0);
      }
      this.worker = this.workerFactory.create();
      throw error;
    });
  }
  postMessage(message) {
    this.worker.postMessage(message);
  }
  handleMessage([type, data]) {
    if (type === 2 /* ReadTaskResult */) {
      const [coroutineId, error, result] = data;
      const coroutine = this.coroutines.get(coroutineId);
      if (!coroutine)
        throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId);
      coroutine.done(error, result);
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type);
    }
  }
};

// libs/platform/src/core/thread_pool.ts
var ThreadPool = class {
  constructor(workerFactory, settings) {
    this.workerFactory = workerFactory;
    this.settings = settings;
    if (this.settings.minThreads) {
      for (let i = 0; i < this.settings.minThreads; i++) {
        this.addThread();
      }
    }
  }
  turn = 0;
  threads = [];
  terminated = false;
  config(settings) {
    Object.assign(this.settings, settings);
  }
  async getThread() {
    if (this.terminated)
      throw new ConcurrencyError(ErrorMessage.ThreadPoolTerminated);
    if (this.threads.length < this.settings.maxThreads)
      this.addThread();
    if (this.turn > this.threads.length - 1)
      this.turn = 0;
    const thread = this.threads[this.turn];
    this.turn += 1;
    return thread;
  }
  async terminate(force = false) {
    for (let i = 0; i < this.threads.length; i++) {
      const thread = this.threads[i];
      await thread.terminate(force);
    }
    this.threads = [];
    this.terminated = true;
  }
  addThread() {
    const thread = new Thread(this.workerFactory);
    this.threads.push(thread);
  }
};

// libs/platform/src/core/master.ts
var Master = class {
  constructor(workerFactory) {
    this.workerFactory = workerFactory;
    this.settings = defaultConcurrencySettings;
  }
  settings;
  pool;
  started = false;
  config(settings) {
    settings = settings ?? {};
    this.settings = {
      disabled: getBoolean(settings.disabled) ?? this.settings.disabled,
      maxThreads: getNumber(settings.maxThreads) || this.settings.maxThreads,
      minThreads: getNumber(settings.minThreads) ?? this.settings.minThreads,
      threadIdleTimeout: getNumber(settings.threadIdleTimeout) || this.settings.threadIdleTimeout
    };
    if (this.started)
      this.pool.config(this.settings);
  }
  import(moduleSrc) {
    if (!this.settings.disabled && !this.started)
      this.start();
    const module2 = this.settings.disabled ? {
      load: () => import(moduleSrc.toString())
    } : new ConcurrentModule(this.pool, moduleSrc.toString());
    return module2;
  }
  async terminate(force) {
    if (this.started) {
      await this.pool.terminate(!!force);
      this.pool = void 0;
      this.started = false;
    }
  }
  start() {
    this.pool = new ThreadPool(this.workerFactory, this.settings);
    this.started = true;
  }
};

// libs/platform/src/node/index.cts
var concurrent = new Master({
  create: () => {
    const BASE_URL = process.env["BASE_URL"];
    const src = new URL("./worker_script.js", new URL(BASE_URL || `file:${__filename}`));
    return new NodeWorker(src);
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  concurrent
});
