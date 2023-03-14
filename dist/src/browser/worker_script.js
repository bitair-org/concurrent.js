var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
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
var ValueType = {
  undefined: 1,
  boolean: 2,
  number: 3,
  bigint: 4,
  string: 5,
  symbol: 6,
  function: 7,
  object: 8
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
function isSymbol(val) {
  return typeof val === "symbol";
}
function format(str, args) {
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`%{${i}}`, args[i]);
  }
  return str;
}
function getProperties(obj) {
  const map = {};
  while (obj) {
    const keys = Reflect.ownKeys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!isSymbol(key)) {
        if (!map[key]) {
          const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
          map[key] = Reflect.get(ValueType, typeof descriptor?.value);
        }
      }
    }
    obj = Reflect.getPrototypeOf(obj);
  }
  return map;
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

// libs/platform/src/core/worker_manager.ts
var WorkerManager = class {
  objects = /* @__PURE__ */ new Map();
  lastObjectId = 0;
  async handleMessage(type, data) {
    if (type == 1 /* RunTask */) {
      const [coroutineId, taskType, taskData] = data;
      let message;
      try {
        let error, result;
        switch (taskType) {
          case 1 /* InvokeFunction */:
            ;
            [error, result] = await this.invokeFunction(...taskData);
            break;
          case 2 /* GetStaticProperty */:
            ;
            [error, result] = await this.getStaticProperty(...taskData);
            break;
          case 3 /* SetStaticProperty */:
            ;
            [error, result] = await this.setStaticProperty(...taskData);
            break;
          case 4 /* InvokeStaticMethod */:
            ;
            [error, result] = await this.invokeStaticMethod(...taskData);
            break;
          case 5 /* InstantiateObject */:
            ;
            [error, result] = await this.instantiateObject(...taskData);
            break;
          case 6 /* GetInstanceProperty */:
            ;
            [error, result] = await this.getInstanceProperty(...taskData);
            break;
          case 7 /* SetInstanceProperty */:
            ;
            [error, result] = await this.setInstanceProperty(...taskData);
            break;
          case 8 /* InvokeInstanceMethod */:
            ;
            [error, result] = await this.invokeInstanceMethod(...taskData);
            break;
          case 9 /* DisposeObject */:
            ;
            [error, result] = this.disposeObject(...taskData);
            break;
          default:
            throw new ConcurrencyError(ErrorMessage.InvalidTaskType, taskType);
        }
        message = [2 /* ReadTaskResult */, [coroutineId, error, result]];
      } catch (error) {
        message = [
          2 /* ReadTaskResult */,
          [
            coroutineId,
            { message: error.message, code: error.code },
            void 0
          ]
        ];
      }
      return message;
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type);
    }
  }
  async invokeFunction(moduleSrc, functionName, args = []) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const method = Reflect.get(module, functionName);
      result = await method.apply(module.exports, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async getStaticProperty(moduleSrc, exportName, propName) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const _export = Reflect.get(module, exportName);
      result = Reflect.get(_export, propName);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async setStaticProperty(moduleSrc, exportName, propName, value) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const _export = Reflect.get(module, exportName);
      result = Reflect.set(_export, propName, value);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async invokeStaticMethod(moduleSrc, exportName, methodName, args = []) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const _export = Reflect.get(module, exportName);
      const method = Reflect.get(_export, methodName);
      result = await Reflect.apply(method, _export, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async instantiateObject(moduleSrc, exportName, args = []) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const ctor = Reflect.get(module, exportName);
      const obj = Reflect.construct(ctor, args);
      this.lastObjectId += 1;
      this.objects.set(this.lastObjectId, obj);
      result = [this.lastObjectId, getProperties(obj)];
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async getInstanceProperty(objectId, propName) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      result = Reflect.get(obj, propName);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async setInstanceProperty(objectId, propName, value) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      result = Reflect.set(obj, propName, value);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async invokeInstanceMethod(objectId, methodName, args = []) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      const method = Reflect.get(obj, methodName);
      result = await Reflect.apply(method, obj, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  disposeObject(objectId) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let error;
    try {
      this.objects.delete(objectId);
    } catch (err) {
      error = err;
    }
    return [error, void 0];
  }
};

// libs/platform/src/browser/worker_script.ts
if (void 0)
  throw new ConcurrencyError2(Constants.ErrorMessage.NotRunningOnWorker);
var manager = new WorkerManager();
onmessage = function(e) {
  const [type, data] = e.data;
  manager.handleMessage(type, data).then((reply) => {
    postMessage(reply);
  });
};
