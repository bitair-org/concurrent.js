// libs/platform/src/core/constants.ts
var ErrorMessage = {
  InternalError: { code: 500, text: "Internal error has occurred." },
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{1}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{1}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{1}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{1}'" },
  NotRunningOnWorker: { code: 506, text: "This module must be run on a worker." },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 509, text: "Thread allocation failed due to timeout." }
};
var SYMBOL = {
  DISPOSE: Symbol("DISPOSE")
};

// libs/platform/src/core/utils.ts
function isFunction(val) {
  return typeof val === "function";
}
function isSymbol(val) {
  return typeof val === "symbol";
}
function format(str, args) {
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`%{${i + 1}}`, args[i]);
  }
  return str;
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
          case 1 /* InstantiateObject */:
            ;
            [error, result] = await this.instantiateObject(...taskData);
            break;
          case 2 /* GetInstanceProperty */:
            ;
            [error, result] = await this.getInstanceProperty(...taskData);
            break;
          case 3 /* SetInstanceProperty */:
            ;
            [error, result] = await this.setInstanceProperty(...taskData);
            break;
          case 4 /* InvokeInstanceMethod */:
            ;
            [error, result] = await this.invokeInstanceMethod(...taskData);
            break;
          case 5 /* DisposeObject */:
            ;
            [error, result] = this.disposeObject(...taskData);
            break;
          case 6 /* InvokeFunction */:
            ;
            [error, result] = await this.invokeFunction(...taskData);
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
  async instantiateObject(moduleSrc, exportName, ctorArgs = []) {
    const module = await import(moduleSrc);
    const ctor = module[exportName];
    const obj = new ctor(...ctorArgs);
    this.lastObjectId += 1;
    this.objects.set(this.lastObjectId, obj);
    const result = [this.lastObjectId, getPropertyTypeMap(obj)];
    return [void 0, result];
  }
  async getInstanceProperty(objectId, name) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      result = Reflect.get(obj, name);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async setInstanceProperty(objectId, name, value) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      result = Reflect.set(obj, name, value);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async invokeInstanceMethod(objectId, name, args = []) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      const method = Reflect.get(obj, name);
      result = await method.apply(obj, args);
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
  async invokeFunction(moduleSrc, functionName, args = []) {
    const module = await import(moduleSrc);
    let result, error;
    try {
      const method = Reflect.get(module, functionName);
      result = await method.apply(module.exports, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
};
function getPropertyTypeMap(obj) {
  const map = {};
  while (obj) {
    const keys = Reflect.ownKeys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!isSymbol(key)) {
        if (!map[key]) {
          const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
          map[key] = isFunction(descriptor.value) ? 1 /* Function */ : 2 /* Any */;
        }
      }
    }
    obj = Reflect.getPrototypeOf(obj);
  }
  return map;
}

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
