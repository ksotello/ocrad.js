var OCRAD = (function(){
	
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 16608;
var _stdout;
var _stdout=_stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });
var ___fsmu8;
var ___dso_handle;
var ___dso_handle=___dso_handle=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,48,48,0,0,250,0,0,0,148,0,0,0,66,0,0,0,152,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,64,48,0,0,250,0,0,0,244,0,0,0,66,0,0,0,152,0,0,0,8,0,0,0,18,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var __ZN10Page_imageC1EP8_IO_FILEb;
var __ZN10Page_imageC1ERK12OCRAD_Pixmapb;
var __ZN9RectangleC1Eiiii;
var __ZN8TextpageC1ERK10Page_imagePKcRK7Controlb;
var __ZN8TextpageD1Ev;
var __ZN6BitmapC1Eiiii;
var __ZN6BitmapC1ERKS_RK9Rectangle;
var __ZN4BlobC1ERKS_;
var __ZN4BlobD1Ev;
var __ZN9TextblockC1ERK9RectangleS2_RNSt3__16vectorIP4BlobNS3_9allocatorIS6_EEEE;
var __ZN9TextblockD1Ev;
var __ZN9CharacterC1ERKS_;
var __ZN9CharacterD1Ev;
var __ZN8TextlineD1Ev;
var __ZN7ProfileC1ERK6BitmapNS_4TypeE;
var __ZN8FeaturesC1ERK4Blob;
var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
var __ZNSt9bad_allocD1Ev;
/* memory initializer */ allocate([0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117,74,117,108,0,0,0,0,0,108,105,110,101,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,74,117,110,0,0,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,122,111,110,101,32,37,100,32,111,102,32,37,100,10,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,103,117,101,115,115,32,39,37,115,39,44,32,99,111,110,102,105,100,101,110,99,101,32,37,100,32,32,32,32,0,0,0,79,99,116,111,98,101,114,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,105,109,97,103,101,32,116,111,111,32,115,109,97,108,108,46,32,77,105,110,105,109,117,109,32,115,105,122,101,32,105,115,32,51,120,51,46,0,0,0,65,117,103,117,115,116,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,116,111,116,97,108,32,98,108,111,98,115,32,105,110,32,112,97,103,101,32,37,100,10,10,0,0,0,0,0,0,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,103,117,101,115,115,32,39,37,99,39,44,32,99,111,110,102,105,100,101,110,99,101,32,37,100,32,32,32,32,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,122,101,114,111,32,104,101,105,103,104,116,32,105,110,32,112,110,109,32,102,105,108,101,46,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,100,101,108,101,116,101,95,104,111,108,101,44,32,108,111,115,116,32,104,111,108,101,46,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,104,111,108,101,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,116,111,116,97,108,32,122,111,110,101,115,32,105,110,32,112,97,103,101,32,37,100,10,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,119,105,100,116,104,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,37,100,32,103,117,101,115,115,101,115,32,32,32,32,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,122,101,114,111,32,119,105,100,116,104,32,105,110,32,112,110,109,32,102,105,108,101,46,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,106,111,105,110,95,104,111,108,101,115,44,32,108,111,115,116,32,104,111,108,101,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,98,97,100,32,112,97,114,97,109,101,116,101,114,32,98,117,105,108,100,105,110,103,32,97,32,66,105,116,109,97,112,32,102,114,111,109,32,112,97,114,116,32,111,102,32,97,110,111,116,104,101,114,32,111,110,101,0,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,104,101,105,103,104,116,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,0,0,0,0,0,101,120,116,101,110,100,95,114,105,103,104,116,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,86,114,104,111,109,98,111,105,100,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,95,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,98,97,100,32,109,97,103,105,99,32,110,117,109,98,101,114,32,45,32,110,111,116,32,97,32,112,98,109,44,32,112,103,109,32,111,114,32,112,112,109,32,102,105,108,101,46,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,109,97,120,118,97,108,32,62,32,50,53,53,32,105,110,32,112,112,109,32,34,80,54,34,32,102,105,108,101,46,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,80,77,0,0,0,0,0,0,65,77,0,0,0,0,0,0,98,111,116,116,111,109,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,0,0,0,0,0,101,120,116,101,110,100,95,108,101,102,116,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,86,114,104,111,109,98,111,105,100,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,109,101,97,110,32,104,101,105,103,104,116,32,61,32,37,100,44,32,116,114,97,99,107,32,115,101,103,109,101,110,116,115,32,61,32,37,100,10,0,0,103,117,101,115,115,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,48,46,50,51,45,112,114,101,49,0,0,0,0,0,0,0,118,97,108,117,101,32,62,32,109,97,120,118,97,108,32,105,110,32,112,112,109,32,102,105,108,101,46,0,0,0,0,0,102,105,108,108,95,104,111,108,101,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,110,117,109,98,101,114,32,111,102,32,116,101,120,116,32,98,108,111,99,107,115,32,61,32,37,100,10,0,0,0,0,0,114,105,103,104,116,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,0,0,0,0,0,0,115,119,97,112,95,103,117,101,115,115,101,115,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,122,101,114,111,32,109,97,120,118,97,108,32,105,110,32,112,103,109,32,102,105,108,101,46,0,0,0,0,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,122,101,114,111,32,109,97,120,118,97,108,32,105,110,32,112,112,109,32,102,105,108,101,46,0,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,116,111,112,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,105,110,115,101,114,116,95,115,112,97,99,101,44,32,116,114,97,99,107,32,110,111,116,32,115,101,116,32,121,101,116,0,37,100,32,99,104,97,114,97,99,116,101,114,115,32,105,110,32,108,105,110,101,32,37,100,10,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,111,99,114,97,100,58,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,37,115,46,10,0,0,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,32,46,0,0,0,0,0,0,37,112,0,0,0,0,0,0,102,97,108,115,101,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,109,97,120,118,97,108,32,62,32,50,53,53,32,105,110,32,112,103,109,32,34,80,53,34,32,102,105,108,101,46,0,0,116,114,117,101,0,0,0,0,108,32,61,32,37,100,44,32,116,32,61,32,37,100,44,32,114,32,61,32,37,100,44,32,98,32,61,32,37,100,10,0,10,10,0,0,0,0,0,0,58,32,0,0,0,0,0,0,106,117,110,107,32,105,110,32,112,98,109,32,102,105,108,101,32,119,104,101,114,101,32,98,105,116,115,32,115,104,111,117,108,100,32,98,101,46,0,0,32,32,104,50,46,98,111,116,116,111,109,40,37,100,41,0,101,110,100,45,111,102,45,102,105,108,101,32,114,101,97,100,105,110,103,32,112,110,109,32,102,105,108,101,46,0,0,0,108,101,102,116,44,32,98,97,100,32,112,97,114,97,109,101,116,101,114,32,114,101,115,105,122,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,0,0,0,0,0,0,0,32,32,104,50,46,116,111,112,40,37,100,41,0,0,0,0,110,117,109,98,101,114,32,116,111,111,32,98,105,103,32,105,110,32,112,110,109,32,102,105,108,101,46,0,0,0,0,0,105,110,115,101,114,116,95,115,112,97,99,101,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,105,110,115,101,114,116,95,103,117,101,115,115,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,32,32,104,49,46,98,111,116,116,111,109,40,37,100,41,0,37,100,32,108,105,110,101,115,10,10,0,0,0,0,0,0,106,117,110,107,32,105,110,32,112,110,109,32,102,105,108,101,32,119,104,101,114,101,32,97,110,32,105,110,116,101,103,101,114,32,115,104,111,117,108,100,32,98,101,46,0,0,0,0,108,32,61,32,37,100,44,32,108,99,32,61,32,37,100,44,32,114,32,61,32,37,100,44,32,114,99,32,61,32,37,100,44,32,104,32,61,32,37,100,10,0,0,0,0,0,0,0,32,32,104,49,46,116,111,112,40,37,100,41,0,0,0,0,32,32,98,111,120,46,98,111,116,116,111,109,40,37,100,41,0,0,0,0,0,0,0,0,37,99,32,37,99,32,37,99,32,0,0,0,0,0,0,0,32,32,98,111,120,46,118,99,101,110,116,101,114,40,37,100,41,0,0,0,0,0,0,0,37,100,32,37,100,32,37,100,10,0,0,0,0,0,0,0,32,79,0,0,0,0,0,0,67,0,0,0,0,0,0,0,32,32,98,111,120,46,116,111,112,40,37,100,41,0,0,0,37,100,32,37,100,32,37,100,32,0,0,0,0,0,0,0,99,104,97,114,97,99,116,101,114,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,118,101,99,116,111,114,0,0,32,32,98,111,116,116,111,109,40,37,100,41,0,0,0,0,98,97,100,32,112,97,114,97,109,101,116,101,114,32,98,117,105,108,100,105,110,103,32,97,32,114,101,100,117,99,101,100,32,80,97,103,101,95,105,109,97,103,101,0,0,0,0,0,37,46,48,76,102,0,0,0,32,32,118,99,101,110,116,101,114,40,37,100,41,0,0,0,37,100,32,0,0,0,0,0,118,97,108,117,101,32,62,32,109,97,120,118,97,108,32,105,110,32,112,103,109,32,102,105,108,101,46,0,0,0,0,0,84,101,120,116,112,97,103,101,58,58,116,101,120,116,98,108,111,99,107,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,32,32,116,111,112,40,37,100,41,0,0,0,0,0,0,0,37,100,10,0,0,0,0,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,84,104,117,0,0,0,0,0,32,37,99,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,80,37,99,10,37,100,32,37,100,10,0,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,99,111,110,115,116,32,98,108,111,98,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,98,97,100,32,112,97,114,97,109,101,116,101,114,32,98,117,105,108,100,105,110,103,32,97,32,82,101,99,116,97,110,103,108,101,0,0,0,0,0,0,106,111,105,110,95,98,108,111,98,115,44,32,108,111,115,116,32,98,108,111,98,0,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,119,105,100,116,104,32,61,32,37,100,44,32,104,101,105,103,104,116,32,61,32,37,100,44,32,104,99,101,110,116,101,114,32,61,32,37,100,44,32,118,99,101,110,116,101,114,32,61,32,37,100,44,32,98,108,97,99,107,32,97,114,101,97,32,61,32,37,100,37,37,10,10,0,0,0,0,0,0,0,0,83,117,110,100,97,121,0,0,98,97,100,32,112,97,114,97,109,101,116,101,114,32,98,117,105,108,100,105,110,103,32,97,32,86,114,104,111,109,98,111,105,100,0,0,0,0,0,0,102,105,108,101,32,115,105,122,101,32,105,115,32,37,100,119,32,120,32,37,100,104,10,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,115,99,97,108,101,32,102,97,99,116,111,114,32,116,111,111,32,98,105,103,46,32,39,105,110,116,39,32,119,105,108,108,32,111,118,101,114,102,108,111,119,46,0,0,0,0,0,0,100,101,108,101,116,101,95,99,104,97,114,97,99,116,101,114,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,116,111,116,97,108,32,98,108,111,98,115,32,105,110,32,122,111,110,101,32,37,117,10,10,0,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,98,108,111,98,44,32,105,110,100,101,120,32,111,117,116,32,111,102,32,98,111,117,110,100,115,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,108,101,102,116,32,61,32,37,100,44,32,116,111,112,32,61,32,37,100,44,32,114,105,103,104,116,32,61,32,37,100,44,32,98,111,116,116,111,109,32,61,32,37,100,10,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,102,105,108,101,32,116,121,112,101,32,105,115,32,80,37,99,10,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,122,111,110,101,32,115,105,122,101,32,37,100,119,32,120,32,37,100,104,10,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,83,101,112,0,0,0,0,0,65,117,103,0,0,0,0,0,105,109,97,103,101,32,116,111,111,32,98,105,103,46,32,39,105,110,116,39,32,119,105,108,108,32,111,118,101,114,102,108,111,119,46,0,0,0,0,0,114,98,0,0,0,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,255,255,255,255,1,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,1,0,0,0,255,255,255,255,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,72,42,0,0,36,0,0,0,118,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,42,0,0,198,0,0,0,162,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,42,0,0,72,0,0,0,6,1,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,42,0,0,96,0,0,0,8,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,42,0,0,96,0,0,0,22,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,42,0,0,168,0,0,0,84,0,0,0,54,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,42,0,0,254,0,0,0,190,0,0,0,54,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,42,0,0,160,0,0,0,192,0,0,0,54,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,43,0,0,0,1,0,0,138,0,0,0,54,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,43,0,0,252,0,0,0,94,0,0,0,54,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,43,0,0,158,0,0,0,110,0,0,0,54,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,43,0,0,44,0,0,0,112,0,0,0,54,0,0,0,118,0,0,0,4,0,0,0,30,0,0,0,6,0,0,0,20,0,0,0,54,0,0,0,2,0,0,0,248,255,255,255,224,43,0,0,20,0,0,0,10,0,0,0,32,0,0,0,14,0,0,0,2,0,0,0,30,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,44,0,0,242,0,0,0,226,0,0,0,54,0,0,0,18,0,0,0,16,0,0,0,58,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,8,44,0,0,62,0,0,0,100,0,0,0,112,0,0,0,120,0,0,0,88,0,0,0,42,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,44,0,0,78,0,0,0,194,0,0,0,54,0,0,0,44,0,0,0,38,0,0,0,8,0,0,0,46,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,44,0,0,64,0,0,0,68,0,0,0,54,0,0,0,40,0,0,0,76,0,0,0,12,0,0,0,58,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,44,0,0,246,0,0,0,2,0,0,0,54,0,0,0,24,0,0,0,30,0,0,0,70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,44,0,0,52,0,0,0,210,0,0,0,54,0,0,0,38,0,0,0,14,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,44,0,0,214,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,44,0,0,34,0,0,0,136,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,44,0,0,6,0,0,0,174,0,0,0,54,0,0,0,8,0,0,0,6,0,0,0,12,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,44,0,0,100,0,0,0,20,0,0,0,54,0,0,0,22,0,0,0,26,0,0,0,32,0,0,0,24,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,44,0,0,46,0,0,0,28,0,0,0,54,0,0,0,46,0,0,0,44,0,0,0,36,0,0,0,38,0,0,0,28,0,0,0,42,0,0,0,34,0,0,0,52,0,0,0,50,0,0,0,48,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,45,0,0,58,0,0,0,4,0,0,0,54,0,0,0,76,0,0,0,68,0,0,0,62,0,0,0,64,0,0,0,56,0,0,0,66,0,0,0,60,0,0,0,74,0,0,0,72,0,0,0,70,0,0,0,40,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,45,0,0,74,0,0,0,92,0,0,0,54,0,0,0,6,0,0,0,12,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,45,0,0,32,0,0,0,176,0,0,0,54,0,0,0,16,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,45,0,0,12,0,0,0,188,0,0,0,54,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,116,0,0,0,94,0,0,0,24,0,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,45,0,0,180,0,0,0,130,0,0,0,54,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,48,0,0,0,8,0,0,0,20,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,45,0,0,180,0,0,0,24,0,0,0,54,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,92,0,0,0,58,0,0,0,10,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,45,0,0,180,0,0,0,102,0,0,0,54,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,45,0,0,180,0,0,0,40,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,45,0,0,62,0,0,0,156,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,45,0,0,180,0,0,0,80,0,0,0,54,0,0,0,20,0,0,0,2,0,0,0,4,0,0,0,10,0,0,0,16,0,0,0,28,0,0,0,24,0,0,0,6,0,0,0,4,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,46,0,0,4,1,0,0,42,0,0,0,54,0,0,0,10,0,0,0,4,0,0,0,18,0,0,0,36,0,0,0,8,0,0,0,6,0,0,0,26,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,46,0,0,70,0,0,0,222,0,0,0,70,0,0,0,6,0,0,0,14,0,0,0,32,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,46,0,0,180,0,0,0,86,0,0,0,54,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,46,0,0,180,0,0,0,164,0,0,0,54,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,8,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,46,0,0,128,0,0,0,234,0,0,0,20,0,0,0,22,0,0,0,16,0,0,0,14,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,46,0,0,10,0,0,0,120,0,0,0,64,0,0,0,40,0,0,0,28,0,0,0,10,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,160,46,0,0,50,0,0,0,208,0,0,0,252,255,255,255,252,255,255,255,160,46,0,0,144,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,184,46,0,0,216,0,0,0,236,0,0,0,252,255,255,255,252,255,255,255,184,46,0,0,108,0,0,0,202,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,208,46,0,0,88,0,0,0,8,1,0,0,248,255,255,255,248,255,255,255,208,46,0,0,182,0,0,0,232,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,232,46,0,0,106,0,0,0,206,0,0,0,248,255,255,255,248,255,255,255,232,46,0,0,134,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,0,0,204,0,0,0,184,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,47,0,0,248,0,0,0,230,0,0,0,16,0,0,0,22,0,0,0,16,0,0,0,14,0,0,0,54,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,30,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,47,0,0,154,0,0,0,178,0,0,0,40,0,0,0,40,0,0,0,28,0,0,0,10,0,0,0,82,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,42,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,47,0,0,224,0,0,0,142,0,0,0,54,0,0,0,60,0,0,0,114,0,0,0,32,0,0,0,84,0,0,0,4,0,0,0,36,0,0,0,50,0,0,0,24,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,47,0,0,104,0,0,0,60,0,0,0,54,0,0,0,106,0,0,0,4,0,0,0,72,0,0,0,80,0,0,0,82,0,0,0,28,0,0,0,110,0,0,0,54,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,47,0,0,228,0,0,0,116,0,0,0,54,0,0,0,16,0,0,0,56,0,0,0,6,0,0,0,48,0,0,0,86,0,0,0,56,0,0,0,86,0,0,0,60,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,47,0,0,76,0,0,0,172,0,0,0,54,0,0,0,98,0,0,0,102,0,0,0,34,0,0,0,78,0,0,0,30,0,0,0,22,0,0,0,72,0,0,0,76,0,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,0,0,90,0,0,0,18,0,0,0,42,0,0,0,22,0,0,0,16,0,0,0,14,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,64,0,0,0,74,0,0,0,12,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,48,0,0,16,0,0,0,218,0,0,0,66,0,0,0,40,0,0,0,28,0,0,0,10,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,90,0,0,0,22,0,0,0,2,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,48,0,0,250,0,0,0,200,0,0,0,66,0,0,0,152,0,0,0,8,0,0,0,2,0,0,0,12,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0].concat([78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,78,49,48,80,97,103,101,95,105,109,97,103,101,53,69,114,114,111,114,69,0,0,0,0,0,0,0,0,120,30,0,0,0,0,0,0,136,30,0,0,0,0,0,0,152,30,0,0,64,42,0,0,0,0,0,0,0,0,0,0,168,30,0,0,64,42,0,0,0,0,0,0,0,0,0,0,184,30,0,0,64,42,0,0,0,0,0,0,0,0,0,0,208,30,0,0,136,42,0,0,0,0,0,0,0,0,0,0,232,30,0,0,64,42,0,0,0,0,0,0,0,0,0,0,248,30,0,0,80,30,0,0,16,31,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,72,47,0,0,0,0,0,0,80,30,0,0,88,31,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,80,47,0,0,0,0,0,0,80,30,0,0,160,31,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,88,47,0,0,0,0,0,0,80,30,0,0,232,31,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,96,47,0,0,0,0,0,0,0,0,0,0,48,32,0,0,144,44,0,0,0,0,0,0,0,0,0,0,96,32,0,0,144,44,0,0,0,0,0,0,80,30,0,0,144,32,0,0,0,0,0,0,1,0,0,0,136,46,0,0,0,0,0,0,80,30,0,0,168,32,0,0,0,0,0,0,1,0,0,0,136,46,0,0,0,0,0,0,80,30,0,0,192,32,0,0,0,0,0,0,1,0,0,0,144,46,0,0,0,0,0,0,80,30,0,0,216,32,0,0,0,0,0,0,1,0,0,0,144,46,0,0,0,0,0,0,80,30,0,0,240,32,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,248,47,0,0,0,8,0,0,80,30,0,0,56,33,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,248,47,0,0,0,8,0,0,80,30,0,0,128,33,0,0,0,0,0,0,3,0,0,0,200,45,0,0,2,0,0,0,152,42,0,0,2,0,0,0,40,46,0,0,0,8,0,0,80,30,0,0,200,33,0,0,0,0,0,0,3,0,0,0,200,45,0,0,2,0,0,0,152,42,0,0,2,0,0,0,48,46,0,0,0,8,0,0,0,0,0,0,16,34,0,0,200,45,0,0,0,0,0,0,0,0,0,0,40,34,0,0,200,45,0,0,0,0,0,0,80,30,0,0,64,34,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,152,46,0,0,2,0,0,0,80,30,0,0,88,34,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,152,46,0,0,2,0,0,0,0,0,0,0,112,34,0,0,0,0,0,0,136,34,0,0,0,47,0,0,0,0,0,0,80,30,0,0,168,34,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,64,43,0,0,0,0,0,0,80,30,0,0,240,34,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,88,43,0,0,0,0,0,0,80,30,0,0,56,35,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,112,43,0,0,0,0,0,0,80,30,0,0,128,35,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,136,43,0,0,0,0,0,0,0,0,0,0,200,35,0,0,200,45,0,0,0,0,0,0,0,0,0,0,224,35,0,0,200,45,0,0,0,0,0,0,80,30,0,0,248,35,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,16,47,0,0,2,0,0,0,80,30,0,0,32,36,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,16,47,0,0,2,0,0,0,80,30,0,0,72,36,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,16,47,0,0,2,0,0,0,80,30,0,0,112,36,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,16,47,0,0,2,0,0,0,0,0,0,0,152,36,0,0,128,46,0,0,0,0,0,0,0,0,0,0,176,36,0,0,200,45,0,0,0,0,0,0,80,30,0,0,200,36,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,240,47,0,0,2,0,0,0,80,30,0,0,224,36,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,240,47,0,0,2,0,0,0,0,0,0,0,248,36,0,0,0,0,0,0,32,37,0,0,0,0,0,0,72,37,0,0,24,47,0,0,0,0,0,0,0,0,0,0,104,37,0,0,168,45,0,0,0,0,0,0,0,0,0,0,144,37,0,0,168,45,0,0,0,0,0,0,0,0,0,0,184,37,0,0,0,0,0,0,240,37,0,0,0,0,0,0,40,38,0,0,0,0,0,0,72,38,0,0,0,0,0,0,104,38,0,0,0,0,0,0,136,38,0,0,0,0,0,0,168,38,0,0,80,30,0,0,192,38,0,0,0,0,0,0,1,0,0,0,32,43,0,0,3,244,255,255,80,30,0,0,240,38,0,0,0,0,0,0,1,0,0,0,48,43,0,0,3,244,255,255,80,30,0,0,32,39,0,0,0,0,0,0,1,0,0,0,32,43,0,0,3,244,255,255,80,30,0,0,80,39,0,0,0,0,0,0,1,0,0,0,48,43,0,0,3,244,255,255,0,0,0,0,128,39,0,0,104,42,0,0,0,0,0,0,0,0,0,0,152,39,0,0,0,0,0,0,176,39,0,0,120,46,0,0,0,0,0,0,0,0,0,0,200,39,0,0,104,46,0,0,0,0,0,0,0,0,0,0,232,39,0,0,112,46,0,0,0,0,0,0,0,0,0,0,8,40,0,0,0,0,0,0,40,40,0,0,0,0,0,0,72,40,0,0,0,0,0,0,104,40,0,0,80,30,0,0,136,40,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,232,47,0,0,2,0,0,0,80,30,0,0,168,40,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,232,47,0,0,2,0,0,0,80,30,0,0,200,40,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,232,47,0,0,2,0,0,0,80,30,0,0,232,40,0,0,0,0,0,0,2,0,0,0,200,45,0,0,2,0,0,0,232,47,0,0,2,0,0,0,0,0,0,0,8,41,0,0,0,0,0,0,32,41,0,0,0,0,0,0,56,41,0,0,0,0,0,0,80,41,0,0,104,46,0,0,0,0,0,0,0,0,0,0,104,41,0,0,112,46,0,0,0,0,0,0,0,0,0,0,128,41,0,0,64,48,0,0,0,0,0,0,0,0,0,0,168,41,0,0,64,48,0,0,0,0,0,0,0,0,0,0,208,41,0,0,80,48,0,0,0,0,0,0,0,0,0,0,248,41,0,0,56,42,0,0,0,0,0,0,0,0,0,0,32,42,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___gxx_personality_v0() {
    }
  function _llvm_eh_typeid_for(type) {
      return type;
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }function ___cxa_get_exception_ptr(ptr) {
      return ptr;
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      var mode = HEAP32[((varargs)>>2)];
      path = Pointer_stringify(path);
      try {
        var stream = FS.open(path, oflag, mode);
        return stream.fd;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 512;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 64;
        flags |= 1024;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        FS.close(stream);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      var stream = FS.getStream(fildes);
      if (stream) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  Module["_strlen"] = _strlen;
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _llvm_memset_p0i8_i64=_memset;
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }var _putc=_fputc;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStream(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStream(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  var _abs=Math_abs;
  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }
  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }
  Module["_tolower"] = _tolower;
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStream(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }
  var _getc=_fgetc;
  function ___errno_location() {
      return ___errno_state;
    }
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _abort() {
      Module['abort']();
    }
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function ___cxa_guard_abort() {}
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _catopen() { throw 'TODO: ' + aborter }
  function _catgets() { throw 'TODO: ' + aborter }
  function _catclose() { throw 'TODO: ' + aborter }
  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }
  function _freelocale(locale) {
      _free(locale);
    }
  function _isascii(chr) {
      return chr >= 0 && (chr & 0x80) == 0;
    }
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
      var pattern = Pointer_stringify(format);
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }var _strftime_l=_strftime;
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  var _llvm_va_start=undefined;
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdin|0;var p=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var q=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var r=env._stderr|0;var s=env.___fsmu8|0;var t=env._stdout|0;var u=env.___dso_handle|0;var v=+env.NaN;var w=+env.Infinity;var x=0;var y=0;var z=0;var A=0;var B=0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0.0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=global.Math.floor;var V=global.Math.abs;var W=global.Math.sqrt;var X=global.Math.pow;var Y=global.Math.cos;var Z=global.Math.sin;var _=global.Math.tan;var $=global.Math.acos;var aa=global.Math.asin;var ab=global.Math.atan;var ac=global.Math.atan2;var ad=global.Math.exp;var ae=global.Math.log;var af=global.Math.ceil;var ag=global.Math.imul;var ah=env.abort;var ai=env.assert;var aj=env.asmPrintInt;var ak=env.asmPrintFloat;var al=env.min;var am=env.invoke_iiiii;var an=env.invoke_viiii;var ao=env.invoke_viiiii;var ap=env.invoke_vi;var aq=env.invoke_vii;var ar=env.invoke_iiiiii;var as=env.invoke_viiiiiid;var at=env.invoke_ii;var au=env.invoke_iiii;var av=env.invoke_viiiiiii;var aw=env.invoke_viiiiid;var ax=env.invoke_v;var ay=env.invoke_iiiiiiiii;var az=env.invoke_viiiiiiiii;var aA=env.invoke_viiiiii;var aB=env.invoke_iii;var aC=env.invoke_viiiiiiii;var aD=env.invoke_viii;var aE=env._llvm_lifetime_end;var aF=env.__scanString;var aG=env._fclose;var aH=env._pthread_mutex_lock;var aI=env.___cxa_end_catch;var aJ=env._strtoull;var aK=env._fflush;var aL=env._fputc;var aM=env._fwrite;var aN=env._send;var aO=env._isspace;var aP=env._read;var aQ=env._fsync;var aR=env.___cxa_guard_abort;var aS=env._newlocale;var aT=env.___gxx_personality_v0;var aU=env._pthread_cond_wait;var aV=env.___cxa_rethrow;var aW=env.___resumeException;var aX=env._strcmp;var aY=env._strncmp;var aZ=env._vsscanf;var a_=env._snprintf;var a$=env._fgetc;var a0=env.__getFloat;var a1=env._atexit;var a2=env.___cxa_free_exception;var a3=env._close;var a4=env.___setErrNo;var a5=env._isxdigit;var a6=env._abs;var a7=env._exit;var a8=env._sprintf;var a9=env.___ctype_b_loc;var ba=env._freelocale;var bb=env._catgets;var bc=env.__isLeapYear;var bd=env._asprintf;var be=env.___cxa_is_number_type;var bf=env.___cxa_does_inherit;var bg=env.___cxa_guard_acquire;var bh=env.___cxa_begin_catch;var bi=env._recv;var bj=env.__parseInt64;var bk=env.__ZSt18uncaught_exceptionv;var bl=env.___cxa_call_unexpected;var bm=env.___cxa_get_exception_ptr;var bn=env._islower;var bo=env.__exit;var bp=env._isupper;var bq=env._strftime;var br=env._llvm_va_end;var bs=env.___cxa_throw;var bt=env._llvm_eh_exception;var bu=env._toupper;var bv=env._pread;var bw=env._fopen;var bx=env._open;var by=env.__arraySum;var bz=env._isalpha;var bA=env.___cxa_find_matching_catch;var bB=env.__formatString;var bC=env._pthread_cond_broadcast;var bD=env.__ZSt9terminatev;var bE=env._isascii;var bF=env._pthread_mutex_unlock;var bG=env._sbrk;var bH=env.___errno_location;var bI=env._strerror;var bJ=env._catclose;var bK=env._llvm_lifetime_start;var bL=env.___cxa_guard_release;var bM=env._ungetc;var bN=env._uselocale;var bO=env._vsnprintf;var bP=env._sscanf;var bQ=env._sysconf;var bR=env._fread;var bS=env._abort;var bT=env._fprintf;var bU=env._isdigit;var bV=env._strtoll;var bW=env.__addDays;var bX=env.__reallyNegative;var bY=env._write;var bZ=env.___cxa_allocate_exception;var b_=env._vasprintf;var b$=env._catopen;var b0=env.___ctype_toupper_loc;var b1=env.___ctype_tolower_loc;var b2=env._llvm_eh_typeid_for;var b3=env._pwrite;var b4=env._strerror_r;var b5=env._time;var b6=0.0;
// EMSCRIPTEN_START_FUNCS
function jZ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==8){v=16}else if((u|0)==64){v=8}else{v=10}u=l|0;kh(n,h,u,m);pm(p|0,0,12)|0;h=o;h5(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L3294:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=ce[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=2783}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=ce[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=2783;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{L=m;M=C;N=G;break L3294}}}}while(0);if((F|0)==2783){F=0;if(E){L=m;M=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}h5(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}h5(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{U=c[G>>2]|0}if((kd(U,v,S,q,t,A,n,l,s,u)|0)!=0){L=S;M=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;ce[T&127](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=on(L,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;l8(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=2825}else{B=c[M+12>>2]|0;if((B|0)==(c[M+16>>2]|0)){Y=ce[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=2825;break}if(!(h^(M|0)==0)){break}Z=b|0;c[Z>>2]=W;h3(o);h3(n);i=e;return}}while(0);do{if((F|0)==2825){if(h){break}Z=b|0;c[Z>>2]=W;h3(o);h3(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;h3(o);h3(n);i=e;return}function j_(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];j$(a,0,j,k,f,g,h);i=b;return}function j$(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;f=i;i=i+144|0;m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=f|0;n=f+104|0;o=f+112|0;p=f+128|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=c[j+4>>2]&74;if((v|0)==0){w=0}else if((v|0)==8){w=16}else if((v|0)==64){w=8}else{w=10}v=m|0;kh(o,j,v,n);pm(q|0,0,12)|0;j=p;h5(p,10,0);if((a[q]&1)==0){m=j+1|0;x=m;y=m;z=p+8|0}else{m=p+8|0;x=c[m>>2]|0;y=j+1|0;z=m}c[r>>2]=x;m=s|0;c[t>>2]=m;c[u>>2]=0;j=g|0;g=h|0;h=p|0;A=p+4|0;B=c[n>>2]|0;n=x;x=c[j>>2]|0;L3384:while(1){do{if((x|0)==0){C=0}else{D=c[x+12>>2]|0;if((D|0)==(c[x+16>>2]|0)){E=ce[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{E=c[D>>2]|0}if((E|0)!=-1){C=x;break}c[j>>2]=0;C=0}}while(0);F=(C|0)==0;D=c[g>>2]|0;do{if((D|0)==0){G=2854}else{H=c[D+12>>2]|0;if((H|0)==(c[D+16>>2]|0)){I=ce[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{I=c[H>>2]|0}if((I|0)==-1){c[g>>2]=0;G=2854;break}else{H=(D|0)==0;if(F^H){J=D;K=H;break}else{L=n;M=D;N=H;break L3384}}}}while(0);if((G|0)==2854){G=0;if(F){L=n;M=0;N=1;break}else{J=0;K=1}}D=d[q]|0;H=(D&1|0)==0;if(((c[r>>2]|0)-n|0)==((H?D>>>1:c[A>>2]|0)|0)){if(H){O=D>>>1;P=D>>>1}else{D=c[A>>2]|0;O=D;P=D}h5(p,O<<1,0);if((a[q]&1)==0){Q=10}else{Q=(c[h>>2]&-2)-1|0}h5(p,Q,0);if((a[q]&1)==0){R=y}else{R=c[z>>2]|0}c[r>>2]=R+P;S=R}else{S=n}D=C+12|0;H=c[D>>2]|0;T=C+16|0;if((H|0)==(c[T>>2]|0)){U=ce[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{U=c[H>>2]|0}if((kd(U,w,S,r,u,B,o,m,t,v)|0)!=0){L=S;M=J;N=K;break}H=c[D>>2]|0;if((H|0)==(c[T>>2]|0)){T=c[(c[C>>2]|0)+40>>2]|0;ce[T&127](C)|0;n=S;x=C;continue}else{c[D>>2]=H+4;n=S;x=C;continue}}x=d[o]|0;if((x&1|0)==0){V=x>>>1}else{V=c[o+4>>2]|0}do{if((V|0)!=0){x=c[t>>2]|0;if((x-s|0)>=160){break}S=c[u>>2]|0;c[t>>2]=x+4;c[x>>2]=S}}while(0);b[l>>1]=om(L,c[r>>2]|0,k,w)|0;l8(o,m,c[t>>2]|0,k);do{if(F){W=0}else{t=c[C+12>>2]|0;if((t|0)==(c[C+16>>2]|0)){X=ce[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{X=c[t>>2]|0}if((X|0)!=-1){W=C;break}c[j>>2]=0;W=0}}while(0);j=(W|0)==0;do{if(N){G=2896}else{C=c[M+12>>2]|0;if((C|0)==(c[M+16>>2]|0)){Y=ce[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{Y=c[C>>2]|0}if((Y|0)==-1){c[g>>2]=0;G=2896;break}if(!(j^(M|0)==0)){break}Z=e|0;c[Z>>2]=W;h3(p);h3(o);i=f;return}}while(0);do{if((G|0)==2896){if(j){break}Z=e|0;c[Z>>2]=W;h3(p);h3(o);i=f;return}}while(0);c[k>>2]=c[k>>2]|2;Z=e|0;c[Z>>2]=W;h3(p);h3(o);i=f;return}function j0(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];j1(a,0,j,k,f,g,h);i=b;return}function j1(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==8){v=16}else if((u|0)==64){v=8}else{v=10}u=l|0;kh(n,h,u,m);pm(p|0,0,12)|0;h=o;h5(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L3474:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=ce[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=2925}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=ce[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=2925;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L3474}}}}while(0);if((F|0)==2925){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}h5(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}h5(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{T=c[G>>2]|0}if((kd(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;ce[S&127](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=ol(K,c[q>>2]|0,j,v)|0;l8(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=2967}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=ce[c[(c[L>>2]|0)+36>>2]&127](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=2967;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;h3(o);h3(n);i=e;return}}while(0);do{if((F|0)==2967){if(h){break}Y=b|0;c[Y>>2]=V;h3(o);h3(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;h3(o);h3(n);i=e;return}function j2(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];j3(a,0,j,k,f,g,h);i=b;return}function j3(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==8){v=16}else if((u|0)==64){v=8}else{v=10}u=l|0;kh(n,h,u,m);pm(p|0,0,12)|0;h=o;h5(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L3564:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=ce[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=2996}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=ce[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=2996;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{K=m;L=C;M=G;break L3564}}}}while(0);if((F|0)==2996){F=0;if(E){K=m;L=0;M=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){N=C>>>1;O=C>>>1}else{C=c[z>>2]|0;N=C;O=C}h5(o,N<<1,0);if((a[p]&1)==0){P=10}else{P=(c[g>>2]&-2)-1|0}h5(o,P,0);if((a[p]&1)==0){Q=x}else{Q=c[y>>2]|0}c[q>>2]=Q+O;R=Q}else{R=m}C=B+12|0;G=c[C>>2]|0;S=B+16|0;if((G|0)==(c[S>>2]|0)){T=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{T=c[G>>2]|0}if((kd(T,v,R,q,t,A,n,l,s,u)|0)!=0){K=R;L=I;M=J;break}G=c[C>>2]|0;if((G|0)==(c[S>>2]|0)){S=c[(c[B>>2]|0)+40>>2]|0;ce[S&127](B)|0;m=R;w=B;continue}else{c[C>>2]=G+4;m=R;w=B;continue}}w=d[n]|0;if((w&1|0)==0){U=w>>>1}else{U=c[n+4>>2]|0}do{if((U|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}R=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=R}}while(0);c[k>>2]=ok(K,c[q>>2]|0,j,v)|0;l8(n,l,c[s>>2]|0,j);do{if(E){V=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){W=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{W=c[s>>2]|0}if((W|0)!=-1){V=B;break}c[h>>2]=0;V=0}}while(0);h=(V|0)==0;do{if(M){F=3038}else{B=c[L+12>>2]|0;if((B|0)==(c[L+16>>2]|0)){X=ce[c[(c[L>>2]|0)+36>>2]&127](L)|0}else{X=c[B>>2]|0}if((X|0)==-1){c[f>>2]=0;F=3038;break}if(!(h^(L|0)==0)){break}Y=b|0;c[Y>>2]=V;h3(o);h3(n);i=e;return}}while(0);do{if((F|0)==3038){if(h){break}Y=b|0;c[Y>>2]=V;h3(o);h3(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Y=b|0;c[Y>>2]=V;h3(o);h3(n);i=e;return}function j4(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];j5(a,0,j,k,f,g,h);i=b;return}function j5(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+144|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+104|0;n=e+112|0;o=e+128|0;p=o;q=i;i=i+4|0;i=i+7&-8;r=i;i=i+160|0;s=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;u=c[h+4>>2]&74;if((u|0)==0){v=0}else if((u|0)==8){v=16}else if((u|0)==64){v=8}else{v=10}u=l|0;kh(n,h,u,m);pm(p|0,0,12)|0;h=o;h5(o,10,0);if((a[p]&1)==0){l=h+1|0;w=l;x=l;y=o+8|0}else{l=o+8|0;w=c[l>>2]|0;x=h+1|0;y=l}c[q>>2]=w;l=r|0;c[s>>2]=l;c[t>>2]=0;h=f|0;f=g|0;g=o|0;z=o+4|0;A=c[m>>2]|0;m=w;w=c[h>>2]|0;L3654:while(1){do{if((w|0)==0){B=0}else{C=c[w+12>>2]|0;if((C|0)==(c[w+16>>2]|0)){D=ce[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{D=c[C>>2]|0}if((D|0)!=-1){B=w;break}c[h>>2]=0;B=0}}while(0);E=(B|0)==0;C=c[f>>2]|0;do{if((C|0)==0){F=3067}else{G=c[C+12>>2]|0;if((G|0)==(c[C+16>>2]|0)){H=ce[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{H=c[G>>2]|0}if((H|0)==-1){c[f>>2]=0;F=3067;break}else{G=(C|0)==0;if(E^G){I=C;J=G;break}else{L=m;M=C;N=G;break L3654}}}}while(0);if((F|0)==3067){F=0;if(E){L=m;M=0;N=1;break}else{I=0;J=1}}C=d[p]|0;G=(C&1|0)==0;if(((c[q>>2]|0)-m|0)==((G?C>>>1:c[z>>2]|0)|0)){if(G){O=C>>>1;P=C>>>1}else{C=c[z>>2]|0;O=C;P=C}h5(o,O<<1,0);if((a[p]&1)==0){Q=10}else{Q=(c[g>>2]&-2)-1|0}h5(o,Q,0);if((a[p]&1)==0){R=x}else{R=c[y>>2]|0}c[q>>2]=R+P;S=R}else{S=m}C=B+12|0;G=c[C>>2]|0;T=B+16|0;if((G|0)==(c[T>>2]|0)){U=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{U=c[G>>2]|0}if((kd(U,v,S,q,t,A,n,l,s,u)|0)!=0){L=S;M=I;N=J;break}G=c[C>>2]|0;if((G|0)==(c[T>>2]|0)){T=c[(c[B>>2]|0)+40>>2]|0;ce[T&127](B)|0;m=S;w=B;continue}else{c[C>>2]=G+4;m=S;w=B;continue}}w=d[n]|0;if((w&1|0)==0){V=w>>>1}else{V=c[n+4>>2]|0}do{if((V|0)!=0){w=c[s>>2]|0;if((w-r|0)>=160){break}S=c[t>>2]|0;c[s>>2]=w+4;c[w>>2]=S}}while(0);t=oj(L,c[q>>2]|0,j,v)|0;c[k>>2]=t;c[k+4>>2]=K;l8(n,l,c[s>>2]|0,j);do{if(E){W=0}else{s=c[B+12>>2]|0;if((s|0)==(c[B+16>>2]|0)){X=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{X=c[s>>2]|0}if((X|0)!=-1){W=B;break}c[h>>2]=0;W=0}}while(0);h=(W|0)==0;do{if(N){F=3109}else{B=c[M+12>>2]|0;if((B|0)==(c[M+16>>2]|0)){Y=ce[c[(c[M>>2]|0)+36>>2]&127](M)|0}else{Y=c[B>>2]|0}if((Y|0)==-1){c[f>>2]=0;F=3109;break}if(!(h^(M|0)==0)){break}Z=b|0;c[Z>>2]=W;h3(o);h3(n);i=e;return}}while(0);do{if((F|0)==3109){if(h){break}Z=b|0;c[Z>>2]=W;h3(o);h3(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;h3(o);h3(n);i=e;return}function j6(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];j7(a,0,j,k,f,g,h);i=b;return}function j7(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=h;h=i;i=i+4|0;i=i+7&-8;c[h>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;ki(o,j,x,m,n);pm(q|0,0,12)|0;j=p;h5(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=h|0;h=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L3739:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=ce[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=3134}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=ce[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=3134;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L3739}}}}while(0);if((I|0)==3134){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}h5(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[h>>2]&-2)-1|0}h5(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=ce[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{W=c[J>>2]|0}if((kj(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;ce[V&127](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);g[l>>2]=+oi(N,c[r>>2]|0,k);l8(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=ce[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=3177}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=ce[c[(c[O>>2]|0)+36>>2]&127](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=3177;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}}while(0);do{if((I|0)==3177){if(j){break}$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}function j8(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];j9(a,0,j,k,f,g,h);i=b;return}function j9(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;ki(o,j,x,m,n);pm(q|0,0,12)|0;j=p;h5(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L3825:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=ce[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=3202}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=ce[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=3202;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L3825}}}}while(0);if((I|0)==3202){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}h5(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}h5(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=ce[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{W=c[J>>2]|0}if((kj(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;ce[V&127](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+oh(N,c[r>>2]|0,k);l8(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=ce[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=3245}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=ce[c[(c[O>>2]|0)+36>>2]&127](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=3245;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}}while(0);do{if((I|0)==3245){if(j){break}$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}function ka(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;b=i;i=i+16|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;c[j>>2]=c[d>>2];c[k>>2]=c[e>>2];kb(a,0,j,k,f,g,h);i=b;return}function kb(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;e=i;i=i+176|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[m>>2];m=e+128|0;n=e+136|0;o=e+144|0;p=e+160|0;q=p;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;v=i;i=i+1|0;i=i+7&-8;w=i;i=i+1|0;i=i+7&-8;x=e|0;ki(o,j,x,m,n);pm(q|0,0,12)|0;j=p;h5(p,10,0);if((a[q]&1)==0){y=j+1|0;z=y;A=y;B=p+8|0}else{y=p+8|0;z=c[y>>2]|0;A=j+1|0;B=y}c[r>>2]=z;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;j=f|0;f=g|0;g=p|0;C=p+4|0;D=c[m>>2]|0;m=c[n>>2]|0;n=z;z=c[j>>2]|0;L3911:while(1){do{if((z|0)==0){E=0}else{F=c[z+12>>2]|0;if((F|0)==(c[z+16>>2]|0)){G=ce[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[F>>2]|0}if((G|0)!=-1){E=z;break}c[j>>2]=0;E=0}}while(0);H=(E|0)==0;F=c[f>>2]|0;do{if((F|0)==0){I=3270}else{J=c[F+12>>2]|0;if((J|0)==(c[F+16>>2]|0)){K=ce[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{K=c[J>>2]|0}if((K|0)==-1){c[f>>2]=0;I=3270;break}else{J=(F|0)==0;if(H^J){L=F;M=J;break}else{N=n;O=F;P=J;break L3911}}}}while(0);if((I|0)==3270){I=0;if(H){N=n;O=0;P=1;break}else{L=0;M=1}}F=d[q]|0;J=(F&1|0)==0;if(((c[r>>2]|0)-n|0)==((J?F>>>1:c[C>>2]|0)|0)){if(J){Q=F>>>1;R=F>>>1}else{F=c[C>>2]|0;Q=F;R=F}h5(p,Q<<1,0);if((a[q]&1)==0){S=10}else{S=(c[g>>2]&-2)-1|0}h5(p,S,0);if((a[q]&1)==0){T=A}else{T=c[B>>2]|0}c[r>>2]=T+R;U=T}else{U=n}F=E+12|0;J=c[F>>2]|0;V=E+16|0;if((J|0)==(c[V>>2]|0)){W=ce[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{W=c[J>>2]|0}if((kj(W,v,w,U,r,D,m,o,y,t,u,x)|0)!=0){N=U;O=L;P=M;break}J=c[F>>2]|0;if((J|0)==(c[V>>2]|0)){V=c[(c[E>>2]|0)+40>>2]|0;ce[V&127](E)|0;n=U;z=E;continue}else{c[F>>2]=J+4;n=U;z=E;continue}}z=d[o]|0;if((z&1|0)==0){X=z>>>1}else{X=c[o+4>>2]|0}do{if((X|0)!=0){if((a[v]&1)==0){break}z=c[t>>2]|0;if((z-s|0)>=160){break}U=c[u>>2]|0;c[t>>2]=z+4;c[z>>2]=U}}while(0);h[l>>3]=+og(N,c[r>>2]|0,k);l8(o,y,c[t>>2]|0,k);do{if(H){Y=0}else{t=c[E+12>>2]|0;if((t|0)==(c[E+16>>2]|0)){Z=ce[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Z=c[t>>2]|0}if((Z|0)!=-1){Y=E;break}c[j>>2]=0;Y=0}}while(0);j=(Y|0)==0;do{if(P){I=3313}else{E=c[O+12>>2]|0;if((E|0)==(c[O+16>>2]|0)){_=ce[c[(c[O>>2]|0)+36>>2]&127](O)|0}else{_=c[E>>2]|0}if((_|0)==-1){c[f>>2]=0;I=3313;break}if(!(j^(O|0)==0)){break}$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}}while(0);do{if((I|0)==3313){if(j){break}$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}}while(0);c[k>>2]=c[k>>2]|2;$=b|0;c[$>>2]=Y;h3(p);h3(o);i=e;return}function kc(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+136|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+120|0;o=n;p=i;i=i+4|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;r=i;i=i+4|0;i=i+7&-8;s=i;i=i+160|0;t=i;i=i+4|0;i=i+7&-8;u=i;i=i+4|0;i=i+7&-8;pm(o|0,0,12)|0;o=q;ip(p,h);h=p|0;p=c[h>>2]|0;if((c[3980]|0)!=-1){c[l>>2]=15920;c[l+4>>2]=14;c[l+8>>2]=0;h_(15920,l,98)}l=(c[3981]|0)-1|0;v=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-v>>2>>>0>l>>>0){w=c[v+(l<<2)>>2]|0;if((w|0)==0){break}x=w;y=m|0;z=c[(c[w>>2]|0)+48>>2]|0;b7[z&15](x,12392,12418,y)|0;x=c[h>>2]|0;hG(x)|0;pm(o|0,0,12)|0;x=q;h5(q,10,0);if((a[o]&1)==0){z=x+1|0;A=z;B=z;C=q+8|0}else{z=q+8|0;A=c[z>>2]|0;B=x+1|0;C=z}c[r>>2]=A;z=s|0;c[t>>2]=z;c[u>>2]=0;x=f|0;w=g|0;D=q|0;E=q+4|0;F=A;G=c[x>>2]|0;L4004:while(1){do{if((G|0)==0){H=0}else{I=c[G+12>>2]|0;if((I|0)==(c[G+16>>2]|0)){J=ce[c[(c[G>>2]|0)+36>>2]&127](G)|0}else{J=c[I>>2]|0}if((J|0)!=-1){H=G;break}c[x>>2]=0;H=0}}while(0);I=(H|0)==0;K=c[w>>2]|0;do{if((K|0)==0){L=3345}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=ce[c[(c[K>>2]|0)+36>>2]&127](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[w>>2]=0;L=3345;break}else{if(I^(K|0)==0){break}else{O=F;break L4004}}}}while(0);if((L|0)==3345){L=0;if(I){O=F;break}}K=d[o]|0;M=(K&1|0)==0;if(((c[r>>2]|0)-F|0)==((M?K>>>1:c[E>>2]|0)|0)){if(M){P=K>>>1;Q=K>>>1}else{K=c[E>>2]|0;P=K;Q=K}h5(q,P<<1,0);if((a[o]&1)==0){R=10}else{R=(c[D>>2]&-2)-1|0}h5(q,R,0);if((a[o]&1)==0){S=B}else{S=c[C>>2]|0}c[r>>2]=S+Q;T=S}else{T=F}K=H+12|0;M=c[K>>2]|0;U=H+16|0;if((M|0)==(c[U>>2]|0)){V=ce[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{V=c[M>>2]|0}if((kd(V,16,T,r,u,0,n,z,t,y)|0)!=0){O=T;break}M=c[K>>2]|0;if((M|0)==(c[U>>2]|0)){U=c[(c[H>>2]|0)+40>>2]|0;ce[U&127](H)|0;F=T;G=H;continue}else{c[K>>2]=M+4;F=T;G=H;continue}}a[O+3|0]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);G=jR(O,c[3620]|0,2512,(F=i,i=i+8|0,c[F>>2]=k,F)|0)|0;i=F;if((G|0)!=1){c[j>>2]=4}G=c[x>>2]|0;do{if((G|0)==0){W=0}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){X=ce[c[(c[G>>2]|0)+36>>2]&127](G)|0}else{X=c[F>>2]|0}if((X|0)!=-1){W=G;break}c[x>>2]=0;W=0}}while(0);x=(W|0)==0;G=c[w>>2]|0;do{if((G|0)==0){L=3390}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){Y=ce[c[(c[G>>2]|0)+36>>2]&127](G)|0}else{Y=c[F>>2]|0}if((Y|0)==-1){c[w>>2]=0;L=3390;break}if(!(x^(G|0)==0)){break}Z=b|0;c[Z>>2]=W;h3(q);h3(n);i=e;return}}while(0);do{if((L|0)==3390){if(x){break}Z=b|0;c[Z>>2]=W;h3(q);h3(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;Z=b|0;c[Z>>2]=W;h3(q);h3(n);i=e;return}}while(0);e=bZ(4)|0;oK(e);bs(e|0,10840,132)}function kd(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)!=0&(b|0)==(i|0)){i=c[l>>2]|0;if((i-k|0)>=160){q=0;return q|0}k=c[h>>2]|0;c[l>>2]=i+4;c[i>>2]=k;c[h>>2]=0;q=0;return q|0}k=m+104|0;i=m;while(1){if((i|0)==(k|0)){s=k;break}if((c[i>>2]|0)==(b|0)){s=i;break}else{i=i+4|0}}i=s-m|0;m=i>>2;if((i|0)>92){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((i|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if((a[n-1|0]|0)!=48){q=-1;return q|0}c[h>>2]=0;s=a[12392+m|0]|0;b=c[g>>2]|0;c[g>>2]=b+1;a[b]=s;q=0;return q|0}}while(0);f=a[12392+m|0]|0;c[g>>2]=n+1;a[n]=f;c[h>>2]=(c[h>>2]|0)+1;q=0;return q|0}function ke(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;ip(k,d);d=k|0;k=c[d>>2]|0;if((c[3982]|0)!=-1){c[j>>2]=15928;c[j+4>>2]=14;c[j+8>>2]=0;h_(15928,j,98)}j=(c[3983]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+32>>2]|0;b7[o&15](n,12392,12418,e)|0;n=c[d>>2]|0;if((c[3886]|0)!=-1){c[h>>2]=15544;c[h+4>>2]=14;c[h+8>>2]=0;h_(15544,h,98)}o=(c[3887]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;a[f]=ce[c[(c[p>>2]|0)+16>>2]&127](q)|0;cb[c[(c[p>>2]|0)+20>>2]&127](b,q);q=c[d>>2]|0;hG(q)|0;i=g;return}}while(0);o=bZ(4)|0;oK(o);bs(o|0,10840,132)}}while(0);g=bZ(4)|0;oK(g);bs(g|0,10840,132)}function kf(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+40|0;j=h|0;k=h+16|0;l=h+32|0;ip(l,d);d=l|0;l=c[d>>2]|0;if((c[3982]|0)!=-1){c[k>>2]=15928;c[k+4>>2]=14;c[k+8>>2]=0;h_(15928,k,98)}k=(c[3983]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;p=c[(c[n>>2]|0)+32>>2]|0;b7[p&15](o,12392,12424,e)|0;o=c[d>>2]|0;if((c[3886]|0)!=-1){c[j>>2]=15544;c[j+4>>2]=14;c[j+8>>2]=0;h_(15544,j,98)}p=(c[3887]|0)-1|0;n=c[o+8>>2]|0;do{if((c[o+12>>2]|0)-n>>2>>>0>p>>>0){q=c[n+(p<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;a[f]=ce[c[(c[s>>2]|0)+12>>2]&127](r)|0;a[g]=ce[c[(c[s>>2]|0)+16>>2]&127](r)|0;cb[c[(c[q>>2]|0)+20>>2]&127](b,r);r=c[d>>2]|0;hG(r)|0;i=h;return}}while(0);p=bZ(4)|0;oK(p);bs(p|0,10840,132)}}while(0);h=bZ(4)|0;oK(h);bs(h|0,10840,132)}function kg(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(b<<24>>24==i<<24>>24){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((a[j]|0)==b<<24>>24){s=j;break}else{j=j+1|0}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[12392+j|0]|0;if((j|0)==25|(j|0)==24){s=c[h>>2]|0;do{if((s|0)!=(g|0)){if((a[s-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=s+1;a[s]=o;p=0;return p|0}else if((j|0)==22|(j|0)==23){a[f]=80;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=o;p=0;return p|0}else{s=a[f]|0;do{if((o&95|0)==(s<<24>>24|0)){a[f]=s|-128;if((a[e]&1)==0){break}a[e]=0;g=d[k]|0;if((g&1|0)==0){t=g>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}g=c[m>>2]|0;if((g-l|0)>=160){break}b=c[n>>2]|0;c[m>>2]=g+4;c[g>>2]=b}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=o;if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}return 0}function kh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+32|0;ip(j,b);b=j|0;j=c[b>>2]|0;if((c[3980]|0)!=-1){c[h>>2]=15920;c[h+4>>2]=14;c[h+8>>2]=0;h_(15920,h,98)}h=(c[3981]|0)-1|0;k=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-k>>2>>>0>h>>>0){l=c[k+(h<<2)>>2]|0;if((l|0)==0){break}m=l;n=c[(c[l>>2]|0)+48>>2]|0;b7[n&15](m,12392,12418,d)|0;m=c[b>>2]|0;if((c[3884]|0)!=-1){c[g>>2]=15536;c[g+4>>2]=14;c[g+8>>2]=0;h_(15536,g,98)}n=(c[3885]|0)-1|0;l=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-l>>2>>>0>n>>>0){o=c[l+(n<<2)>>2]|0;if((o|0)==0){break}p=o;c[e>>2]=ce[c[(c[o>>2]|0)+16>>2]&127](p)|0;cb[c[(c[o>>2]|0)+20>>2]&127](a,p);p=c[b>>2]|0;hG(p)|0;i=f;return}}while(0);n=bZ(4)|0;oK(n);bs(n|0,10840,132)}}while(0);f=bZ(4)|0;oK(f);bs(f|0,10840,132)}function ki(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=g+32|0;ip(k,b);b=k|0;k=c[b>>2]|0;if((c[3980]|0)!=-1){c[j>>2]=15920;c[j+4>>2]=14;c[j+8>>2]=0;h_(15920,j,98)}j=(c[3981]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}n=m;o=c[(c[m>>2]|0)+48>>2]|0;b7[o&15](n,12392,12424,d)|0;n=c[b>>2]|0;if((c[3884]|0)!=-1){c[h>>2]=15536;c[h+4>>2]=14;c[h+8>>2]=0;h_(15536,h,98)}o=(c[3885]|0)-1|0;m=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-m>>2>>>0>o>>>0){p=c[m+(o<<2)>>2]|0;if((p|0)==0){break}q=p;r=p;c[e>>2]=ce[c[(c[r>>2]|0)+12>>2]&127](q)|0;c[f>>2]=ce[c[(c[r>>2]|0)+16>>2]&127](q)|0;cb[c[(c[p>>2]|0)+20>>2]&127](a,q);q=c[b>>2]|0;hG(q)|0;i=g;return}}while(0);o=bZ(4)|0;oK(o);bs(o|0,10840,132)}}while(0);g=bZ(4)|0;oK(g);bs(g|0,10840,132)}function kj(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(i|0)){if((a[e]&1)==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((c[j>>2]|0)==(b|0)){s=j;break}else{j=j+4|0}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[12392+o|0]|0;do{if((o|0)==25|(o|0)==24){b=c[h>>2]|0;do{if((b|0)!=(g|0)){if((a[b-1|0]&95|0)==(a[f]&127|0)){break}else{p=-1}return p|0}}while(0);c[h>>2]=b+1;a[b]=s;p=0;return p|0}else if((o|0)==22|(o|0)==23){a[f]=80}else{r=a[f]|0;if((s&95|0)!=(r<<24>>24|0)){break}a[f]=r|-128;if((a[e]&1)==0){break}a[e]=0;r=d[k]|0;if((r&1|0)==0){t=r>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}r=c[m>>2]|0;if((r-l|0)>=160){break}q=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=q}}while(0);m=c[h>>2]|0;c[h>>2]=m+1;a[m]=s;if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1;p=0;return p|0}function kk(a){a=a|0;hE(a|0);pb(a);return}function kl(a){a=a|0;hE(a|0);return}function km(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];cl[o&31](b,d,l,f,g,h&1);i=j;return}ip(m,f);f=m|0;m=c[f>>2]|0;if((c[3886]|0)!=-1){c[k>>2]=15544;c[k+4>>2]=14;c[k+8>>2]=0;h_(15544,k,98)}k=(c[3887]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;hG(o)|0;o=c[l>>2]|0;if(h){cb[c[o+24>>2]&127](n,d)}else{cb[c[o+28>>2]&127](n,d)}d=n;o=n;l=a[o]|0;if((l&1)==0){p=d+1|0;q=p;r=p;s=n+8|0}else{p=n+8|0;q=c[p>>2]|0;r=d+1|0;s=p}p=e|0;d=n+4|0;t=q;u=l;while(1){if((u&1)==0){v=r}else{v=c[s>>2]|0}l=u&255;if((t|0)==(v+((l&1|0)==0?l>>>1:c[d>>2]|0)|0)){break}l=a[t]|0;w=c[p>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)!=(c[w+28>>2]|0)){c[x>>2]=y+1;a[y]=l;break}if((cm[c[(c[w>>2]|0)+52>>2]&31](w,l&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2];h3(n);i=j;return}}while(0);j=bZ(4)|0;oK(j);bs(j|0,10840,132)}function kn(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[5016]|0;a[q+1|0]=a[5017]|0;a[q+2|0]=a[5018]|0;a[q+3|0]=a[5019]|0;a[q+4|0]=a[5020]|0;a[q+5|0]=a[5021]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);v=ko(u,12,c[3620]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=3653;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=3653;break}w=k+2|0}else if((h|0)==32){w=q}else{x=3653}}while(0);if((x|0)==3653){w=u}x=l|0;ip(o,f);kp(u,w,q,x,m,n,o);hG(c[o>>2]|0)|0;c[p>>2]=c[e>>2];kq(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function ko(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+16|0;h=g|0;j=h;c[j>>2]=f;c[j+4>>2]=0;j=bN(d|0)|0;d=bO(a|0,b|0,e|0,h|0)|0;if((j|0)==0){i=g;return d|0}bN(j|0)|0;i=g;return d|0}function kp(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[3982]|0)!=-1){c[n>>2]=15928;c[n+4>>2]=14;c[n+8>>2]=0;h_(15928,n,98)}n=(c[3983]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}r=k;s=c[p>>2]|0;if((c[3886]|0)!=-1){c[m>>2]=15544;c[m+4>>2]=14;c[m+8>>2]=0;h_(15544,m,98)}m=(c[3887]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}t=s;cb[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+32>>2]|0;b7[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=cm[c[(c[k>>2]|0)+28>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=cm[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1;a[y]=q;q=cm[c[(c[p>>2]|0)+28>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=ce[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+1;a[I]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=cm[c[(c[p>>2]|0)+28>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-1|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=a[J]|0;a[J]=a[K]|0;a[K]=C;J=J+1|0;K=K-1|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;h3(o);i=l;return}else{L=g+(e-b)|0;c[h>>2]=L;h3(o);i=l;return}}function kq(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g|0;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;do{if((h|0)>0){if((cf[c[(c[d>>2]|0)+48>>2]&63](d,e,h)|0)==(h|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){h2(l,q,j);if((a[l]&1)==0){r=l+1|0}else{r=c[l+8>>2]|0}if((cf[c[(c[d>>2]|0)+48>>2]&63](d,r,q)|0)==(q|0)){h3(l);break}c[m>>2]=0;c[b>>2]=0;h3(l);i=k;return}}while(0);l=n-o|0;do{if((l|0)>0){if((cf[c[(c[d>>2]|0)+48>>2]&63](d,f,l)|0)==(l|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function kr(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);t=ko(u,22,c[3620]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==32){w=r}else if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=3760;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=3760;break}w=l+2|0}else{x=3760}}while(0);if((x|0)==3760){w=u}x=m|0;ip(p,f);kp(u,w,r,x,n,o,p);hG(c[p>>2]|0)|0;c[q>>2]=c[e>>2];kq(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function ks(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+72|0;q=j|0;a[q]=a[5016]|0;a[q+1|0]=a[5017]|0;a[q+2|0]=a[5018]|0;a[q+3|0]=a[5019]|0;a[q+4|0]=a[5020]|0;a[q+5|0]=a[5021]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=k|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);t=ko(u,12,c[3620]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+t|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=3785;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=3785;break}w=k+2|0}else if((h|0)==32){w=q}else{x=3785}}while(0);if((x|0)==3785){w=u}x=l|0;ip(o,f);kp(u,w,q,x,m,n,o);hG(c[o>>2]|0)|0;c[p>>2]=c[e>>2];kq(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function kt(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+112|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+80|0;o=d+88|0;p=d+96|0;q=d+104|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);u=l|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);t=ko(u,23,c[3620]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=3810;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=3810;break}w=l+2|0}else if((j|0)==32){w=r}else{x=3810}}while(0);if((x|0)==3810){w=u}x=m|0;ip(p,f);kp(u,w,r,x,n,o,p);hG(c[p>>2]|0)|0;c[q>>2]=c[e>>2];kq(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function ku(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=c[3620]|0;if(y){w=ko(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=ko(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[16488]|0)==0;if(y){do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=kv(m,c[3620]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);w=kv(m,c[3620]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ph();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==32){F=A}else if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=3866;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=3866;break}F=E+2|0}else{G=3866}}while(0);if((G|0)==3866){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=o3(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}ph();H=0;I=0;J=c[m>>2]|0}}while(0);ip(q,f);kw(J,F,A,H,o,p,q);hG(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];kq(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){o4(I)}if((D|0)==0){i=d;return}o4(D);i=d;return}function kv(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;h=bN(b|0)|0;b=b_(a|0,d|0,g|0)|0;if((h|0)==0){i=f;return b|0}bN(h|0)|0;i=f;return b|0}function kw(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[3982]|0)!=-1){c[n>>2]=15928;c[n+4>>2]=14;c[n+8>>2]=0;h_(15928,n,98)}n=(c[3983]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}r=k;s=c[p>>2]|0;if((c[3886]|0)!=-1){c[m>>2]=15544;c[m+4>>2]=14;c[m+8>>2]=0;h_(15544,m,98)}m=(c[3887]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}t=s;cb[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=cm[c[(c[k>>2]|0)+28>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=m;v=b+1|0}else{v=b}m=f;L4704:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=3932;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=3932;break}p=k;n=cm[c[(c[p>>2]|0)+28>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1;a[q]=n;n=v+2|0;q=cm[c[(c[p>>2]|0)+28>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1;a[u]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L4704}u=a[q]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((a5(u<<24>>24|0,c[3620]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=3932}}while(0);L4719:do{if((x|0)==3932){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L4719}q=a[w]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((bU(q<<24>>24|0,c[3620]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=3932}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+32>>2]|0;b7[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=ce[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+1;a[J]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=cm[c[(c[p>>2]|0)+28>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-1|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=a[K]|0;a[K]=a[L]|0;a[L]=D;K=K+1|0;L=L-1|0;}while(K>>>0<L>>>0)}}while(0);L4758:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=cm[c[(c[L>>2]|0)+28>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L4758}}L=ce[c[(c[s>>2]|0)+12>>2]&127](t)|0;H=c[j>>2]|0;c[j>>2]=H+1;a[H]=L;M=K+1|0}else{M=y}}while(0);b7[c[(c[k>>2]|0)+32>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;h3(o);i=l;return}N=g+(e-b)|0;c[h>>2]=N;h3(o);i=l;return}function kx(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+152|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+112|0;p=d+120|0;q=d+128|0;r=d+136|0;s=d+144|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=c[3620]|0;if(y){w=ko(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=ko(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[16488]|0)==0;if(y){do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=kv(m,c[3620]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);w=kv(m,c[3620]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ph();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=4029;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=4029;break}F=E+2|0}else if((B|0)==32){F=A}else{G=4029}}while(0);if((G|0)==4029){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=o3(C<<1)|0;if((G|0)!=0){H=G;I=G;J=E;break}ph();H=0;I=0;J=c[m>>2]|0}}while(0);ip(q,f);kw(J,F,A,H,o,p,q);hG(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];kq(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){o4(I)}if((D|0)==0){i=d;return}o4(D);i=d;return}function ky(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+104|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+88|0;n=d+96|0;o=d+16|0;a[o]=a[5024]|0;a[o+1|0]=a[5025]|0;a[o+2|0]=a[5026]|0;a[o+3|0]=a[5027]|0;a[o+4|0]=a[5028]|0;a[o+5|0]=a[5029]|0;p=k|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);q=ko(p,20,c[3620]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==32){r=o}else if((h|0)==16){s=a[p]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){r=k+1|0;break}if(!((q|0)>1&s<<24>>24==48)){t=4062;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){t=4062;break}r=k+2|0}else{t=4062}}while(0);if((t|0)==4062){r=p}ip(m,f);t=m|0;m=c[t>>2]|0;if((c[3982]|0)!=-1){c[j>>2]=15928;c[j+4>>2]=14;c[j+8>>2]=0;h_(15928,j,98)}j=(c[3983]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){s=c[h+(j<<2)>>2]|0;if((s|0)==0){break}u=s;v=c[t>>2]|0;hG(v)|0;v=l|0;w=c[(c[s>>2]|0)+32>>2]|0;b7[w&15](u,p,o,v)|0;u=l+q|0;if((r|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;kq(b,n,v,x,u,f,g);i=d;return}x=l+(r-k)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;kq(b,n,v,x,u,f,g);i=d;return}}while(0);d=bZ(4)|0;oK(d);bs(d|0,10840,132)}function kz(a){a=a|0;hE(a|0);pb(a);return}function kA(a){a=a|0;hE(a|0);return}function kB(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+48|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+16|0;m=j+24|0;n=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];cl[o&31](b,d,l,f,g,h&1);i=j;return}ip(m,f);f=m|0;m=c[f>>2]|0;if((c[3884]|0)!=-1){c[k>>2]=15536;c[k+4>>2]=14;c[k+8>>2]=0;h_(15536,k,98)}k=(c[3885]|0)-1|0;g=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-g>>2>>>0>k>>>0){l=c[g+(k<<2)>>2]|0;if((l|0)==0){break}d=l;o=c[f>>2]|0;hG(o)|0;o=c[l>>2]|0;if(h){cb[c[o+24>>2]&127](n,d)}else{cb[c[o+28>>2]&127](n,d)}d=n;o=a[d]|0;if((o&1)==0){l=n+4|0;p=l;q=l;r=n+8|0}else{l=n+8|0;p=c[l>>2]|0;q=n+4|0;r=l}l=e|0;s=p;t=o;while(1){if((t&1)==0){u=q}else{u=c[r>>2]|0}o=t&255;if((o&1|0)==0){v=o>>>1}else{v=c[q>>2]|0}if((s|0)==(u+(v<<2)|0)){break}o=c[s>>2]|0;w=c[l>>2]|0;do{if((w|0)!=0){x=w+24|0;y=c[x>>2]|0;if((y|0)==(c[w+28>>2]|0)){z=cm[c[(c[w>>2]|0)+52>>2]&31](w,o)|0}else{c[x>>2]=y+4;c[y>>2]=o;z=o}if((z|0)!=-1){break}c[l>>2]=0}}while(0);s=s+4|0;t=a[d]|0}c[b>>2]=c[l>>2];ie(n);i=j;return}}while(0);j=bZ(4)|0;oK(j);bs(j|0,10840,132)}function kC(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[5016]|0;a[q+1|0]=a[5017]|0;a[q+2|0]=a[5018]|0;a[q+3|0]=a[5019]|0;a[q+4|0]=a[5020]|0;a[q+5|0]=a[5021]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);u=k|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);v=ko(u,12,c[3620]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==32){w=q}else if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=4133;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=4133;break}w=k+2|0}else{x=4133}}while(0);if((x|0)==4133){w=u}x=l|0;ip(o,f);kD(u,w,q,x,m,n,o);hG(c[o>>2]|0)|0;c[p>>2]=c[e>>2];kE(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function kD(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[3980]|0)!=-1){c[n>>2]=15920;c[n+4>>2]=14;c[n+8>>2]=0;h_(15920,n,98)}n=(c[3981]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}r=k;s=c[p>>2]|0;if((c[3884]|0)!=-1){c[m>>2]=15536;c[m+4>>2]=14;c[m+8>>2]=0;h_(15536,m,98)}m=(c[3885]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}t=s;cb[c[(c[s>>2]|0)+20>>2]&127](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}do{if((v|0)==0){p=c[(c[k>>2]|0)+48>>2]|0;b7[p&15](r,b,f,g)|0;c[j>>2]=g+(f-b<<2)}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=cm[c[(c[k>>2]|0)+44>>2]&31](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if((a[w]|0)!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=cm[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4;c[y>>2]=q;q=cm[c[(c[p>>2]|0)+44>>2]&31](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}do{q=a[z]|0;a[z]=a[A]|0;a[A]=q;z=z+1|0;A=A-1|0;}while(z>>>0<A>>>0)}}while(0);q=ce[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(x>>>0<f>>>0){n=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=(a[m]&1)==0;do{if((a[(F?n:c[B>>2]|0)+D|0]|0)==0){G=D;H=C}else{if((C|0)!=(a[(F?n:c[B>>2]|0)+D|0]|0)){G=D;H=C;break}I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=q;I=d[m]|0;G=(D>>>0<(((I&1|0)==0?I>>>1:c[y>>2]|0)-1|0)>>>0)+D|0;H=0}}while(0);F=cm[c[(c[p>>2]|0)+44>>2]&31](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break}}}E=g+(x-b<<2)|0;D=c[j>>2]|0;if((E|0)==(D|0)){break}C=D-4|0;if(E>>>0<C>>>0){J=E;K=C}else{break}do{C=c[J>>2]|0;c[J>>2]=c[K>>2];c[K>>2]=C;J=J+4|0;K=K-4|0;}while(J>>>0<K>>>0)}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0;c[h>>2]=L;h3(o);i=l;return}else{L=g+(e-b<<2)|0;c[h>>2]=L;h3(o);i=l;return}}function kE(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[l>>2];l=k|0;m=d|0;d=c[m>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g>>2;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;g=h>>2;do{if((h|0)>0){if((cf[c[(c[d>>2]|0)+48>>2]&63](d,e,g)|0)==(g|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((q|0)>0){id(l,q,j);if((a[l]&1)==0){r=l+4|0}else{r=c[l+8>>2]|0}if((cf[c[(c[d>>2]|0)+48>>2]&63](d,r,q)|0)==(q|0)){ie(l);break}c[m>>2]=0;c[b>>2]=0;ie(l);i=k;return}}while(0);l=n-o|0;o=l>>2;do{if((l|0)>0){if((cf[c[(c[d>>2]|0)+48>>2]&63](d,f,o)|0)==(o|0)){break}c[m>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[p>>2]=0;c[b>>2]=d;i=k;return}function kF(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+232|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+200|0;o=d+208|0;p=d+216|0;q=d+224|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);u=l|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);t=ko(u,22,c[3620]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+t|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((t|0)>1&s<<24>>24==48)){x=4234;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=4234;break}w=l+2|0}else if((j|0)==32){w=r}else{x=4234}}while(0);if((x|0)==4234){w=u}x=m|0;ip(p,f);kD(u,w,r,x,n,o,p);hG(c[p>>2]|0)|0;c[q>>2]=c[e>>2];kE(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function kG(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+144|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+8|0;l=d+24|0;m=d+112|0;n=d+120|0;o=d+128|0;p=d+136|0;q=j|0;a[q]=a[5016]|0;a[q+1|0]=a[5017]|0;a[q+2|0]=a[5018]|0;a[q+3|0]=a[5019]|0;a[q+4|0]=a[5020]|0;a[q+5|0]=a[5021]|0;r=j+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=j+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=k|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);v=ko(u,12,c[3620]|0,q,(q=i,i=i+8|0,c[q>>2]=h,q)|0)|0;i=q;q=k+v|0;h=c[s>>2]&176;do{if((h|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=k+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=4259;break}s=a[k+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=4259;break}w=k+2|0}else if((h|0)==32){w=q}else{x=4259}}while(0);if((x|0)==4259){w=u}x=l|0;ip(o,f);kD(u,w,q,x,m,n,o);hG(c[o>>2]|0)|0;c[p>>2]=c[e>>2];kE(b,p,x,c[m>>2]|0,c[n>>2]|0,f,g);i=d;return}function kH(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+240|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+32|0;n=d+208|0;o=d+216|0;p=d+224|0;q=d+232|0;c[k>>2]=37;c[k+4>>2]=0;r=k;k=r+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=k}else{a[k]=43;u=r+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;a[v+1|0]=108;u=v+2|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=117}}while(0);u=l|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);v=ko(u,23,c[3620]|0,r,(r=i,i=i+16|0,c[r>>2]=h,c[r+8>>2]=j,r)|0)|0;i=r;r=l+v|0;j=c[s>>2]&176;do{if((j|0)==16){s=a[u]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){w=l+1|0;break}if(!((v|0)>1&s<<24>>24==48)){x=4284;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){x=4284;break}w=l+2|0}else if((j|0)==32){w=r}else{x=4284}}while(0);if((x|0)==4284){w=u}x=m|0;ip(p,f);kD(u,w,r,x,n,o,p);hG(c[p>>2]|0)|0;c[q>>2]=c[e>>2];kE(b,q,x,c[n>>2]|0,c[o>>2]|0,f,g);i=d;return}function kI(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){if((k&1|0)==0){a[x]=97;y=0;break}else{a[x]=65;y=0;break}}else{a[x]=46;v=x+2|0;a[x+1|0]=42;if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=c[3620]|0;if(y){w=ko(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=ko(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[16488]|0)==0;if(y){do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=kv(m,c[3620]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);w=kv(m,c[3620]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ph();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=4340;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=4340;break}F=E+2|0}else if((B|0)==32){F=A}else{G=4340}}while(0);if((G|0)==4340){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=o3(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}ph();H=B;I=B;J=c[m>>2]|0}}while(0);ip(q,f);kJ(J,F,A,H,o,p,q);hG(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];kE(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){o4(I)}if((D|0)==0){i=d;return}o4(D);i=d;return}function kJ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+48|0;m=l|0;n=l+16|0;o=l+32|0;p=k|0;k=c[p>>2]|0;if((c[3980]|0)!=-1){c[n>>2]=15920;c[n+4>>2]=14;c[n+8>>2]=0;h_(15920,n,98)}n=(c[3981]|0)-1|0;q=c[k+8>>2]|0;if((c[k+12>>2]|0)-q>>2>>>0<=n>>>0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bZ(4)|0;s=r;oK(s);bs(r|0,10840,132)}r=k;s=c[p>>2]|0;if((c[3884]|0)!=-1){c[m>>2]=15536;c[m+4>>2]=14;c[m+8>>2]=0;h_(15536,m,98)}m=(c[3885]|0)-1|0;p=c[s+8>>2]|0;if((c[s+12>>2]|0)-p>>2>>>0<=m>>>0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bZ(4)|0;u=t;oK(u);bs(t|0,10840,132)}t=s;cb[c[(c[s>>2]|0)+20>>2]&127](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=cm[c[(c[k>>2]|0)+44>>2]&31](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L5243:do{if((m-v|0)>1){if((a[v]|0)!=48){w=v;x=4395;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=4395;break}p=k;n=cm[c[(c[p>>2]|0)+44>>2]&31](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4;c[q>>2]=n;n=v+2|0;q=cm[c[(c[p>>2]|0)+44>>2]&31](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4;c[u>>2]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L5243}u=a[q]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((a5(u<<24>>24|0,c[3620]|0)|0)==0){y=q;z=n;break}else{q=q+1|0}}}else{w=v;x=4395}}while(0);L5258:do{if((x|0)==4395){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L5258}q=a[w]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((bU(q<<24>>24|0,c[3620]|0)|0)==0){y=w;z=v;break}else{w=w+1|0;x=4395}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+48>>2]|0;b7[u&15](r,z,y,v)|0;c[j>>2]=(c[j>>2]|0)+(y-z<<2)}else{do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}do{v=a[B]|0;a[B]=a[C]|0;a[C]=v;B=B+1|0;C=C-1|0;}while(B>>>0<C>>>0)}}while(0);q=ce[c[(c[s>>2]|0)+16>>2]&127](t)|0;if(z>>>0<y>>>0){v=x+1|0;u=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=(a[w]&1)==0;do{if((a[(G?v:c[n>>2]|0)+E|0]|0)>0){if((D|0)!=(a[(G?v:c[n>>2]|0)+E|0]|0)){H=E;I=D;break}J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=q;J=d[w]|0;H=(E>>>0<(((J&1|0)==0?J>>>1:c[u>>2]|0)-1|0)>>>0)+E|0;I=0}else{H=E;I=D}}while(0);G=cm[c[(c[p>>2]|0)+44>>2]&31](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break}}}F=g+(z-b<<2)|0;E=c[j>>2]|0;if((F|0)==(E|0)){break}D=E-4|0;if(F>>>0<D>>>0){K=F;L=D}else{break}do{D=c[K>>2]|0;c[K>>2]=c[L>>2];c[L>>2]=D;K=K+4|0;L=L-4|0;}while(K>>>0<L>>>0)}}while(0);L5297:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=cm[c[(c[L>>2]|0)+44>>2]&31](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L5297}}L=ce[c[(c[s>>2]|0)+12>>2]&127](t)|0;H=c[j>>2]|0;c[j>>2]=H+4;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);b7[c[(c[k>>2]|0)+48>>2]&15](r,M,f,c[j>>2]|0)|0;r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r;c[h>>2]=N;h3(o);i=l;return}N=g+(e-b<<2)|0;c[h>>2]=N;h3(o);i=l;return}function kK(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+320|0;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;l=d+8|0;m=d+40|0;n=d+48|0;o=d+280|0;p=d+288|0;q=d+296|0;r=d+304|0;s=d+312|0;c[k>>2]=37;c[k+4>>2]=0;t=k;k=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){w=k}else{a[k]=43;w=t+2|0}if((v&1024|0)==0){x=w}else{a[w]=35;x=w+1|0}w=v&260;k=v>>>14;do{if((w|0)==260){a[x]=76;v=x+1|0;if((k&1|0)==0){a[v]=97;y=0;break}else{a[v]=65;y=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;v=x+3|0;if((w|0)==4){if((k&1|0)==0){a[v]=102;y=1;break}else{a[v]=70;y=1;break}}else if((w|0)==256){if((k&1|0)==0){a[v]=101;y=1;break}else{a[v]=69;y=1;break}}else{if((k&1|0)==0){a[v]=103;y=1;break}else{a[v]=71;y=1;break}}}}while(0);k=l|0;c[m>>2]=k;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=c[3620]|0;if(y){w=ko(k,30,l,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;A=w}else{w=ko(k,30,l,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;A=w}do{if((A|0)>29){w=(a[16488]|0)==0;if(y){do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=kv(m,c[3620]|0,t,(z=i,i=i+16|0,c[z>>2]=c[f+8>>2],h[z+8>>3]=j,z)|0)|0;i=z;B=l}else{do{if(w){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);w=kv(m,c[3620]|0,t,(z=i,i=i+8|0,h[z>>3]=j,z)|0)|0;i=z;B=w}w=c[m>>2]|0;if((w|0)!=0){C=B;D=w;E=w;break}ph();w=c[m>>2]|0;C=B;D=w;E=w}else{C=A;D=0;E=c[m>>2]|0}}while(0);A=E+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[E]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){F=E+1|0;break}if(!((C|0)>1&u<<24>>24==48)){G=4492;break}u=a[E+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){G=4492;break}F=E+2|0}else if((B|0)==32){F=A}else{G=4492}}while(0);if((G|0)==4492){F=E}do{if((E|0)==(k|0)){H=n|0;I=0;J=k}else{G=o3(C<<3)|0;B=G;if((G|0)!=0){H=B;I=B;J=E;break}ph();H=B;I=B;J=c[m>>2]|0}}while(0);ip(q,f);kJ(J,F,A,H,o,p,q);hG(c[q>>2]|0)|0;q=e|0;c[s>>2]=c[q>>2];kE(r,s,H,c[o>>2]|0,c[p>>2]|0,f,g);g=c[r>>2]|0;c[q>>2]=g;c[b>>2]=g;if((I|0)!=0){o4(I)}if((D|0)==0){i=d;return}o4(D);i=d;return}function kL(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=i;i=i+216|0;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=d+24|0;l=d+48|0;m=d+200|0;n=d+208|0;o=d+16|0;a[o]=a[5024]|0;a[o+1|0]=a[5025]|0;a[o+2|0]=a[5026]|0;a[o+3|0]=a[5027]|0;a[o+4|0]=a[5028]|0;a[o+5|0]=a[5029]|0;p=k|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);q=ko(p,20,c[3620]|0,o,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;o=k+q|0;h=c[f+4>>2]&176;do{if((h|0)==16){r=a[p]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){s=k+1|0;break}if(!((q|0)>1&r<<24>>24==48)){t=4525;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){t=4525;break}s=k+2|0}else if((h|0)==32){s=o}else{t=4525}}while(0);if((t|0)==4525){s=p}ip(m,f);t=m|0;m=c[t>>2]|0;if((c[3980]|0)!=-1){c[j>>2]=15920;c[j+4>>2]=14;c[j+8>>2]=0;h_(15920,j,98)}j=(c[3981]|0)-1|0;h=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-h>>2>>>0>j>>>0){r=c[h+(j<<2)>>2]|0;if((r|0)==0){break}u=r;v=c[t>>2]|0;hG(v)|0;v=l|0;w=c[(c[r>>2]|0)+48>>2]|0;b7[w&15](u,p,o,v)|0;u=l+(q<<2)|0;if((s|0)==(o|0)){x=u;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;kE(b,n,v,x,u,f,g);i=d;return}x=l+(s-k<<2)|0;y=e|0;z=c[y>>2]|0;A=n|0;c[A>>2]=z;kE(b,n,v,x,u,f,g);i=d;return}}while(0);d=bZ(4)|0;oK(d);bs(d|0,10840,132)}function kM(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;n=i;i=i+48|0;o=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[o>>2];o=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[o>>2];o=n|0;p=n+16|0;q=n+24|0;r=n+32|0;s=n+40|0;ip(p,h);t=p|0;p=c[t>>2]|0;if((c[3982]|0)!=-1){c[o>>2]=15928;c[o+4>>2]=14;c[o+8>>2]=0;h_(15928,o,98)}o=(c[3983]|0)-1|0;u=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-u>>2>>>0>o>>>0){v=c[u+(o<<2)>>2]|0;if((v|0)==0){break}w=v;x=c[t>>2]|0;hG(x)|0;c[j>>2]=0;x=f|0;L5427:do{if((l|0)==(m|0)){y=4604}else{z=g|0;A=v;B=v;C=v+8|0;D=e;E=r|0;F=s|0;G=q|0;H=l;I=0;L5429:while(1){J=I;while(1){if((J|0)!=0){y=4604;break L5427}K=c[x>>2]|0;do{if((K|0)==0){L=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){L=K;break}if((ce[c[(c[K>>2]|0)+36>>2]&127](K)|0)!=-1){L=K;break}c[x>>2]=0;L=0}}while(0);K=(L|0)==0;M=c[z>>2]|0;L5439:do{if((M|0)==0){y=4557}else{do{if((c[M+12>>2]|0)==(c[M+16>>2]|0)){if((ce[c[(c[M>>2]|0)+36>>2]&127](M)|0)!=-1){break}c[z>>2]=0;y=4557;break L5439}}while(0);if(K){N=M}else{y=4558;break L5429}}}while(0);if((y|0)==4557){y=0;if(K){y=4558;break L5429}else{N=0}}if((cf[c[(c[A>>2]|0)+36>>2]&63](w,a[H]|0,0)|0)<<24>>24==37){y=4561;break}M=a[H]|0;if(M<<24>>24>=0){O=c[C>>2]|0;if((b[O+(M<<24>>24<<1)>>1]&8192)!=0){P=H;y=4572;break}}Q=L+12|0;M=c[Q>>2]|0;R=L+16|0;if((M|0)==(c[R>>2]|0)){S=(ce[c[(c[L>>2]|0)+36>>2]&127](L)|0)&255}else{S=a[M]|0}M=cm[c[(c[B>>2]|0)+12>>2]&31](w,S)|0;if(M<<24>>24==(cm[c[(c[B>>2]|0)+12>>2]&31](w,a[H]|0)|0)<<24>>24){y=4599;break}c[j>>2]=4;J=4}L5457:do{if((y|0)==4572){while(1){y=0;J=P+1|0;if((J|0)==(m|0)){T=m;break}M=a[J]|0;if(M<<24>>24<0){T=J;break}if((b[O+(M<<24>>24<<1)>>1]&8192)==0){T=J;break}else{P=J;y=4572}}K=L;J=N;while(1){do{if((K|0)==0){U=0}else{if((c[K+12>>2]|0)!=(c[K+16>>2]|0)){U=K;break}if((ce[c[(c[K>>2]|0)+36>>2]&127](K)|0)!=-1){U=K;break}c[x>>2]=0;U=0}}while(0);M=(U|0)==0;do{if((J|0)==0){y=4585}else{if((c[J+12>>2]|0)!=(c[J+16>>2]|0)){if(M){V=J;break}else{W=T;break L5457}}if((ce[c[(c[J>>2]|0)+36>>2]&127](J)|0)==-1){c[z>>2]=0;y=4585;break}else{if(M^(J|0)==0){V=J;break}else{W=T;break L5457}}}}while(0);if((y|0)==4585){y=0;if(M){W=T;break L5457}else{V=0}}X=U+12|0;Y=c[X>>2]|0;Z=U+16|0;if((Y|0)==(c[Z>>2]|0)){_=(ce[c[(c[U>>2]|0)+36>>2]&127](U)|0)&255}else{_=a[Y]|0}if(_<<24>>24<0){W=T;break L5457}if((b[(c[C>>2]|0)+(_<<24>>24<<1)>>1]&8192)==0){W=T;break L5457}Y=c[X>>2]|0;if((Y|0)==(c[Z>>2]|0)){Z=c[(c[U>>2]|0)+40>>2]|0;ce[Z&127](U)|0;K=U;J=V;continue}else{c[X>>2]=Y+1;K=U;J=V;continue}}}else if((y|0)==4561){y=0;J=H+1|0;if((J|0)==(m|0)){y=4562;break L5429}K=cf[c[(c[A>>2]|0)+36>>2]&63](w,a[J]|0,0)|0;if((K<<24>>24|0)==69|(K<<24>>24|0)==48){Y=H+2|0;if((Y|0)==(m|0)){y=4565;break L5429}$=K;aa=cf[c[(c[A>>2]|0)+36>>2]&63](w,a[Y]|0,0)|0;ab=Y}else{$=0;aa=K;ab=J}J=c[(c[D>>2]|0)+36>>2]|0;c[E>>2]=L;c[F>>2]=N;ck[J&7](q,e,r,s,h,j,k,aa,$);c[x>>2]=c[G>>2];W=ab+1|0}else if((y|0)==4599){y=0;J=c[Q>>2]|0;if((J|0)==(c[R>>2]|0)){K=c[(c[L>>2]|0)+40>>2]|0;ce[K&127](L)|0}else{c[Q>>2]=J+1}W=H+1|0}}while(0);if((W|0)==(m|0)){y=4604;break L5427}H=W;I=c[j>>2]|0}if((y|0)==4565){c[j>>2]=4;ac=L;break}else if((y|0)==4562){c[j>>2]=4;ac=L;break}else if((y|0)==4558){c[j>>2]=4;ac=L;break}}}while(0);if((y|0)==4604){ac=c[x>>2]|0}w=f|0;do{if((ac|0)!=0){if((c[ac+12>>2]|0)!=(c[ac+16>>2]|0)){break}if((ce[c[(c[ac>>2]|0)+36>>2]&127](ac)|0)!=-1){break}c[w>>2]=0}}while(0);x=c[w>>2]|0;v=(x|0)==0;I=g|0;H=c[I>>2]|0;L5515:do{if((H|0)==0){y=4614}else{do{if((c[H+12>>2]|0)==(c[H+16>>2]|0)){if((ce[c[(c[H>>2]|0)+36>>2]&127](H)|0)!=-1){break}c[I>>2]=0;y=4614;break L5515}}while(0);if(!v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);do{if((y|0)==4614){if(v){break}ad=d|0;c[ad>>2]=x;i=n;return}}while(0);c[j>>2]=c[j>>2]|2;ad=d|0;c[ad>>2]=x;i=n;return}}while(0);n=bZ(4)|0;oK(n);bs(n|0,10840,132)}function kN(a){a=a|0;hE(a|0);pb(a);return}function kO(a){a=a|0;hE(a|0);return}function kP(a){a=a|0;return 2}function kQ(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];kM(a,b,k,l,f,g,h,5008,5016);i=j;return}function kR(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=ce[c[(c[n>>2]|0)+20>>2]&127](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=o;e=a[o]|0;if((e&1)==0){p=f+1|0;q=f+1|0}else{f=c[o+8>>2]|0;p=f;q=f}f=e&255;if((f&1|0)==0){r=f>>>1}else{r=c[o+4>>2]|0}kM(b,d,l,m,g,h,j,q,p+r|0);i=k;return}function kS(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;ip(m,f);f=m|0;m=c[f>>2]|0;if((c[3982]|0)!=-1){c[l>>2]=15928;c[l+4>>2]=14;c[l+8>>2]=0;h_(15928,l,98)}l=(c[3983]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;hG(o)|0;o=c[e>>2]|0;q=b+8|0;r=ce[c[c[q>>2]>>2]&127](q)|0;c[k>>2]=o;o=(jw(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bZ(4)|0;oK(j);bs(j|0,10840,132)}function kT(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;ip(m,f);f=m|0;m=c[f>>2]|0;if((c[3982]|0)!=-1){c[l>>2]=15928;c[l+4>>2]=14;c[l+8>>2]=0;h_(15928,l,98)}l=(c[3983]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;hG(o)|0;o=c[e>>2]|0;q=b+8|0;r=ce[c[(c[q>>2]|0)+4>>2]&127](q)|0;c[k>>2]=o;o=(jw(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bZ(4)|0;oK(j);bs(j|0,10840,132)}function kU(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;ip(l,f);f=l|0;l=c[f>>2]|0;if((c[3982]|0)!=-1){c[k>>2]=15928;c[k+4>>2]=14;c[k+8>>2]=0;h_(15928,k,98)}k=(c[3983]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;hG(n)|0;c[j>>2]=c[e>>2];n=kZ(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=bZ(4)|0;oK(b);bs(b|0,10840,132)}function kV(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;ip(z,g);_=z|0;z=c[_>>2]|0;if((c[3982]|0)!=-1){c[y>>2]=15928;c[y+4>>2]=14;c[y+8>>2]=0;h_(15928,y,98)}y=(c[3983]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;hG(aa)|0;L5592:do{switch(k<<24>>24|0){case 99:{aa=d+8|0;ac=ce[c[(c[aa>>2]|0)+12>>2]&127](aa)|0;aa=e|0;c[B>>2]=c[aa>>2];c[C>>2]=c[f>>2];ad=ac;ae=a[ac]|0;if((ae&1)==0){af=ad+1|0;ag=ad+1|0}else{ad=c[ac+8>>2]|0;af=ad;ag=ad}ad=ae&255;if((ad&1|0)==0){ah=ad>>>1}else{ah=c[ac+4>>2]|0}kM(A,d,B,C,g,h,j,ag,af+ah|0);c[aa>>2]=c[A>>2];break};case 72:{c[u>>2]=c[f>>2];aa=kZ(e,u,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L5592}else{c[h>>2]=ac|4;break L5592}break};case 97:case 65:{ac=c[f>>2]|0;aa=d+8|0;ad=ce[c[c[aa>>2]>>2]&127](aa)|0;c[x>>2]=ac;ac=(jw(e,x,ad,ad+168|0,ab,h,0)|0)-ad|0;if((ac|0)>=168){break L5592}c[j+24>>2]=((ac|0)/12|0|0)%7|0;break};case 106:{c[s>>2]=c[f>>2];ac=kZ(e,s,h,ab,3)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ac|0)<366){c[j+28>>2]=ac;break L5592}else{c[h>>2]=ad|4;break L5592}break};case 68:{ad=e|0;c[E>>2]=c[ad>>2];c[F>>2]=c[f>>2];kM(D,d,E,F,g,h,j,5e3,5008);c[ad>>2]=c[D>>2];break};case 109:{c[r>>2]=c[f>>2];ad=(kZ(e,r,h,ab,2)|0)-1|0;ac=c[h>>2]|0;if((ac&4|0)==0&(ad|0)<12){c[j+16>>2]=ad;break L5592}else{c[h>>2]=ac|4;break L5592}break};case 77:{c[q>>2]=c[f>>2];ac=kZ(e,q,h,ab,2)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ac|0)<60){c[j+4>>2]=ac;break L5592}else{c[h>>2]=ad|4;break L5592}break};case 110:case 116:{c[J>>2]=c[f>>2];kW(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];kX(d,j+8|0,e,K,h,ab);break};case 114:{ad=e|0;c[M>>2]=c[ad>>2];c[N>>2]=c[f>>2];kM(L,d,M,N,g,h,j,4976,4987);c[ad>>2]=c[L>>2];break};case 82:{ad=e|0;c[P>>2]=c[ad>>2];c[Q>>2]=c[f>>2];kM(O,d,P,Q,g,h,j,4968,4973);c[ad>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];ad=kZ(e,p,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(ad|0)<61){c[j>>2]=ad;break L5592}else{c[h>>2]=ac|4;break L5592}break};case 84:{ac=e|0;c[S>>2]=c[ac>>2];c[T>>2]=c[f>>2];kM(R,d,S,T,g,h,j,4960,4968);c[ac>>2]=c[R>>2];break};case 119:{c[o>>2]=c[f>>2];ac=kZ(e,o,h,ab,1)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ac|0)<7){c[j+24>>2]=ac;break L5592}else{c[h>>2]=ad|4;break L5592}break};case 120:{ad=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];cg[ad&127](b,d,U,V,g,h,j);i=l;return};case 88:{ad=d+8|0;ac=ce[c[(c[ad>>2]|0)+24>>2]&127](ad)|0;ad=e|0;c[X>>2]=c[ad>>2];c[Y>>2]=c[f>>2];aa=ac;ae=a[ac]|0;if((ae&1)==0){ai=aa+1|0;aj=aa+1|0}else{aa=c[ac+8>>2]|0;ai=aa;aj=aa}aa=ae&255;if((aa&1|0)==0){ak=aa>>>1}else{ak=c[ac+4>>2]|0}kM(W,d,X,Y,g,h,j,aj,ai+ak|0);c[ad>>2]=c[W>>2];break};case 121:{c[n>>2]=c[f>>2];ad=kZ(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L5592}if((ad|0)<69){al=ad+2e3|0}else{al=(ad-69|0)>>>0<31>>>0?ad+1900|0:ad}c[j+20>>2]=al-1900;break};case 89:{c[m>>2]=c[f>>2];ad=kZ(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L5592}c[j+20>>2]=ad-1900;break};case 37:{c[Z>>2]=c[f>>2];kY(0,e,Z,h,ab);break};case 98:case 66:case 104:{ad=c[f>>2]|0;ac=d+8|0;aa=ce[c[(c[ac>>2]|0)+4>>2]&127](ac)|0;c[w>>2]=ad;ad=(jw(e,w,aa,aa+288|0,ab,h,0)|0)-aa|0;if((ad|0)>=288){break L5592}c[j+16>>2]=((ad|0)/12|0|0)%12|0;break};case 70:{ad=e|0;c[H>>2]=c[ad>>2];c[I>>2]=c[f>>2];kM(G,d,H,I,g,h,j,4992,5e3);c[ad>>2]=c[G>>2];break};case 100:case 101:{ad=j+12|0;c[v>>2]=c[f>>2];aa=kZ(e,v,h,ab,2)|0;ac=c[h>>2]|0;do{if((ac&4|0)==0){if((aa-1|0)>>>0>=31>>>0){break}c[ad>>2]=aa;break L5592}}while(0);c[h>>2]=ac|4;break};case 73:{aa=j+8|0;c[t>>2]=c[f>>2];ad=kZ(e,t,h,ab,2)|0;ae=c[h>>2]|0;do{if((ae&4|0)==0){if((ad-1|0)>>>0>=12>>>0){break}c[aa>>2]=ad;break L5592}}while(0);c[h>>2]=ae|4;break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=bZ(4)|0;oK(l);bs(l|0,10840,132)}function kW(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;j=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[j>>2];j=e|0;e=f|0;f=h+8|0;L5673:while(1){h=c[j>>2]|0;do{if((h|0)==0){k=0}else{if((c[h+12>>2]|0)!=(c[h+16>>2]|0)){k=h;break}if((ce[c[(c[h>>2]|0)+36>>2]&127](h)|0)==-1){c[j>>2]=0;k=0;break}else{k=c[j>>2]|0;break}}}while(0);h=(k|0)==0;l=c[e>>2]|0;L5682:do{if((l|0)==0){m=4754}else{do{if((c[l+12>>2]|0)==(c[l+16>>2]|0)){if((ce[c[(c[l>>2]|0)+36>>2]&127](l)|0)!=-1){break}c[e>>2]=0;m=4754;break L5682}}while(0);if(h){n=l;o=0}else{p=l;q=0;break L5673}}}while(0);if((m|0)==4754){m=0;if(h){p=0;q=1;break}else{n=0;o=1}}l=c[j>>2]|0;r=c[l+12>>2]|0;if((r|0)==(c[l+16>>2]|0)){s=(ce[c[(c[l>>2]|0)+36>>2]&127](l)|0)&255}else{s=a[r]|0}if(s<<24>>24<0){p=n;q=o;break}if((b[(c[f>>2]|0)+(s<<24>>24<<1)>>1]&8192)==0){p=n;q=o;break}r=c[j>>2]|0;l=r+12|0;t=c[l>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;ce[u&127](r)|0;continue}else{c[l>>2]=t+1;continue}}o=c[j>>2]|0;do{if((o|0)==0){v=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){v=o;break}if((ce[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[j>>2]=0;v=0;break}else{v=c[j>>2]|0;break}}}while(0);j=(v|0)==0;do{if(q){m=4773}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(!(j^(p|0)==0)){break}i=d;return}if((ce[c[(c[p>>2]|0)+36>>2]&127](p)|0)==-1){c[e>>2]=0;m=4773;break}if(!j){break}i=d;return}}while(0);do{if((m|0)==4773){if(j){break}i=d;return}}while(0);c[g>>2]=c[g>>2]|2;i=d;return}function kX(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=ce[c[(c[l>>2]|0)+8>>2]&127](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=jw(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function kY(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;b=i;h=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[h>>2];h=d|0;d=c[h>>2]|0;do{if((d|0)==0){j=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){j=d;break}if((ce[c[(c[d>>2]|0)+36>>2]&127](d)|0)==-1){c[h>>2]=0;j=0;break}else{j=c[h>>2]|0;break}}}while(0);d=(j|0)==0;j=e|0;e=c[j>>2]|0;L5756:do{if((e|0)==0){k=4811}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((ce[c[(c[e>>2]|0)+36>>2]&127](e)|0)!=-1){break}c[j>>2]=0;k=4811;break L5756}}while(0);if(d){l=e;m=0}else{k=4812}}}while(0);if((k|0)==4811){if(d){k=4812}else{l=0;m=1}}if((k|0)==4812){c[f>>2]=c[f>>2]|6;i=b;return}d=c[h>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){n=(ce[c[(c[d>>2]|0)+36>>2]&127](d)|0)&255}else{n=a[e]|0}if((cf[c[(c[g>>2]|0)+36>>2]&63](g,n,0)|0)<<24>>24!=37){c[f>>2]=c[f>>2]|4;i=b;return}n=c[h>>2]|0;g=n+12|0;e=c[g>>2]|0;if((e|0)==(c[n+16>>2]|0)){d=c[(c[n>>2]|0)+40>>2]|0;ce[d&127](n)|0}else{c[g>>2]=e+1}e=c[h>>2]|0;do{if((e|0)==0){o=0}else{if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){o=e;break}if((ce[c[(c[e>>2]|0)+36>>2]&127](e)|0)==-1){c[h>>2]=0;o=0;break}else{o=c[h>>2]|0;break}}}while(0);h=(o|0)==0;do{if(m){k=4831}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){if(!(h^(l|0)==0)){break}i=b;return}if((ce[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1){c[j>>2]=0;k=4831;break}if(!h){break}i=b;return}}while(0);do{if((k|0)==4831){if(h){break}i=b;return}}while(0);c[f>>2]=c[f>>2]|2;i=b;return}function kZ(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;j=i;k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=0}else{if((c[d+12>>2]|0)!=(c[d+16>>2]|0)){l=d;break}if((ce[c[(c[d>>2]|0)+36>>2]&127](d)|0)==-1){c[k>>2]=0;l=0;break}else{l=c[k>>2]|0;break}}}while(0);d=(l|0)==0;l=e|0;e=c[l>>2]|0;L5810:do{if((e|0)==0){m=4851}else{do{if((c[e+12>>2]|0)==(c[e+16>>2]|0)){if((ce[c[(c[e>>2]|0)+36>>2]&127](e)|0)!=-1){break}c[l>>2]=0;m=4851;break L5810}}while(0);if(d){n=e}else{m=4852}}}while(0);if((m|0)==4851){if(d){m=4852}else{n=0}}if((m|0)==4852){c[f>>2]=c[f>>2]|6;o=0;i=j;return o|0}d=c[k>>2]|0;e=c[d+12>>2]|0;if((e|0)==(c[d+16>>2]|0)){p=(ce[c[(c[d>>2]|0)+36>>2]&127](d)|0)&255}else{p=a[e]|0}do{if(p<<24>>24>=0){e=g+8|0;if((b[(c[e>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0){break}d=g;q=(cf[c[(c[d>>2]|0)+36>>2]&63](g,p,0)|0)<<24>>24;r=c[k>>2]|0;s=r+12|0;t=c[s>>2]|0;if((t|0)==(c[r+16>>2]|0)){u=c[(c[r>>2]|0)+40>>2]|0;ce[u&127](r)|0;v=q;w=h;x=n}else{c[s>>2]=t+1;v=q;w=h;x=n}while(1){y=v-48|0;q=w-1|0;t=c[k>>2]|0;do{if((t|0)==0){z=0}else{if((c[t+12>>2]|0)!=(c[t+16>>2]|0)){z=t;break}if((ce[c[(c[t>>2]|0)+36>>2]&127](t)|0)==-1){c[k>>2]=0;z=0;break}else{z=c[k>>2]|0;break}}}while(0);t=(z|0)==0;if((x|0)==0){A=z;B=0}else{do{if((c[x+12>>2]|0)==(c[x+16>>2]|0)){if((ce[c[(c[x>>2]|0)+36>>2]&127](x)|0)!=-1){C=x;break}c[l>>2]=0;C=0}else{C=x}}while(0);A=c[k>>2]|0;B=C}D=(B|0)==0;if(!((t^D)&(q|0)>0)){m=4881;break}s=c[A+12>>2]|0;if((s|0)==(c[A+16>>2]|0)){E=(ce[c[(c[A>>2]|0)+36>>2]&127](A)|0)&255}else{E=a[s]|0}if(E<<24>>24<0){o=y;m=4899;break}if((b[(c[e>>2]|0)+(E<<24>>24<<1)>>1]&2048)==0){o=y;m=4897;break}s=((cf[c[(c[d>>2]|0)+36>>2]&63](g,E,0)|0)<<24>>24)+(y*10|0)|0;r=c[k>>2]|0;u=r+12|0;F=c[u>>2]|0;if((F|0)==(c[r+16>>2]|0)){G=c[(c[r>>2]|0)+40>>2]|0;ce[G&127](r)|0;v=s;w=q;x=B;continue}else{c[u>>2]=F+1;v=s;w=q;x=B;continue}}if((m|0)==4881){do{if((A|0)==0){H=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){H=A;break}if((ce[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[k>>2]=0;H=0;break}else{H=c[k>>2]|0;break}}}while(0);d=(H|0)==0;L5867:do{if(D){m=4891}else{do{if((c[B+12>>2]|0)==(c[B+16>>2]|0)){if((ce[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){break}c[l>>2]=0;m=4891;break L5867}}while(0);if(d){o=y}else{break}i=j;return o|0}}while(0);do{if((m|0)==4891){if(d){break}else{o=y}i=j;return o|0}}while(0);c[f>>2]=c[f>>2]|2;o=y;i=j;return o|0}else if((m|0)==4897){i=j;return o|0}else if((m|0)==4899){i=j;return o|0}}}while(0);c[f>>2]=c[f>>2]|4;o=0;i=j;return o|0}function k_(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0;l=i;i=i+48|0;m=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[m>>2];m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=l|0;n=l+16|0;o=l+24|0;p=l+32|0;q=l+40|0;ip(n,f);r=n|0;n=c[r>>2]|0;if((c[3980]|0)!=-1){c[m>>2]=15920;c[m+4>>2]=14;c[m+8>>2]=0;h_(15920,m,98)}m=(c[3981]|0)-1|0;s=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;v=c[r>>2]|0;hG(v)|0;c[g>>2]=0;v=d|0;L5890:do{if((j|0)==(k|0)){w=4971}else{x=e|0;y=t;z=t;A=t;B=b;C=p|0;D=q|0;E=o|0;F=j;G=0;L5892:while(1){H=G;while(1){if((H|0)!=0){w=4971;break L5890}I=c[v>>2]|0;do{if((I|0)==0){J=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){L=ce[c[(c[I>>2]|0)+36>>2]&127](I)|0}else{L=c[K>>2]|0}if((L|0)!=-1){J=I;break}c[v>>2]=0;J=0}}while(0);I=(J|0)==0;K=c[x>>2]|0;do{if((K|0)==0){w=4923}else{M=c[K+12>>2]|0;if((M|0)==(c[K+16>>2]|0)){N=ce[c[(c[K>>2]|0)+36>>2]&127](K)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[x>>2]=0;w=4923;break}else{if(I^(K|0)==0){O=K;break}else{w=4925;break L5892}}}}while(0);if((w|0)==4923){w=0;if(I){w=4925;break L5892}else{O=0}}if((cf[c[(c[y>>2]|0)+52>>2]&63](u,c[F>>2]|0,0)|0)<<24>>24==37){w=4928;break}if(cf[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[F>>2]|0)|0){P=F;w=4938;break}Q=J+12|0;K=c[Q>>2]|0;R=J+16|0;if((K|0)==(c[R>>2]|0)){S=ce[c[(c[J>>2]|0)+36>>2]&127](J)|0}else{S=c[K>>2]|0}K=cm[c[(c[A>>2]|0)+28>>2]&31](u,S)|0;if((K|0)==(cm[c[(c[A>>2]|0)+28>>2]&31](u,c[F>>2]|0)|0)){w=4966;break}c[g>>2]=4;H=4}L5924:do{if((w|0)==4928){w=0;H=F+4|0;if((H|0)==(k|0)){w=4929;break L5892}K=cf[c[(c[y>>2]|0)+52>>2]&63](u,c[H>>2]|0,0)|0;if((K<<24>>24|0)==69|(K<<24>>24|0)==48){M=F+8|0;if((M|0)==(k|0)){w=4932;break L5892}T=K;U=cf[c[(c[y>>2]|0)+52>>2]&63](u,c[M>>2]|0,0)|0;V=M}else{T=0;U=K;V=H}H=c[(c[B>>2]|0)+36>>2]|0;c[C>>2]=J;c[D>>2]=O;ck[H&7](o,b,p,q,f,g,h,U,T);c[v>>2]=c[E>>2];W=V+4|0}else if((w|0)==4966){w=0;H=c[Q>>2]|0;if((H|0)==(c[R>>2]|0)){K=c[(c[J>>2]|0)+40>>2]|0;ce[K&127](J)|0}else{c[Q>>2]=H+4}W=F+4|0}else if((w|0)==4938){while(1){w=0;H=P+4|0;if((H|0)==(k|0)){X=k;break}if(cf[c[(c[z>>2]|0)+12>>2]&63](u,8192,c[H>>2]|0)|0){P=H;w=4938}else{X=H;break}}I=J;H=O;while(1){do{if((I|0)==0){Y=0}else{K=c[I+12>>2]|0;if((K|0)==(c[I+16>>2]|0)){Z=ce[c[(c[I>>2]|0)+36>>2]&127](I)|0}else{Z=c[K>>2]|0}if((Z|0)!=-1){Y=I;break}c[v>>2]=0;Y=0}}while(0);K=(Y|0)==0;do{if((H|0)==0){w=4953}else{M=c[H+12>>2]|0;if((M|0)==(c[H+16>>2]|0)){_=ce[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{_=c[M>>2]|0}if((_|0)==-1){c[x>>2]=0;w=4953;break}else{if(K^(H|0)==0){$=H;break}else{W=X;break L5924}}}}while(0);if((w|0)==4953){w=0;if(K){W=X;break L5924}else{$=0}}M=Y+12|0;aa=c[M>>2]|0;ab=Y+16|0;if((aa|0)==(c[ab>>2]|0)){ac=ce[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{ac=c[aa>>2]|0}if(!(cf[c[(c[z>>2]|0)+12>>2]&63](u,8192,ac)|0)){W=X;break L5924}aa=c[M>>2]|0;if((aa|0)==(c[ab>>2]|0)){ab=c[(c[Y>>2]|0)+40>>2]|0;ce[ab&127](Y)|0;I=Y;H=$;continue}else{c[M>>2]=aa+4;I=Y;H=$;continue}}}}while(0);if((W|0)==(k|0)){w=4971;break L5890}F=W;G=c[g>>2]|0}if((w|0)==4932){c[g>>2]=4;ad=J;break}else if((w|0)==4925){c[g>>2]=4;ad=J;break}else if((w|0)==4929){c[g>>2]=4;ad=J;break}}}while(0);if((w|0)==4971){ad=c[v>>2]|0}u=d|0;do{if((ad|0)!=0){t=c[ad+12>>2]|0;if((t|0)==(c[ad+16>>2]|0)){ae=ce[c[(c[ad>>2]|0)+36>>2]&127](ad)|0}else{ae=c[t>>2]|0}if((ae|0)!=-1){break}c[u>>2]=0}}while(0);v=c[u>>2]|0;t=(v|0)==0;G=e|0;F=c[G>>2]|0;do{if((F|0)==0){w=4984}else{z=c[F+12>>2]|0;if((z|0)==(c[F+16>>2]|0)){af=ce[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{af=c[z>>2]|0}if((af|0)==-1){c[G>>2]=0;w=4984;break}if(!(t^(F|0)==0)){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);do{if((w|0)==4984){if(t){break}ag=a|0;c[ag>>2]=v;i=l;return}}while(0);c[g>>2]=c[g>>2]|2;ag=a|0;c[ag>>2]=v;i=l;return}}while(0);l=bZ(4)|0;oK(l);bs(l|0,10840,132)}function k$(a){a=a|0;hE(a|0);pb(a);return}function k0(a){a=a|0;hE(a|0);return}function k1(a){a=a|0;return 2}function k2(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;i=i+16|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;c[k>>2]=c[d>>2];c[l>>2]=c[e>>2];k_(a,b,k,l,f,g,h,4928,4960);i=j;return}function k3(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=k|0;m=k+8|0;n=d+8|0;o=ce[c[(c[n>>2]|0)+20>>2]&127](n)|0;c[l>>2]=c[e>>2];c[m>>2]=c[f>>2];f=a[o]|0;if((f&1)==0){p=o+4|0;q=o+4|0}else{e=c[o+8>>2]|0;p=e;q=e}e=f&255;if((e&1|0)==0){r=e>>>1}else{r=c[o+4>>2]|0}k_(b,d,l,m,g,h,j,q,p+(r<<2)|0);i=k;return}function k4(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;ip(m,f);f=m|0;m=c[f>>2]|0;if((c[3980]|0)!=-1){c[l>>2]=15920;c[l+4>>2]=14;c[l+8>>2]=0;h_(15920,l,98)}l=(c[3981]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;hG(o)|0;o=c[e>>2]|0;q=b+8|0;r=ce[c[c[q>>2]>>2]&127](q)|0;c[k>>2]=o;o=(jV(d,k,r,r+168|0,p,g,0)|0)-r|0;if((o|0)>=168){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+24>>2]=((o|0)/12|0|0)%7|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bZ(4)|0;oK(j);bs(j|0,10840,132)}function k5(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;l=j+8|0;m=j+24|0;ip(m,f);f=m|0;m=c[f>>2]|0;if((c[3980]|0)!=-1){c[l>>2]=15920;c[l+4>>2]=14;c[l+8>>2]=0;h_(15920,l,98)}l=(c[3981]|0)-1|0;n=c[m+8>>2]|0;do{if((c[m+12>>2]|0)-n>>2>>>0>l>>>0){o=c[n+(l<<2)>>2]|0;if((o|0)==0){break}p=o;o=c[f>>2]|0;hG(o)|0;o=c[e>>2]|0;q=b+8|0;r=ce[c[(c[q>>2]|0)+4>>2]&127](q)|0;c[k>>2]=o;o=(jV(d,k,r,r+288|0,p,g,0)|0)-r|0;if((o|0)>=288){s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}c[h+16>>2]=((o|0)/12|0|0)%12|0;s=d|0;t=c[s>>2]|0;u=a|0;c[u>>2]=t;i=j;return}}while(0);j=bZ(4)|0;oK(j);bs(j|0,10840,132)}function k6(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;k=b+8|0;l=b+24|0;ip(l,f);f=l|0;l=c[f>>2]|0;if((c[3980]|0)!=-1){c[k>>2]=15920;c[k+4>>2]=14;c[k+8>>2]=0;h_(15920,k,98)}k=(c[3981]|0)-1|0;m=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}o=n;n=c[f>>2]|0;hG(n)|0;c[j>>2]=c[e>>2];n=lb(d,j,g,o,4)|0;if((c[g>>2]&4|0)!=0){p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}if((n|0)<69){s=n+2e3|0}else{s=(n-69|0)>>>0<31>>>0?n+1900|0:n}c[h+20>>2]=s-1900;p=d|0;q=c[p>>2]|0;r=a|0;c[r>>2]=q;i=b;return}}while(0);b=bZ(4)|0;oK(b);bs(b|0,10840,132)}function k7(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;l=i;i=i+328|0;m=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[m>>2];m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=l|0;n=l+8|0;o=l+16|0;p=l+24|0;q=l+32|0;r=l+40|0;s=l+48|0;t=l+56|0;u=l+64|0;v=l+72|0;w=l+80|0;x=l+88|0;y=l+96|0;z=l+112|0;A=l+120|0;B=l+128|0;C=l+136|0;D=l+144|0;E=l+152|0;F=l+160|0;G=l+168|0;H=l+176|0;I=l+184|0;J=l+192|0;K=l+200|0;L=l+208|0;M=l+216|0;N=l+224|0;O=l+232|0;P=l+240|0;Q=l+248|0;R=l+256|0;S=l+264|0;T=l+272|0;U=l+280|0;V=l+288|0;W=l+296|0;X=l+304|0;Y=l+312|0;Z=l+320|0;c[h>>2]=0;ip(z,g);_=z|0;z=c[_>>2]|0;if((c[3980]|0)!=-1){c[y>>2]=15920;c[y+4>>2]=14;c[y+8>>2]=0;h_(15920,y,98)}y=(c[3981]|0)-1|0;$=c[z+8>>2]|0;do{if((c[z+12>>2]|0)-$>>2>>>0>y>>>0){aa=c[$+(y<<2)>>2]|0;if((aa|0)==0){break}ab=aa;aa=c[_>>2]|0;hG(aa)|0;L6067:do{switch(k<<24>>24|0){case 100:case 101:{aa=j+12|0;c[v>>2]=c[f>>2];ac=lb(e,v,h,ab,2)|0;ad=c[h>>2]|0;do{if((ad&4|0)==0){if((ac-1|0)>>>0>=31>>>0){break}c[aa>>2]=ac;break L6067}}while(0);c[h>>2]=ad|4;break};case 73:{ac=j+8|0;c[t>>2]=c[f>>2];aa=lb(e,t,h,ab,2)|0;ae=c[h>>2]|0;do{if((ae&4|0)==0){if((aa-1|0)>>>0>=12>>>0){break}c[ac>>2]=aa;break L6067}}while(0);c[h>>2]=ae|4;break};case 72:{c[u>>2]=c[f>>2];aa=lb(e,u,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(aa|0)<24){c[j+8>>2]=aa;break L6067}else{c[h>>2]=ac|4;break L6067}break};case 68:{ac=e|0;c[E>>2]=c[ac>>2];c[F>>2]=c[f>>2];k_(D,d,E,F,g,h,j,4896,4928);c[ac>>2]=c[D>>2];break};case 97:case 65:{ac=c[f>>2]|0;aa=d+8|0;ad=ce[c[c[aa>>2]>>2]&127](aa)|0;c[x>>2]=ac;ac=(jV(e,x,ad,ad+168|0,ab,h,0)|0)-ad|0;if((ac|0)>=168){break L6067}c[j+24>>2]=((ac|0)/12|0|0)%7|0;break};case 109:{c[r>>2]=c[f>>2];ac=(lb(e,r,h,ab,2)|0)-1|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ac|0)<12){c[j+16>>2]=ac;break L6067}else{c[h>>2]=ad|4;break L6067}break};case 77:{c[q>>2]=c[f>>2];ad=lb(e,q,h,ab,2)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(ad|0)<60){c[j+4>>2]=ad;break L6067}else{c[h>>2]=ac|4;break L6067}break};case 110:case 116:{c[J>>2]=c[f>>2];k8(0,e,J,h,ab);break};case 112:{c[K>>2]=c[f>>2];k9(d,j+8|0,e,K,h,ab);break};case 114:{ac=e|0;c[M>>2]=c[ac>>2];c[N>>2]=c[f>>2];k_(L,d,M,N,g,h,j,4848,4892);c[ac>>2]=c[L>>2];break};case 82:{ac=e|0;c[P>>2]=c[ac>>2];c[Q>>2]=c[f>>2];k_(O,d,P,Q,g,h,j,4824,4844);c[ac>>2]=c[O>>2];break};case 83:{c[p>>2]=c[f>>2];ac=lb(e,p,h,ab,2)|0;ad=c[h>>2]|0;if((ad&4|0)==0&(ac|0)<61){c[j>>2]=ac;break L6067}else{c[h>>2]=ad|4;break L6067}break};case 84:{ad=e|0;c[S>>2]=c[ad>>2];c[T>>2]=c[f>>2];k_(R,d,S,T,g,h,j,4792,4824);c[ad>>2]=c[R>>2];break};case 119:{c[o>>2]=c[f>>2];ad=lb(e,o,h,ab,1)|0;ac=c[h>>2]|0;if((ac&4|0)==0&(ad|0)<7){c[j+24>>2]=ad;break L6067}else{c[h>>2]=ac|4;break L6067}break};case 120:{ac=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];cg[ac&127](b,d,U,V,g,h,j);i=l;return};case 88:{ac=d+8|0;ad=ce[c[(c[ac>>2]|0)+24>>2]&127](ac)|0;ac=e|0;c[X>>2]=c[ac>>2];c[Y>>2]=c[f>>2];aa=a[ad]|0;if((aa&1)==0){af=ad+4|0;ag=ad+4|0}else{ah=c[ad+8>>2]|0;af=ah;ag=ah}ah=aa&255;if((ah&1|0)==0){ai=ah>>>1}else{ai=c[ad+4>>2]|0}k_(W,d,X,Y,g,h,j,ag,af+(ai<<2)|0);c[ac>>2]=c[W>>2];break};case 121:{c[n>>2]=c[f>>2];ac=lb(e,n,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L6067}if((ac|0)<69){aj=ac+2e3|0}else{aj=(ac-69|0)>>>0<31>>>0?ac+1900|0:ac}c[j+20>>2]=aj-1900;break};case 89:{c[m>>2]=c[f>>2];ac=lb(e,m,h,ab,4)|0;if((c[h>>2]&4|0)!=0){break L6067}c[j+20>>2]=ac-1900;break};case 37:{c[Z>>2]=c[f>>2];la(0,e,Z,h,ab);break};case 98:case 66:case 104:{ac=c[f>>2]|0;ad=d+8|0;ah=ce[c[(c[ad>>2]|0)+4>>2]&127](ad)|0;c[w>>2]=ac;ac=(jV(e,w,ah,ah+288|0,ab,h,0)|0)-ah|0;if((ac|0)>=288){break L6067}c[j+16>>2]=((ac|0)/12|0|0)%12|0;break};case 70:{ac=e|0;c[H>>2]=c[ac>>2];c[I>>2]=c[f>>2];k_(G,d,H,I,g,h,j,4760,4792);c[ac>>2]=c[G>>2];break};case 106:{c[s>>2]=c[f>>2];ac=lb(e,s,h,ab,3)|0;ah=c[h>>2]|0;if((ah&4|0)==0&(ac|0)<366){c[j+28>>2]=ac;break L6067}else{c[h>>2]=ah|4;break L6067}break};case 99:{ah=d+8|0;ac=ce[c[(c[ah>>2]|0)+12>>2]&127](ah)|0;ah=e|0;c[B>>2]=c[ah>>2];c[C>>2]=c[f>>2];ad=a[ac]|0;if((ad&1)==0){ak=ac+4|0;al=ac+4|0}else{aa=c[ac+8>>2]|0;ak=aa;al=aa}aa=ad&255;if((aa&1|0)==0){am=aa>>>1}else{am=c[ac+4>>2]|0}k_(A,d,B,C,g,h,j,al,ak+(am<<2)|0);c[ah>>2]=c[A>>2];break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);l=bZ(4)|0;oK(l);bs(l|0,10840,132)}function k8(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=d|0;d=f;L6148:while(1){h=c[g>>2]|0;do{if((h|0)==0){j=1}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){l=ce[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[g>>2]=0;j=1;break}else{j=(c[g>>2]|0)==0;break}}}while(0);h=c[b>>2]|0;do{if((h|0)==0){m=5128}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){n=ce[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{n=c[k>>2]|0}if((n|0)==-1){c[b>>2]=0;m=5128;break}else{k=(h|0)==0;if(j^k){o=h;p=k;break}else{q=h;r=k;break L6148}}}}while(0);if((m|0)==5128){m=0;if(j){q=0;r=1;break}else{o=0;p=1}}h=c[g>>2]|0;k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){s=ce[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{s=c[k>>2]|0}if(!(cf[c[(c[d>>2]|0)+12>>2]&63](f,8192,s)|0)){q=o;r=p;break}k=c[g>>2]|0;h=k+12|0;t=c[h>>2]|0;if((t|0)==(c[k+16>>2]|0)){u=c[(c[k>>2]|0)+40>>2]|0;ce[u&127](k)|0;continue}else{c[h>>2]=t+4;continue}}p=c[g>>2]|0;do{if((p|0)==0){v=1}else{o=c[p+12>>2]|0;if((o|0)==(c[p+16>>2]|0)){w=ce[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{w=c[o>>2]|0}if((w|0)==-1){c[g>>2]=0;v=1;break}else{v=(c[g>>2]|0)==0;break}}}while(0);do{if(r){m=5150}else{g=c[q+12>>2]|0;if((g|0)==(c[q+16>>2]|0)){x=ce[c[(c[q>>2]|0)+36>>2]&127](q)|0}else{x=c[g>>2]|0}if((x|0)==-1){c[b>>2]=0;m=5150;break}if(!(v^(q|0)==0)){break}i=a;return}}while(0);do{if((m|0)==5150){if(v){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function k9(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+8|0;k=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[k>>2];k=j|0;l=a+8|0;a=ce[c[(c[l>>2]|0)+8>>2]&127](l)|0;l=d[a]|0;if((l&1|0)==0){m=l>>>1}else{m=c[a+4>>2]|0}l=d[a+12|0]|0;if((l&1|0)==0){n=l>>>1}else{n=c[a+16>>2]|0}if((m|0)==(-n|0)){c[g>>2]=c[g>>2]|4;i=j;return}c[k>>2]=c[f>>2];f=jV(e,k,a,a+24|0,h,g,0)|0;g=f-a|0;do{if((f|0)==(a|0)){if((c[b>>2]|0)!=12){break}c[b>>2]=0;i=j;return}}while(0);if((g|0)!=12){i=j;return}g=c[b>>2]|0;if((g|0)>=12){i=j;return}c[b>>2]=g+12;i=j;return}function la(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;b=c[g>>2]|0;do{if((b|0)==0){h=1}else{j=c[b+12>>2]|0;if((j|0)==(c[b+16>>2]|0)){k=ce[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{k=c[j>>2]|0}if((k|0)==-1){c[g>>2]=0;h=1;break}else{h=(c[g>>2]|0)==0;break}}}while(0);k=d|0;d=c[k>>2]|0;do{if((d|0)==0){l=5190}else{b=c[d+12>>2]|0;if((b|0)==(c[d+16>>2]|0)){m=ce[c[(c[d>>2]|0)+36>>2]&127](d)|0}else{m=c[b>>2]|0}if((m|0)==-1){c[k>>2]=0;l=5190;break}else{b=(d|0)==0;if(h^b){n=d;o=b;break}else{l=5192;break}}}}while(0);if((l|0)==5190){if(h){l=5192}else{n=0;o=1}}if((l|0)==5192){c[e>>2]=c[e>>2]|6;i=a;return}h=c[g>>2]|0;d=c[h+12>>2]|0;if((d|0)==(c[h+16>>2]|0)){p=ce[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{p=c[d>>2]|0}if((cf[c[(c[f>>2]|0)+52>>2]&63](f,p,0)|0)<<24>>24!=37){c[e>>2]=c[e>>2]|4;i=a;return}p=c[g>>2]|0;f=p+12|0;d=c[f>>2]|0;if((d|0)==(c[p+16>>2]|0)){h=c[(c[p>>2]|0)+40>>2]|0;ce[h&127](p)|0}else{c[f>>2]=d+4}d=c[g>>2]|0;do{if((d|0)==0){q=1}else{f=c[d+12>>2]|0;if((f|0)==(c[d+16>>2]|0)){r=ce[c[(c[d>>2]|0)+36>>2]&127](d)|0}else{r=c[f>>2]|0}if((r|0)==-1){c[g>>2]=0;q=1;break}else{q=(c[g>>2]|0)==0;break}}}while(0);do{if(o){l=5214}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){s=ce[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{s=c[g>>2]|0}if((s|0)==-1){c[k>>2]=0;l=5214;break}if(!(q^(n|0)==0)){break}i=a;return}}while(0);do{if((l|0)==5214){if(q){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function lb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=i;h=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[h>>2];h=a|0;a=c[h>>2]|0;do{if((a|0)==0){j=1}else{k=c[a+12>>2]|0;if((k|0)==(c[a+16>>2]|0)){l=ce[c[(c[a>>2]|0)+36>>2]&127](a)|0}else{l=c[k>>2]|0}if((l|0)==-1){c[h>>2]=0;j=1;break}else{j=(c[h>>2]|0)==0;break}}}while(0);l=b|0;b=c[l>>2]|0;do{if((b|0)==0){m=5236}else{a=c[b+12>>2]|0;if((a|0)==(c[b+16>>2]|0)){n=ce[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{n=c[a>>2]|0}if((n|0)==-1){c[l>>2]=0;m=5236;break}else{if(j^(b|0)==0){o=b;break}else{m=5238;break}}}}while(0);if((m|0)==5236){if(j){m=5238}else{o=0}}if((m|0)==5238){c[d>>2]=c[d>>2]|6;p=0;i=g;return p|0}j=c[h>>2]|0;b=c[j+12>>2]|0;if((b|0)==(c[j+16>>2]|0)){q=ce[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{q=c[b>>2]|0}b=e;if(!(cf[c[(c[b>>2]|0)+12>>2]&63](e,2048,q)|0)){c[d>>2]=c[d>>2]|4;p=0;i=g;return p|0}j=e;n=(cf[c[(c[j>>2]|0)+52>>2]&63](e,q,0)|0)<<24>>24;q=c[h>>2]|0;a=q+12|0;k=c[a>>2]|0;if((k|0)==(c[q+16>>2]|0)){r=c[(c[q>>2]|0)+40>>2]|0;ce[r&127](q)|0;s=n;t=f;u=o}else{c[a>>2]=k+4;s=n;t=f;u=o}while(1){v=s-48|0;o=t-1|0;f=c[h>>2]|0;do{if((f|0)==0){w=0}else{n=c[f+12>>2]|0;if((n|0)==(c[f+16>>2]|0)){x=ce[c[(c[f>>2]|0)+36>>2]&127](f)|0}else{x=c[n>>2]|0}if((x|0)==-1){c[h>>2]=0;w=0;break}else{w=c[h>>2]|0;break}}}while(0);f=(w|0)==0;if((u|0)==0){y=w;z=0}else{n=c[u+12>>2]|0;if((n|0)==(c[u+16>>2]|0)){A=ce[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{A=c[n>>2]|0}if((A|0)==-1){c[l>>2]=0;B=0}else{B=u}y=c[h>>2]|0;z=B}C=(z|0)==0;if(!((f^C)&(o|0)>0)){break}f=c[y+12>>2]|0;if((f|0)==(c[y+16>>2]|0)){D=ce[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{D=c[f>>2]|0}if(!(cf[c[(c[b>>2]|0)+12>>2]&63](e,2048,D)|0)){p=v;m=5290;break}f=((cf[c[(c[j>>2]|0)+52>>2]&63](e,D,0)|0)<<24>>24)+(v*10|0)|0;n=c[h>>2]|0;k=n+12|0;a=c[k>>2]|0;if((a|0)==(c[n+16>>2]|0)){q=c[(c[n>>2]|0)+40>>2]|0;ce[q&127](n)|0;s=f;t=o;u=z;continue}else{c[k>>2]=a+4;s=f;t=o;u=z;continue}}if((m|0)==5290){i=g;return p|0}do{if((y|0)==0){E=1}else{u=c[y+12>>2]|0;if((u|0)==(c[y+16>>2]|0)){F=ce[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{F=c[u>>2]|0}if((F|0)==-1){c[h>>2]=0;E=1;break}else{E=(c[h>>2]|0)==0;break}}}while(0);do{if(C){m=5282}else{h=c[z+12>>2]|0;if((h|0)==(c[z+16>>2]|0)){G=ce[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[h>>2]|0}if((G|0)==-1){c[l>>2]=0;m=5282;break}if(E^(z|0)==0){p=v}else{break}i=g;return p|0}}while(0);do{if((m|0)==5282){if(E){break}else{p=v}i=g;return p|0}}while(0);c[d>>2]=c[d>>2]|2;p=v;i=g;return p|0}function lc(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((f|0)==(c[3620]|0)){g=b|0;hE(g);pb(d);return}ba(c[e>>2]|0);g=b|0;hE(g);pb(d);return}function ld(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((e|0)==(c[3620]|0)){f=b|0;hE(f);return}ba(c[d>>2]|0);f=b|0;hE(f);return}function le(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+112|0;f=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[f>>2];f=g|0;l=g+8|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=bq(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=cm[c[(c[s>>2]|0)+52>>2]&31](s,m&255)|0}else{c[l>>2]=j+1;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function lf(b){b=b|0;var d=0,e=0,f=0,g=0;d=b;e=b+8|0;f=c[e>>2]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((f|0)==(c[3620]|0)){g=b|0;hE(g);pb(d);return}ba(c[e>>2]|0);g=b|0;hE(g);pb(d);return}function lg(b){b=b|0;var d=0,e=0,f=0;d=b+8|0;e=c[d>>2]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((e|0)==(c[3620]|0)){f=b|0;hE(f);return}ba(c[d>>2]|0);f=b|0;hE(f);return}function lh(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+408|0;e=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[e>>2];e=f|0;k=f+400|0;l=e|0;c[k>>2]=e+400;li(b+8|0,l,k,g,h,j);j=c[k>>2]|0;k=c[d>>2]|0;if((l|0)==(j|0)){m=k;n=a|0;c[n>>2]=m;i=f;return}else{o=k;p=l}while(1){l=c[p>>2]|0;if((o|0)==0){q=0}else{k=o+24|0;d=c[k>>2]|0;if((d|0)==(c[o+28>>2]|0)){r=cm[c[(c[o>>2]|0)+52>>2]&31](o,l)|0}else{c[k>>2]=d+4;c[d>>2]=l;r=l}q=(r|0)==-1?0:o}l=p+4|0;if((l|0)==(j|0)){m=q;break}else{o=q;p=l}}n=a|0;c[n>>2]=m;i=f;return}function li(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+120|0;k=j|0;l=j+112|0;m=i;i=i+4|0;i=i+7&-8;n=j+8|0;o=k|0;a[o]=37;p=k+1|0;a[p]=g;q=k+2|0;a[q]=h;a[k+3|0]=0;if(h<<24>>24!=0){a[p]=h;a[q]=g}g=b|0;bq(n|0,100,o|0,f|0,c[g>>2]|0)|0;c[l>>2]=0;c[l+4>>2]=0;c[m>>2]=n;n=(c[e>>2]|0)-d>>2;f=bN(c[g>>2]|0)|0;g=oA(d,m,n,l)|0;if((f|0)!=0){bN(f|0)|0}if((g|0)==-1){l4(1984)}else{c[e>>2]=d+(g<<2);i=j;return}}function lj(a){a=a|0;hE(a|0);pb(a);return}function lk(a){a=a|0;hE(a|0);return}function ll(a){a=a|0;return 127}function lm(a){a=a|0;return 127}function ln(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lo(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lp(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lq(a,b){a=a|0;b=b|0;h2(a,1,45);return}function lr(a){a=a|0;return 0}function ls(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function lt(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function lu(a){a=a|0;hE(a|0);pb(a);return}function lv(a){a=a|0;hE(a|0);return}function lw(a){a=a|0;return 127}function lx(a){a=a|0;return 127}function ly(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lz(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lA(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lB(a,b){a=a|0;b=b|0;h2(a,1,45);return}function lC(a){a=a|0;return 0}function lD(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function lE(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function lF(a){a=a|0;hE(a|0);pb(a);return}function lG(a){a=a|0;hE(a|0);return}function lH(a){a=a|0;return 2147483647}function lI(a){a=a|0;return 2147483647}function lJ(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lK(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lL(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lM(a,b){a=a|0;b=b|0;id(a,1,45);return}function lN(a){a=a|0;return 0}function lO(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function lP(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function lQ(a){a=a|0;hE(a|0);pb(a);return}function lR(a){a=a|0;hE(a|0);return}function lS(a){a=a|0;return 2147483647}function lT(a){a=a|0;return 2147483647}function lU(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lV(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lW(a,b){a=a|0;b=b|0;b=a;pm(b|0,0,12)|0;return}function lX(a,b){a=a|0;b=b|0;id(a,1,45);return}function lY(a){a=a|0;return 0}function lZ(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function l_(b,c){b=b|0;c=c|0;c=b;C=67109634;a[c]=C&255;C=C>>8;a[c+1|0]=C&255;C=C>>8;a[c+2|0]=C&255;C=C>>8;a[c+3|0]=C&255;return}function l$(a){a=a|0;hE(a|0);pb(a);return}function l0(a){a=a|0;hE(a|0);return}function l1(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+280|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=d+160|0;t=d+176|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=166;w=m+100|0;ip(p,h);m=p|0;x=c[m>>2]|0;if((c[3982]|0)!=-1){c[l>>2]=15928;c[l+4>>2]=14;c[l+8>>2]=0;h_(15928,l,98)}l=(c[3983]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(l3(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+32>>2]|0;b7[D&15](A,4744,4754,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>98){H=o3(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}ph();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+10|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((a[N]|0)==(a[M]|0)){O=N;break}else{N=N+1|0}}a[L]=a[4744+(O-H)|0]|0;N=M+1|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=bP(D|0,3480,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}o4(J);break}M=bZ(8)|0;hM(M,3408);bs(M|0,10856,26)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){R=z;break}if((ce[c[(c[z>>2]|0)+36>>2]&127](z)|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){S=5465}else{if((c[z+12>>2]|0)!=(c[z+16>>2]|0)){if(A){break}else{S=5467;break}}if((ce[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1){c[B>>2]=0;S=5465;break}else{if(A^(z|0)==0){break}else{S=5467;break}}}}while(0);if((S|0)==5465){if(A){S=5467}}if((S|0)==5467){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;hG(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}ca[c[v>>2]&511](z);i=d;return}}while(0);d=bZ(4)|0;oK(d);bs(d|0,10840,132)}function l2(a){a=a|0;return}function l3(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0;q=i;i=i+440|0;r=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[r>>2];r=q|0;s=q+400|0;t=q+408|0;u=q+416|0;v=q+424|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=r|0;pm(w|0,0,12)|0;E=x;F=y;G=z;H=A;pm(E|0,0,12)|0;pm(F|0,0,12)|0;pm(G|0,0,12)|0;pm(H|0,0,12)|0;l7(g,h,s,t,u,v,x,y,z,B);h=n|0;c[o>>2]=c[h>>2];g=e|0;e=f|0;f=m+8|0;m=z+1|0;I=z+4|0;J=z+8|0;K=y+1|0;L=y+4|0;M=y+8|0;N=(j&512|0)!=0;j=x+1|0;O=x+4|0;P=x+8|0;Q=A+1|0;R=A+4|0;S=A+8|0;T=s+3|0;U=v+4|0;V=n+4|0;n=p;p=166;W=D;X=D;D=r+400|0;r=0;Y=0;L6580:while(1){Z=c[g>>2]|0;do{if((Z|0)==0){_=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){_=Z;break}if((ce[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)==-1){c[g>>2]=0;_=0;break}else{_=c[g>>2]|0;break}}}while(0);Z=(_|0)==0;$=c[e>>2]|0;do{if(($|0)==0){aa=5493}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=5752;break L6580}}if((ce[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[e>>2]=0;aa=5493;break}else{if(Z){ab=$;break}else{ac=p;ad=W;ae=X;af=r;aa=5752;break L6580}}}}while(0);if((aa|0)==5493){aa=0;if(Z){ac=p;ad=W;ae=X;af=r;aa=5752;break}else{ab=0}}L6602:do{switch(a[s+Y|0]|0){case 3:{$=a[F]|0;ag=$&255;ah=(ag&1|0)==0?ag>>>1:c[L>>2]|0;ag=a[G]|0;ai=ag&255;aj=(ai&1|0)==0?ai>>>1:c[I>>2]|0;if((ah|0)==(-aj|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6602}ai=(ah|0)==0;ah=c[g>>2]|0;aq=c[ah+12>>2]|0;ar=c[ah+16>>2]|0;as=(aq|0)==(ar|0);if(!(ai|(aj|0)==0)){if(as){aj=(ce[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255;at=c[g>>2]|0;au=aj;av=a[F]|0;aw=at;ax=c[at+12>>2]|0;ay=c[at+16>>2]|0}else{au=a[aq]|0;av=$;aw=ah;ax=aq;ay=ar}ar=aw+12|0;at=(ax|0)==(ay|0);if(au<<24>>24==(a[(av&1)==0?K:c[M>>2]|0]|0)){if(at){aj=c[(c[aw>>2]|0)+40>>2]|0;ce[aj&127](aw)|0}else{c[ar>>2]=ax+1}ar=d[F]|0;ak=((ar&1|0)==0?ar>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;al=D;am=X;an=W;ao=p;ap=n;break L6602}if(at){az=(ce[c[(c[aw>>2]|0)+36>>2]&127](aw)|0)&255}else{az=a[ax]|0}if(az<<24>>24!=(a[(a[G]&1)==0?m:c[J>>2]|0]|0)){aa=5588;break L6580}at=c[g>>2]|0;ar=at+12|0;aj=c[ar>>2]|0;if((aj|0)==(c[at+16>>2]|0)){aA=c[(c[at>>2]|0)+40>>2]|0;ce[aA&127](at)|0}else{c[ar>>2]=aj+1}a[l]=1;aj=d[G]|0;ak=((aj&1|0)==0?aj>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;al=D;am=X;an=W;ao=p;ap=n;break L6602}if(ai){if(as){ai=(ce[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255;aB=ai;aC=a[G]|0}else{aB=a[aq]|0;aC=ag}if(aB<<24>>24!=(a[(aC&1)==0?m:c[J>>2]|0]|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6602}ag=c[g>>2]|0;ai=ag+12|0;aj=c[ai>>2]|0;if((aj|0)==(c[ag+16>>2]|0)){ar=c[(c[ag>>2]|0)+40>>2]|0;ce[ar&127](ag)|0}else{c[ai>>2]=aj+1}a[l]=1;aj=d[G]|0;ak=((aj&1|0)==0?aj>>>1:c[I>>2]|0)>>>0>1>>>0?z:r;al=D;am=X;an=W;ao=p;ap=n;break L6602}if(as){as=(ce[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255;aD=as;aE=a[F]|0}else{aD=a[aq]|0;aE=$}if(aD<<24>>24!=(a[(aE&1)==0?K:c[M>>2]|0]|0)){a[l]=1;ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6602}$=c[g>>2]|0;aq=$+12|0;as=c[aq>>2]|0;if((as|0)==(c[$+16>>2]|0)){ah=c[(c[$>>2]|0)+40>>2]|0;ce[ah&127]($)|0}else{c[aq>>2]=as+1}as=d[F]|0;ak=((as&1|0)==0?as>>>1:c[L>>2]|0)>>>0>1>>>0?y:r;al=D;am=X;an=W;ao=p;ap=n;break};case 0:{aa=5521;break};case 1:{if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=5752;break L6580}as=c[g>>2]|0;aq=c[as+12>>2]|0;if((aq|0)==(c[as+16>>2]|0)){aF=(ce[c[(c[as>>2]|0)+36>>2]&127](as)|0)&255}else{aF=a[aq]|0}aq=aF<<24>>24;if((bE(aq|0)|0)==0){aa=5520;break L6580}if((b[(c[f>>2]|0)+(aq<<1)>>1]&8192)==0){aa=5520;break L6580}aq=c[g>>2]|0;as=aq+12|0;$=c[as>>2]|0;if(($|0)==(c[aq+16>>2]|0)){aG=(ce[c[(c[aq>>2]|0)+40>>2]&127](aq)|0)&255}else{c[as>>2]=$+1;aG=a[$]|0}h8(A,aG);aa=5521;break};case 4:{$=0;as=D;aq=X;ah=W;aj=p;ai=n;L6670:while(1){ag=c[g>>2]|0;do{if((ag|0)==0){aH=0}else{if((c[ag+12>>2]|0)!=(c[ag+16>>2]|0)){aH=ag;break}if((ce[c[(c[ag>>2]|0)+36>>2]&127](ag)|0)==-1){c[g>>2]=0;aH=0;break}else{aH=c[g>>2]|0;break}}}while(0);ag=(aH|0)==0;ar=c[e>>2]|0;do{if((ar|0)==0){aa=5645}else{if((c[ar+12>>2]|0)!=(c[ar+16>>2]|0)){if(ag){break}else{break L6670}}if((ce[c[(c[ar>>2]|0)+36>>2]&127](ar)|0)==-1){c[e>>2]=0;aa=5645;break}else{if(ag){break}else{break L6670}}}}while(0);if((aa|0)==5645){aa=0;if(ag){break}}ar=c[g>>2]|0;at=c[ar+12>>2]|0;if((at|0)==(c[ar+16>>2]|0)){aI=(ce[c[(c[ar>>2]|0)+36>>2]&127](ar)|0)&255}else{aI=a[at]|0}at=aI<<24>>24;do{if((bE(at|0)|0)==0){aa=5665}else{if((b[(c[f>>2]|0)+(at<<1)>>1]&2048)==0){aa=5665;break}ar=c[o>>2]|0;if((ar|0)==(ai|0)){aA=(c[V>>2]|0)!=166;aJ=c[h>>2]|0;aK=ai-aJ|0;aL=aK>>>0<2147483647>>>0?aK<<1:-1;aM=o5(aA?aJ:0,aL)|0;if((aM|0)==0){ph()}do{if(aA){c[h>>2]=aM;aN=aM}else{aJ=c[h>>2]|0;c[h>>2]=aM;if((aJ|0)==0){aN=aM;break}ca[c[V>>2]&511](aJ);aN=c[h>>2]|0}}while(0);c[V>>2]=82;aM=aN+aK|0;c[o>>2]=aM;aO=(c[h>>2]|0)+aL|0;aP=aM}else{aO=ai;aP=ar}c[o>>2]=aP+1;a[aP]=aI;aQ=$+1|0;aR=as;aS=aq;aT=ah;aU=aj;aV=aO}}while(0);if((aa|0)==5665){aa=0;at=d[w]|0;if((((at&1|0)==0?at>>>1:c[U>>2]|0)|0)==0|($|0)==0){break}if(aI<<24>>24!=(a[u]|0)){break}if((aq|0)==(as|0)){at=aq-ah|0;ag=at>>>0<2147483647>>>0?at<<1:-1;if((aj|0)==166){aW=0}else{aW=ah}aM=o5(aW,ag)|0;aA=aM;if((aM|0)==0){ph()}aX=aA+(ag>>>2<<2)|0;aY=aA+(at>>2<<2)|0;aZ=aA;a_=82}else{aX=as;aY=aq;aZ=ah;a_=aj}c[aY>>2]=$;aQ=0;aR=aX;aS=aY+4|0;aT=aZ;aU=a_;aV=ai}aA=c[g>>2]|0;at=aA+12|0;ag=c[at>>2]|0;if((ag|0)==(c[aA+16>>2]|0)){aM=c[(c[aA>>2]|0)+40>>2]|0;ce[aM&127](aA)|0;$=aQ;as=aR;aq=aS;ah=aT;aj=aU;ai=aV;continue}else{c[at>>2]=ag+1;$=aQ;as=aR;aq=aS;ah=aT;aj=aU;ai=aV;continue}}if((ah|0)==(aq|0)|($|0)==0){a$=as;a0=aq;a1=ah;a2=aj}else{if((aq|0)==(as|0)){ag=aq-ah|0;at=ag>>>0<2147483647>>>0?ag<<1:-1;if((aj|0)==166){a3=0}else{a3=ah}aA=o5(a3,at)|0;aM=aA;if((aA|0)==0){ph()}a4=aM+(at>>>2<<2)|0;a5=aM+(ag>>2<<2)|0;a6=aM;a7=82}else{a4=as;a5=aq;a6=ah;a7=aj}c[a5>>2]=$;a$=a4;a0=a5+4|0;a1=a6;a2=a7}if((c[B>>2]|0)>0){aM=c[g>>2]|0;do{if((aM|0)==0){a8=0}else{if((c[aM+12>>2]|0)!=(c[aM+16>>2]|0)){a8=aM;break}if((ce[c[(c[aM>>2]|0)+36>>2]&127](aM)|0)==-1){c[g>>2]=0;a8=0;break}else{a8=c[g>>2]|0;break}}}while(0);aM=(a8|0)==0;$=c[e>>2]|0;do{if(($|0)==0){aa=5698}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(aM){a9=$;break}else{aa=5705;break L6580}}if((ce[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[e>>2]=0;aa=5698;break}else{if(aM){a9=$;break}else{aa=5705;break L6580}}}}while(0);if((aa|0)==5698){aa=0;if(aM){aa=5705;break L6580}else{a9=0}}$=c[g>>2]|0;aj=c[$+12>>2]|0;if((aj|0)==(c[$+16>>2]|0)){ba=(ce[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{ba=a[aj]|0}if(ba<<24>>24!=(a[t]|0)){aa=5705;break L6580}aj=c[g>>2]|0;$=aj+12|0;ah=c[$>>2]|0;if((ah|0)==(c[aj+16>>2]|0)){aq=c[(c[aj>>2]|0)+40>>2]|0;ce[aq&127](aj)|0;bb=ai;bc=a9}else{c[$>>2]=ah+1;bb=ai;bc=a9}while(1){ah=c[g>>2]|0;do{if((ah|0)==0){bd=0}else{if((c[ah+12>>2]|0)!=(c[ah+16>>2]|0)){bd=ah;break}if((ce[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)==-1){c[g>>2]=0;bd=0;break}else{bd=c[g>>2]|0;break}}}while(0);ah=(bd|0)==0;do{if((bc|0)==0){aa=5721}else{if((c[bc+12>>2]|0)!=(c[bc+16>>2]|0)){if(ah){be=bc;break}else{aa=5730;break L6580}}if((ce[c[(c[bc>>2]|0)+36>>2]&127](bc)|0)==-1){c[e>>2]=0;aa=5721;break}else{if(ah){be=bc;break}else{aa=5730;break L6580}}}}while(0);if((aa|0)==5721){aa=0;if(ah){aa=5730;break L6580}else{be=0}}$=c[g>>2]|0;aj=c[$+12>>2]|0;if((aj|0)==(c[$+16>>2]|0)){bf=(ce[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{bf=a[aj]|0}aj=bf<<24>>24;if((bE(aj|0)|0)==0){aa=5730;break L6580}if((b[(c[f>>2]|0)+(aj<<1)>>1]&2048)==0){aa=5730;break L6580}aj=c[o>>2]|0;if((aj|0)==(bb|0)){$=(c[V>>2]|0)!=166;aq=c[h>>2]|0;as=bb-aq|0;ag=as>>>0<2147483647>>>0?as<<1:-1;at=o5($?aq:0,ag)|0;if((at|0)==0){ph()}do{if($){c[h>>2]=at;bg=at}else{aq=c[h>>2]|0;c[h>>2]=at;if((aq|0)==0){bg=at;break}ca[c[V>>2]&511](aq);bg=c[h>>2]|0}}while(0);c[V>>2]=82;at=bg+as|0;c[o>>2]=at;bh=(c[h>>2]|0)+ag|0;bi=at}else{bh=bb;bi=aj}at=c[g>>2]|0;$=c[at+12>>2]|0;if(($|0)==(c[at+16>>2]|0)){ah=(ce[c[(c[at>>2]|0)+36>>2]&127](at)|0)&255;bj=ah;bk=c[o>>2]|0}else{bj=a[$]|0;bk=bi}c[o>>2]=bk+1;a[bk]=bj;$=(c[B>>2]|0)-1|0;c[B>>2]=$;ah=c[g>>2]|0;at=ah+12|0;aq=c[at>>2]|0;if((aq|0)==(c[ah+16>>2]|0)){aA=c[(c[ah>>2]|0)+40>>2]|0;ce[aA&127](ah)|0}else{c[at>>2]=aq+1}if(($|0)>0){bb=bh;bc=be}else{bl=bh;break}}}else{bl=ai}if((c[o>>2]|0)==(c[h>>2]|0)){aa=5750;break L6580}else{ak=r;al=a$;am=a0;an=a1;ao=a2;ap=bl}break};case 2:{if(!((r|0)!=0|Y>>>0<2>>>0)){if((Y|0)==2){bm=(a[T]|0)!=0}else{bm=0}if(!(N|bm)){ak=0;al=D;am=X;an=W;ao=p;ap=n;break L6602}}aM=a[E]|0;$=c[P>>2]|0;aq=(aM&1)==0?j:$;L6833:do{if((Y|0)==0){bn=aq;bo=aM;bp=$}else{if((d[s+(Y-1)|0]|0)>>>0>=2>>>0){bn=aq;bo=aM;bp=$;break}at=aM&255;L6836:do{if((((at&1|0)==0?at>>>1:c[O>>2]|0)|0)==0){bq=aq;br=aM;bs=$}else{ah=aq;while(1){aA=a[ah]|0;if((bE(aA|0)|0)==0){break}if((b[(c[f>>2]|0)+(aA<<1)>>1]&8192)==0){break}aA=ah+1|0;aJ=a[E]|0;bt=c[P>>2]|0;bu=aJ&255;if((aA|0)==(((aJ&1)==0?j:bt)+((bu&1|0)==0?bu>>>1:c[O>>2]|0)|0)){bq=aA;br=aJ;bs=bt;break L6836}else{ah=aA}}bq=ah;br=a[E]|0;bs=c[P>>2]|0}}while(0);at=(br&1)==0?j:bs;aj=bq-at|0;ag=a[H]|0;as=ag&255;ar=(as&1|0)==0?as>>>1:c[R>>2]|0;if(aj>>>0>ar>>>0){bn=at;bo=br;bp=bs;break}as=(ag&1)==0?Q:c[S>>2]|0;ag=as+ar|0;if((bq|0)==(at|0)){bn=bq;bo=br;bp=bs;break}aL=as+(ar-aj)|0;aj=at;while(1){if((a[aL]|0)!=(a[aj]|0)){bn=at;bo=br;bp=bs;break L6833}ar=aL+1|0;if((ar|0)==(ag|0)){bn=bq;bo=br;bp=bs;break}else{aL=ar;aj=aj+1|0}}}}while(0);aq=bo&255;L6850:do{if((bn|0)==(((bo&1)==0?j:bp)+((aq&1|0)==0?aq>>>1:c[O>>2]|0)|0)){bv=bn}else{$=ab;aM=bn;while(1){ai=c[g>>2]|0;do{if((ai|0)==0){bw=0}else{if((c[ai+12>>2]|0)!=(c[ai+16>>2]|0)){bw=ai;break}if((ce[c[(c[ai>>2]|0)+36>>2]&127](ai)|0)==-1){c[g>>2]=0;bw=0;break}else{bw=c[g>>2]|0;break}}}while(0);ai=(bw|0)==0;do{if(($|0)==0){aa=5619}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(ai){bx=$;break}else{bv=aM;break L6850}}if((ce[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[e>>2]=0;aa=5619;break}else{if(ai){bx=$;break}else{bv=aM;break L6850}}}}while(0);if((aa|0)==5619){aa=0;if(ai){bv=aM;break L6850}else{bx=0}}ah=c[g>>2]|0;aj=c[ah+12>>2]|0;if((aj|0)==(c[ah+16>>2]|0)){by=(ce[c[(c[ah>>2]|0)+36>>2]&127](ah)|0)&255}else{by=a[aj]|0}if(by<<24>>24!=(a[aM]|0)){bv=aM;break L6850}aj=c[g>>2]|0;ah=aj+12|0;aL=c[ah>>2]|0;if((aL|0)==(c[aj+16>>2]|0)){ag=c[(c[aj>>2]|0)+40>>2]|0;ce[ag&127](aj)|0}else{c[ah>>2]=aL+1}aL=aM+1|0;ah=a[E]|0;aj=ah&255;if((aL|0)==(((ah&1)==0?j:c[P>>2]|0)+((aj&1|0)==0?aj>>>1:c[O>>2]|0)|0)){bv=aL;break}else{$=bx;aM=aL}}}}while(0);if(!N){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6602}aq=a[E]|0;aM=aq&255;if((bv|0)==(((aq&1)==0?j:c[P>>2]|0)+((aM&1|0)==0?aM>>>1:c[O>>2]|0)|0)){ak=r;al=D;am=X;an=W;ao=p;ap=n}else{aa=5632;break L6580}break};default:{ak=r;al=D;am=X;an=W;ao=p;ap=n}}}while(0);L6885:do{if((aa|0)==5521){aa=0;if((Y|0)==3){ac=p;ad=W;ae=X;af=r;aa=5752;break L6580}else{bz=ab}while(1){Z=c[g>>2]|0;do{if((Z|0)==0){bA=0}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){bA=Z;break}if((ce[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)==-1){c[g>>2]=0;bA=0;break}else{bA=c[g>>2]|0;break}}}while(0);Z=(bA|0)==0;do{if((bz|0)==0){aa=5534}else{if((c[bz+12>>2]|0)!=(c[bz+16>>2]|0)){if(Z){bB=bz;break}else{ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6885}}if((ce[c[(c[bz>>2]|0)+36>>2]&127](bz)|0)==-1){c[e>>2]=0;aa=5534;break}else{if(Z){bB=bz;break}else{ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6885}}}}while(0);if((aa|0)==5534){aa=0;if(Z){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6885}else{bB=0}}aM=c[g>>2]|0;aq=c[aM+12>>2]|0;if((aq|0)==(c[aM+16>>2]|0)){bC=(ce[c[(c[aM>>2]|0)+36>>2]&127](aM)|0)&255}else{bC=a[aq]|0}aq=bC<<24>>24;if((bE(aq|0)|0)==0){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6885}if((b[(c[f>>2]|0)+(aq<<1)>>1]&8192)==0){ak=r;al=D;am=X;an=W;ao=p;ap=n;break L6885}aq=c[g>>2]|0;aM=aq+12|0;$=c[aM>>2]|0;if(($|0)==(c[aq+16>>2]|0)){bD=(ce[c[(c[aq>>2]|0)+40>>2]&127](aq)|0)&255}else{c[aM>>2]=$+1;bD=a[$]|0}h8(A,bD);bz=bB}}}while(0);$=Y+1|0;if($>>>0<4>>>0){n=ap;p=ao;W=an;X=am;D=al;r=ak;Y=$}else{ac=ao;ad=an;ae=am;af=ak;aa=5752;break}}L6923:do{if((aa|0)==5730){c[k>>2]=c[k>>2]|4;bF=0;bG=a1;bH=a2}else if((aa|0)==5750){c[k>>2]=c[k>>2]|4;bF=0;bG=a1;bH=a2}else if((aa|0)==5752){L6927:do{if((af|0)!=0){ak=af;am=af+1|0;an=af+8|0;ao=af+4|0;Y=1;L6929:while(1){r=d[ak]|0;if((r&1|0)==0){bI=r>>>1}else{bI=c[ao>>2]|0}if(Y>>>0>=bI>>>0){break L6927}r=c[g>>2]|0;do{if((r|0)==0){bJ=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){bJ=r;break}if((ce[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[g>>2]=0;bJ=0;break}else{bJ=c[g>>2]|0;break}}}while(0);r=(bJ|0)==0;Z=c[e>>2]|0;do{if((Z|0)==0){aa=5770}else{if((c[Z+12>>2]|0)!=(c[Z+16>>2]|0)){if(r){break}else{break L6929}}if((ce[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)==-1){c[e>>2]=0;aa=5770;break}else{if(r){break}else{break L6929}}}}while(0);if((aa|0)==5770){aa=0;if(r){break}}Z=c[g>>2]|0;al=c[Z+12>>2]|0;if((al|0)==(c[Z+16>>2]|0)){bK=(ce[c[(c[Z>>2]|0)+36>>2]&127](Z)|0)&255}else{bK=a[al]|0}if((a[ak]&1)==0){bL=am}else{bL=c[an>>2]|0}if(bK<<24>>24!=(a[bL+Y|0]|0)){break}al=Y+1|0;Z=c[g>>2]|0;D=Z+12|0;X=c[D>>2]|0;if((X|0)==(c[Z+16>>2]|0)){ap=c[(c[Z>>2]|0)+40>>2]|0;ce[ap&127](Z)|0;Y=al;continue}else{c[D>>2]=X+1;Y=al;continue}}c[k>>2]=c[k>>2]|4;bF=0;bG=ad;bH=ac;break L6923}}while(0);if((ad|0)==(ae|0)){bF=1;bG=ae;bH=ac;break}c[C>>2]=0;l8(v,ad,ae,C);if((c[C>>2]|0)==0){bF=1;bG=ad;bH=ac;break}c[k>>2]=c[k>>2]|4;bF=0;bG=ad;bH=ac}else if((aa|0)==5705){c[k>>2]=c[k>>2]|4;bF=0;bG=a1;bH=a2}else if((aa|0)==5520){c[k>>2]=c[k>>2]|4;bF=0;bG=W;bH=p}else if((aa|0)==5632){c[k>>2]=c[k>>2]|4;bF=0;bG=W;bH=p}else if((aa|0)==5588){c[k>>2]=c[k>>2]|4;bF=0;bG=W;bH=p}}while(0);h3(A);h3(z);h3(y);h3(x);h3(v);if((bG|0)==0){i=q;return bF|0}ca[bH&511](bG);i=q;return bF|0}function l4(a){a=a|0;var b=0;b=bZ(8)|0;hM(b,a);bs(b|0,10856,26)}function l5(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+160|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+120|0;o=d+128|0;p=d+136|0;q=d+144|0;r=d+152|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=166;u=m+100|0;ip(p,h);m=p|0;v=c[m>>2]|0;if((c[3982]|0)!=-1){c[l>>2]=15928;c[l+4>>2]=14;c[l+8>>2]=0;h_(15928,l,98)}l=(c[3983]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(l3(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){a[k+1|0]=0;a[B]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){h8(k,cm[c[(c[B>>2]|0)+28>>2]&31](y,45)|0)}x=cm[c[(c[B>>2]|0)+28>>2]&31](y,48)|0;y=c[o>>2]|0;B=y-1|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((a[C]|0)==x<<24>>24){C=C+1|0}else{break}}l6(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){D=B;break}if((ce[c[(c[B>>2]|0)+36>>2]&127](B)|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){E=5828}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){break}else{E=5830;break}}if((ce[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[z>>2]=0;E=5828;break}else{if(x^(A|0)==0){break}else{E=5830;break}}}}while(0);if((E|0)==5828){if(x){E=5830}}if((E|0)==5830){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;hG(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}ca[c[t>>2]&511](A);i=d;return}}while(0);d=bZ(4)|0;oK(d);bs(d|0,10840,132)}function l6(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=10;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g|0;if((e|0)==(d|0)){return b|0}if((k-j|0)>>>0<h>>>0){ib(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+1|0}else{n=c[b+8>>2]|0}m=e+(j-g)|0;g=d;d=n+j|0;while(1){a[d]=a[g]|0;l=g+1|0;if((l|0)==(e|0)){break}else{g=l;d=d+1|0}}a[n+m|0]=0;m=j+h|0;if((a[f]&1)==0){a[f]=m<<1&255;return b|0}else{c[b+4>>2]=m;return b|0}return 0}function l7(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[4100]|0)!=-1){c[p>>2]=16400;c[p+4>>2]=14;c[p+8>>2]=0;h_(16400,p,98)}p=(c[4101]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=bZ(4)|0;L=K;oK(L);bs(K|0,10840,132)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=bZ(4)|0;L=K;oK(L);bs(K|0,10840,132)}K=b;cb[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C&255;C=C>>8;a[L+1|0]=C&255;C=C>>8;a[L+2|0]=C&255;C=C>>8;a[L+3|0]=C&255;L=b;cb[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){a[l+1|0]=0;a[q]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}h7(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];pm(s|0,0,12)|0;h3(r);cb[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){a[k+1|0]=0;a[r]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}h7(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];pm(u|0,0,12)|0;h3(t);t=b;a[f]=ce[c[(c[t>>2]|0)+12>>2]&127](K)|0;a[g]=ce[c[(c[t>>2]|0)+16>>2]&127](K)|0;cb[c[(c[L>>2]|0)+20>>2]&127](v,K);t=h;if((a[t]&1)==0){a[h+1|0]=0;a[t]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}h7(h,0);c[t>>2]=c[w>>2];c[t+4>>2]=c[w+4>>2];c[t+8>>2]=c[w+8>>2];pm(w|0,0,12)|0;h3(v);cb[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){a[j+1|0]=0;a[L]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}h7(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];pm(y|0,0,12)|0;h3(x);M=ce[c[(c[b>>2]|0)+36>>2]&127](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[4102]|0)!=-1){c[o>>2]=16408;c[o+4>>2]=14;c[o+8>>2]=0;h_(16408,o,98)}o=(c[4103]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=bZ(4)|0;O=N;oK(O);bs(N|0,10840,132)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=bZ(4)|0;O=N;oK(O);bs(N|0,10840,132)}N=K;cb[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C&255;C=C>>8;a[O+1|0]=C&255;C=C>>8;a[O+2|0]=C&255;C=C>>8;a[O+3|0]=C&255;O=K;cb[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){a[l+1|0]=0;a[z]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}h7(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];pm(B|0,0,12)|0;h3(A);cb[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){a[k+1|0]=0;a[A]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}h7(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];pm(E|0,0,12)|0;h3(D);D=K;a[f]=ce[c[(c[D>>2]|0)+12>>2]&127](N)|0;a[g]=ce[c[(c[D>>2]|0)+16>>2]&127](N)|0;cb[c[(c[O>>2]|0)+20>>2]&127](F,N);D=h;if((a[D]&1)==0){a[h+1|0]=0;a[D]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}h7(h,0);c[D>>2]=c[G>>2];c[D+4>>2]=c[G+4>>2];c[D+8>>2]=c[G+8>>2];pm(G|0,0,12)|0;h3(F);cb[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){a[j+1|0]=0;a[O]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}h7(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];pm(I|0,0,12)|0;h3(H);M=ce[c[(c[K>>2]|0)+36>>2]&127](N)|0;c[m>>2]=M;i=n;return}}function l8(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;h=b;i=a[h]|0;j=i&255;if((j&1|0)==0){k=j>>>1}else{k=c[b+4>>2]|0}if((k|0)==0){return}do{if((d|0)==(e|0)){l=i}else{k=e-4|0;if(k>>>0>d>>>0){m=d;n=k}else{l=i;break}do{k=c[m>>2]|0;c[m>>2]=c[n>>2];c[n>>2]=k;m=m+4|0;n=n-4|0;}while(m>>>0<n>>>0);l=a[h]|0}}while(0);if((l&1)==0){o=g+1|0}else{o=c[b+8>>2]|0}g=l&255;if((g&1|0)==0){p=g>>>1}else{p=c[b+4>>2]|0}b=e-4|0;e=a[o]|0;g=e<<24>>24;l=e<<24>>24<1|e<<24>>24==127;L7146:do{if(b>>>0>d>>>0){e=o+p|0;h=o;n=d;m=g;i=l;while(1){if(!i){if((m|0)!=(c[n>>2]|0)){break}}k=(e-h|0)>1?h+1|0:h;j=n+4|0;q=a[k]|0;r=q<<24>>24;s=q<<24>>24<1|q<<24>>24==127;if(j>>>0<b>>>0){h=k;n=j;m=r;i=s}else{t=r;u=s;break L7146}}c[f>>2]=4;return}else{t=g;u=l}}while(0);if(u){return}u=c[b>>2]|0;if(!(t>>>0<u>>>0|(u|0)==0)){return}c[f>>2]=4;return}function l9(a){a=a|0;hE(a|0);pb(a);return}function ma(a){a=a|0;hE(a|0);return}function mb(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+600|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=d+456|0;t=d+496|0;u=n|0;c[u>>2]=m;v=n+4|0;c[v>>2]=166;w=m+400|0;ip(p,h);m=p|0;x=c[m>>2]|0;if((c[3980]|0)!=-1){c[l>>2]=15920;c[l+4>>2]=14;c[l+8>>2]=0;h_(15920,l,98)}l=(c[3981]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>l>>>0){z=c[y+(l<<2)>>2]|0;if((z|0)==0){break}A=z;a[q]=0;B=f|0;c[r>>2]=c[B>>2];do{if(mc(e,r,g,p,c[h+4>>2]|0,j,q,A,n,o,w)|0){C=s|0;D=c[(c[z>>2]|0)+48>>2]|0;b7[D&15](A,4728,4738,C)|0;D=t|0;E=c[o>>2]|0;F=c[u>>2]|0;G=E-F|0;do{if((G|0)>392){H=o3((G>>2)+2|0)|0;if((H|0)!=0){I=H;J=H;break}ph();I=0;J=0}else{I=D;J=0}}while(0);if((a[q]&1)==0){K=I}else{a[I]=45;K=I+1|0}if(F>>>0<E>>>0){G=s+40|0;H=s;L=K;M=F;while(1){N=C;while(1){if((N|0)==(G|0)){O=G;break}if((c[N>>2]|0)==(c[M>>2]|0)){O=N;break}else{N=N+4|0}}a[L]=a[4728+(O-H>>2)|0]|0;N=M+4|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break}}}else{Q=K}a[Q]=0;M=bP(D|0,3480,(L=i,i=i+8|0,c[L>>2]=k,L)|0)|0;i=L;if((M|0)==1){if((J|0)==0){break}o4(J);break}M=bZ(8)|0;hM(M,3408);bs(M|0,10856,26)}}while(0);A=e|0;z=c[A>>2]|0;do{if((z|0)==0){R=0}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){S=ce[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{S=c[M>>2]|0}if((S|0)!=-1){R=z;break}c[A>>2]=0;R=0}}while(0);A=(R|0)==0;z=c[B>>2]|0;do{if((z|0)==0){T=5997}else{M=c[z+12>>2]|0;if((M|0)==(c[z+16>>2]|0)){U=ce[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{U=c[M>>2]|0}if((U|0)==-1){c[B>>2]=0;T=5997;break}else{if(A^(z|0)==0){break}else{T=5999;break}}}}while(0);if((T|0)==5997){if(A){T=5999}}if((T|0)==5999){c[j>>2]=c[j>>2]|2}c[b>>2]=R;z=c[m>>2]|0;hG(z)|0;z=c[u>>2]|0;c[u>>2]=0;if((z|0)==0){i=d;return}ca[c[v>>2]&511](z);i=d;return}}while(0);d=bZ(4)|0;oK(d);bs(d|0,10840,132)}function mc(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0;p=i;i=i+448|0;q=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[q>>2];q=p|0;r=p+8|0;s=p+408|0;t=p+416|0;u=p+424|0;v=p+432|0;w=v;x=i;i=i+12|0;i=i+7&-8;y=i;i=i+12|0;i=i+7&-8;z=i;i=i+12|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;c[q>>2]=o;o=r|0;pm(w|0,0,12)|0;D=x;E=y;F=z;G=A;pm(D|0,0,12)|0;pm(E|0,0,12)|0;pm(F|0,0,12)|0;pm(G|0,0,12)|0;mf(f,g,s,t,u,v,x,y,z,B);g=m|0;c[n>>2]=c[g>>2];f=b|0;b=e|0;e=l;H=z+4|0;I=z+8|0;J=y+4|0;K=y+8|0;L=(h&512|0)!=0;h=x+4|0;M=x+8|0;N=A+4|0;O=A+8|0;P=s+3|0;Q=v+4|0;R=166;S=o;T=o;o=r+400|0;r=0;U=0;L7230:while(1){V=c[f>>2]|0;do{if((V|0)==0){W=1}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){Y=ce[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{Y=c[X>>2]|0}if((Y|0)==-1){c[f>>2]=0;W=1;break}else{W=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){Z=6025}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){_=ce[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{_=c[X>>2]|0}if((_|0)==-1){c[b>>2]=0;Z=6025;break}else{if(W^(V|0)==0){$=V;break}else{aa=R;ab=S;ac=T;ad=r;Z=6265;break L7230}}}}while(0);if((Z|0)==6025){Z=0;if(W){aa=R;ab=S;ac=T;ad=r;Z=6265;break}else{$=0}}L7254:do{switch(a[s+U|0]|0){case 0:{Z=6050;break};case 3:{V=a[E]|0;X=V&255;ae=(X&1|0)==0;af=a[F]|0;ag=af&255;ah=(ag&1|0)==0;if(((ae?X>>>1:c[J>>2]|0)|0)==(-(ah?ag>>>1:c[H>>2]|0)|0)){ai=r;aj=o;ak=T;al=S;am=R;break L7254}do{if(((ae?X>>>1:c[J>>2]|0)|0)!=0){if(((ah?ag>>>1:c[H>>2]|0)|0)==0){break}an=c[f>>2]|0;ao=c[an+12>>2]|0;if((ao|0)==(c[an+16>>2]|0)){ap=ce[c[(c[an>>2]|0)+36>>2]&127](an)|0;aq=ap;ar=a[E]|0}else{aq=c[ao>>2]|0;ar=V}ao=c[f>>2]|0;ap=ao+12|0;an=c[ap>>2]|0;as=(an|0)==(c[ao+16>>2]|0);if((aq|0)==(c[((ar&1)==0?J:c[K>>2]|0)>>2]|0)){if(as){at=c[(c[ao>>2]|0)+40>>2]|0;ce[at&127](ao)|0}else{c[ap>>2]=an+4}ap=d[E]|0;ai=((ap&1|0)==0?ap>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;aj=o;ak=T;al=S;am=R;break L7254}if(as){au=ce[c[(c[ao>>2]|0)+36>>2]&127](ao)|0}else{au=c[an>>2]|0}if((au|0)!=(c[((a[F]&1)==0?H:c[I>>2]|0)>>2]|0)){Z=6115;break L7230}an=c[f>>2]|0;ao=an+12|0;as=c[ao>>2]|0;if((as|0)==(c[an+16>>2]|0)){ap=c[(c[an>>2]|0)+40>>2]|0;ce[ap&127](an)|0}else{c[ao>>2]=as+4}a[k]=1;as=d[F]|0;ai=((as&1|0)==0?as>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;aj=o;ak=T;al=S;am=R;break L7254}}while(0);ag=c[f>>2]|0;ah=c[ag+12>>2]|0;as=(ah|0)==(c[ag+16>>2]|0);if(((ae?X>>>1:c[J>>2]|0)|0)==0){if(as){ao=ce[c[(c[ag>>2]|0)+36>>2]&127](ag)|0;av=ao;aw=a[F]|0}else{av=c[ah>>2]|0;aw=af}if((av|0)!=(c[((aw&1)==0?H:c[I>>2]|0)>>2]|0)){ai=r;aj=o;ak=T;al=S;am=R;break L7254}ao=c[f>>2]|0;an=ao+12|0;ap=c[an>>2]|0;if((ap|0)==(c[ao+16>>2]|0)){at=c[(c[ao>>2]|0)+40>>2]|0;ce[at&127](ao)|0}else{c[an>>2]=ap+4}a[k]=1;ap=d[F]|0;ai=((ap&1|0)==0?ap>>>1:c[H>>2]|0)>>>0>1>>>0?z:r;aj=o;ak=T;al=S;am=R;break L7254}if(as){as=ce[c[(c[ag>>2]|0)+36>>2]&127](ag)|0;ax=as;ay=a[E]|0}else{ax=c[ah>>2]|0;ay=V}if((ax|0)!=(c[((ay&1)==0?J:c[K>>2]|0)>>2]|0)){a[k]=1;ai=r;aj=o;ak=T;al=S;am=R;break L7254}ah=c[f>>2]|0;as=ah+12|0;ag=c[as>>2]|0;if((ag|0)==(c[ah+16>>2]|0)){ap=c[(c[ah>>2]|0)+40>>2]|0;ce[ap&127](ah)|0}else{c[as>>2]=ag+4}ag=d[E]|0;ai=((ag&1|0)==0?ag>>>1:c[J>>2]|0)>>>0>1>>>0?y:r;aj=o;ak=T;al=S;am=R;break};case 2:{if(!((r|0)!=0|U>>>0<2>>>0)){if((U|0)==2){az=(a[P]|0)!=0}else{az=0}if(!(L|az)){ai=0;aj=o;ak=T;al=S;am=R;break L7254}}ag=a[D]|0;as=(ag&1)==0?h:c[M>>2]|0;L7314:do{if((U|0)==0){aA=as;aB=ag;aC=$}else{if((d[s+(U-1)|0]|0)>>>0<2>>>0){aD=as;aE=ag}else{aA=as;aB=ag;aC=$;break}while(1){ah=aE&255;if((aD|0)==(((aE&1)==0?h:c[M>>2]|0)+(((ah&1|0)==0?ah>>>1:c[h>>2]|0)<<2)|0)){aF=aE;break}if(!(cf[c[(c[e>>2]|0)+12>>2]&63](l,8192,c[aD>>2]|0)|0)){Z=6126;break}aD=aD+4|0;aE=a[D]|0}if((Z|0)==6126){Z=0;aF=a[D]|0}ah=(aF&1)==0;ap=aD-(ah?h:c[M>>2]|0)>>2;an=a[G]|0;ao=an&255;at=(ao&1|0)==0;L7324:do{if(ap>>>0<=(at?ao>>>1:c[N>>2]|0)>>>0){aG=(an&1)==0;aH=(aG?N:c[O>>2]|0)+((at?ao>>>1:c[N>>2]|0)-ap<<2)|0;aI=(aG?N:c[O>>2]|0)+((at?ao>>>1:c[N>>2]|0)<<2)|0;if((aH|0)==(aI|0)){aA=aD;aB=aF;aC=$;break L7314}else{aJ=aH;aK=ah?h:c[M>>2]|0}while(1){if((c[aJ>>2]|0)!=(c[aK>>2]|0)){break L7324}aH=aJ+4|0;if((aH|0)==(aI|0)){aA=aD;aB=aF;aC=$;break L7314}aJ=aH;aK=aK+4|0}}}while(0);aA=ah?h:c[M>>2]|0;aB=aF;aC=$}}while(0);L7331:while(1){ag=aB&255;if((aA|0)==(((aB&1)==0?h:c[M>>2]|0)+(((ag&1|0)==0?ag>>>1:c[h>>2]|0)<<2)|0)){break}ag=c[f>>2]|0;do{if((ag|0)==0){aL=1}else{as=c[ag+12>>2]|0;if((as|0)==(c[ag+16>>2]|0)){aM=ce[c[(c[ag>>2]|0)+36>>2]&127](ag)|0}else{aM=c[as>>2]|0}if((aM|0)==-1){c[f>>2]=0;aL=1;break}else{aL=(c[f>>2]|0)==0;break}}}while(0);do{if((aC|0)==0){Z=6147}else{ag=c[aC+12>>2]|0;if((ag|0)==(c[aC+16>>2]|0)){aN=ce[c[(c[aC>>2]|0)+36>>2]&127](aC)|0}else{aN=c[ag>>2]|0}if((aN|0)==-1){c[b>>2]=0;Z=6147;break}else{if(aL^(aC|0)==0){aO=aC;break}else{break L7331}}}}while(0);if((Z|0)==6147){Z=0;if(aL){break}else{aO=0}}ag=c[f>>2]|0;ah=c[ag+12>>2]|0;if((ah|0)==(c[ag+16>>2]|0)){aP=ce[c[(c[ag>>2]|0)+36>>2]&127](ag)|0}else{aP=c[ah>>2]|0}if((aP|0)!=(c[aA>>2]|0)){break}ah=c[f>>2]|0;ag=ah+12|0;as=c[ag>>2]|0;if((as|0)==(c[ah+16>>2]|0)){V=c[(c[ah>>2]|0)+40>>2]|0;ce[V&127](ah)|0}else{c[ag>>2]=as+4}aA=aA+4|0;aB=a[D]|0;aC=aO}if(!L){ai=r;aj=o;ak=T;al=S;am=R;break L7254}as=a[D]|0;ag=as&255;if((aA|0)==(((as&1)==0?h:c[M>>2]|0)+(((ag&1|0)==0?ag>>>1:c[h>>2]|0)<<2)|0)){ai=r;aj=o;ak=T;al=S;am=R}else{Z=6159;break L7230}break};case 4:{ag=0;as=o;ah=T;V=S;af=R;L7367:while(1){X=c[f>>2]|0;do{if((X|0)==0){aQ=1}else{ae=c[X+12>>2]|0;if((ae|0)==(c[X+16>>2]|0)){aR=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{aR=c[ae>>2]|0}if((aR|0)==-1){c[f>>2]=0;aQ=1;break}else{aQ=(c[f>>2]|0)==0;break}}}while(0);X=c[b>>2]|0;do{if((X|0)==0){Z=6173}else{ae=c[X+12>>2]|0;if((ae|0)==(c[X+16>>2]|0)){aS=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{aS=c[ae>>2]|0}if((aS|0)==-1){c[b>>2]=0;Z=6173;break}else{if(aQ^(X|0)==0){break}else{break L7367}}}}while(0);if((Z|0)==6173){Z=0;if(aQ){break}}X=c[f>>2]|0;ae=c[X+12>>2]|0;if((ae|0)==(c[X+16>>2]|0)){aT=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{aT=c[ae>>2]|0}if(cf[c[(c[e>>2]|0)+12>>2]&63](l,2048,aT)|0){ae=c[n>>2]|0;if((ae|0)==(c[q>>2]|0)){mg(m,n,q);aU=c[n>>2]|0}else{aU=ae}c[n>>2]=aU+4;c[aU>>2]=aT;aV=ag+1|0;aW=as;aX=ah;aY=V;aZ=af}else{ae=d[w]|0;if((((ae&1|0)==0?ae>>>1:c[Q>>2]|0)|0)==0|(ag|0)==0){break}if((aT|0)!=(c[u>>2]|0)){break}if((ah|0)==(as|0)){ae=(af|0)!=166;X=ah-V|0;ao=X>>>0<2147483647>>>0?X<<1:-1;if(ae){a_=V}else{a_=0}ae=o5(a_,ao)|0;at=ae;if((ae|0)==0){ph()}a$=at+(ao>>>2<<2)|0;a0=at+(X>>2<<2)|0;a1=at;a2=82}else{a$=as;a0=ah;a1=V;a2=af}c[a0>>2]=ag;aV=0;aW=a$;aX=a0+4|0;aY=a1;aZ=a2}at=c[f>>2]|0;X=at+12|0;ao=c[X>>2]|0;if((ao|0)==(c[at+16>>2]|0)){ae=c[(c[at>>2]|0)+40>>2]|0;ce[ae&127](at)|0;ag=aV;as=aW;ah=aX;V=aY;af=aZ;continue}else{c[X>>2]=ao+4;ag=aV;as=aW;ah=aX;V=aY;af=aZ;continue}}if((V|0)==(ah|0)|(ag|0)==0){a3=as;a4=ah;a5=V;a6=af}else{if((ah|0)==(as|0)){ao=(af|0)!=166;X=ah-V|0;at=X>>>0<2147483647>>>0?X<<1:-1;if(ao){a7=V}else{a7=0}ao=o5(a7,at)|0;ae=ao;if((ao|0)==0){ph()}a8=ae+(at>>>2<<2)|0;a9=ae+(X>>2<<2)|0;ba=ae;bb=82}else{a8=as;a9=ah;ba=V;bb=af}c[a9>>2]=ag;a3=a8;a4=a9+4|0;a5=ba;a6=bb}ae=c[B>>2]|0;if((ae|0)>0){X=c[f>>2]|0;do{if((X|0)==0){bc=1}else{at=c[X+12>>2]|0;if((at|0)==(c[X+16>>2]|0)){bd=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{bd=c[at>>2]|0}if((bd|0)==-1){c[f>>2]=0;bc=1;break}else{bc=(c[f>>2]|0)==0;break}}}while(0);X=c[b>>2]|0;do{if((X|0)==0){Z=6222}else{ag=c[X+12>>2]|0;if((ag|0)==(c[X+16>>2]|0)){be=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{be=c[ag>>2]|0}if((be|0)==-1){c[b>>2]=0;Z=6222;break}else{if(bc^(X|0)==0){bf=X;break}else{Z=6228;break L7230}}}}while(0);if((Z|0)==6222){Z=0;if(bc){Z=6228;break L7230}else{bf=0}}X=c[f>>2]|0;ag=c[X+12>>2]|0;if((ag|0)==(c[X+16>>2]|0)){bg=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{bg=c[ag>>2]|0}if((bg|0)!=(c[t>>2]|0)){Z=6228;break L7230}ag=c[f>>2]|0;X=ag+12|0;af=c[X>>2]|0;if((af|0)==(c[ag+16>>2]|0)){V=c[(c[ag>>2]|0)+40>>2]|0;ce[V&127](ag)|0;bh=bf;bi=ae}else{c[X>>2]=af+4;bh=bf;bi=ae}while(1){af=c[f>>2]|0;do{if((af|0)==0){bj=1}else{X=c[af+12>>2]|0;if((X|0)==(c[af+16>>2]|0)){bk=ce[c[(c[af>>2]|0)+36>>2]&127](af)|0}else{bk=c[X>>2]|0}if((bk|0)==-1){c[f>>2]=0;bj=1;break}else{bj=(c[f>>2]|0)==0;break}}}while(0);do{if((bh|0)==0){Z=6245}else{af=c[bh+12>>2]|0;if((af|0)==(c[bh+16>>2]|0)){bl=ce[c[(c[bh>>2]|0)+36>>2]&127](bh)|0}else{bl=c[af>>2]|0}if((bl|0)==-1){c[b>>2]=0;Z=6245;break}else{if(bj^(bh|0)==0){bm=bh;break}else{Z=6252;break L7230}}}}while(0);if((Z|0)==6245){Z=0;if(bj){Z=6252;break L7230}else{bm=0}}af=c[f>>2]|0;X=c[af+12>>2]|0;if((X|0)==(c[af+16>>2]|0)){bn=ce[c[(c[af>>2]|0)+36>>2]&127](af)|0}else{bn=c[X>>2]|0}if(!(cf[c[(c[e>>2]|0)+12>>2]&63](l,2048,bn)|0)){Z=6252;break L7230}if((c[n>>2]|0)==(c[q>>2]|0)){mg(m,n,q)}X=c[f>>2]|0;af=c[X+12>>2]|0;if((af|0)==(c[X+16>>2]|0)){bo=ce[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{bo=c[af>>2]|0}af=c[n>>2]|0;c[n>>2]=af+4;c[af>>2]=bo;af=bi-1|0;c[B>>2]=af;X=c[f>>2]|0;ag=X+12|0;V=c[ag>>2]|0;if((V|0)==(c[X+16>>2]|0)){ah=c[(c[X>>2]|0)+40>>2]|0;ce[ah&127](X)|0}else{c[ag>>2]=V+4}if((af|0)>0){bh=bm;bi=af}else{break}}}if((c[n>>2]|0)==(c[g>>2]|0)){Z=6263;break L7230}else{ai=r;aj=a3;ak=a4;al=a5;am=a6}break};case 1:{if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=6265;break L7230}ae=c[f>>2]|0;af=c[ae+12>>2]|0;if((af|0)==(c[ae+16>>2]|0)){bp=ce[c[(c[ae>>2]|0)+36>>2]&127](ae)|0}else{bp=c[af>>2]|0}if(!(cf[c[(c[e>>2]|0)+12>>2]&63](l,8192,bp)|0)){Z=6049;break L7230}af=c[f>>2]|0;ae=af+12|0;V=c[ae>>2]|0;if((V|0)==(c[af+16>>2]|0)){bq=ce[c[(c[af>>2]|0)+40>>2]&127](af)|0}else{c[ae>>2]=V+4;bq=c[V>>2]|0}ij(A,bq);Z=6050;break};default:{ai=r;aj=o;ak=T;al=S;am=R}}}while(0);L7523:do{if((Z|0)==6050){Z=0;if((U|0)==3){aa=R;ab=S;ac=T;ad=r;Z=6265;break L7230}else{br=$}while(1){V=c[f>>2]|0;do{if((V|0)==0){bs=1}else{ae=c[V+12>>2]|0;if((ae|0)==(c[V+16>>2]|0)){bt=ce[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{bt=c[ae>>2]|0}if((bt|0)==-1){c[f>>2]=0;bs=1;break}else{bs=(c[f>>2]|0)==0;break}}}while(0);do{if((br|0)==0){Z=6064}else{V=c[br+12>>2]|0;if((V|0)==(c[br+16>>2]|0)){bu=ce[c[(c[br>>2]|0)+36>>2]&127](br)|0}else{bu=c[V>>2]|0}if((bu|0)==-1){c[b>>2]=0;Z=6064;break}else{if(bs^(br|0)==0){bv=br;break}else{ai=r;aj=o;ak=T;al=S;am=R;break L7523}}}}while(0);if((Z|0)==6064){Z=0;if(bs){ai=r;aj=o;ak=T;al=S;am=R;break L7523}else{bv=0}}V=c[f>>2]|0;ae=c[V+12>>2]|0;if((ae|0)==(c[V+16>>2]|0)){bw=ce[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{bw=c[ae>>2]|0}if(!(cf[c[(c[e>>2]|0)+12>>2]&63](l,8192,bw)|0)){ai=r;aj=o;ak=T;al=S;am=R;break L7523}ae=c[f>>2]|0;V=ae+12|0;af=c[V>>2]|0;if((af|0)==(c[ae+16>>2]|0)){bx=ce[c[(c[ae>>2]|0)+40>>2]&127](ae)|0}else{c[V>>2]=af+4;bx=c[af>>2]|0}ij(A,bx);br=bv}}}while(0);af=U+1|0;if(af>>>0<4>>>0){R=am;S=al;T=ak;o=aj;r=ai;U=af}else{aa=am;ab=al;ac=ak;ad=ai;Z=6265;break}}L7560:do{if((Z|0)==6049){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==6115){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==6159){c[j>>2]=c[j>>2]|4;by=0;bz=S;bA=R}else if((Z|0)==6228){c[j>>2]=c[j>>2]|4;by=0;bz=a5;bA=a6}else if((Z|0)==6252){c[j>>2]=c[j>>2]|4;by=0;bz=a5;bA=a6}else if((Z|0)==6263){c[j>>2]=c[j>>2]|4;by=0;bz=a5;bA=a6}else if((Z|0)==6265){L7568:do{if((ad|0)!=0){ai=ad;ak=ad+4|0;al=ad+8|0;am=1;L7570:while(1){U=d[ai]|0;if((U&1|0)==0){bB=U>>>1}else{bB=c[ak>>2]|0}if(am>>>0>=bB>>>0){break L7568}U=c[f>>2]|0;do{if((U|0)==0){bC=1}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bD=ce[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{bD=c[r>>2]|0}if((bD|0)==-1){c[f>>2]=0;bC=1;break}else{bC=(c[f>>2]|0)==0;break}}}while(0);U=c[b>>2]|0;do{if((U|0)==0){Z=6284}else{r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bE=ce[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{bE=c[r>>2]|0}if((bE|0)==-1){c[b>>2]=0;Z=6284;break}else{if(bC^(U|0)==0){break}else{break L7570}}}}while(0);if((Z|0)==6284){Z=0;if(bC){break}}U=c[f>>2]|0;r=c[U+12>>2]|0;if((r|0)==(c[U+16>>2]|0)){bF=ce[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{bF=c[r>>2]|0}if((a[ai]&1)==0){bG=ak}else{bG=c[al>>2]|0}if((bF|0)!=(c[bG+(am<<2)>>2]|0)){break}r=am+1|0;U=c[f>>2]|0;aj=U+12|0;o=c[aj>>2]|0;if((o|0)==(c[U+16>>2]|0)){T=c[(c[U>>2]|0)+40>>2]|0;ce[T&127](U)|0;am=r;continue}else{c[aj>>2]=o+4;am=r;continue}}c[j>>2]=c[j>>2]|4;by=0;bz=ab;bA=aa;break L7560}}while(0);if((ab|0)==(ac|0)){by=1;bz=ac;bA=aa;break}c[C>>2]=0;l8(v,ab,ac,C);if((c[C>>2]|0)==0){by=1;bz=ab;bA=aa;break}c[j>>2]=c[j>>2]|4;by=0;bz=ab;bA=aa}}while(0);ie(A);ie(z);ie(y);ie(x);h3(v);if((bz|0)==0){i=p;return by|0}ca[bA&511](bz);i=p;return by|0}function md(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+456|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=d|0;m=d+16|0;n=d+416|0;o=d+424|0;p=d+432|0;q=d+440|0;r=d+448|0;s=n|0;c[s>>2]=m;t=n+4|0;c[t>>2]=166;u=m+400|0;ip(p,h);m=p|0;v=c[m>>2]|0;if((c[3980]|0)!=-1){c[l>>2]=15920;c[l+4>>2]=14;c[l+8>>2]=0;h_(15920,l,98)}l=(c[3981]|0)-1|0;w=c[v+8>>2]|0;do{if((c[v+12>>2]|0)-w>>2>>>0>l>>>0){x=c[w+(l<<2)>>2]|0;if((x|0)==0){break}y=x;a[q]=0;z=f|0;A=c[z>>2]|0;c[r>>2]=A;if(mc(e,r,g,p,c[h+4>>2]|0,j,q,y,n,o,u)|0){B=k;if((a[B]&1)==0){c[k+4>>2]=0;a[B]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}B=x;if((a[q]&1)!=0){ij(k,cm[c[(c[B>>2]|0)+44>>2]&31](y,45)|0)}x=cm[c[(c[B>>2]|0)+44>>2]&31](y,48)|0;y=c[o>>2]|0;B=y-4|0;C=c[s>>2]|0;while(1){if(C>>>0>=B>>>0){break}if((c[C>>2]|0)==(x|0)){C=C+4|0}else{break}}me(k,C,y)|0}x=e|0;B=c[x>>2]|0;do{if((B|0)==0){D=0}else{E=c[B+12>>2]|0;if((E|0)==(c[B+16>>2]|0)){F=ce[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{F=c[E>>2]|0}if((F|0)!=-1){D=B;break}c[x>>2]=0;D=0}}while(0);x=(D|0)==0;do{if((A|0)==0){G=6339}else{B=c[A+12>>2]|0;if((B|0)==(c[A+16>>2]|0)){H=ce[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{H=c[B>>2]|0}if((H|0)==-1){c[z>>2]=0;G=6339;break}else{if(x^(A|0)==0){break}else{G=6341;break}}}}while(0);if((G|0)==6339){if(x){G=6341}}if((G|0)==6341){c[j>>2]=c[j>>2]|2}c[b>>2]=D;A=c[m>>2]|0;hG(A)|0;A=c[s>>2]|0;c[s>>2]=0;if((A|0)==0){i=d;return}ca[c[t>>2]&511](A);i=d;return}}while(0);d=bZ(4)|0;oK(d);bs(d|0,10840,132)}function me(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;f=b;g=d;h=a[f]|0;i=h&255;if((i&1|0)==0){j=i>>>1}else{j=c[b+4>>2]|0}if((h&1)==0){k=1;l=h}else{h=c[b>>2]|0;k=(h&-2)-1|0;l=h&255}h=e-g>>2;if((h|0)==0){return b|0}if((k-j|0)>>>0<h>>>0){il(b,k,j+h-k|0,j,j,0,0);m=a[f]|0}else{m=l}if((m&1)==0){n=b+4|0}else{n=c[b+8>>2]|0}m=n+(j<<2)|0;if((d|0)==(e|0)){o=m}else{l=j+((e-4+(-g|0)|0)>>>2)+1|0;g=d;d=m;while(1){c[d>>2]=c[g>>2];m=g+4|0;if((m|0)==(e|0)){break}else{g=m;d=d+4|0}}o=n+(l<<2)|0}c[o>>2]=0;o=j+h|0;if((a[f]&1)==0){a[f]=o<<1&255;return b|0}else{c[b+4>>2]=o;return b|0}return 0}function mf(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;n=i;i=i+56|0;o=n|0;p=n+16|0;q=n+32|0;r=n+40|0;s=r;t=i;i=i+12|0;i=i+7&-8;u=t;v=i;i=i+12|0;i=i+7&-8;w=v;x=i;i=i+12|0;i=i+7&-8;y=x;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+12|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+12|0;i=i+7&-8;I=H;if(b){b=c[d>>2]|0;if((c[4096]|0)!=-1){c[p>>2]=16384;c[p+4>>2]=14;c[p+8>>2]=0;h_(16384,p,98)}p=(c[4097]|0)-1|0;J=c[b+8>>2]|0;if((c[b+12>>2]|0)-J>>2>>>0<=p>>>0){K=bZ(4)|0;L=K;oK(L);bs(K|0,10840,132)}b=c[J+(p<<2)>>2]|0;if((b|0)==0){K=bZ(4)|0;L=K;oK(L);bs(K|0,10840,132)}K=b;cb[c[(c[b>>2]|0)+44>>2]&127](q,K);L=e;C=c[q>>2]|0;a[L]=C&255;C=C>>8;a[L+1|0]=C&255;C=C>>8;a[L+2|0]=C&255;C=C>>8;a[L+3|0]=C&255;L=b;cb[c[(c[L>>2]|0)+32>>2]&127](r,K);q=l;if((a[q]&1)==0){c[l+4>>2]=0;a[q]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}ii(l,0);c[q>>2]=c[s>>2];c[q+4>>2]=c[s+4>>2];c[q+8>>2]=c[s+8>>2];pm(s|0,0,12)|0;ie(r);cb[c[(c[L>>2]|0)+28>>2]&127](t,K);r=k;if((a[r]&1)==0){c[k+4>>2]=0;a[r]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}ii(k,0);c[r>>2]=c[u>>2];c[r+4>>2]=c[u+4>>2];c[r+8>>2]=c[u+8>>2];pm(u|0,0,12)|0;ie(t);t=b;c[f>>2]=ce[c[(c[t>>2]|0)+12>>2]&127](K)|0;c[g>>2]=ce[c[(c[t>>2]|0)+16>>2]&127](K)|0;cb[c[(c[b>>2]|0)+20>>2]&127](v,K);b=h;if((a[b]&1)==0){a[h+1|0]=0;a[b]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}h7(h,0);c[b>>2]=c[w>>2];c[b+4>>2]=c[w+4>>2];c[b+8>>2]=c[w+8>>2];pm(w|0,0,12)|0;h3(v);cb[c[(c[L>>2]|0)+24>>2]&127](x,K);L=j;if((a[L]&1)==0){c[j+4>>2]=0;a[L]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}ii(j,0);c[L>>2]=c[y>>2];c[L+4>>2]=c[y+4>>2];c[L+8>>2]=c[y+8>>2];pm(y|0,0,12)|0;ie(x);M=ce[c[(c[t>>2]|0)+36>>2]&127](K)|0;c[m>>2]=M;i=n;return}else{K=c[d>>2]|0;if((c[4098]|0)!=-1){c[o>>2]=16392;c[o+4>>2]=14;c[o+8>>2]=0;h_(16392,o,98)}o=(c[4099]|0)-1|0;d=c[K+8>>2]|0;if((c[K+12>>2]|0)-d>>2>>>0<=o>>>0){N=bZ(4)|0;O=N;oK(O);bs(N|0,10840,132)}K=c[d+(o<<2)>>2]|0;if((K|0)==0){N=bZ(4)|0;O=N;oK(O);bs(N|0,10840,132)}N=K;cb[c[(c[K>>2]|0)+44>>2]&127](z,N);O=e;C=c[z>>2]|0;a[O]=C&255;C=C>>8;a[O+1|0]=C&255;C=C>>8;a[O+2|0]=C&255;C=C>>8;a[O+3|0]=C&255;O=K;cb[c[(c[O>>2]|0)+32>>2]&127](A,N);z=l;if((a[z]&1)==0){c[l+4>>2]=0;a[z]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}ii(l,0);c[z>>2]=c[B>>2];c[z+4>>2]=c[B+4>>2];c[z+8>>2]=c[B+8>>2];pm(B|0,0,12)|0;ie(A);cb[c[(c[O>>2]|0)+28>>2]&127](D,N);A=k;if((a[A]&1)==0){c[k+4>>2]=0;a[A]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}ii(k,0);c[A>>2]=c[E>>2];c[A+4>>2]=c[E+4>>2];c[A+8>>2]=c[E+8>>2];pm(E|0,0,12)|0;ie(D);D=K;c[f>>2]=ce[c[(c[D>>2]|0)+12>>2]&127](N)|0;c[g>>2]=ce[c[(c[D>>2]|0)+16>>2]&127](N)|0;cb[c[(c[K>>2]|0)+20>>2]&127](F,N);K=h;if((a[K]&1)==0){a[h+1|0]=0;a[K]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}h7(h,0);c[K>>2]=c[G>>2];c[K+4>>2]=c[G+4>>2];c[K+8>>2]=c[G+8>>2];pm(G|0,0,12)|0;h3(F);cb[c[(c[O>>2]|0)+24>>2]&127](H,N);O=j;if((a[O]&1)==0){c[j+4>>2]=0;a[O]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}ii(j,0);c[O>>2]=c[I>>2];c[O+4>>2]=c[I+4>>2];c[O+8>>2]=c[I+8>>2];pm(I|0,0,12)|0;ie(H);M=ce[c[(c[D>>2]|0)+36>>2]&127](N)|0;c[m>>2]=M;i=n;return}}function mg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a+4|0;f=(c[e>>2]|0)!=166;g=a|0;a=c[g>>2]|0;h=a;i=(c[d>>2]|0)-h|0;j=i>>>0<2147483647>>>0?i<<1:-1;i=(c[b>>2]|0)-h>>2;if(f){k=a}else{k=0}a=o5(k,j)|0;k=a;if((a|0)==0){ph()}do{if(f){c[g>>2]=k;l=k}else{a=c[g>>2]|0;c[g>>2]=k;if((a|0)==0){l=k;break}ca[c[e>>2]&511](a);l=c[g>>2]|0}}while(0);c[e>>2]=82;c[b>>2]=l+(i<<2);c[d>>2]=(c[g>>2]|0)+(j>>>2<<2);return}function mh(a){a=a|0;hE(a|0);pb(a);return}function mi(a){a=a|0;hE(a|0);return}function mj(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;e=i;i=i+280|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+232|0;p=e+240|0;q=e+248|0;r=e+256|0;s=e+264|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+100|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=a_(D|0,100,3296,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);G=kv(n,c[3620]|0,3296,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){ph();I=c[n>>2]|0}else{I=H}H=o3(G)|0;if((H|0)!=0){J=H;K=G;L=I;M=H;break}ph();J=0;K=G;L=I;M=0}else{J=E;K=F;L=0;M=0}}while(0);ip(o,j);F=o|0;E=c[F>>2]|0;if((c[3982]|0)!=-1){c[m>>2]=15928;c[m+4>>2]=14;c[m+8>>2]=0;h_(15928,m,98)}m=(c[3983]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}G=D;H=c[n>>2]|0;N=H+K|0;O=c[(c[D>>2]|0)+32>>2]|0;b7[O&15](G,H,N,J)|0;if((K|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}pm(t|0,0,12)|0;pm(v|0,0,12)|0;pm(x|0,0,12)|0;mk(g,P,o,p,q,r,s,u,w,y);N=z|0;H=c[y>>2]|0;if((K|0)>(H|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(K-H<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+H|0;do{if(O>>>0>100>>>0){D=o3(O)|0;if((D|0)!=0){V=D;W=D;break}ph();V=0;W=0}else{V=N;W=0}}while(0);ml(V,A,B,c[j+4>>2]|0,J,J+K|0,G,P,p,a[q]|0,a[r]|0,s,u,w,H);c[C>>2]=c[f>>2];kq(b,C,V,c[A>>2]|0,c[B>>2]|0,j,k);if((W|0)!=0){o4(W)}h3(w);h3(u);h3(s);N=c[F>>2]|0;hG(N)|0;if((M|0)!=0){o4(M)}if((L|0)==0){i=e;return}o4(L);i=e;return}}while(0);e=bZ(4)|0;oK(e);bs(e|0,10840,132)}function mk(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[4100]|0)!=-1){c[p>>2]=16400;c[p+4>>2]=14;c[p+8>>2]=0;h_(16400,p,98)}p=(c[4101]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=bZ(4)|0;R=Q;oK(R);bs(Q|0,10840,132)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=bZ(4)|0;R=Q;oK(R);bs(Q|0,10840,132)}Q=e;R=c[e>>2]|0;if(d){cb[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C&255;C=C>>8;a[r+1|0]=C&255;C=C>>8;a[r+2|0]=C&255;C=C>>8;a[r+3|0]=C&255;cb[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){a[l+1|0]=0;a[r]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}h7(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];pm(t|0,0,12)|0;h3(s)}else{cb[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C&255;C=C>>8;a[v+1|0]=C&255;C=C>>8;a[v+2|0]=C&255;C=C>>8;a[v+3|0]=C&255;cb[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){a[l+1|0]=0;a[v]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}h7(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];pm(x|0,0,12)|0;h3(w)}w=e;a[g]=ce[c[(c[w>>2]|0)+12>>2]&127](Q)|0;a[h]=ce[c[(c[w>>2]|0)+16>>2]&127](Q)|0;w=e;cb[c[(c[w>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}h7(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];pm(z|0,0,12)|0;h3(y);cb[c[(c[w>>2]|0)+24>>2]&127](A,Q);w=k;if((a[w]&1)==0){a[k+1|0]=0;a[w]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}h7(k,0);c[w>>2]=c[B>>2];c[w+4>>2]=c[B+4>>2];c[w+8>>2]=c[B+8>>2];pm(B|0,0,12)|0;h3(A);S=ce[c[(c[e>>2]|0)+36>>2]&127](Q)|0;c[m>>2]=S;i=n;return}else{if((c[4102]|0)!=-1){c[o>>2]=16408;c[o+4>>2]=14;c[o+8>>2]=0;h_(16408,o,98)}o=(c[4103]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=bZ(4)|0;U=T;oK(U);bs(T|0,10840,132)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=bZ(4)|0;U=T;oK(U);bs(T|0,10840,132)}T=P;U=c[P>>2]|0;if(d){cb[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C&255;C=C>>8;a[E+1|0]=C&255;C=C>>8;a[E+2|0]=C&255;C=C>>8;a[E+3|0]=C&255;cb[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){a[l+1|0]=0;a[E]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}h7(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];pm(G|0,0,12)|0;h3(F)}else{cb[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C&255;C=C>>8;a[I+1|0]=C&255;C=C>>8;a[I+2|0]=C&255;C=C>>8;a[I+3|0]=C&255;cb[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){a[l+1|0]=0;a[I]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}h7(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];pm(K|0,0,12)|0;h3(J)}J=P;a[g]=ce[c[(c[J>>2]|0)+12>>2]&127](T)|0;a[h]=ce[c[(c[J>>2]|0)+16>>2]&127](T)|0;J=P;cb[c[(c[J>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}h7(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];pm(M|0,0,12)|0;h3(L);cb[c[(c[J>>2]|0)+24>>2]&127](N,T);J=k;if((a[J]&1)==0){a[k+1|0]=0;a[J]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}h7(k,0);c[J>>2]=c[O>>2];c[J+4>>2]=c[O+4>>2];c[J+8>>2]=c[O+8>>2];pm(O|0,0,12)|0;h3(N);S=ce[c[(c[P>>2]|0)+36>>2]&127](T)|0;c[m>>2]=S;i=n;return}}function ml(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=j+8|0;B=(r|0)>0;C=o;D=o+1|0;E=o+8|0;F=o+4|0;o=-r|0;G=h;h=0;while(1){L7920:do{switch(a[l+h|0]|0){case 0:{c[e>>2]=c[f>>2];H=G;break};case 3:{I=a[t]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[w>>2]|0}if((K|0)==0){H=G;break L7920}if((I&1)==0){L=u}else{L=c[v>>2]|0}I=a[L]|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=I;H=G;break};case 4:{I=c[f>>2]|0;J=k?G+1|0:G;M=J;while(1){if(M>>>0>=i>>>0){break}N=a[M]|0;if(N<<24>>24<0){break}if((b[(c[p>>2]|0)+(N<<24>>24<<1)>>1]&2048)==0){break}else{M=M+1|0}}N=M;if(B){if(M>>>0>J>>>0){O=J+(-N|0)|0;N=O>>>0<o>>>0?o:O;O=N+r|0;P=M;Q=r;R=I;while(1){S=P-1|0;T=a[S]|0;c[f>>2]=R+1;a[R]=T;T=Q-1|0;U=(T|0)>0;if(!(S>>>0>J>>>0&U)){break}P=S;Q=T;R=c[f>>2]|0}R=M+N|0;if(U){V=O;W=R;X=6612}else{Y=0;Z=O;_=R}}else{V=r;W=M;X=6612}if((X|0)==6612){X=0;Y=cm[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;Z=V;_=W}R=c[f>>2]|0;c[f>>2]=R+1;if((Z|0)>0){Q=Z;P=R;while(1){a[P]=Y;T=Q-1|0;S=c[f>>2]|0;c[f>>2]=S+1;if((T|0)>0){Q=T;P=S}else{$=S;break}}}else{$=R}a[$]=m;aa=_}else{aa=M}if((aa|0)==(J|0)){P=cm[c[(c[s>>2]|0)+28>>2]&31](j,48)|0;Q=c[f>>2]|0;c[f>>2]=Q+1;a[Q]=P}else{P=a[C]|0;Q=P&255;if((Q&1|0)==0){ab=Q>>>1}else{ab=c[F>>2]|0}if((ab|0)==0){ac=aa;ad=0;ae=0;af=-1}else{if((P&1)==0){ag=D}else{ag=c[E>>2]|0}ac=aa;ad=0;ae=0;af=a[ag]|0}while(1){do{if((ad|0)==(af|0)){P=c[f>>2]|0;c[f>>2]=P+1;a[P]=n;P=ae+1|0;Q=a[C]|0;O=Q&255;if((O&1|0)==0){ah=O>>>1}else{ah=c[F>>2]|0}if(P>>>0>=ah>>>0){ai=af;aj=P;ak=0;break}O=(Q&1)==0;if(O){al=D}else{al=c[E>>2]|0}if((a[al+P|0]|0)==127){ai=-1;aj=P;ak=0;break}if(O){am=D}else{am=c[E>>2]|0}ai=a[am+P|0]|0;aj=P;ak=0}else{ai=af;aj=ae;ak=ad}}while(0);P=ac-1|0;O=a[P]|0;Q=c[f>>2]|0;c[f>>2]=Q+1;a[Q]=O;if((P|0)==(J|0)){break}else{ac=P;ad=ak+1|0;ae=aj;af=ai}}}M=c[f>>2]|0;if((I|0)==(M|0)){H=J;break L7920}R=M-1|0;if(I>>>0<R>>>0){an=I;ao=R}else{H=J;break L7920}while(1){R=a[an]|0;a[an]=a[ao]|0;a[ao]=R;R=an+1|0;M=ao-1|0;if(R>>>0<M>>>0){an=R;ao=M}else{H=J;break}}break};case 1:{c[e>>2]=c[f>>2];J=cm[c[(c[s>>2]|0)+28>>2]&31](j,32)|0;I=c[f>>2]|0;c[f>>2]=I+1;a[I]=J;H=G;break};case 2:{J=a[q]|0;I=J&255;M=(I&1|0)==0;if(M){ap=I>>>1}else{ap=c[z>>2]|0}if((ap|0)==0|x){H=G;break L7920}if((J&1)==0){aq=y;ar=y}else{J=c[A>>2]|0;aq=J;ar=J}if(M){as=I>>>1}else{as=c[z>>2]|0}I=aq+as|0;M=c[f>>2]|0;if((ar|0)==(I|0)){at=M}else{J=ar;R=M;while(1){a[R]=a[J]|0;M=J+1|0;P=R+1|0;if((M|0)==(I|0)){at=P;break}else{J=M;R=P}}}c[f>>2]=at;H=G;break};default:{H=G}}}while(0);R=h+1|0;if(R>>>0<4>>>0){G=H;h=R}else{break}}h=a[t]|0;t=h&255;H=(t&1|0)==0;if(H){au=t>>>1}else{au=c[w>>2]|0}if(au>>>0>1>>>0){if((h&1)==0){av=u;aw=u}else{u=c[v>>2]|0;av=u;aw=u}if(H){ax=t>>>1}else{ax=c[w>>2]|0}w=av+ax|0;ax=c[f>>2]|0;av=aw+1|0;if((av|0)==(w|0)){ay=ax}else{aw=ax;ax=av;while(1){a[aw]=a[ax]|0;av=aw+1|0;t=ax+1|0;if((t|0)==(w|0)){ay=av;break}else{aw=av;ax=t}}}c[f>>2]=ay}ay=g&176;if((ay|0)==16){return}else if((ay|0)==32){c[e>>2]=c[f>>2];return}else{c[e>>2]=d;return}}function mm(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+100|0;i=i+7&-8;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;ip(m,h);B=m|0;C=c[B>>2]|0;if((c[3982]|0)!=-1){c[l>>2]=15928;c[l+4>>2]=14;c[l+8>>2]=0;h_(15928,l,98)}l=(c[3983]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=k;I=a[H]|0;J=I&255;if((J&1|0)==0){K=J>>>1}else{K=c[k+4>>2]|0}if((K|0)==0){L=0}else{if((I&1)==0){M=G+1|0}else{M=c[k+8>>2]|0}I=a[M]|0;L=I<<24>>24==(cm[c[(c[E>>2]|0)+28>>2]&31](F,45)|0)<<24>>24}pm(r|0,0,12)|0;pm(t|0,0,12)|0;pm(v|0,0,12)|0;mk(g,L,m,n,o,p,q,s,u,w);E=x|0;I=a[H]|0;J=I&255;N=(J&1|0)==0;if(N){O=J>>>1}else{O=c[k+4>>2]|0}P=c[w>>2]|0;if((O|0)>(P|0)){if(N){Q=J>>>1}else{Q=c[k+4>>2]|0}J=d[v]|0;if((J&1|0)==0){R=J>>>1}else{R=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){S=J>>>1}else{S=c[s+4>>2]|0}T=(Q-P<<1|1)+R+S|0}else{J=d[v]|0;if((J&1|0)==0){U=J>>>1}else{U=c[u+4>>2]|0}J=d[t]|0;if((J&1|0)==0){V=J>>>1}else{V=c[s+4>>2]|0}T=U+2+V|0}J=T+P|0;do{if(J>>>0>100>>>0){N=o3(J)|0;if((N|0)!=0){W=N;X=N;Y=I;break}ph();W=0;X=0;Y=a[H]|0}else{W=E;X=0;Y=I}}while(0);if((Y&1)==0){Z=G+1|0;_=G+1|0}else{I=c[k+8>>2]|0;Z=I;_=I}I=Y&255;if((I&1|0)==0){$=I>>>1}else{$=c[k+4>>2]|0}ml(W,y,z,c[h+4>>2]|0,_,Z+$|0,F,L,n,a[o]|0,a[p]|0,q,s,u,P);c[A>>2]=c[f>>2];kq(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){h3(u);h3(s);h3(q);aa=c[B>>2]|0;ab=aa|0;ac=hG(ab)|0;i=e;return}o4(X);h3(u);h3(s);h3(q);aa=c[B>>2]|0;ab=aa|0;ac=hG(ab)|0;i=e;return}}while(0);e=bZ(4)|0;oK(e);bs(e|0,10840,132)}function mn(a){a=a|0;hE(a|0);pb(a);return}function mo(a){a=a|0;hE(a|0);return}function mp(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+576|0;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];m=e|0;n=e+120|0;o=e+528|0;p=e+536|0;q=e+544|0;r=e+552|0;s=e+560|0;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+400|0;A=i;i=i+4|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;D=e+16|0;c[n>>2]=D;E=e+128|0;F=a_(D|0,100,3296,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;do{if(F>>>0>99>>>0){do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);G=kv(n,c[3620]|0,3296,(D=i,i=i+8|0,h[D>>3]=l,D)|0)|0;i=D;H=c[n>>2]|0;if((H|0)==0){ph();I=c[n>>2]|0}else{I=H}H=o3(G<<2)|0;J=H;if((H|0)!=0){K=J;L=G;M=I;N=J;break}ph();K=J;L=G;M=I;N=J}else{K=E;L=F;M=0;N=0}}while(0);ip(o,j);F=o|0;E=c[F>>2]|0;if((c[3980]|0)!=-1){c[m>>2]=15920;c[m+4>>2]=14;c[m+8>>2]=0;h_(15920,m,98)}m=(c[3981]|0)-1|0;I=c[E+8>>2]|0;do{if((c[E+12>>2]|0)-I>>2>>>0>m>>>0){D=c[I+(m<<2)>>2]|0;if((D|0)==0){break}J=D;G=c[n>>2]|0;H=G+L|0;O=c[(c[D>>2]|0)+48>>2]|0;b7[O&15](J,G,H,K)|0;if((L|0)==0){P=0}else{P=(a[c[n>>2]|0]|0)==45}pm(t|0,0,12)|0;pm(v|0,0,12)|0;pm(x|0,0,12)|0;mq(g,P,o,p,q,r,s,u,w,y);H=z|0;G=c[y>>2]|0;if((L|0)>(G|0)){O=d[x]|0;if((O&1|0)==0){Q=O>>>1}else{Q=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){R=O>>>1}else{R=c[u+4>>2]|0}S=(L-G<<1|1)+Q+R|0}else{O=d[x]|0;if((O&1|0)==0){T=O>>>1}else{T=c[w+4>>2]|0}O=d[v]|0;if((O&1|0)==0){U=O>>>1}else{U=c[u+4>>2]|0}S=T+2+U|0}O=S+G|0;do{if(O>>>0>100>>>0){D=o3(O<<2)|0;V=D;if((D|0)!=0){W=V;X=V;break}ph();W=V;X=V}else{W=H;X=0}}while(0);mr(W,A,B,c[j+4>>2]|0,K,K+(L<<2)|0,J,P,p,c[q>>2]|0,c[r>>2]|0,s,u,w,G);c[C>>2]=c[f>>2];kE(b,C,W,c[A>>2]|0,c[B>>2]|0,j,k);if((X|0)!=0){o4(X)}ie(w);ie(u);h3(s);H=c[F>>2]|0;hG(H)|0;if((N|0)!=0){o4(N)}if((M|0)==0){i=e;return}o4(M);i=e;return}}while(0);e=bZ(4)|0;oK(e);bs(e|0,10840,132)}function mq(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;n=i;i=i+40|0;o=n|0;p=n+16|0;q=n+32|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+4|0;i=i+7&-8;v=u;w=i;i=i+12|0;i=i+7&-8;x=w;y=i;i=i+12|0;i=i+7&-8;z=y;A=i;i=i+12|0;i=i+7&-8;B=A;D=i;i=i+4|0;i=i+7&-8;E=D;F=i;i=i+12|0;i=i+7&-8;G=F;H=i;i=i+4|0;i=i+7&-8;I=H;J=i;i=i+12|0;i=i+7&-8;K=J;L=i;i=i+12|0;i=i+7&-8;M=L;N=i;i=i+12|0;i=i+7&-8;O=N;P=c[e>>2]|0;if(b){if((c[4096]|0)!=-1){c[p>>2]=16384;c[p+4>>2]=14;c[p+8>>2]=0;h_(16384,p,98)}p=(c[4097]|0)-1|0;b=c[P+8>>2]|0;if((c[P+12>>2]|0)-b>>2>>>0<=p>>>0){Q=bZ(4)|0;R=Q;oK(R);bs(Q|0,10840,132)}e=c[b+(p<<2)>>2]|0;if((e|0)==0){Q=bZ(4)|0;R=Q;oK(R);bs(Q|0,10840,132)}Q=e;R=c[e>>2]|0;if(d){cb[c[R+44>>2]&127](r,Q);r=f;C=c[q>>2]|0;a[r]=C&255;C=C>>8;a[r+1|0]=C&255;C=C>>8;a[r+2|0]=C&255;C=C>>8;a[r+3|0]=C&255;cb[c[(c[e>>2]|0)+32>>2]&127](s,Q);r=l;if((a[r]&1)==0){c[l+4>>2]=0;a[r]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}ii(l,0);c[r>>2]=c[t>>2];c[r+4>>2]=c[t+4>>2];c[r+8>>2]=c[t+8>>2];pm(t|0,0,12)|0;ie(s)}else{cb[c[R+40>>2]&127](v,Q);v=f;C=c[u>>2]|0;a[v]=C&255;C=C>>8;a[v+1|0]=C&255;C=C>>8;a[v+2|0]=C&255;C=C>>8;a[v+3|0]=C&255;cb[c[(c[e>>2]|0)+28>>2]&127](w,Q);v=l;if((a[v]&1)==0){c[l+4>>2]=0;a[v]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}ii(l,0);c[v>>2]=c[x>>2];c[v+4>>2]=c[x+4>>2];c[v+8>>2]=c[x+8>>2];pm(x|0,0,12)|0;ie(w)}w=e;c[g>>2]=ce[c[(c[w>>2]|0)+12>>2]&127](Q)|0;c[h>>2]=ce[c[(c[w>>2]|0)+16>>2]&127](Q)|0;cb[c[(c[e>>2]|0)+20>>2]&127](y,Q);x=j;if((a[x]&1)==0){a[j+1|0]=0;a[x]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}h7(j,0);c[x>>2]=c[z>>2];c[x+4>>2]=c[z+4>>2];c[x+8>>2]=c[z+8>>2];pm(z|0,0,12)|0;h3(y);cb[c[(c[e>>2]|0)+24>>2]&127](A,Q);e=k;if((a[e]&1)==0){c[k+4>>2]=0;a[e]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}ii(k,0);c[e>>2]=c[B>>2];c[e+4>>2]=c[B+4>>2];c[e+8>>2]=c[B+8>>2];pm(B|0,0,12)|0;ie(A);S=ce[c[(c[w>>2]|0)+36>>2]&127](Q)|0;c[m>>2]=S;i=n;return}else{if((c[4098]|0)!=-1){c[o>>2]=16392;c[o+4>>2]=14;c[o+8>>2]=0;h_(16392,o,98)}o=(c[4099]|0)-1|0;Q=c[P+8>>2]|0;if((c[P+12>>2]|0)-Q>>2>>>0<=o>>>0){T=bZ(4)|0;U=T;oK(U);bs(T|0,10840,132)}P=c[Q+(o<<2)>>2]|0;if((P|0)==0){T=bZ(4)|0;U=T;oK(U);bs(T|0,10840,132)}T=P;U=c[P>>2]|0;if(d){cb[c[U+44>>2]&127](E,T);E=f;C=c[D>>2]|0;a[E]=C&255;C=C>>8;a[E+1|0]=C&255;C=C>>8;a[E+2|0]=C&255;C=C>>8;a[E+3|0]=C&255;cb[c[(c[P>>2]|0)+32>>2]&127](F,T);E=l;if((a[E]&1)==0){c[l+4>>2]=0;a[E]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}ii(l,0);c[E>>2]=c[G>>2];c[E+4>>2]=c[G+4>>2];c[E+8>>2]=c[G+8>>2];pm(G|0,0,12)|0;ie(F)}else{cb[c[U+40>>2]&127](I,T);I=f;C=c[H>>2]|0;a[I]=C&255;C=C>>8;a[I+1|0]=C&255;C=C>>8;a[I+2|0]=C&255;C=C>>8;a[I+3|0]=C&255;cb[c[(c[P>>2]|0)+28>>2]&127](J,T);I=l;if((a[I]&1)==0){c[l+4>>2]=0;a[I]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}ii(l,0);c[I>>2]=c[K>>2];c[I+4>>2]=c[K+4>>2];c[I+8>>2]=c[K+8>>2];pm(K|0,0,12)|0;ie(J)}J=P;c[g>>2]=ce[c[(c[J>>2]|0)+12>>2]&127](T)|0;c[h>>2]=ce[c[(c[J>>2]|0)+16>>2]&127](T)|0;cb[c[(c[P>>2]|0)+20>>2]&127](L,T);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}h7(j,0);c[h>>2]=c[M>>2];c[h+4>>2]=c[M+4>>2];c[h+8>>2]=c[M+8>>2];pm(M|0,0,12)|0;h3(L);cb[c[(c[P>>2]|0)+24>>2]&127](N,T);P=k;if((a[P]&1)==0){c[k+4>>2]=0;a[P]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}ii(k,0);c[P>>2]=c[O>>2];c[P+4>>2]=c[O+4>>2];c[P+8>>2]=c[O+8>>2];pm(O|0,0,12)|0;ie(N);S=ce[c[(c[J>>2]|0)+36>>2]&127](T)|0;c[m>>2]=S;i=n;return}}function mr(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=i;y=(q|0)>0;z=n;A=n+1|0;B=n+8|0;C=n+4|0;n=g;g=0;while(1){L8241:do{switch(a[k+g|0]|0){case 3:{D=a[s]|0;E=D&255;if((E&1|0)==0){F=E>>>1}else{F=c[t>>2]|0}if((F|0)==0){G=n;break L8241}if((D&1)==0){H=t}else{H=c[u>>2]|0}D=c[H>>2]|0;E=c[e>>2]|0;c[e>>2]=E+4;c[E>>2]=D;G=n;break};case 4:{D=c[e>>2]|0;E=j?n+4|0:n;I=E;while(1){if(I>>>0>=h>>>0){break}if(cf[c[(c[o>>2]|0)+12>>2]&63](i,2048,c[I>>2]|0)|0){I=I+4|0}else{break}}if(y){if(I>>>0>E>>>0){J=I;K=q;do{J=J-4|0;L=c[J>>2]|0;M=c[e>>2]|0;c[e>>2]=M+4;c[M>>2]=L;K=K-1|0;N=(K|0)>0;}while(J>>>0>E>>>0&N);if(N){O=K;P=J;Q=6888}else{R=0;S=K;T=J}}else{O=q;P=I;Q=6888}if((Q|0)==6888){Q=0;R=cm[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;S=O;T=P}L=c[e>>2]|0;c[e>>2]=L+4;if((S|0)>0){M=S;U=L;while(1){c[U>>2]=R;V=M-1|0;W=c[e>>2]|0;c[e>>2]=W+4;if((V|0)>0){M=V;U=W}else{X=W;break}}}else{X=L}c[X>>2]=l;Y=T}else{Y=I}if((Y|0)==(E|0)){U=cm[c[(c[r>>2]|0)+44>>2]&31](i,48)|0;M=c[e>>2]|0;c[e>>2]=M+4;c[M>>2]=U}else{U=a[z]|0;M=U&255;if((M&1|0)==0){Z=M>>>1}else{Z=c[C>>2]|0}if((Z|0)==0){_=Y;$=0;aa=0;ab=-1}else{if((U&1)==0){ac=A}else{ac=c[B>>2]|0}_=Y;$=0;aa=0;ab=a[ac]|0}while(1){do{if(($|0)==(ab|0)){U=c[e>>2]|0;c[e>>2]=U+4;c[U>>2]=m;U=aa+1|0;M=a[z]|0;J=M&255;if((J&1|0)==0){ad=J>>>1}else{ad=c[C>>2]|0}if(U>>>0>=ad>>>0){ae=ab;af=U;ag=0;break}J=(M&1)==0;if(J){ah=A}else{ah=c[B>>2]|0}if((a[ah+U|0]|0)==127){ae=-1;af=U;ag=0;break}if(J){ai=A}else{ai=c[B>>2]|0}ae=a[ai+U|0]|0;af=U;ag=0}else{ae=ab;af=aa;ag=$}}while(0);U=_-4|0;J=c[U>>2]|0;M=c[e>>2]|0;c[e>>2]=M+4;c[M>>2]=J;if((U|0)==(E|0)){break}else{_=U;$=ag+1|0;aa=af;ab=ae}}}I=c[e>>2]|0;if((D|0)==(I|0)){G=E;break L8241}L=I-4|0;if(D>>>0<L>>>0){aj=D;ak=L}else{G=E;break L8241}while(1){L=c[aj>>2]|0;c[aj>>2]=c[ak>>2];c[ak>>2]=L;L=aj+4|0;I=ak-4|0;if(L>>>0<I>>>0){aj=L;ak=I}else{G=E;break}}break};case 1:{c[d>>2]=c[e>>2];E=cm[c[(c[r>>2]|0)+44>>2]&31](i,32)|0;D=c[e>>2]|0;c[e>>2]=D+4;c[D>>2]=E;G=n;break};case 0:{c[d>>2]=c[e>>2];G=n;break};case 2:{E=a[p]|0;D=E&255;I=(D&1|0)==0;if(I){al=D>>>1}else{al=c[w>>2]|0}if((al|0)==0|v){G=n;break L8241}if((E&1)==0){am=w;an=w;ao=w}else{E=c[x>>2]|0;am=E;an=E;ao=E}if(I){ap=D>>>1}else{ap=c[w>>2]|0}D=am+(ap<<2)|0;I=c[e>>2]|0;if((an|0)==(D|0)){aq=I}else{E=(am+(ap-1<<2)+(-ao|0)|0)>>>2;L=an;U=I;while(1){c[U>>2]=c[L>>2];J=L+4|0;if((J|0)==(D|0)){break}L=J;U=U+4|0}aq=I+(E+1<<2)|0}c[e>>2]=aq;G=n;break};default:{G=n}}}while(0);U=g+1|0;if(U>>>0<4>>>0){n=G;g=U}else{break}}g=a[s]|0;s=g&255;G=(s&1|0)==0;if(G){ar=s>>>1}else{ar=c[t>>2]|0}if(ar>>>0>1>>>0){if((g&1)==0){as=t;at=t;au=t}else{g=c[u>>2]|0;as=g;at=g;au=g}if(G){av=s>>>1}else{av=c[t>>2]|0}t=as+(av<<2)|0;s=c[e>>2]|0;G=at+4|0;if((G|0)==(t|0)){aw=s}else{at=((as+(av-2<<2)+(-au|0)|0)>>>2)+1|0;au=s;av=G;while(1){c[au>>2]=c[av>>2];G=av+4|0;if((G|0)==(t|0)){break}else{au=au+4|0;av=G}}aw=s+(at<<2)|0}c[e>>2]=aw}aw=f&176;if((aw|0)==32){c[d>>2]=c[e>>2];return}else if((aw|0)==16){return}else{c[d>>2]=b;return}}function ms(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;e=i;i=i+64|0;l=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[l>>2];l=e|0;m=e+16|0;n=e+24|0;o=e+32|0;p=e+40|0;q=e+48|0;r=q;s=i;i=i+12|0;i=i+7&-8;t=s;u=i;i=i+12|0;i=i+7&-8;v=u;w=i;i=i+4|0;i=i+7&-8;x=i;i=i+400|0;y=i;i=i+4|0;i=i+7&-8;z=i;i=i+4|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;ip(m,h);B=m|0;C=c[B>>2]|0;if((c[3980]|0)!=-1){c[l>>2]=15920;c[l+4>>2]=14;c[l+8>>2]=0;h_(15920,l,98)}l=(c[3981]|0)-1|0;D=c[C+8>>2]|0;do{if((c[C+12>>2]|0)-D>>2>>>0>l>>>0){E=c[D+(l<<2)>>2]|0;if((E|0)==0){break}F=E;G=k;H=a[G]|0;I=H&255;if((I&1|0)==0){J=I>>>1}else{J=c[k+4>>2]|0}if((J|0)==0){K=0}else{if((H&1)==0){L=k+4|0}else{L=c[k+8>>2]|0}H=c[L>>2]|0;K=(H|0)==(cm[c[(c[E>>2]|0)+44>>2]&31](F,45)|0)}pm(r|0,0,12)|0;pm(t|0,0,12)|0;pm(v|0,0,12)|0;mq(g,K,m,n,o,p,q,s,u,w);E=x|0;H=a[G]|0;I=H&255;M=(I&1|0)==0;if(M){N=I>>>1}else{N=c[k+4>>2]|0}O=c[w>>2]|0;if((N|0)>(O|0)){if(M){P=I>>>1}else{P=c[k+4>>2]|0}I=d[v]|0;if((I&1|0)==0){Q=I>>>1}else{Q=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){R=I>>>1}else{R=c[s+4>>2]|0}S=(P-O<<1|1)+Q+R|0}else{I=d[v]|0;if((I&1|0)==0){T=I>>>1}else{T=c[u+4>>2]|0}I=d[t]|0;if((I&1|0)==0){U=I>>>1}else{U=c[s+4>>2]|0}S=T+2+U|0}I=S+O|0;do{if(I>>>0>100>>>0){M=o3(I<<2)|0;V=M;if((M|0)!=0){W=V;X=V;Y=H;break}ph();W=V;X=V;Y=a[G]|0}else{W=E;X=0;Y=H}}while(0);if((Y&1)==0){Z=k+4|0;_=k+4|0}else{H=c[k+8>>2]|0;Z=H;_=H}H=Y&255;if((H&1|0)==0){$=H>>>1}else{$=c[k+4>>2]|0}mr(W,y,z,c[h+4>>2]|0,_,Z+($<<2)|0,F,K,n,c[o>>2]|0,c[p>>2]|0,q,s,u,O);c[A>>2]=c[f>>2];kE(b,A,W,c[y>>2]|0,c[z>>2]|0,h,j);if((X|0)==0){ie(u);ie(s);h3(q);aa=c[B>>2]|0;ab=aa|0;ac=hG(ab)|0;i=e;return}o4(X);ie(u);ie(s);h3(q);aa=c[B>>2]|0;ab=aa|0;ac=hG(ab)|0;i=e;return}}while(0);e=bZ(4)|0;oK(e);bs(e|0,10840,132)}function mt(a){a=a|0;hE(a|0);pb(a);return}function mu(a){a=a|0;hE(a|0);return}function mv(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=b$(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function mw(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+16|0;j=d|0;k=j;pm(k|0,0,12)|0;l=b;m=h;n=a[h]|0;if((n&1)==0){o=m+1|0;p=m+1|0}else{m=c[h+8>>2]|0;o=m;p=m}m=n&255;if((m&1|0)==0){q=m>>>1}else{q=c[h+4>>2]|0}h=o+q|0;do{if(p>>>0<h>>>0){q=p;do{h8(j,a[q]|0);q=q+1|0;}while(q>>>0<h>>>0);q=(e|0)==-1?-1:e<<1;if((a[k]&1)==0){r=q;s=7020;break}t=c[j+8>>2]|0;u=q}else{r=(e|0)==-1?-1:e<<1;s=7020}}while(0);if((s|0)==7020){t=j+1|0;u=r}r=bb(u|0,f|0,g|0,t|0)|0;pm(l|0,0,12)|0;l=pk(r|0)|0;t=r+l|0;if((l|0)>0){v=r}else{h3(j);i=d;return}do{h8(b,a[v]|0);v=v+1|0;}while(v>>>0<t>>>0);h3(j);i=d;return}function mx(a,b){a=a|0;b=b|0;bJ(((b|0)==-1?-1:b<<1)|0)|0;return}function my(a){a=a|0;hE(a|0);pb(a);return}function mz(a){a=a|0;hE(a|0);return}function mA(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=b$(f|0,1)|0;return d>>>(((d|0)!=-1|0)>>>0)|0}function mB(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;d=i;i=i+224|0;j=d|0;k=d+8|0;l=d+40|0;m=d+48|0;n=d+56|0;o=d+64|0;p=d+192|0;q=d+200|0;r=d+208|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;pm(s|0,0,12)|0;v=b;w=t|0;c[t+4>>2]=0;c[t>>2]=6792;x=a[h]|0;if((x&1)==0){y=h+4|0;z=h+4|0}else{A=c[h+8>>2]|0;y=A;z=A}A=x&255;if((A&1|0)==0){B=A>>>1}else{B=c[h+4>>2]|0}h=y+(B<<2)|0;L8474:do{if(z>>>0<h>>>0){B=t;y=k|0;A=k+32|0;x=z;C=6792;while(1){c[m>>2]=x;D=(cj[c[C+12>>2]&31](w,j,x,h,m,y,A,l)|0)==2;E=c[m>>2]|0;if(D|(E|0)==(x|0)){break}if(y>>>0<(c[l>>2]|0)>>>0){D=y;do{h8(r,a[D]|0);D=D+1|0;}while(D>>>0<(c[l>>2]|0)>>>0);F=c[m>>2]|0}else{F=E}if(F>>>0>=h>>>0){break L8474}x=F;C=c[B>>2]|0}B=bZ(8)|0;hM(B,1984);bs(B|0,10856,26)}}while(0);hE(t|0);if((a[s]&1)==0){G=r+1|0}else{G=c[r+8>>2]|0}s=bb(((e|0)==-1?-1:e<<1)|0,f|0,g|0,G|0)|0;pm(v|0,0,12)|0;v=u|0;c[u+4>>2]=0;c[u>>2]=6736;G=pk(s|0)|0;g=s+G|0;if((G|0)<1){H=u|0;hE(H);h3(r);i=d;return}G=u;f=g;e=o|0;t=o+128|0;o=s;s=6736;while(1){c[q>>2]=o;F=(cj[c[s+16>>2]&31](v,n,o,(f-o|0)>32?o+32|0:g,q,e,t,p)|0)==2;h=c[q>>2]|0;if(F|(h|0)==(o|0)){break}if(e>>>0<(c[p>>2]|0)>>>0){F=e;do{ij(b,c[F>>2]|0);F=F+4|0;}while(F>>>0<(c[p>>2]|0)>>>0);I=c[q>>2]|0}else{I=h}if(I>>>0>=g>>>0){J=7087;break}o=I;s=c[G>>2]|0}if((J|0)==7087){H=u|0;hE(H);h3(r);i=d;return}d=bZ(8)|0;hM(d,1984);bs(d|0,10856,26)}function mC(a,b){a=a|0;b=b|0;bJ(((b|0)==-1?-1:b<<1)|0)|0;return}function mD(b){b=b|0;var d=0,e=0,f=0;c[b>>2]=6256;d=b+8|0;e=c[d>>2]|0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);if((e|0)==(c[3620]|0)){f=b|0;hE(f);return}ba(c[d>>2]|0);f=b|0;hE(f);return}function mE(a){a=a|0;a=bZ(8)|0;hH(a,3224);c[a>>2]=5192;bs(a|0,10872,38)}function mF(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+448|0;f=e|0;g=e+16|0;h=e+32|0;j=e+48|0;k=e+64|0;l=e+80|0;m=e+96|0;n=e+112|0;o=e+128|0;p=e+144|0;q=e+160|0;r=e+176|0;s=e+192|0;t=e+208|0;u=e+224|0;v=e+240|0;w=e+256|0;x=e+272|0;y=e+288|0;z=e+304|0;A=e+320|0;B=e+336|0;C=e+352|0;D=e+368|0;E=e+384|0;F=e+400|0;G=e+416|0;H=e+432|0;c[b+4>>2]=d-1;c[b>>2]=6512;d=b+8|0;I=b+12|0;a[b+136|0]=1;J=b+24|0;K=J;c[I>>2]=K;c[d>>2]=K;c[b+16>>2]=J+112;J=28;L=K;do{if((L|0)==0){M=0}else{c[L>>2]=0;M=c[I>>2]|0}L=M+4|0;c[I>>2]=L;J=J-1|0;}while((J|0)!=0);h1(b+144|0,3152,1);J=c[d>>2]|0;d=c[I>>2]|0;if((J|0)!=(d|0)){c[I>>2]=d+(~((d-4+(-J|0)|0)>>>2)<<2)}c[3653]=0;c[3652]=6216;if((c[3902]|0)!=-1){c[H>>2]=15608;c[H+4>>2]=14;c[H+8>>2]=0;h_(15608,H,98)}mG(b,14608,(c[3903]|0)-1|0);c[3651]=0;c[3650]=6176;if((c[3900]|0)!=-1){c[G>>2]=15600;c[G+4>>2]=14;c[G+8>>2]=0;h_(15600,G,98)}mG(b,14600,(c[3901]|0)-1|0);c[3703]=0;c[3702]=6624;c[3704]=0;a[14820]=0;c[3704]=c[(a9()|0)>>2];if((c[3982]|0)!=-1){c[F>>2]=15928;c[F+4>>2]=14;c[F+8>>2]=0;h_(15928,F,98)}mG(b,14808,(c[3983]|0)-1|0);c[3701]=0;c[3700]=6544;if((c[3980]|0)!=-1){c[E>>2]=15920;c[E+4>>2]=14;c[E+8>>2]=0;h_(15920,E,98)}mG(b,14800,(c[3981]|0)-1|0);c[3655]=0;c[3654]=6312;if((c[3906]|0)!=-1){c[D>>2]=15624;c[D+4>>2]=14;c[D+8>>2]=0;h_(15624,D,98)}mG(b,14616,(c[3907]|0)-1|0);c[1179]=0;c[1178]=6256;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);c[1180]=c[3620];if((c[3904]|0)!=-1){c[C>>2]=15616;c[C+4>>2]=14;c[C+8>>2]=0;h_(15616,C,98)}mG(b,4712,(c[3905]|0)-1|0);c[3657]=0;c[3656]=6368;if((c[3908]|0)!=-1){c[B>>2]=15632;c[B+4>>2]=14;c[B+8>>2]=0;h_(15632,B,98)}mG(b,14624,(c[3909]|0)-1|0);c[3659]=0;c[3658]=6424;if((c[3910]|0)!=-1){c[A>>2]=15640;c[A+4>>2]=14;c[A+8>>2]=0;h_(15640,A,98)}mG(b,14632,(c[3911]|0)-1|0);c[3633]=0;c[3632]=5720;a[14536]=46;a[14537]=44;pm(14540,0,12)|0;if((c[3886]|0)!=-1){c[z>>2]=15544;c[z+4>>2]=14;c[z+8>>2]=0;h_(15544,z,98)}mG(b,14528,(c[3887]|0)-1|0);c[1171]=0;c[1170]=5672;c[1172]=46;c[1173]=44;pm(4696,0,12)|0;if((c[3884]|0)!=-1){c[y>>2]=15536;c[y+4>>2]=14;c[y+8>>2]=0;h_(15536,y,98)}mG(b,4680,(c[3885]|0)-1|0);c[3649]=0;c[3648]=6104;if((c[3898]|0)!=-1){c[x>>2]=15592;c[x+4>>2]=14;c[x+8>>2]=0;h_(15592,x,98)}mG(b,14592,(c[3899]|0)-1|0);c[3647]=0;c[3646]=6032;if((c[3896]|0)!=-1){c[w>>2]=15584;c[w+4>>2]=14;c[w+8>>2]=0;h_(15584,w,98)}mG(b,14584,(c[3897]|0)-1|0);c[3645]=0;c[3644]=5968;if((c[3894]|0)!=-1){c[v>>2]=15576;c[v+4>>2]=14;c[v+8>>2]=0;h_(15576,v,98)}mG(b,14576,(c[3895]|0)-1|0);c[3643]=0;c[3642]=5904;if((c[3892]|0)!=-1){c[u>>2]=15568;c[u+4>>2]=14;c[u+8>>2]=0;h_(15568,u,98)}mG(b,14568,(c[3893]|0)-1|0);c[3713]=0;c[3712]=7552;if((c[4102]|0)!=-1){c[t>>2]=16408;c[t+4>>2]=14;c[t+8>>2]=0;h_(16408,t,98)}mG(b,14848,(c[4103]|0)-1|0);c[3711]=0;c[3710]=7488;if((c[4100]|0)!=-1){c[s>>2]=16400;c[s+4>>2]=14;c[s+8>>2]=0;h_(16400,s,98)}mG(b,14840,(c[4101]|0)-1|0);c[3709]=0;c[3708]=7424;if((c[4098]|0)!=-1){c[r>>2]=16392;c[r+4>>2]=14;c[r+8>>2]=0;h_(16392,r,98)}mG(b,14832,(c[4099]|0)-1|0);c[3707]=0;c[3706]=7360;if((c[4096]|0)!=-1){c[q>>2]=16384;c[q+4>>2]=14;c[q+8>>2]=0;h_(16384,q,98)}mG(b,14824,(c[4097]|0)-1|0);c[3631]=0;c[3630]=5376;if((c[3874]|0)!=-1){c[p>>2]=15496;c[p+4>>2]=14;c[p+8>>2]=0;h_(15496,p,98)}mG(b,14520,(c[3875]|0)-1|0);c[3629]=0;c[3628]=5336;if((c[3872]|0)!=-1){c[o>>2]=15488;c[o+4>>2]=14;c[o+8>>2]=0;h_(15488,o,98)}mG(b,14512,(c[3873]|0)-1|0);c[3627]=0;c[3626]=5296;if((c[3870]|0)!=-1){c[n>>2]=15480;c[n+4>>2]=14;c[n+8>>2]=0;h_(15480,n,98)}mG(b,14504,(c[3871]|0)-1|0);c[3625]=0;c[3624]=5256;if((c[3868]|0)!=-1){c[m>>2]=15472;c[m+4>>2]=14;c[m+8>>2]=0;h_(15472,m,98)}mG(b,14496,(c[3869]|0)-1|0);c[1167]=0;c[1166]=5576;c[1168]=5624;if((c[3882]|0)!=-1){c[l>>2]=15528;c[l+4>>2]=14;c[l+8>>2]=0;h_(15528,l,98)}mG(b,4664,(c[3883]|0)-1|0);c[1163]=0;c[1162]=5480;c[1164]=5528;if((c[3880]|0)!=-1){c[k>>2]=15520;c[k+4>>2]=14;c[k+8>>2]=0;h_(15520,k,98)}mG(b,4648,(c[3881]|0)-1|0);c[1159]=0;c[1158]=6480;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);c[1160]=c[3620];c[1158]=5448;if((c[3878]|0)!=-1){c[j>>2]=15512;c[j+4>>2]=14;c[j+8>>2]=0;h_(15512,j,98)}mG(b,4632,(c[3879]|0)-1|0);c[1155]=0;c[1154]=6480;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);c[1156]=c[3620];c[1154]=5416;if((c[3876]|0)!=-1){c[h>>2]=15504;c[h+4>>2]=14;c[h+8>>2]=0;h_(15504,h,98)}mG(b,4616,(c[3877]|0)-1|0);c[3641]=0;c[3640]=5808;if((c[3890]|0)!=-1){c[g>>2]=15560;c[g+4>>2]=14;c[g+8>>2]=0;h_(15560,g,98)}mG(b,14560,(c[3891]|0)-1|0);c[3639]=0;c[3638]=5768;if((c[3888]|0)!=-1){c[f>>2]=15552;c[f+4>>2]=14;c[f+8>>2]=0;h_(15552,f,98)}mG(b,14552,(c[3889]|0)-1|0);i=e;return}function mG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;hF(b|0);e=a+8|0;f=a+12|0;a=c[f>>2]|0;g=e|0;h=c[g>>2]|0;i=a-h>>2;do{if(i>>>0>d>>>0){j=h}else{k=d+1|0;if(i>>>0<k>>>0){oq(e,k-i|0);j=c[g>>2]|0;break}if(i>>>0<=k>>>0){j=h;break}l=h+(k<<2)|0;if((l|0)==(a|0)){j=h;break}c[f>>2]=a+(~((a-4+(-l|0)|0)>>>2)<<2);j=h}}while(0);h=c[j+(d<<2)>>2]|0;if((h|0)==0){m=j;n=m+(d<<2)|0;c[n>>2]=b;return}hG(h|0)|0;m=c[g>>2]|0;n=m+(d<<2)|0;c[n>>2]=b;return}function mH(a){a=a|0;mI(a);pb(a);return}function mI(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;c[b>>2]=6512;d=b+12|0;e=c[d>>2]|0;f=b+8|0;g=c[f>>2]|0;if((e|0)!=(g|0)){h=0;i=g;g=e;while(1){e=c[i+(h<<2)>>2]|0;if((e|0)==0){j=g;k=i}else{l=e|0;hG(l)|0;j=c[d>>2]|0;k=c[f>>2]|0}l=h+1|0;if(l>>>0<j-k>>2>>>0){h=l;i=k;g=j}else{break}}}h3(b+144|0);j=c[f>>2]|0;if((j|0)==0){m=b|0;hE(m);return}f=c[d>>2]|0;if((j|0)!=(f|0)){c[d>>2]=f+(~((f-4+(-j|0)|0)>>>2)<<2)}if((j|0)==(b+24|0)){a[b+136|0]=0;m=b|0;hE(m);return}else{pb(j);m=b|0;hE(m);return}}function mJ(){var b=0,d=0;if((a[16472]|0)!=0){b=c[3612]|0;return b|0}if((bg(16472)|0)==0){b=c[3612]|0;return b|0}do{if((a[16480]|0)==0){if((bg(16480)|0)==0){break}mF(14640,1);c[3616]=14640;c[3614]=14464}}while(0);d=c[c[3614]>>2]|0;c[3618]=d;hF(d|0);c[3612]=14472;b=c[3612]|0;return b|0}function mK(a){a=a|0;var b=0;b=c[(mJ()|0)>>2]|0;c[a>>2]=b;hF(b|0);return}function mL(a,b){a=a|0;b=b|0;var d=0;d=c[b>>2]|0;c[a>>2]=d;hF(d|0);return}function mM(a){a=a|0;hG(c[a>>2]|0)|0;return}function mN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=c[a>>2]|0;a=b|0;if((c[a>>2]|0)!=-1){c[e>>2]=b;c[e+4>>2]=14;c[e+8>>2]=0;h_(a,e,98)}e=(c[b+4>>2]|0)-1|0;b=c[f+8>>2]|0;if((c[f+12>>2]|0)-b>>2>>>0<=e>>>0){g=bZ(4)|0;h=g;oK(h);bs(g|0,10840,132);return 0}f=c[b+(e<<2)>>2]|0;if((f|0)==0){g=bZ(4)|0;h=g;oK(h);bs(g|0,10840,132);return 0}else{i=d;return f|0}return 0}function mO(a){a=a|0;hE(a|0);pb(a);return}function mP(a){a=a|0;if((a|0)==0){return}ca[c[(c[a>>2]|0)+4>>2]&511](a);return}function mQ(a){a=a|0;c[a+4>>2]=(I=c[3912]|0,c[3912]=I+1,I)+1;return}function mR(a){a=a|0;hE(a|0);pb(a);return}function mS(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128>>>0){f=0;return f|0}f=(b[(c[(a9()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function mT(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128>>>0){j=b[(c[(a9()|0)>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function mU(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128>>>0){if((b[(c[(a9()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=7309;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=7310;break}else{h=e}}if((i|0)==7310){return g|0}else if((i|0)==7309){return g|0}return 0}function mV(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a=e;while(1){if((a|0)==(f|0)){g=f;h=7321;break}e=c[a>>2]|0;if(e>>>0>=128>>>0){g=a;h=7320;break}if((b[(c[(a9()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16==0){g=a;h=7319;break}else{a=a+4|0}}if((h|0)==7320){return g|0}else if((h|0)==7319){return g|0}else if((h|0)==7321){return g|0}return 0}function mW(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(b0()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function mX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(b0()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function mY(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128>>>0){d=b;return d|0}d=c[(c[(b1()|0)>>2]|0)+(b<<2)>>2]|0;return d|0}function mZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128>>>0){g=c[(c[(b1()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function m_(a,b){a=a|0;b=b|0;return b<<24>>24|0}function m$(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function m0(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function m1(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=((e-4+(-d|0)|0)>>>2)+1|0;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128>>>0?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b<<2)|0;return h|0}function m2(b){b=b|0;var d=0;c[b>>2]=6624;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}pd(d)}}while(0);hE(b|0);pb(b);return}function m3(b){b=b|0;var d=0;c[b>>2]=6624;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)==0){break}pd(d)}}while(0);hE(b|0);return}function m4(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(b0()|0)>>2]|0)+((b&255)<<2)>>2]&255;return d|0}function m5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(b0()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function m6(a,b){a=a|0;b=b|0;var d=0;if(b<<24>>24<0){d=b;return d|0}d=c[(c[(b1()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return d|0}function m7(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24<0){h=d}else{h=c[(c[(b1()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}return f|0}function m8(a,b){a=a|0;b=b|0;return b|0}function m9(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function na(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24<0?c:b)|0}function nb(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24<0?e:f;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function nc(a){a=a|0;hE(a|0);pb(a);return}function nd(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function ne(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function nf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function ng(a){a=a|0;return 1}function nh(a){a=a|0;return 1}function ni(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function nj(a){a=a|0;return 1}function nk(a){a=a|0;mD(a);pb(a);return}function nl(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+8|0;m=l|0;n=m;o=i;i=i+4|0;i=i+7&-8;p=e;while(1){if((p|0)==(f|0)){q=f;break}if((c[p>>2]|0)==0){q=p;break}else{p=p+4|0}}c[k>>2]=h;c[g>>2]=e;L8892:do{if((e|0)==(f|0)|(h|0)==(j|0)){r=e}else{p=d;s=j;t=b+8|0;u=o|0;v=h;w=e;x=q;while(1){y=c[p+4>>2]|0;c[m>>2]=c[p>>2];c[m+4>>2]=y;y=bN(c[t>>2]|0)|0;z=oD(v,g,x-w>>2,s-v|0,d)|0;if((y|0)!=0){bN(y|0)|0}if((z|0)==0){A=1;B=7480;break}else if((z|0)==(-1|0)){B=7443;break}y=(c[k>>2]|0)+z|0;c[k>>2]=y;if((y|0)==(j|0)){B=7476;break}if((x|0)==(f|0)){C=f;D=y;E=c[g>>2]|0}else{y=bN(c[t>>2]|0)|0;z=oC(u,0,d)|0;if((y|0)!=0){bN(y|0)|0}if((z|0)==-1){A=2;B=7481;break}y=c[k>>2]|0;if(z>>>0>(s-y|0)>>>0){A=1;B=7483;break}L8910:do{if((z|0)!=0){F=z;G=u;H=y;while(1){I=a[G]|0;c[k>>2]=H+1;a[H]=I;I=F-1|0;if((I|0)==0){break L8910}F=I;G=G+1|0;H=c[k>>2]|0}}}while(0);y=(c[g>>2]|0)+4|0;c[g>>2]=y;z=y;while(1){if((z|0)==(f|0)){J=f;break}if((c[z>>2]|0)==0){J=z;break}else{z=z+4|0}}C=J;D=c[k>>2]|0;E=y}if((E|0)==(f|0)|(D|0)==(j|0)){r=E;break L8892}else{v=D;w=E;x=C}}if((B|0)==7480){i=l;return A|0}else if((B|0)==7481){i=l;return A|0}else if((B|0)==7476){r=c[g>>2]|0;break}else if((B|0)==7443){c[k>>2]=v;L8926:do{if((w|0)==(c[g>>2]|0)){K=w}else{x=w;u=v;while(1){s=c[x>>2]|0;p=bN(c[t>>2]|0)|0;z=oC(u,s,n)|0;if((p|0)!=0){bN(p|0)|0}if((z|0)==-1){K=x;break L8926}p=(c[k>>2]|0)+z|0;c[k>>2]=p;z=x+4|0;if((z|0)==(c[g>>2]|0)){K=z;break}else{x=z;u=p}}}}while(0);c[g>>2]=K;A=2;i=l;return A|0}else if((B|0)==7483){i=l;return A|0}}}while(0);A=(r|0)!=(f|0)|0;i=l;return A|0}function nm(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;l=i;i=i+8|0;m=l|0;n=m;o=e;while(1){if((o|0)==(f|0)){p=f;break}if((a[o]|0)==0){p=o;break}else{o=o+1|0}}c[k>>2]=h;c[g>>2]=e;L8944:do{if((e|0)==(f|0)|(h|0)==(j|0)){q=e}else{o=d;r=j;s=b+8|0;t=h;u=e;v=p;while(1){w=c[o+4>>2]|0;c[m>>2]=c[o>>2];c[m+4>>2]=w;x=v;w=bN(c[s>>2]|0)|0;y=oz(t,g,x-u|0,r-t>>2,d)|0;if((w|0)!=0){bN(w|0)|0}if((y|0)==(-1|0)){z=7498;break}else if((y|0)==0){A=2;z=7533;break}w=(c[k>>2]|0)+(y<<2)|0;c[k>>2]=w;if((w|0)==(j|0)){z=7530;break}y=c[g>>2]|0;if((v|0)==(f|0)){B=f;C=w;D=y}else{E=bN(c[s>>2]|0)|0;F=oy(w,y,1,d)|0;if((E|0)!=0){bN(E|0)|0}if((F|0)!=0){A=2;z=7535;break}c[k>>2]=(c[k>>2]|0)+4;F=(c[g>>2]|0)+1|0;c[g>>2]=F;E=F;while(1){if((E|0)==(f|0)){G=f;break}if((a[E]|0)==0){G=E;break}else{E=E+1|0}}B=G;C=c[k>>2]|0;D=F}if((D|0)==(f|0)|(C|0)==(j|0)){q=D;break L8944}else{t=C;u=D;v=B}}if((z|0)==7535){i=l;return A|0}else if((z|0)==7498){c[k>>2]=t;L8969:do{if((u|0)==(c[g>>2]|0)){H=u}else{v=t;r=u;while(1){o=bN(c[s>>2]|0)|0;E=oy(v,r,x-r|0,n)|0;if((o|0)!=0){bN(o|0)|0}if((E|0)==(-2|0)){z=7510;break}else if((E|0)==(-1|0)){z=7509;break}else if((E|0)==0){I=r+1|0}else{I=r+E|0}E=(c[k>>2]|0)+4|0;c[k>>2]=E;if((I|0)==(c[g>>2]|0)){H=I;break L8969}else{v=E;r=I}}if((z|0)==7510){c[g>>2]=r;A=1;i=l;return A|0}else if((z|0)==7509){c[g>>2]=r;A=2;i=l;return A|0}}}while(0);c[g>>2]=H;A=(H|0)!=(f|0)|0;i=l;return A|0}else if((z|0)==7530){q=c[g>>2]|0;break}else if((z|0)==7533){i=l;return A|0}}}while(0);A=(q|0)!=(f|0)|0;i=l;return A|0}function nn(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+8|0;c[g>>2]=e;e=h|0;j=bN(c[b+8>>2]|0)|0;b=oC(e,0,d)|0;if((j|0)!=0){bN(j|0)|0}if((b|0)==(-1|0)|(b|0)==0){k=2;i=h;return k|0}j=b-1|0;b=c[g>>2]|0;if(j>>>0>(f-b|0)>>>0){k=1;i=h;return k|0}if((j|0)==0){k=0;i=h;return k|0}else{l=j;m=e;n=b}while(1){b=a[m]|0;c[g>>2]=n+1;a[n]=b;b=l-1|0;if((b|0)==0){k=0;break}l=b;m=m+1|0;n=c[g>>2]|0}i=h;return k|0}function no(a){a=a|0;var b=0,d=0,e=0;b=a+8|0;a=bN(c[b>>2]|0)|0;d=oB(0,0,4)|0;if((a|0)!=0){bN(a|0)|0}if((d|0)!=0){e=-1;return e|0}d=c[b>>2]|0;if((d|0)==0){e=1;return e|0}b=bN(d|0)|0;if((b|0)==0){e=0;return e|0}bN(b|0)|0;e=0;return e|0}function np(a){a=a|0;return 0}function nq(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=d;d=0;j=0;while(1){k=bN(c[i>>2]|0)|0;l=ox(a,h-a|0,b)|0;if((k|0)!=0){bN(k|0)|0}if((l|0)==0){m=1;n=a+1|0}else if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;o=7595;break}else{m=l;n=a+l|0}l=m+d|0;k=j+1|0;if(k>>>0>=f>>>0|(n|0)==(e|0)){g=l;o=7594;break}else{a=n;d=l;j=k}}if((o|0)==7595){return g|0}else if((o|0)==7594){return g|0}return 0}function nr(a){a=a|0;var b=0,d=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=bN(b|0)|0;if((a|0)==0){d=4;break}bN(a|0)|0;d=4}}while(0);return d|0}function ns(a){a=a|0;hE(a|0);pb(a);return}function nt(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=nu(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function nu(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0;c[g>>2]=d;c[j>>2]=h;do{if((l&2|0)!=0){if((i-h|0)<3){m=1;return m|0}else{c[j>>2]=h+1;a[h]=-17;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-69;d=c[j>>2]|0;c[j>>2]=d+1;a[d]=-65;break}}}while(0);h=f;l=c[g>>2]|0;if(l>>>0>=f>>>0){m=0;return m|0}d=i;i=l;L9061:while(1){l=b[i>>1]|0;n=l&65535;if(n>>>0>k>>>0){m=2;o=7640;break}do{if((l&65535)>>>0<128>>>0){p=c[j>>2]|0;if((d-p|0)<1){m=1;o=7641;break L9061}c[j>>2]=p+1;a[p]=l&255}else{if((l&65535)>>>0<2048>>>0){p=c[j>>2]|0;if((d-p|0)<2){m=1;o=7643;break L9061}c[j>>2]=p+1;a[p]=(n>>>6|192)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0<55296>>>0){p=c[j>>2]|0;if((d-p|0)<3){m=1;o=7635;break L9061}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((l&65535)>>>0>=56320>>>0){if((l&65535)>>>0<57344>>>0){m=2;o=7644;break L9061}p=c[j>>2]|0;if((d-p|0)<3){m=1;o=7636;break L9061}c[j>>2]=p+1;a[p]=(n>>>12|224)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n>>>6&63|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n&63|128)&255;break}if((h-i|0)<4){m=1;o=7639;break L9061}p=i+2|0;q=e[p>>1]|0;if((q&64512|0)!=56320){m=2;o=7633;break L9061}if((d-(c[j>>2]|0)|0)<4){m=1;o=7632;break L9061}r=n&960;if(((r<<10)+65536|n<<10&64512|q&1023)>>>0>k>>>0){m=2;o=7642;break L9061}c[g>>2]=p;p=(r>>>6)+1|0;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(p>>>2|240)&255;r=c[j>>2]|0;c[j>>2]=r+1;a[r]=(n>>>2&15|p<<4&48|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(n<<4&48|q>>>6&15|128)&255;p=c[j>>2]|0;c[j>>2]=p+1;a[p]=(q&63|128)&255}}while(0);n=(c[g>>2]|0)+2|0;c[g>>2]=n;if(n>>>0<f>>>0){i=n}else{m=0;o=7638;break}}if((o|0)==7642){return m|0}else if((o|0)==7643){return m|0}else if((o|0)==7644){return m|0}else if((o|0)==7633){return m|0}else if((o|0)==7635){return m|0}else if((o|0)==7636){return m|0}else if((o|0)==7638){return m|0}else if((o|0)==7632){return m|0}else if((o|0)==7639){return m|0}else if((o|0)==7640){return m|0}else if((o|0)==7641){return m|0}return 0}function nv(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=nw(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=b;return l|0}function nw(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;c[g>>2]=e;c[j>>2]=h;h=c[g>>2]|0;do{if((l&4|0)==0){m=h}else{if((f-h|0)<=2){m=h;break}if((a[h]|0)!=-17){m=h;break}if((a[h+1|0]|0)!=-69){m=h;break}if((a[h+2|0]|0)!=-65){m=h;break}e=h+3|0;c[g>>2]=e;m=e}}while(0);L9107:do{if(m>>>0<f>>>0){h=f;l=i;e=c[j>>2]|0;n=m;L9109:while(1){if(e>>>0>=i>>>0){o=n;break L9107}p=a[n]|0;q=p&255;if(q>>>0>k>>>0){r=2;s=7693;break}do{if(p<<24>>24>-1){b[e>>1]=p&255;c[g>>2]=(c[g>>2]|0)+1}else{if((p&255)>>>0<194>>>0){r=2;s=7701;break L9109}if((p&255)>>>0<224>>>0){if((h-n|0)<2){r=1;s=7703;break L9109}t=d[n+1|0]|0;if((t&192|0)!=128){r=2;s=7705;break L9109}u=t&63|q<<6&1984;if(u>>>0>k>>>0){r=2;s=7698;break L9109}b[e>>1]=u&65535;c[g>>2]=(c[g>>2]|0)+2;break}if((p&255)>>>0<240>>>0){if((h-n|0)<3){r=1;s=7694;break L9109}u=a[n+1|0]|0;t=a[n+2|0]|0;if((q|0)==237){if((u&-32)<<24>>24!=-128){r=2;s=7702;break L9109}}else if((q|0)==224){if((u&-32)<<24>>24!=-96){r=2;s=7706;break L9109}}else{if((u&-64)<<24>>24!=-128){r=2;s=7704;break L9109}}v=t&255;if((v&192|0)!=128){r=2;s=7697;break L9109}t=(u&255)<<6&4032|q<<12|v&63;if((t&65535)>>>0>k>>>0){r=2;s=7696;break L9109}b[e>>1]=t&65535;c[g>>2]=(c[g>>2]|0)+3;break}if((p&255)>>>0>=245>>>0){r=2;s=7699;break L9109}if((h-n|0)<4){r=1;s=7687;break L9109}t=a[n+1|0]|0;v=a[n+2|0]|0;u=a[n+3|0]|0;if((q|0)==240){if((t+112&255)>>>0>=48>>>0){r=2;s=7688;break L9109}}else if((q|0)==244){if((t&-16)<<24>>24!=-128){r=2;s=7689;break L9109}}else{if((t&-64)<<24>>24!=-128){r=2;s=7690;break L9109}}w=v&255;if((w&192|0)!=128){r=2;s=7691;break L9109}v=u&255;if((v&192|0)!=128){r=2;s=7692;break L9109}if((l-e|0)<4){r=1;s=7700;break L9109}u=q&7;x=t&255;t=w<<6;y=v&63;if((x<<12&258048|u<<18|t&4032|y)>>>0>k>>>0){r=2;s=7707;break L9109}b[e>>1]=(x<<2&60|w>>>4&3|((x>>>4&3|u<<2)<<6)+16320|55296)&65535;u=(c[j>>2]|0)+2|0;c[j>>2]=u;b[u>>1]=(y|t&960|56320)&65535;c[g>>2]=(c[g>>2]|0)+4}}while(0);q=(c[j>>2]|0)+2|0;c[j>>2]=q;p=c[g>>2]|0;if(p>>>0<f>>>0){e=q;n=p}else{o=p;break L9107}}if((s|0)==7698){return r|0}else if((s|0)==7699){return r|0}else if((s|0)==7700){return r|0}else if((s|0)==7701){return r|0}else if((s|0)==7702){return r|0}else if((s|0)==7703){return r|0}else if((s|0)==7687){return r|0}else if((s|0)==7688){return r|0}else if((s|0)==7689){return r|0}else if((s|0)==7690){return r|0}else if((s|0)==7691){return r|0}else if((s|0)==7692){return r|0}else if((s|0)==7704){return r|0}else if((s|0)==7705){return r|0}else if((s|0)==7706){return r|0}else if((s|0)==7707){return r|0}else if((s|0)==7693){return r|0}else if((s|0)==7694){return r|0}else if((s|0)==7696){return r|0}else if((s|0)==7697){return r|0}}else{o=m}}while(0);r=o>>>0<f>>>0|0;return r|0}function nx(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function ny(a){a=a|0;return 0}function nz(a){a=a|0;return 0}function nA(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return nB(c,d,e,1114111,0)|0}function nB(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L9180:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=0;j=h;L9182:while(1){k=a[j]|0;l=k&255;if(l>>>0>f>>>0){m=j;break L9180}do{if(k<<24>>24>-1){n=j+1|0;o=i}else{if((k&255)>>>0<194>>>0){m=j;break L9180}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L9180}p=d[j+1|0]|0;if((p&192|0)!=128){m=j;break L9180}if((p&63|l<<6&1984)>>>0>f>>>0){m=j;break L9180}n=j+2|0;o=i;break}if((k&255)>>>0<240>>>0){q=j;if((g-q|0)<3){m=j;break L9180}p=a[j+1|0]|0;r=a[j+2|0]|0;if((l|0)==237){if((p&-32)<<24>>24!=-128){s=7734;break L9182}}else if((l|0)==224){if((p&-32)<<24>>24!=-96){s=7732;break L9182}}else{if((p&-64)<<24>>24!=-128){s=7736;break L9182}}t=r&255;if((t&192|0)!=128){m=j;break L9180}if(((p&255)<<6&4032|l<<12&61440|t&63)>>>0>f>>>0){m=j;break L9180}n=j+3|0;o=i;break}if((k&255)>>>0>=245>>>0){m=j;break L9180}u=j;if((g-u|0)<4){m=j;break L9180}if((e-i|0)>>>0<2>>>0){m=j;break L9180}t=a[j+1|0]|0;p=a[j+2|0]|0;r=a[j+3|0]|0;if((l|0)==240){if((t+112&255)>>>0>=48>>>0){s=7745;break L9182}}else if((l|0)==244){if((t&-16)<<24>>24!=-128){s=7747;break L9182}}else{if((t&-64)<<24>>24!=-128){s=7749;break L9182}}v=p&255;if((v&192|0)!=128){m=j;break L9180}p=r&255;if((p&192|0)!=128){m=j;break L9180}if(((t&255)<<12&258048|l<<18&1835008|v<<6&4032|p&63)>>>0>f>>>0){m=j;break L9180}n=j+4|0;o=i+1|0}}while(0);l=o+1|0;if(n>>>0<c>>>0&l>>>0<e>>>0){i=l;j=n}else{m=n;break L9180}}if((s|0)==7732){w=q-b|0;return w|0}else if((s|0)==7745){w=u-b|0;return w|0}else if((s|0)==7747){w=u-b|0;return w|0}else if((s|0)==7749){w=u-b|0;return w|0}else if((s|0)==7736){w=q-b|0;return w|0}else if((s|0)==7734){w=q-b|0;return w|0}}else{m=h}}while(0);w=m-b|0;return w|0}function nC(a){a=a|0;return 4}function nD(a){a=a|0;hE(a|0);pb(a);return}function nE(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=nF(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function nF(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0;c[e>>2]=b;c[h>>2]=f;do{if((j&2|0)!=0){if((g-f|0)<3){k=1;return k|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);f=c[e>>2]|0;if(f>>>0>=d>>>0){k=0;return k|0}j=g;g=f;L9246:while(1){f=c[g>>2]|0;if((f&-2048|0)==55296|f>>>0>i>>>0){k=2;l=7789;break}do{if(f>>>0<128>>>0){b=c[h>>2]|0;if((j-b|0)<1){k=1;l=7792;break L9246}c[h>>2]=b+1;a[b]=f&255}else{if(f>>>0<2048>>>0){b=c[h>>2]|0;if((j-b|0)<2){k=1;l=7786;break L9246}c[h>>2]=b+1;a[b]=(f>>>6|192)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}b=c[h>>2]|0;m=j-b|0;if(f>>>0<65536>>>0){if((m|0)<3){k=1;l=7791;break L9246}c[h>>2]=b+1;a[b]=(f>>>12|224)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f>>>6&63|128)&255;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=(f&63|128)&255;break}else{if((m|0)<4){k=1;l=7793;break L9246}c[h>>2]=b+1;a[b]=(f>>>18|240)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>12&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f>>>6&63|128)&255;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=(f&63|128)&255;break}}}while(0);f=(c[e>>2]|0)+4|0;c[e>>2]=f;if(f>>>0<d>>>0){g=f}else{k=0;l=7787;break}}if((l|0)==7791){return k|0}else if((l|0)==7787){return k|0}else if((l|0)==7786){return k|0}else if((l|0)==7792){return k|0}else if((l|0)==7789){return k|0}else if((l|0)==7793){return k|0}return 0}function nG(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b|0;k=b+8|0;c[a>>2]=d;c[k>>2]=g;l=nH(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=b;return l|0}function nH(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;c[f>>2]=b;c[i>>2]=g;g=c[f>>2]|0;do{if((k&4|0)==0){l=g}else{if((e-g|0)<=2){l=g;break}if((a[g]|0)!=-17){l=g;break}if((a[g+1|0]|0)!=-69){l=g;break}if((a[g+2|0]|0)!=-65){l=g;break}b=g+3|0;c[f>>2]=b;l=b}}while(0);L9279:do{if(l>>>0<e>>>0){g=e;k=c[i>>2]|0;b=l;L9281:while(1){if(k>>>0>=h>>>0){m=b;break L9279}n=a[b]|0;o=n&255;do{if(n<<24>>24>-1){if(o>>>0>j>>>0){p=2;q=7853;break L9281}c[k>>2]=o;c[f>>2]=(c[f>>2]|0)+1}else{if((n&255)>>>0<194>>>0){p=2;q=7852;break L9281}if((n&255)>>>0<224>>>0){if((g-b|0)<2){p=1;q=7841;break L9281}r=d[b+1|0]|0;if((r&192|0)!=128){p=2;q=7848;break L9281}s=r&63|o<<6&1984;if(s>>>0>j>>>0){p=2;q=7850;break L9281}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+2;break}if((n&255)>>>0<240>>>0){if((g-b|0)<3){p=1;q=7836;break L9281}s=a[b+1|0]|0;r=a[b+2|0]|0;if((o|0)==224){if((s&-32)<<24>>24!=-96){p=2;q=7851;break L9281}}else if((o|0)==237){if((s&-32)<<24>>24!=-128){p=2;q=7854;break L9281}}else{if((s&-64)<<24>>24!=-128){p=2;q=7844;break L9281}}t=r&255;if((t&192|0)!=128){p=2;q=7842;break L9281}r=(s&255)<<6&4032|o<<12&61440|t&63;if(r>>>0>j>>>0){p=2;q=7843;break L9281}c[k>>2]=r;c[f>>2]=(c[f>>2]|0)+3;break}if((n&255)>>>0>=245>>>0){p=2;q=7840;break L9281}if((g-b|0)<4){p=1;q=7838;break L9281}r=a[b+1|0]|0;t=a[b+2|0]|0;s=a[b+3|0]|0;if((o|0)==244){if((r&-16)<<24>>24!=-128){p=2;q=7845;break L9281}}else if((o|0)==240){if((r+112&255)>>>0>=48>>>0){p=2;q=7846;break L9281}}else{if((r&-64)<<24>>24!=-128){p=2;q=7837;break L9281}}u=t&255;if((u&192|0)!=128){p=2;q=7849;break L9281}t=s&255;if((t&192|0)!=128){p=2;q=7847;break L9281}s=(r&255)<<12&258048|o<<18&1835008|u<<6&4032|t&63;if(s>>>0>j>>>0){p=2;q=7835;break L9281}c[k>>2]=s;c[f>>2]=(c[f>>2]|0)+4}}while(0);o=(c[i>>2]|0)+4|0;c[i>>2]=o;n=c[f>>2]|0;if(n>>>0<e>>>0){k=o;b=n}else{m=n;break L9279}}if((q|0)==7853){return p|0}else if((q|0)==7854){return p|0}else if((q|0)==7836){return p|0}else if((q|0)==7837){return p|0}else if((q|0)==7838){return p|0}else if((q|0)==7840){return p|0}else if((q|0)==7841){return p|0}else if((q|0)==7847){return p|0}else if((q|0)==7848){return p|0}else if((q|0)==7849){return p|0}else if((q|0)==7850){return p|0}else if((q|0)==7851){return p|0}else if((q|0)==7852){return p|0}else if((q|0)==7842){return p|0}else if((q|0)==7843){return p|0}else if((q|0)==7844){return p|0}else if((q|0)==7845){return p|0}else if((q|0)==7846){return p|0}else if((q|0)==7835){return p|0}}else{m=l}}while(0);p=m>>>0<e>>>0|0;return p|0}function nI(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function nJ(a){a=a|0;return 0}function nK(a){a=a|0;return 0}function nL(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return nM(c,d,e,1114111,0)|0}function nM(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;do{if((g&4|0)==0){h=b}else{if((c-b|0)<=2){h=b;break}if((a[b]|0)!=-17){h=b;break}if((a[b+1|0]|0)!=-69){h=b;break}h=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);L9350:do{if(h>>>0<c>>>0&(e|0)!=0){g=c;i=1;j=h;L9352:while(1){k=a[j]|0;l=k&255;do{if(k<<24>>24>-1){if(l>>>0>f>>>0){m=j;break L9350}n=j+1|0}else{if((k&255)>>>0<194>>>0){m=j;break L9350}if((k&255)>>>0<224>>>0){if((g-j|0)<2){m=j;break L9350}o=d[j+1|0]|0;if((o&192|0)!=128){m=j;break L9350}if((o&63|l<<6&1984)>>>0>f>>>0){m=j;break L9350}n=j+2|0;break}if((k&255)>>>0<240>>>0){p=j;if((g-p|0)<3){m=j;break L9350}o=a[j+1|0]|0;q=a[j+2|0]|0;if((l|0)==237){if((o&-32)<<24>>24!=-128){r=7881;break L9352}}else if((l|0)==224){if((o&-32)<<24>>24!=-96){r=7879;break L9352}}else{if((o&-64)<<24>>24!=-128){r=7883;break L9352}}s=q&255;if((s&192|0)!=128){m=j;break L9350}if(((o&255)<<6&4032|l<<12&61440|s&63)>>>0>f>>>0){m=j;break L9350}n=j+3|0;break}if((k&255)>>>0>=245>>>0){m=j;break L9350}t=j;if((g-t|0)<4){m=j;break L9350}s=a[j+1|0]|0;o=a[j+2|0]|0;q=a[j+3|0]|0;if((l|0)==240){if((s+112&255)>>>0>=48>>>0){r=7891;break L9352}}else if((l|0)==244){if((s&-16)<<24>>24!=-128){r=7893;break L9352}}else{if((s&-64)<<24>>24!=-128){r=7895;break L9352}}u=o&255;if((u&192|0)!=128){m=j;break L9350}o=q&255;if((o&192|0)!=128){m=j;break L9350}if(((s&255)<<12&258048|l<<18&1835008|u<<6&4032|o&63)>>>0>f>>>0){m=j;break L9350}n=j+4|0}}while(0);if(!(n>>>0<c>>>0&i>>>0<e>>>0)){m=n;break L9350}i=i+1|0;j=n}if((r|0)==7895){v=t-b|0;return v|0}else if((r|0)==7893){v=t-b|0;return v|0}else if((r|0)==7883){v=p-b|0;return v|0}else if((r|0)==7891){v=t-b|0;return v|0}else if((r|0)==7879){v=p-b|0;return v|0}else if((r|0)==7881){v=p-b|0;return v|0}}else{m=h}}while(0);v=m-b|0;return v|0}function nN(a){a=a|0;return 4}function nO(a){a=a|0;hE(a|0);pb(a);return}function nP(a){a=a|0;hE(a|0);pb(a);return}function nQ(a){a=a|0;c[a>>2]=5720;h3(a+12|0);hE(a|0);pb(a);return}function nR(a){a=a|0;c[a>>2]=5720;h3(a+12|0);hE(a|0);return}function nS(a){a=a|0;c[a>>2]=5672;h3(a+16|0);hE(a|0);pb(a);return}function nT(a){a=a|0;c[a>>2]=5672;h3(a+16|0);hE(a|0);return}function nU(b){b=b|0;return a[b+8|0]|0}function nV(a){a=a|0;return c[a+8>>2]|0}function nW(b){b=b|0;return a[b+9|0]|0}function nX(a){a=a|0;return c[a+12>>2]|0}function nY(a,b){a=a|0;b=b|0;h0(a,b+12|0);return}function nZ(a,b){a=a|0;b=b|0;h0(a,b+16|0);return}function n_(a,b){a=a|0;b=b|0;h1(a,2584,4);return}function n$(a,b){a=a|0;b=b|0;ic(a,2528,oF(2528)|0);return}function n0(a,b){a=a|0;b=b|0;h1(a,2520,5);return}function n1(a,b){a=a|0;b=b|0;ic(a,2480,oF(2480)|0);return}function n2(b){b=b|0;var d=0;if((a[16568]|0)!=0){d=c[3738]|0;return d|0}if((bg(16568)|0)==0){d=c[3738]|0;return d|0}do{if((a[16456]|0)==0){if((bg(16456)|0)==0){break}pm(13992,0,168)|0;a1(268,0,u|0)|0}}while(0);h4(13992,3800)|0;h4(14004,3712)|0;h4(14016,3704)|0;h4(14028,3688)|0;h4(14040,3672)|0;h4(14052,3600)|0;h4(14064,3584)|0;h4(14076,3544)|0;h4(14088,3536)|0;h4(14100,3512)|0;h4(14112,3504)|0;h4(14124,3488)|0;h4(14136,3456)|0;h4(14148,3448)|0;c[3738]=13992;d=c[3738]|0;return d|0}function n3(b){b=b|0;var d=0;if((a[16512]|0)!=0){d=c[3716]|0;return d|0}if((bg(16512)|0)==0){d=c[3716]|0;return d|0}do{if((a[16432]|0)==0){if((bg(16432)|0)==0){break}pm(13248,0,168)|0;a1(150,0,u|0)|0}}while(0);ig(13248,4464)|0;ig(13260,4432)|0;ig(13272,4400)|0;ig(13284,4360)|0;ig(13296,4296)|0;ig(13308,4264)|0;ig(13320,4176)|0;ig(13332,4128)|0;ig(13344,4072)|0;ig(13356,4056)|0;ig(13368,4008)|0;ig(13380,3904)|0;ig(13392,3888)|0;ig(13404,3872)|0;c[3716]=13248;d=c[3716]|0;return d|0}function n4(b){b=b|0;var d=0;if((a[16560]|0)!=0){d=c[3736]|0;return d|0}if((bg(16560)|0)==0){d=c[3736]|0;return d|0}do{if((a[16448]|0)==0){if((bg(16448)|0)==0){break}pm(13704,0,288)|0;a1(170,0,u|0)|0}}while(0);h4(13704,440)|0;h4(13716,424)|0;h4(13728,416)|0;h4(13740,408)|0;h4(13752,368)|0;h4(13764,360)|0;h4(13776,352)|0;h4(13788,344)|0;h4(13800,288)|0;h4(13812,280)|0;h4(13824,232)|0;h4(13836,216)|0;h4(13848,168)|0;h4(13860,160)|0;h4(13872,136)|0;h4(13884,128)|0;h4(13896,368)|0;h4(13908,120)|0;h4(13920,80)|0;h4(13932,4552)|0;h4(13944,4544)|0;h4(13956,4536)|0;h4(13968,4528)|0;h4(13980,4520)|0;c[3736]=13704;d=c[3736]|0;return d|0}function n5(b){b=b|0;var d=0;if((a[16504]|0)!=0){d=c[3714]|0;return d|0}if((bg(16504)|0)==0){d=c[3714]|0;return d|0}do{if((a[16424]|0)==0){if((bg(16424)|0)==0){break}pm(12960,0,288)|0;a1(124,0,u|0)|0}}while(0);ig(12960,1488)|0;ig(12972,1448)|0;ig(12984,1392)|0;ig(12996,1320)|0;ig(13008,768)|0;ig(13020,1288)|0;ig(13032,1160)|0;ig(13044,1128)|0;ig(13056,1088)|0;ig(13068,992)|0;ig(13080,952)|0;ig(13092,912)|0;ig(13104,872)|0;ig(13116,832)|0;ig(13128,816)|0;ig(13140,784)|0;ig(13152,768)|0;ig(13164,704)|0;ig(13176,688)|0;ig(13188,616)|0;ig(13200,600)|0;ig(13212,584)|0;ig(13224,544)|0;ig(13236,496)|0;c[3714]=12960;d=c[3714]|0;return d|0}function n6(b){b=b|0;var d=0;if((a[16576]|0)!=0){d=c[3740]|0;return d|0}if((bg(16576)|0)==0){d=c[3740]|0;return d|0}do{if((a[16464]|0)==0){if((bg(16464)|0)==0){break}pm(14160,0,288)|0;a1(122,0,u|0)|0}}while(0);h4(14160,1528)|0;h4(14172,1520)|0;c[3740]=14160;d=c[3740]|0;return d|0}function n7(b){b=b|0;var d=0;if((a[16520]|0)!=0){d=c[3718]|0;return d|0}if((bg(16520)|0)==0){d=c[3718]|0;return d|0}do{if((a[16440]|0)==0){if((bg(16440)|0)==0){break}pm(13416,0,288)|0;a1(238,0,u|0)|0}}while(0);ig(13416,1720)|0;ig(13428,1632)|0;c[3718]=13416;d=c[3718]|0;return d|0}function n8(b){b=b|0;if((a[16584]|0)!=0){return 14968}if((bg(16584)|0)==0){return 14968}h1(14968,2432,8);a1(258,14968,u|0)|0;return 14968}function n9(b){b=b|0;if((a[16528]|0)!=0){return 14880}if((bg(16528)|0)==0){return 14880}ic(14880,2392,oF(2392)|0);a1(196,14880,u|0)|0;return 14880}function oa(b){b=b|0;if((a[16608]|0)!=0){return 15016}if((bg(16608)|0)==0){return 15016}h1(15016,2312,8);a1(258,15016,u|0)|0;return 15016}function ob(b){b=b|0;if((a[16552]|0)!=0){return 14928}if((bg(16552)|0)==0){return 14928}ic(14928,2232,oF(2232)|0);a1(196,14928,u|0)|0;return 14928}function oc(b){b=b|0;if((a[16600]|0)!=0){return 15e3}if((bg(16600)|0)==0){return 15e3}h1(15e3,2208,20);a1(258,15e3,u|0)|0;return 15e3}function od(b){b=b|0;if((a[16544]|0)!=0){return 14912}if((bg(16544)|0)==0){return 14912}ic(14912,2120,oF(2120)|0);a1(196,14912,u|0)|0;return 14912}function oe(b){b=b|0;if((a[16592]|0)!=0){return 14984}if((bg(16592)|0)==0){return 14984}h1(14984,2088,11);a1(258,14984,u|0)|0;return 14984}function of(b){b=b|0;if((a[16536]|0)!=0){return 14896}if((bg(16536)|0)==0){return 14896}ic(14896,2008,oF(2008)|0);a1(196,14896,u|0)|0;return 14896}function og(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bH()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=+pj(b,g,c[3620]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function oh(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bH()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=+pj(b,g,c[3620]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function oi(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=bH()|0;k=c[j>>2]|0;c[j>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);l=+pj(b,g,c[3620]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function oj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=bH()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);n=aJ(b|0,h|0,f|0,c[3620]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=K;k=n;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(K=j,k)|0}function ok(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bH()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);m=aJ(b|0,h|0,f|0,c[3620]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function ol(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bH()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);m=aJ(b|0,h|0,f|0,c[3620]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function om(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=bH()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);m=aJ(b|0,h|0,f|0,c[3620]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&m>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function on(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}l=bH()|0;m=c[l>>2]|0;c[l>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);n=bV(b|0,h|0,f|0,c[3620]|0)|0;f=K;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(K=j,k)|0}if((b|0)!=34){j=f;k=n;i=g;return(K=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&n>>>0>0>>>0;j=b?2147483647:-2147483648;k=b?-1:0;i=g;return(K=j,k)|0}function oo(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=bH()|0;l=c[k>>2]|0;c[k>>2]=0;do{if((a[16488]|0)==0){if((bg(16488)|0)==0){break}c[3620]=aS(2147483647,3152,0)|0}}while(0);m=bV(b|0,h|0,f|0,c[3620]|0)|0;f=K;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&m>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&m>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function op(a){a=a|0;var b=0,d=0,e=0,f=0;b=a+4|0;d=(c[a>>2]|0)+(c[b+4>>2]|0)|0;a=d;e=c[b>>2]|0;if((e&1|0)==0){f=e;ca[f&511](a);return}else{f=c[(c[d>>2]|0)+(e-1)>>2]|0;ca[f&511](a);return}}function oq(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(h-i>>2>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[f>>2]|0}k=l+4|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b+16|0;k=b|0;l=c[k>>2]|0;g=i-l>>2;i=g+d|0;if(i>>>0>1073741823>>>0){mE(0)}m=h-l|0;do{if(m>>2>>>0>536870910>>>0){n=1073741823;o=8339}else{l=m>>1;h=l>>>0<i>>>0?i:l;if((h|0)==0){p=0;q=0;break}l=b+128|0;if(!((a[l]&1)==0&h>>>0<29>>>0)){n=h;o=8339;break}a[l]=1;p=j;q=h}}while(0);if((o|0)==8339){p=o8(n<<2)|0;q=n}n=d;d=p+(g<<2)|0;do{if((d|0)==0){r=0}else{c[d>>2]=0;r=d}d=r+4|0;n=n-1|0;}while((n|0)!=0);n=p+(q<<2)|0;q=c[k>>2]|0;r=(c[f>>2]|0)-q|0;o=p+(g-(r>>2)<<2)|0;g=o;p=q;pl(g|0,p|0,r)|0;c[k>>2]=o;c[f>>2]=d;c[e>>2]=n;if((q|0)==0){return}if((q|0)==(j|0)){a[b+128|0]=0;return}else{pb(p);return}}function or(a){a=a|0;ie(13692);ie(13680);ie(13668);ie(13656);ie(13644);ie(13632);ie(13620);ie(13608);ie(13596);ie(13584);ie(13572);ie(13560);ie(13548);ie(13536);ie(13524);ie(13512);ie(13500);ie(13488);ie(13476);ie(13464);ie(13452);ie(13440);ie(13428);ie(13416);return}function os(a){a=a|0;h3(14436);h3(14424);h3(14412);h3(14400);h3(14388);h3(14376);h3(14364);h3(14352);h3(14340);h3(14328);h3(14316);h3(14304);h3(14292);h3(14280);h3(14268);h3(14256);h3(14244);h3(14232);h3(14220);h3(14208);h3(14196);h3(14184);h3(14172);h3(14160);return}function ot(a){a=a|0;ie(13236);ie(13224);ie(13212);ie(13200);ie(13188);ie(13176);ie(13164);ie(13152);ie(13140);ie(13128);ie(13116);ie(13104);ie(13092);ie(13080);ie(13068);ie(13056);ie(13044);ie(13032);ie(13020);ie(13008);ie(12996);ie(12984);ie(12972);ie(12960);return}function ou(a){a=a|0;h3(13980);h3(13968);h3(13956);h3(13944);h3(13932);h3(13920);h3(13908);h3(13896);h3(13884);h3(13872);h3(13860);h3(13848);h3(13836);h3(13824);h3(13812);h3(13800);h3(13788);h3(13776);h3(13764);h3(13752);h3(13740);h3(13728);h3(13716);h3(13704);return}function ov(a){a=a|0;ie(13404);ie(13392);ie(13380);ie(13368);ie(13356);ie(13344);ie(13332);ie(13320);ie(13308);ie(13296);ie(13284);ie(13272);ie(13260);ie(13248);return}function ow(a){a=a|0;h3(14148);h3(14136);h3(14124);h3(14112);h3(14100);h3(14088);h3(14076);h3(14064);h3(14052);h3(14040);h3(14028);h3(14016);h3(14004);h3(13992);return}function ox(a,b,c){a=a|0;b=b|0;c=c|0;return oy(0,a,b,(c|0)!=0?c:12472)|0}function oy(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;j=((f|0)==0?12464:f)|0;f=c[j>>2]|0;L9899:do{if((d|0)==0){if((f|0)==0){k=0}else{break}i=g;return k|0}else{if((b|0)==0){l=h;c[h>>2]=l;m=l}else{m=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){l=a[d]|0;n=l&255;if(l<<24>>24>-1){c[m>>2]=n;k=l<<24>>24!=0|0;i=g;return k|0}else{l=n-194|0;if(l>>>0>50>>>0){break L9899}o=d+1|0;p=c[s+(l<<2)>>2]|0;q=e-1|0;break}}else{o=d;p=f;q=e}}while(0);L9915:do{if((q|0)==0){r=p}else{l=a[o]|0;n=(l&255)>>>3;if((n-16|n+(p>>26))>>>0>7>>>0){break L9899}else{t=o;u=p;v=q;w=l}while(1){t=t+1|0;u=(w&255)-128|u<<6;v=v-1|0;if((u|0)>=0){break}if((v|0)==0){r=u;break L9915}w=a[t]|0;if(((w&255)-128|0)>>>0>63>>>0){break L9899}}c[j>>2]=0;c[m>>2]=u;k=e-v|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(bH()|0)>>2]=84;k=-1;i=g;return k|0}function oz(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;g=i;i=i+1032|0;h=g|0;j=g+1024|0;k=c[b>>2]|0;c[j>>2]=k;l=(a|0)!=0;m=l?e:256;e=l?a:h|0;L9930:do{if((k|0)==0|(m|0)==0){n=0;o=d;p=m;q=e;r=k}else{a=h|0;s=m;t=d;u=0;v=e;w=k;while(1){x=t>>>2;y=x>>>0>=s>>>0;if(!(y|t>>>0>131>>>0)){n=u;o=t;p=s;q=v;r=w;break L9930}z=y?s:x;A=t-z|0;x=oA(v,j,z,f)|0;if((x|0)==-1){break}if((v|0)==(a|0)){B=a;C=s}else{B=v+(x<<2)|0;C=s-x|0}z=x+u|0;x=c[j>>2]|0;if((x|0)==0|(C|0)==0){n=z;o=A;p=C;q=B;r=x;break L9930}else{s=C;t=A;u=z;v=B;w=x}}n=-1;o=A;p=0;q=v;r=c[j>>2]|0}}while(0);L9941:do{if((r|0)==0){D=n}else{if((p|0)==0|(o|0)==0){D=n;break}else{E=p;F=o;G=n;H=q;I=r}while(1){J=oy(H,I,F,f)|0;if((J+2|0)>>>0<3>>>0){break}A=(c[j>>2]|0)+J|0;c[j>>2]=A;B=E-1|0;C=G+1|0;if((B|0)==0|(F|0)==(J|0)){D=C;break L9941}else{E=B;F=F-J|0;G=C;H=H+4|0;I=A}}if((J|0)==(-1|0)){D=-1;break}else if((J|0)==0){c[j>>2]=0;D=G;break}else{c[f>>2]=0;D=G;break}}}while(0);if(!l){i=g;return D|0}c[b>>2]=c[j>>2];i=g;return D|0}function oA(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0;h=c[e>>2]|0;do{if((g|0)==0){i=8409}else{j=g|0;k=c[j>>2]|0;if((k|0)==0){i=8409;break}if((b|0)==0){l=k;m=h;n=f;i=8420;break}c[j>>2]=0;o=k;p=h;q=b;r=f;i=8440}}while(0);if((i|0)==8409){if((b|0)==0){t=h;u=f;i=8411}else{v=h;w=b;x=f;i=8410}}L9962:while(1){if((i|0)==8440){i=0;h=d[p]|0;g=h>>>3;if((g-16|g+(o>>26))>>>0>7>>>0){i=8441;break}g=p+1|0;y=h-128|o<<6;do{if((y|0)<0){h=(d[g]|0)-128|0;if(h>>>0>63>>>0){i=8444;break L9962}k=p+2|0;z=h|y<<6;if((z|0)>=0){A=z;B=k;break}h=(d[k]|0)-128|0;if(h>>>0>63>>>0){i=8447;break L9962}A=h|z<<6;B=p+3|0}else{A=y;B=g}}while(0);c[q>>2]=A;v=B;w=q+4|0;x=r-1|0;i=8410;continue}else if((i|0)==8420){i=0;g=(d[m]|0)>>>3;if((g-16|g+(l>>26))>>>0>7>>>0){i=8421;break}g=m+1|0;do{if((l&33554432|0)==0){C=g}else{if(((d[g]|0)-128|0)>>>0>63>>>0){i=8424;break L9962}h=m+2|0;if((l&524288|0)==0){C=h;break}if(((d[h]|0)-128|0)>>>0>63>>>0){i=8427;break L9962}C=m+3|0}}while(0);t=C;u=n-1|0;i=8411;continue}else if((i|0)==8410){i=0;if((x|0)==0){D=f;i=8461;break}else{E=x;F=w;G=v}while(1){g=a[G]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((G&3|0)==0&E>>>0>3>>>0){H=E;I=F;J=G}else{K=G;L=F;M=E;N=g;break}while(1){O=c[J>>2]|0;if(((O-16843009|O)&-2139062144|0)!=0){i=8434;break}c[I>>2]=O&255;c[I+4>>2]=d[J+1|0]|0;c[I+8>>2]=d[J+2|0]|0;P=J+4|0;Q=I+16|0;c[I+12>>2]=d[J+3|0]|0;R=H-4|0;if(R>>>0>3>>>0){H=R;I=Q;J=P}else{i=8435;break}}if((i|0)==8434){i=0;K=J;L=I;M=H;N=O&255;break}else if((i|0)==8435){i=0;K=P;L=Q;M=R;N=a[P]|0;break}}else{K=G;L=F;M=E;N=g}}while(0);S=N&255;if((S-1|0)>>>0>=127>>>0){break}c[L>>2]=S;g=M-1|0;if((g|0)==0){D=f;i=8458;break L9962}else{E=g;F=L+4|0;G=K+1|0}}g=S-194|0;if(g>>>0>50>>>0){T=M;U=L;V=K;i=8451;break}o=c[s+(g<<2)>>2]|0;p=K+1|0;q=L;r=M;i=8440;continue}else if((i|0)==8411){i=0;g=a[t]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((t&3|0)!=0){W=t;X=u;Y=g;break}h=c[t>>2]|0;if(((h-16843009|h)&-2139062144|0)==0){Z=u;_=t}else{W=t;X=u;Y=h&255;break}do{_=_+4|0;Z=Z-4|0;$=c[_>>2]|0;}while((($-16843009|$)&-2139062144|0)==0);W=_;X=Z;Y=$&255}else{W=t;X=u;Y=g}}while(0);g=Y&255;if((g-1|0)>>>0<127>>>0){t=W+1|0;u=X-1|0;i=8411;continue}h=g-194|0;if(h>>>0>50>>>0){T=X;U=b;V=W;i=8451;break}l=c[s+(h<<2)>>2]|0;m=W+1|0;n=X;i=8420;continue}}if((i|0)==8447){aa=z;ab=p-1|0;ac=q;ad=r;i=8450}else if((i|0)==8444){aa=y;ab=p-1|0;ac=q;ad=r;i=8450}else if((i|0)==8458){return D|0}else if((i|0)==8461){return D|0}else if((i|0)==8424){aa=l;ab=m-1|0;ac=b;ad=n;i=8450}else if((i|0)==8421){aa=l;ab=m-1|0;ac=b;ad=n;i=8450}else if((i|0)==8427){aa=l;ab=m-1|0;ac=b;ad=n;i=8450}else if((i|0)==8441){aa=o;ab=p-1|0;ac=q;ad=r;i=8450}if((i|0)==8450){if((aa|0)==0){T=ad;U=ac;V=ab;i=8451}else{ae=ac;af=ab}}do{if((i|0)==8451){if((a[V]|0)!=0){ae=U;af=V;break}if((U|0)!=0){c[U>>2]=0;c[e>>2]=0}D=f-T|0;return D|0}}while(0);c[(bH()|0)>>2]=84;if((ae|0)==0){D=-1;return D|0}c[e>>2]=af;D=-1;return D|0}function oB(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){k=h;c[h>>2]=k;l=k}else{l=b}k=a[e]|0;m=k&255;if(k<<24>>24>-1){c[l>>2]=m;j=k<<24>>24!=0|0;i=g;return j|0}k=m-194|0;if(k>>>0>50>>>0){break}m=e+1|0;n=c[s+(k<<2)>>2]|0;if(f>>>0<4>>>0){if((n&-2147483648>>>(((f*6|0)-6|0)>>>0)|0)!=0){break}}k=d[m]|0;m=k>>>3;if((m-16|m+(n>>26))>>>0>7>>>0){break}m=k-128|n<<6;if((m|0)>=0){c[l>>2]=m;j=2;i=g;return j|0}n=(d[e+2|0]|0)-128|0;if(n>>>0>63>>>0){break}k=n|m<<6;if((k|0)>=0){c[l>>2]=k;j=3;i=g;return j|0}m=(d[e+3|0]|0)-128|0;if(m>>>0>63>>>0){break}c[l>>2]=m|k<<6;j=4;i=g;return j|0}}while(0);c[(bH()|0)>>2]=84;j=-1;i=g;return j|0}function oC(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((b|0)==0){f=1;return f|0}if(d>>>0<128>>>0){a[b]=d&255;f=1;return f|0}if(d>>>0<2048>>>0){a[b]=(d>>>6|192)&255;a[b+1|0]=(d&63|128)&255;f=2;return f|0}if(d>>>0<55296>>>0|(d-57344|0)>>>0<8192>>>0){a[b]=(d>>>12|224)&255;a[b+1|0]=(d>>>6&63|128)&255;a[b+2|0]=(d&63|128)&255;f=3;return f|0}if((d-65536|0)>>>0<1048576>>>0){a[b]=(d>>>18|240)&255;a[b+1|0]=(d>>>12&63|128)&255;a[b+2|0]=(d>>>6&63|128)&255;a[b+3|0]=(d&63|128)&255;f=4;return f|0}else{c[(bH()|0)>>2]=84;f=-1;return f|0}return 0}function oD(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+264|0;g=f|0;h=f+256|0;j=c[b>>2]|0;c[h>>2]=j;k=(a|0)!=0;l=k?e:256;e=k?a:g|0;L10083:do{if((j|0)==0|(l|0)==0){m=0;n=d;o=l;p=e;q=j}else{a=g|0;r=l;s=d;t=0;u=e;v=j;while(1){w=s>>>0>=r>>>0;if(!(w|s>>>0>32>>>0)){m=t;n=s;o=r;p=u;q=v;break L10083}x=w?r:s;y=s-x|0;w=oE(u,h,x,0)|0;if((w|0)==-1){break}if((u|0)==(a|0)){z=a;A=r}else{z=u+w|0;A=r-w|0}x=w+t|0;w=c[h>>2]|0;if((w|0)==0|(A|0)==0){m=x;n=y;o=A;p=z;q=w;break L10083}else{r=A;s=y;t=x;u=z;v=w}}m=-1;n=y;o=0;p=u;q=c[h>>2]|0}}while(0);L10094:do{if((q|0)==0){B=m}else{if((o|0)==0|(n|0)==0){B=m;break}else{C=o;D=n;E=m;F=p;G=q}while(1){H=oC(F,c[G>>2]|0,0)|0;if((H+1|0)>>>0<2>>>0){break}y=(c[h>>2]|0)+4|0;c[h>>2]=y;z=D-1|0;A=E+1|0;if((C|0)==(H|0)|(z|0)==0){B=A;break L10094}else{C=C-H|0;D=z;E=A;F=F+H|0;G=y}}if((H|0)!=0){B=-1;break}c[h>>2]=0;B=E}}while(0);if(!k){i=f;return B|0}c[b>>2]=c[h>>2];i=f;return B|0}function oE(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+8|0;g=f|0;if((b|0)==0){h=c[d>>2]|0;j=g|0;k=c[h>>2]|0;if((k|0)==0){l=0;i=f;return l|0}else{m=0;n=h;o=k}while(1){if(o>>>0>127>>>0){k=oC(j,o,0)|0;if((k|0)==-1){l=-1;p=8556;break}else{q=k}}else{q=1}k=q+m|0;h=n+4|0;r=c[h>>2]|0;if((r|0)==0){l=k;p=8553;break}else{m=k;n=h;o=r}}if((p|0)==8556){i=f;return l|0}else if((p|0)==8553){i=f;return l|0}}L10120:do{if(e>>>0>3>>>0){o=e;n=b;m=c[d>>2]|0;while(1){q=c[m>>2]|0;if((q|0)==0){s=o;t=n;break L10120}if(q>>>0>127>>>0){j=oC(n,q,0)|0;if((j|0)==-1){l=-1;break}u=n+j|0;v=o-j|0;w=m}else{a[n]=q&255;u=n+1|0;v=o-1|0;w=c[d>>2]|0}q=w+4|0;c[d>>2]=q;if(v>>>0>3>>>0){o=v;n=u;m=q}else{s=v;t=u;break L10120}}i=f;return l|0}else{s=e;t=b}}while(0);L10132:do{if((s|0)==0){x=0}else{b=g|0;u=s;v=t;w=c[d>>2]|0;while(1){m=c[w>>2]|0;if((m|0)==0){p=8547;break}if(m>>>0>127>>>0){n=oC(b,m,0)|0;if((n|0)==-1){l=-1;p=8550;break}if(n>>>0>u>>>0){p=8543;break}o=c[w>>2]|0;oC(v,o,0)|0;y=v+n|0;z=u-n|0;A=w}else{a[v]=m&255;y=v+1|0;z=u-1|0;A=c[d>>2]|0}m=A+4|0;c[d>>2]=m;if((z|0)==0){x=0;break L10132}else{u=z;v=y;w=m}}if((p|0)==8550){i=f;return l|0}else if((p|0)==8543){l=e-u|0;i=f;return l|0}else if((p|0)==8547){a[v]=0;x=u;break}}}while(0);c[d>>2]=0;l=e-x|0;i=f;return l|0}function oF(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function oG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((d|0)==0){return a|0}else{e=b;f=d;g=a}while(1){d=f-1|0;c[g>>2]=c[e>>2];if((d|0)==0){break}else{e=e+4|0;f=d;g=g+4|0}}return a|0}function oH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(e){return a|0}else{f=d}do{f=f-1|0;c[a+(f<<2)>>2]=c[b+(f<<2)>>2];}while((f|0)!=0);return a|0}else{if(e){return a|0}else{g=b;h=d;i=a}while(1){d=h-1|0;c[i>>2]=c[g>>2];if((d|0)==0){break}else{g=g+4|0;h=d;i=i+4|0}}return a|0}return 0}function oI(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;if((d|0)==0){return a|0}else{e=d;f=a}while(1){d=e-1|0;c[f>>2]=b;if((d|0)==0){break}else{e=d;f=f+4|0}}return a|0}function oJ(a){a=a|0;return}function oK(a){a=a|0;c[a>>2]=5128;return}function oL(a){a=a|0;pb(a);return}function oM(a){a=a|0;return}function oN(a){a=a|0;return 1736}function oO(a){a=a|0;oJ(a|0);return}function oP(a){a=a|0;return}function oQ(a){a=a|0;return}function oR(a){a=a|0;oJ(a|0);pb(a);return}function oS(a){a=a|0;oJ(a|0);pb(a);return}function oT(a){a=a|0;oJ(a|0);pb(a);return}function oU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=oY(b,12368,12352,-1)|0;b=h;if((h|0)==0){g=0;i=e;return g|0}j=f;pm(j|0,0,56)|0;c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;b8[c[(c[h>>2]|0)+28>>2]&31](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function oV(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function oW(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;b8[c[(c[g>>2]|0)+28>>2]&31](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function oX(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;b8[c[(c[j>>2]|0)+28>>2]&31](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;b8[c[(c[j>>2]|0)+28>>2]&31](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)!=0){m=8650;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=8647;break}}if((m|0)==8650){return}else if((m|0)==8647){return}}function oY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+56|0;g=f|0;h=c[a>>2]|0;j=a+(c[h-8>>2]|0)|0;k=c[h-4>>2]|0;h=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;e=g+16|0;b=g+20|0;a=g+24|0;l=g+28|0;m=g+32|0;n=g+40|0;o=(k|0)==(d|0);d=e;pm(d|0,0,39)|0;if(o){c[g+48>>2]=1;cl[c[(c[k>>2]|0)+20>>2]&31](h,g,j,j,1,0);i=f;return((c[a>>2]|0)==1?j:0)|0}b9[c[(c[k>>2]|0)+24>>2]&15](h,g,j,1,0);j=c[g+36>>2]|0;if((j|0)==0){if((c[n>>2]|0)!=1){p=0;i=f;return p|0}if((c[l>>2]|0)!=1){p=0;i=f;return p|0}p=(c[m>>2]|0)==1?c[b>>2]|0:0;i=f;return p|0}else if((j|0)==1){do{if((c[a>>2]|0)!=1){if((c[n>>2]|0)!=0){p=0;i=f;return p|0}if((c[l>>2]|0)!=1){p=0;i=f;return p|0}if((c[m>>2]|0)==1){break}else{p=0}i=f;return p|0}}while(0);p=c[e>>2]|0;i=f;return p|0}else{p=0;i=f;return p|0}return 0}function oZ(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L10314:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L10316:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;cl[c[(c[v>>2]|0)+20>>2]&31](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)!=0){x=t;y=r;break}do{if((a[m]&1)==0){z=t;A=r}else{if((a[l]&1)==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L10316}else{z=1;A=r;break}}if((c[p>>2]|0)==1){B=8698;break L10314}if((c[o>>2]&2|0)==0){B=8698;break L10314}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if(y){C=x;B=8697}else{D=x;B=8694}}else{D=0;B=8694}}while(0);do{if((B|0)==8694){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;if((c[d+36>>2]|0)!=1){C=D;B=8697;break}if((c[d+24>>2]|0)!=2){C=D;B=8697;break}a[d+54|0]=1;if(D){B=8698}else{B=8699}}}while(0);if((B|0)==8697){if(C){B=8698}else{B=8699}}if((B|0)==8699){c[i>>2]=4;return}else if((B|0)==8698){c[i>>2]=3;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}C=c[b+12>>2]|0;D=b+16+(C<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;b9[c[(c[y>>2]|0)+24>>2]&15](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((C|0)<=1){return}C=c[b+8>>2]|0;do{if((C&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((C&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)!=0){B=8727;break}if((c[b>>2]|0)==1){B=8725;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;b9[c[(c[w>>2]|0)+24>>2]&15](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<D>>>0){A=z}else{B=8733;break}}if((B|0)==8733){return}else if((B|0)==8725){return}else if((B|0)==8727){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)!=0){B=8728;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){B=8734;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;b9[c[(c[w>>2]|0)+24>>2]&15](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<D>>>0){i=z}else{B=8726;break}}if((B|0)==8734){return}else if((B|0)==8726){return}else if((B|0)==8728){return}}}while(0);G=d+54|0;F=e;C=x;while(1){if((a[G]&1)!=0){B=8731;break}x=c[C+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[C>>2]|0;b9[c[(c[i>>2]|0)+24>>2]&15](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=C+8|0;if(x>>>0<D>>>0){C=x}else{B=8735;break}}if((B|0)==8735){return}else if((B|0)==8731){return}}function o_(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;b9[c[(c[h>>2]|0)+24>>2]&15](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;cl[c[(c[l>>2]|0)+20>>2]&31](l,d,e,e,1,g);if((a[k]&1)==0){m=0;n=8754}else{if((a[j]&1)==0){m=1;n=8754}}L10416:do{if((n|0)==8754){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=8757;break}a[d+54|0]=1;if(m){break L10416}}else{n=8757}}while(0);if((n|0)==8757){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function o$(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function o0(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;cl[c[(c[p>>2]|0)+20>>2]&31](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L10465:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;do{if((a[p]&1)!=0){break L10465}do{if((a[i]&1)==0){if((a[k]&1)==0){break}if((c[q>>2]&1|0)==0){break L10465}}else{if((c[o>>2]|0)==1){break L10465}if((c[q>>2]&2|0)==0){break L10465}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;cl[c[(c[u>>2]|0)+20>>2]&31](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);s=s+8|0;}while(s>>>0<n>>>0)}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function o1(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;cl[c[(c[i>>2]|0)+20>>2]&31](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function o2(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function o3(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[3122]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=12528+(h<<2)|0;j=12528+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3122]=e&~(1<<g)}else{if(l>>>0<(c[3126]|0)>>>0){bS();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{bS();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3124]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=12528+(p<<2)|0;m=12528+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3122]=e&~(1<<r)}else{if(l>>>0<(c[3126]|0)>>>0){bS();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{bS();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3124]|0;if((l|0)!=0){q=c[3127]|0;d=l>>>3;l=d<<1;f=12528+(l<<2)|0;k=c[3122]|0;h=1<<d;do{if((k&h|0)==0){c[3122]=k|h;s=f;t=12528+(l+2<<2)|0}else{d=12528+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3126]|0)>>>0){s=g;t=d;break}bS();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3124]=m;c[3127]=e;n=i;return n|0}l=c[3123]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[12792+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3126]|0;if(r>>>0<i>>>0){bS();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){bS();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){bS();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){bS();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){bS();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{bS();return 0}}}while(0);L10632:do{if((e|0)!=0){f=d+28|0;i=12792+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3123]=c[3123]&~(1<<c[f>>2]);break L10632}else{if(e>>>0<(c[3126]|0)>>>0){bS();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L10632}}}while(0);if(v>>>0<(c[3126]|0)>>>0){bS();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3124]|0;if((f|0)!=0){e=c[3127]|0;i=f>>>3;f=i<<1;q=12528+(f<<2)|0;k=c[3122]|0;g=1<<i;do{if((k&g|0)==0){c[3122]=k|g;y=q;z=12528+(f+2<<2)|0}else{i=12528+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3126]|0)>>>0){y=l;z=i;break}bS();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3124]=p;c[3127]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[3123]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[12792+(A<<2)>>2]|0;L10680:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L10680}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[12792+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3124]|0)-g|0)>>>0){o=g;break}q=K;m=c[3126]|0;if(q>>>0<m>>>0){bS();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){bS();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){bS();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){bS();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){bS();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{bS();return 0}}}while(0);L10730:do{if((e|0)!=0){i=K+28|0;m=12792+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3123]=c[3123]&~(1<<c[i>>2]);break L10730}else{if(e>>>0<(c[3126]|0)>>>0){bS();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L10730}}}while(0);if(L>>>0<(c[3126]|0)>>>0){bS();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=12528+(e<<2)|0;r=c[3122]|0;j=1<<i;do{if((r&j|0)==0){c[3122]=r|j;O=m;P=12528+(e+2<<2)|0}else{i=12528+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3126]|0)>>>0){O=d;P=i;break}bS();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=12792+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3123]|0;l=1<<Q;if((m&l|0)==0){c[3123]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=9014;break}else{l=l<<1;m=j}}if((T|0)==9014){if(S>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[3126]|0;if(m>>>0<i>>>0){bS();return 0}if(j>>>0<i>>>0){bS();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[3124]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[3127]|0;if(S>>>0>15>>>0){R=J;c[3127]=R+o;c[3124]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[3124]=0;c[3127]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[3125]|0;if(o>>>0<J>>>0){S=J-o|0;c[3125]=S;J=c[3128]|0;K=J;c[3128]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[3110]|0)==0){J=bQ(30)|0;if((J-1&J|0)==0){c[3112]=J;c[3111]=J;c[3113]=-1;c[3114]=-1;c[3115]=0;c[3233]=0;c[3110]=(b5(0)|0)&-16^1431655768;break}else{bS();return 0}}}while(0);J=o+48|0;S=c[3112]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[3232]|0;do{if((O|0)!=0){P=c[3230]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L10822:do{if((c[3233]&4|0)==0){O=c[3128]|0;L10824:do{if((O|0)==0){T=9044}else{L=O;P=12936;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=9044;break L10824}else{P=M}}if((P|0)==0){T=9044;break}L=R-(c[3125]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=bG(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=9053}}while(0);do{if((T|0)==9044){O=bG(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[3111]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[3230]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[3232]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=bG($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=9053}}while(0);L10844:do{if((T|0)==9053){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=9064;break L10822}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[3112]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((bG(O|0)|0)==-1){bG(m|0)|0;W=Y;break L10844}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=9064;break L10822}}}while(0);c[3233]=c[3233]|4;ad=W;T=9061}else{ad=0;T=9061}}while(0);do{if((T|0)==9061){if(S>>>0>=2147483647>>>0){break}W=bG(S|0)|0;Z=bG(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=9064}}}while(0);do{if((T|0)==9064){ad=(c[3230]|0)+aa|0;c[3230]=ad;if(ad>>>0>(c[3231]|0)>>>0){c[3231]=ad}ad=c[3128]|0;L10864:do{if((ad|0)==0){S=c[3126]|0;if((S|0)==0|ab>>>0<S>>>0){c[3126]=ab}c[3234]=ab;c[3235]=aa;c[3237]=0;c[3131]=c[3110];c[3130]=-1;S=0;do{Y=S<<1;ac=12528+(Y<<2)|0;c[12528+(Y+3<<2)>>2]=ac;c[12528+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[3128]=ab+ae;c[3125]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[3129]=c[3114]}else{S=12936;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=9076;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==9076){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[3128]|0;Y=(c[3125]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[3128]=Z+ai;c[3125]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[3129]=c[3114];break L10864}}while(0);if(ab>>>0<(c[3126]|0)>>>0){c[3126]=ab}S=ab+aa|0;Y=12936;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=9086;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==9086){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[3128]|0)){J=(c[3125]|0)+K|0;c[3125]=J;c[3128]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[3127]|0)){J=(c[3124]|0)+K|0;c[3124]=J;c[3127]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L10909:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=12528+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[3126]|0)>>>0){bS();return 0}if((c[U+12>>2]|0)==(Z|0)){break}bS();return 0}}while(0);if((Q|0)==(U|0)){c[3122]=c[3122]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[3126]|0)>>>0){bS();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}bS();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[3126]|0)>>>0){bS();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){bS();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{bS();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=12792+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[3123]=c[3123]&~(1<<c[P>>2]);break L10909}else{if(m>>>0<(c[3126]|0)>>>0){bS();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L10909}}}while(0);if(an>>>0<(c[3126]|0)>>>0){bS();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=12528+(V<<2)|0;P=c[3122]|0;m=1<<J;do{if((P&m|0)==0){c[3122]=P|m;as=X;at=12528+(V+2<<2)|0}else{J=12528+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[3126]|0)>>>0){as=U;at=J;break}bS();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=12792+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[3123]|0;Q=1<<au;if((X&Q|0)==0){c[3123]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;m=c[aw>>2]|0;if((m|0)==0){T=9159;break}else{Q=Q<<1;X=m}}if((T|0)==9159){if(aw>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[aw>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[3126]|0;if(X>>>0<$>>>0){bS();return 0}if(m>>>0<$>>>0){bS();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=12936;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+(ay-47+aA)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=aa-40-aB|0;c[3128]=ab+aB;c[3125]=_;c[ab+(aB+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[3129]=c[3114];c[ac+4>>2]=27;c[W>>2]=c[3234];c[W+4>>2]=c[3235];c[W+8>>2]=c[3236];c[W+12>>2]=c[3237];c[3234]=ab;c[3235]=aa;c[3237]=0;c[3236]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<az>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<az>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=12528+(K<<2)|0;S=c[3122]|0;m=1<<W;do{if((S&m|0)==0){c[3122]=S|m;aC=Z;aD=12528+(K+2<<2)|0}else{W=12528+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[3126]|0)>>>0){aC=Q;aD=W;break}bS();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aE=0}else{if(_>>>0>16777215>>>0){aE=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aE=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=12792+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[3123]|0;Q=1<<aE;if((Z&Q|0)==0){c[3123]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=_<<aF;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aG=Z+16+(Q>>>31<<2)|0;m=c[aG>>2]|0;if((m|0)==0){T=9194;break}else{Q=Q<<1;Z=m}}if((T|0)==9194){if(aG>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[3126]|0;if(Z>>>0<m>>>0){bS();return 0}if(_>>>0<m>>>0){bS();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[3125]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[3125]=_;ad=c[3128]|0;Q=ad;c[3128]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(bH()|0)>>2]=12;n=0;return n|0}function o4(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3126]|0;if(b>>>0<e>>>0){bS()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){bS()}h=f&-8;i=a+(h-8)|0;j=i;L11081:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){bS()}if((n|0)==(c[3127]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3124]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=12528+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){bS()}if((c[k+12>>2]|0)==(n|0)){break}bS()}}while(0);if((s|0)==(k|0)){c[3122]=c[3122]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){bS()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}bS()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){bS()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){bS()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){bS()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{bS()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=12792+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3123]=c[3123]&~(1<<c[v>>2]);q=n;r=o;break L11081}else{if(p>>>0<(c[3126]|0)>>>0){bS()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L11081}}}while(0);if(A>>>0<(c[3126]|0)>>>0){bS()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3126]|0)>>>0){bS()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3126]|0)>>>0){bS()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){bS()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){bS()}do{if((e&2|0)==0){if((j|0)==(c[3128]|0)){B=(c[3125]|0)+r|0;c[3125]=B;c[3128]=q;c[q+4>>2]=B|1;if((q|0)!=(c[3127]|0)){return}c[3127]=0;c[3124]=0;return}if((j|0)==(c[3127]|0)){B=(c[3124]|0)+r|0;c[3124]=B;c[3127]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L11183:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=12528+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3126]|0)>>>0){bS()}if((c[u+12>>2]|0)==(j|0)){break}bS()}}while(0);if((g|0)==(u|0)){c[3122]=c[3122]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3126]|0)>>>0){bS()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}bS()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3126]|0)>>>0){bS()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3126]|0)>>>0){bS()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){bS()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{bS()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=12792+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3123]=c[3123]&~(1<<c[t>>2]);break L11183}else{if(f>>>0<(c[3126]|0)>>>0){bS()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L11183}}}while(0);if(E>>>0<(c[3126]|0)>>>0){bS()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3126]|0)>>>0){bS()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3126]|0)>>>0){bS()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3127]|0)){H=B;break}c[3124]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=12528+(d<<2)|0;A=c[3122]|0;E=1<<r;do{if((A&E|0)==0){c[3122]=A|E;I=e;J=12528+(d+2<<2)|0}else{r=12528+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3126]|0)>>>0){I=h;J=r;break}bS()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=12792+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3123]|0;d=1<<K;do{if((r&d|0)==0){c[3123]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=9371;break}else{A=A<<1;J=E}}if((N|0)==9371){if(M>>>0<(c[3126]|0)>>>0){bS()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[3126]|0;if(J>>>0<E>>>0){bS()}if(B>>>0<E>>>0){bS()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[3130]|0)-1|0;c[3130]=q;if((q|0)==0){O=12944}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3130]=-1;return}function o5(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=o3(b)|0;return d|0}if(b>>>0>4294967231>>>0){c[(bH()|0)>>2]=12;d=0;return d|0}if(b>>>0<11>>>0){e=16}else{e=b+11&-8}f=o6(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=o3(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;pl(f|0,a|0,e)|0;o4(a);d=f;return d|0}function o6(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3126]|0;if(g>>>0<j>>>0){bS();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){bS();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){bS();return 0}if((k|0)==0){if(b>>>0<256>>>0){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3112]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15>>>0){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;o7(g+b|0,k);n=a;return n|0}if((i|0)==(c[3128]|0)){k=(c[3125]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3128]=g+b;c[3125]=l;n=a;return n|0}if((i|0)==(c[3127]|0)){l=(c[3124]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15>>>0){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3124]=q;c[3127]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L11370:do{if(m>>>0<256>>>0){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=12528+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){bS();return 0}if((c[l+12>>2]|0)==(i|0)){break}bS();return 0}}while(0);if((k|0)==(l|0)){c[3122]=c[3122]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){bS();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}bS();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){bS();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){bS();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){bS();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{bS();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=12792+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3123]=c[3123]&~(1<<c[t>>2]);break L11370}else{if(s>>>0<(c[3126]|0)>>>0){bS();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L11370}}}while(0);if(y>>>0<(c[3126]|0)>>>0){bS();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3126]|0)>>>0){bS();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16>>>0){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;o7(g+b|0,q);n=a;return n|0}return 0}function o7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L11446:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3126]|0;if(i>>>0<l>>>0){bS()}if((j|0)==(c[3127]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3124]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256>>>0){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=12528+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){bS()}if((c[p+12>>2]|0)==(j|0)){break}bS()}}while(0);if((q|0)==(p|0)){c[3122]=c[3122]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){bS()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}bS()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){bS()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){bS()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){bS()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{bS()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=12792+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3123]=c[3123]&~(1<<c[t>>2]);n=j;o=k;break L11446}else{if(m>>>0<(c[3126]|0)>>>0){bS()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L11446}}}while(0);if(y>>>0<(c[3126]|0)>>>0){bS()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3126]|0)>>>0){bS()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3126]|0)>>>0){bS()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3126]|0;if(e>>>0<a>>>0){bS()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3128]|0)){A=(c[3125]|0)+o|0;c[3125]=A;c[3128]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3127]|0)){return}c[3127]=0;c[3124]=0;return}if((f|0)==(c[3127]|0)){A=(c[3124]|0)+o|0;c[3124]=A;c[3127]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L11546:do{if(z>>>0<256>>>0){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=12528+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){bS()}if((c[g+12>>2]|0)==(f|0)){break}bS()}}while(0);if((t|0)==(g|0)){c[3122]=c[3122]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){bS()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}bS()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){bS()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){bS()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){bS()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{bS()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=12792+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3123]=c[3123]&~(1<<c[l>>2]);break L11546}else{if(m>>>0<(c[3126]|0)>>>0){bS()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L11546}}}while(0);if(C>>>0<(c[3126]|0)>>>0){bS()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3126]|0)>>>0){bS()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3126]|0)>>>0){bS()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3127]|0)){F=A;break}c[3124]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256>>>0){z=o<<1;y=12528+(z<<2)|0;C=c[3122]|0;b=1<<o;do{if((C&b|0)==0){c[3122]=C|b;G=y;H=12528+(z+2<<2)|0}else{o=12528+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3126]|0)>>>0){G=d;H=o;break}bS()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215>>>0){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=12792+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3123]|0;z=1<<I;if((o&z|0)==0){c[3123]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=9651;break}else{I=I<<1;J=G}}if((L|0)==9651){if(K>>>0<(c[3126]|0)>>>0){bS()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[3126]|0;if(J>>>0<I>>>0){bS()}if(L>>>0<I>>>0){bS()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function o8(a){a=a|0;var b=0,d=0,e=0;b=(a|0)==0?1:a;while(1){d=o3(b)|0;if((d|0)!=0){e=9695;break}a=(I=c[4104]|0,c[4104]=I+0,I);if((a|0)==0){break}ci[a&1]()}if((e|0)==9695){return d|0}d=bZ(4)|0;c[d>>2]=5096;bs(d|0,10824,36);return 0}function o9(a,b){a=a|0;b=b|0;return o8(a)|0}function pa(a){a=a|0;return o8(a)|0}function pb(a){a=a|0;if((a|0)==0){return}o4(a);return}function pc(a,b){a=a|0;b=b|0;pb(a);return}function pd(a){a=a|0;pb(a);return}function pe(a){a=a|0;pb(a);return}function pf(a){a=a|0;return}function pg(a){a=a|0;return 2104}function ph(){var a=0;a=bZ(4)|0;c[a>>2]=5096;bs(a|0,10824,36)}function pi(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0.0,w=0,x=0,y=0,z=0.0,A=0.0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0,P=0,Q=0.0,R=0.0,S=0.0;e=b;while(1){f=e+1|0;if((aO(a[e]|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==43){i=f;j=0}else if((g<<24>>24|0)==45){i=f;j=1}else{i=e;j=0}e=-1;f=0;g=i;while(1){k=a[g]|0;if(((k<<24>>24)-48|0)>>>0<10>>>0){l=e}else{if(k<<24>>24!=46|(e|0)>-1){break}else{l=f}}e=l;f=f+1|0;g=g+1|0}l=g+(-f|0)|0;i=(e|0)<0;m=((i^1)<<31>>31)+f|0;n=(m|0)>18;o=(n?-18:-m|0)+(i?f:e)|0;e=n?18:m;do{if((e|0)==0){p=b;q=0.0}else{if((e|0)>9){m=l;n=e;f=0;while(1){i=a[m]|0;r=m+1|0;if(i<<24>>24==46){s=a[r]|0;t=m+2|0}else{s=i;t=r}u=(f*10|0)-48+(s<<24>>24)|0;r=n-1|0;if((r|0)>9){m=t;n=r;f=u}else{break}}v=+(u|0)*1.0e9;w=9;x=t;y=9731}else{if((e|0)>0){v=0.0;w=e;x=l;y=9731}else{z=0.0;A=0.0}}if((y|0)==9731){f=x;n=w;m=0;while(1){r=a[f]|0;i=f+1|0;if(r<<24>>24==46){B=a[i]|0;C=f+2|0}else{B=r;C=i}D=(m*10|0)-48+(B<<24>>24)|0;i=n-1|0;if((i|0)>0){f=C;n=i;m=D}else{break}}z=+(D|0);A=v}E=A+z;do{if((k<<24>>24|0)==69|(k<<24>>24|0)==101){m=g+1|0;n=a[m]|0;if((n<<24>>24|0)==45){F=g+2|0;G=1}else if((n<<24>>24|0)==43){F=g+2|0;G=0}else{F=m;G=0}m=a[F]|0;if(((m<<24>>24)-48|0)>>>0<10>>>0){H=F;I=0;J=m}else{K=0;L=F;M=G;break}while(1){m=(I*10|0)-48+(J<<24>>24)|0;n=H+1|0;f=a[n]|0;if(((f<<24>>24)-48|0)>>>0<10>>>0){H=n;I=m;J=f}else{K=m;L=n;M=G;break}}}else{K=0;L=g;M=0}}while(0);n=o+((M|0)==0?K:-K|0)|0;m=(n|0)<0?-n|0:n;if((m|0)>511){c[(bH()|0)>>2]=34;N=1.0;O=8;P=511;y=9748}else{if((m|0)==0){Q=1.0}else{N=1.0;O=8;P=m;y=9748}}if((y|0)==9748){while(1){y=0;if((P&1|0)==0){R=N}else{R=N*+h[O>>3]}m=P>>1;if((m|0)==0){Q=R;break}else{N=R;O=O+8|0;P=m;y=9748}}}if((n|0)>-1){p=L;q=E*Q;break}else{p=L;q=E/Q;break}}}while(0);if((d|0)!=0){c[d>>2]=p}if((j|0)==0){S=q;return+S}S=-0.0-q;return+S}function pj(a,b,c){a=a|0;b=b|0;c=c|0;return+(+pi(a,b))}function pk(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function pl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function pm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function pn(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{pl(b,c,d)|0}return b|0}function po(a){a=a|0;if((a|0)<65)return a|0;if((a|0)>90)return a|0;return a-65+97|0}function pp(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(K=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function pq(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(K=e,a-c>>>0|0)|0}function pr(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}K=a<<c-32;return 0}function ps(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=0;return b>>>c-32|0}function pt(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){K=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}K=(b|0)<0?-1:0;return b>>c-32|0}function pu(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function pv(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function pw(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ag(d,c)|0;f=a>>>16;a=(e>>>16)+(ag(d,f)|0)|0;d=b>>>16;b=ag(d,c)|0;return(K=(a>>>16)+(ag(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function px(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=pq(e^a,f^b,e,f)|0;b=K;a=g^e;e=h^f;f=pq((pC(i,b,pq(g^c,h^d,g,h)|0,K,0)|0)^a,K^e,a,e)|0;return(K=K,f)|0}function py(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=pq(h^a,j^b,h,j)|0;b=K;a=pq(k^d,l^e,k,l)|0;pC(m,b,a,K,g)|0;a=pq(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=K;i=f;return(K=j,a)|0}function pz(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=pw(e,a)|0;f=K;return(K=(ag(b,a)|0)+(ag(d,e)|0)+f|f&0,c|0|0)|0}function pA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=pC(a,b,c,d,0)|0;return(K=K,e)|0}function pB(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;pC(a,b,d,e,g)|0;i=f;return(K=c[g+4>>2]|0,c[g>>2]|0)|0}
function cp(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function cq(){return i|0}function cr(a){a=a|0;i=a}function cs(a,b){a=a|0;b=b|0;if((x|0)==0){x=a;y=b}}function ct(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function cu(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function cv(a){a=a|0;K=a}function cw(a){a=a|0;L=a}function cx(a){a=a|0;M=a}function cy(a){a=a|0;N=a}function cz(a){a=a|0;O=a}function cA(a){a=a|0;P=a}function cB(a){a=a|0;Q=a}function cC(a){a=a|0;R=a}function cD(a){a=a|0;S=a}function cE(a){a=a|0;T=a}function cF(){c[2702]=p+8;c[2704]=p+8;c[2706]=q+8;c[2710]=q+8;c[2714]=q+8;c[2718]=q+8;c[2722]=q+8;c[2726]=p+8;c[2760]=q+8;c[2764]=q+8;c[2828]=q+8;c[2832]=q+8;c[2852]=p+8;c[2854]=q+8;c[2890]=q+8;c[2894]=q+8;c[2930]=q+8;c[2934]=q+8;c[2954]=p+8;c[2956]=p+8;c[2958]=q+8;c[2962]=q+8;c[2966]=q+8;c[2970]=p+8;c[2972]=p+8;c[2974]=p+8;c[2976]=p+8;c[2978]=p+8;c[2980]=p+8;c[2982]=p+8;c[3008]=q+8;c[3012]=p+8;c[3014]=q+8;c[3018]=q+8;c[3022]=q+8;c[3026]=p+8;c[3028]=p+8;c[3030]=p+8;c[3032]=p+8;c[3066]=p+8;c[3068]=p+8;c[3070]=p+8;c[3072]=q+8;c[3076]=q+8;c[3080]=q+8;c[3084]=q+8;c[3088]=q+8;c[3092]=q+8;c[3096]=p+8}function cG(){return 1752}function cH(){var b=0,d=0,e=0,f=0,g=0;c[3108]=-1;b=o9(48,15040)|0;if((b|0)==0){d=0;return d|0}e=b;f=b+20|0;pm(b|0,0,20)|0;c[b+24>>2]=0;c[b+28>>2]=0;a[b+32|0]=52;a[b+33|0]=0;g=b+36|0;pm(g|0,0,12)|0;c[f>>2]=0;d=e;return d|0}function cI(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==0){d=-1;return d|0}e=c[b+4>>2]|0;if((e|0)!=0){dO(e);pb(e)}e=c[b>>2]|0;if((e|0)!=0){f=e+16|0;g=c[f>>2]|0;if((g|0)!=0){h=e+20|0;i=c[h>>2]|0;if((g|0)==(i|0)){j=g}else{k=i;while(1){i=k-12|0;c[h>>2]=i;l=c[i>>2]|0;if((l|0)==0){m=i}else{i=k-12+4|0;if((l|0)!=(c[i>>2]|0)){c[i>>2]=l}pb(l);m=c[h>>2]|0}if((g|0)==(m|0)){break}else{k=m}}j=c[f>>2]|0}pb(j)}pb(e)}if((a[b+36|0]&1)!=0){pb(c[b+44>>2]|0)}pb(b);d=0;return d|0}function cJ(a){a=a|0;var b=0;if((a|0)==0){b=1}else{b=c[a+8>>2]|0}return b|0}function cK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+8|0;if((a|0)==0){f=-1;i=e;return f|0}do{if((b|0)!=0){g=c[b+4>>2]|0;if((g|0)<3){break}h=c[b+8>>2]|0;if((h|0)<3){break}if((2147483647/(h|0)|0|0)<(g|0)){break}if((c[b+12>>2]|0)>>>0>=3>>>0){break}g=o8(32)|0;c5(g,b,d);h=a+4|0;j=c[h>>2]|0;if((j|0)!=0){dO(j);pb(j);c[h>>2]=0}h=a|0;j=c[h>>2]|0;if((j|0)!=0){k=j+16|0;l=c[k>>2]|0;if((l|0)!=0){m=j+20|0;n=c[m>>2]|0;if((l|0)==(n|0)){o=l}else{p=n;while(1){n=p-12|0;c[m>>2]=n;q=c[n>>2]|0;if((q|0)==0){r=n}else{n=p-12+4|0;if((q|0)!=(c[n>>2]|0)){c[n>>2]=q}pb(q);r=c[m>>2]|0}if((l|0)==(r|0)){break}else{p=r}}o=c[k>>2]|0}pb(o)}pb(j)}c[h>>2]=g;f=0;i=e;return f|0}}while(0);c[a+8>>2]=1;f=-1;i=e;return f|0}function cL(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+8|0;if((b|0)==0){g=-1;i=f;return g|0}do{if((d|0)!=0){if((a[d]|0)==0){break}if((aX(d|0,4608)|0)==0){h=c[o>>2]|0}else{h=bw(d|0,4600)|0}if((h|0)==0){break}j=o8(32)|0;c2(j,h,e);k=b+4|0;l=c[k>>2]|0;if((l|0)!=0){dO(l);pb(l);c[k>>2]=0}k=b|0;l=c[k>>2]|0;if((l|0)!=0){m=l+16|0;n=c[m>>2]|0;if((n|0)!=0){p=l+20|0;q=c[p>>2]|0;if((n|0)==(q|0)){r=n}else{s=q;while(1){q=s-12|0;c[p>>2]=q;t=c[q>>2]|0;if((t|0)==0){u=q}else{q=s-12+4|0;if((t|0)!=(c[q>>2]|0)){c[q>>2]=t}pb(t);u=c[p>>2]|0}if((n|0)==(u|0)){break}else{s=u}}r=c[m>>2]|0}pb(r)}pb(l)}c[k>>2]=j;s=0;aG(h|0)|0;g=s;i=f;return g|0}}while(0);c[b+8>>2]=1;g=-1;i=f;return g|0}function cM(b,d){b=b|0;d=d|0;var e=0;if((b|0)==0){e=-1;return e|0}if((c[b>>2]|0)==0){c[b+8>>2]=3;e=-1;return e|0}else{a[b+33|0]=d&1;e=0;return e|0}return 0}function cN(a,b){a=a|0;b=b|0;var d=0,e=0;if((a|0)==0){d=-1;return d|0}e=c[a>>2]|0;if((e|0)==0){c[a+8>>2]=3;d=-1;return d|0}if((b+1|0)>>>0>256>>>0){c[a+8>>2]=1;d=-1;return d|0}else{c8(e,b);d=0;return d|0}return 0}function cO(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;do{if((a|0)==0){d=-1}else{e=c[a>>2]|0;if((e|0)==0){c[a+8>>2]=3;d=-1;break}f=dd(e,b)|0;e=(f^1)<<31>>31;if(f){d=e;break}else{g=e}c[a+8>>2]=1;d=g}}while(0);return d|0}function cP(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=-1;return d|0}e=c[a>>2]|0;if((e|0)==0){c[a+8>>2]=3;d=-1;return d|0}f=o9(40,15040)|0;if((f|0)==0){c[a+8>>2]=2;d=-1;return d|0}g=f;dN(g,e,12480,a+12|0,b);b=a+4|0;a=c[b>>2]|0;if((a|0)!=0){dO(a);pb(a)}c[b>>2]=g;d=0;return d|0}function cQ(a){a=a|0;var b=0,d=0;if((a|0)==0){b=-1;return b|0}do{if((c[a>>2]|0)!=0){d=c[a+4>>2]|0;if((d|0)==0){break}b=(c[d+32>>2]|0)-(c[d+28>>2]|0)>>2;return b|0}}while(0);c[a+8>>2]=3;b=-1;return b|0}function cR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;if((a|0)==0){d=-1;return d|0}do{if((c[a>>2]|0)!=0){e=c[a+4>>2]|0;if((e|0)==0){break}do{if((b|0)>=0){if(((c[e+32>>2]|0)-(c[e+28>>2]|0)>>2|0)<=(b|0)){break}f=dP(e,b)|0;d=(c[f+20>>2]|0)-(c[f+16>>2]|0)>>2;return d|0}}while(0);c[a+8>>2]=1;d=-1;return d|0}}while(0);c[a+8>>2]=3;d=-1;return d|0}function cS(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((a|0)==0){b=-1;return b|0}do{if((c[a>>2]|0)!=0){d=a+4|0;e=c[d>>2]|0;if((e|0)==0){break}if(((c[e+32>>2]|0)-(c[e+28>>2]|0)|0)>0){f=0;g=0;h=e}else{b=0;return b|0}while(1){e=dP(h,g)|0;if(((c[e+20>>2]|0)-(c[e+16>>2]|0)|0)>0){e=f;i=0;while(1){j=eO(dP(c[d>>2]|0,g)|0,i)|0;k=((c[j+20>>2]|0)-(c[j+16>>2]|0)>>2)+e|0;j=i+1|0;l=dP(c[d>>2]|0,g)|0;if((j|0)<((c[l+20>>2]|0)-(c[l+16>>2]|0)>>2|0)){e=k;i=j}else{m=k;break}}}else{m=f}i=g+1|0;e=c[d>>2]|0;if((i|0)<((c[e+32>>2]|0)-(c[e+28>>2]|0)>>2|0)){f=m;g=i;h=e}else{b=m;break}}return b|0}}while(0);c[a+8>>2]=3;b=-1;return b|0}function cT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;if((a|0)==0){d=-1;return d|0}do{if((c[a>>2]|0)!=0){e=a+4|0;f=c[e>>2]|0;if((f|0)==0){break}do{if((b|0)>=0){if(((c[f+32>>2]|0)-(c[f+28>>2]|0)>>2|0)<=(b|0)){break}g=dP(f,b)|0;if(((c[g+20>>2]|0)-(c[g+16>>2]|0)|0)>0){h=0;i=0}else{d=0;return d|0}while(1){g=eO(dP(c[e>>2]|0,b)|0,i)|0;j=((c[g+20>>2]|0)-(c[g+16>>2]|0)>>2)+h|0;g=i+1|0;k=dP(c[e>>2]|0,b)|0;if((g|0)<((c[k+20>>2]|0)-(c[k+16>>2]|0)>>2|0)){h=j;i=g}else{d=j;break}}return d|0}}while(0);c[a+8>>2]=1;d=-1;return d|0}}while(0);c[a+8>>2]=3;d=-1;return d|0}function cU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((a|0)==0){e=-1;return e|0}do{if((c[a>>2]|0)!=0){f=a+4|0;g=c[f>>2]|0;if((g|0)==0){break}do{if((b|0)>=0){if(((c[g+32>>2]|0)-(c[g+28>>2]|0)>>2|0)<=(b|0)|(d|0)<0){break}h=dP(g,b)|0;if(((c[h+20>>2]|0)-(c[h+16>>2]|0)>>2|0)<=(d|0)){break}h=eO(dP(c[f>>2]|0,b)|0,d)|0;e=(c[h+20>>2]|0)-(c[h+16>>2]|0)>>2;return e|0}}while(0);c[a+8>>2]=1;e=-1;return e|0}}while(0);c[a+8>>2]=3;e=-1;return e|0}function cV(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;if((b|0)==0){f=0;return f|0}do{if((c[b>>2]|0)!=0){g=b+4|0;h=c[g>>2]|0;if((h|0)==0){break}do{if((d|0)>=0){if(((c[h+32>>2]|0)-(c[h+28>>2]|0)>>2|0)<=(d|0)|(e|0)<0){break}i=dP(h,d)|0;if(((c[i+20>>2]|0)-(c[i+16>>2]|0)>>2|0)<=(e|0)){break}i=eO(dP(c[g>>2]|0,d)|0,e)|0;j=b+36|0;k=j;l=j;if((a[l]&1)==0){a[k+1|0]=0;a[l]=0}else{a[c[b+44>>2]|0]=0;c[b+40>>2]=0}m=i+20|0;n=i+16|0;o=((c[m>>2]|0)-(c[n>>2]|0)|0)>0;do{if((a[b+33|0]&1)==0){if(!o){break}p=k+1|0;q=b+44|0;r=b+40|0;s=j|0;t=0;do{u=fv(fF(i,t)|0)|0;v=a[l]|0;if((v&1)==0){w=(v&255)>>>1;x=10}else{w=c[r>>2]|0;x=(c[s>>2]&-2)-1|0}if((w|0)==(x|0)){ib(j,x,1,x,x,0,0);y=a[l]|0}else{y=v}if((y&1)==0){a[l]=(w<<1)+2&255;z=p;A=w+1|0}else{v=c[q>>2]|0;B=w+1|0;c[r>>2]=B;z=v;A=B}a[z+w|0]=u;a[z+A|0]=0;t=t+1|0;}while((t|0)<((c[m>>2]|0)-(c[n>>2]|0)>>2|0))}else{if(o){C=0}else{break}do{t=fw(fF(i,C)|0)|0;h9(j,t,pk(t|0)|0)|0;C=C+1|0;}while((C|0)<((c[m>>2]|0)-(c[n>>2]|0)>>2|0))}}while(0);n=a[l]|0;if((n&1)==0){D=(n&255)>>>1;E=10}else{D=c[b+40>>2]|0;E=(c[j>>2]&-2)-1|0}if((D|0)==(E|0)){ib(j,E,1,E,E,0,0);F=a[l]|0}else{F=n}if((F&1)==0){a[l]=(D<<1)+2&255;G=k+1|0;H=D+1|0}else{n=c[b+44>>2]|0;m=D+1|0;c[b+40>>2]=m;G=n;H=m}a[G+D|0]=10;a[G+H|0]=0;if((a[l]&1)==0){f=k+1|0;return f|0}else{f=c[b+44>>2]|0;return f|0}}}while(0);c[b+8>>2]=1;f=0;return f|0}}while(0);c[b+8>>2]=3;f=0;return f|0}function cW(b){b=b|0;var d=0,e=0,f=0,g=0;if((b|0)==0){d=-1;return d|0}do{if((c[b>>2]|0)!=0){e=b+4|0;f=c[e>>2]|0;if((f|0)==0){break}if(((c[f+32>>2]|0)-(c[f+28>>2]|0)|0)<=0){d=0;return d|0}g=dP(f,0)|0;if(((c[g+20>>2]|0)-(c[g+16>>2]|0)|0)<=0){d=0;return d|0}g=fF(eO(dP(c[e>>2]|0,0)|0,0)|0,0)|0;if((c[g+32>>2]|0)==(c[g+28>>2]|0)){d=0;return d|0}e=(a[b+33|0]&1)==0;f=c[(fs(g,0)|0)>>2]|0;if(!e){d=f;return d|0}d=(fb(f)|0)&255;return d|0}}while(0);c[b+8>>2]=3;d=-1;return d|0}function cX(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;a[b+28|0]=1;a[b+29|0]=0;f=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;g=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;h=(f|0)>0;if(!e){if(!h){return}e=(g|0)>0;i=b+16|0;j=0;L324:while(1){if(e){k=0;do{l=c[i>>2]|0;m=a$(d|0)|0;if((m|0)==-1){n=325;break L324}else{o=0;p=m}while(1){q=p&255;if(q<<24>>24==35|o&q<<24>>24!=10){r=1}else{if((aO(p&255|0)|0)==0){break}else{r=0}}m=a$(d|0)|0;if((m|0)==-1){n=326;break L324}else{o=r;p=m}}if((q<<24>>24|0)==48){s=1}else if((q<<24>>24|0)==49){s=0}else{n=304;break L324}m=l+(j*12|0)+4|0;t=c[m>>2]|0;u=l+(j*12|0)+8|0;do{if((t|0)==(c[u>>2]|0)){v=l+(j*12|0)|0;w=c[v>>2]|0;x=t-w|0;y=x+1|0;if((y|0)<0){n=310;break L324}if(x>>>0>1073741822>>>0){z=2147483647;n=313}else{A=x<<1;B=A>>>0<y>>>0?y:A;if((B|0)==0){C=0;D=0}else{z=B;n=313}}if((n|0)==313){n=0;C=o8(z)|0;D=z}B=C+x|0;A=C+D|0;if((B|0)!=0){a[B]=s}B=C+y|0;pl(C|0,w|0,x)|0;c[v>>2]=C;c[m>>2]=B;c[u>>2]=A;if((w|0)==0){break}pb(w)}else{if((t|0)==0){E=0}else{a[t]=s;E=c[m>>2]|0}c[m>>2]=E+1}}while(0);k=k+1|0;}while((k|0)<(g|0))}k=j+1|0;if((k|0)<(f|0)){j=k}else{n=332;break}}if((n|0)==310){mE(0)}else if((n|0)==304){j=bZ(4)|0;c[j>>2]=2640;bs(j|0,12384,0)}else if((n|0)==325){F=bZ(4)|0;G=F;c[G>>2]=2696;bs(F|0,12384,0)}else if((n|0)==326){F=bZ(4)|0;G=F;c[G>>2]=2696;bs(F|0,12384,0)}else if((n|0)==332){return}}if(!h){return}h=b+16|0;if((g|0)>0){H=0}else{b=0;do{b=b+1|0;}while((b|0)<(f|0));return}L370:while(1){b=0;do{F=c[h>>2]|0;G=a$(d|0)|0;if((G|0)==-1){n=327;break L370}else{I=0;J=G}while(1){K=J&255;if(K<<24>>24==35|I&K<<24>>24!=10){L=1}else{if((aO(J&255|0)|0)==0){break}else{L=0}}G=a$(d|0)|0;if((G|0)==-1){n=328;break L370}else{I=L;J=G}}if((K<<24>>24|0)==49){M=1}else if((K<<24>>24|0)==48){M=0}else{n=321;break L370}G=F+(H*12|0)+4|0;j=c[G>>2]|0;E=F+(H*12|0)+8|0;do{if((j|0)==(c[E>>2]|0)){s=F+(H*12|0)|0;C=c[s>>2]|0;D=j-C|0;z=D+1|0;if((z|0)<0){n=322;break L370}if(D>>>0>1073741822>>>0){N=2147483647;n=288}else{q=D<<1;p=q>>>0<z>>>0?z:q;if((p|0)==0){O=0;P=0}else{N=p;n=288}}if((n|0)==288){n=0;O=o8(N)|0;P=N}p=O+D|0;q=O+P|0;if((p|0)!=0){a[p]=M}p=O+z|0;pl(O|0,C|0,D)|0;c[s>>2]=O;c[G>>2]=p;c[E>>2]=q;if((C|0)==0){break}pb(C)}else{if((j|0)==0){Q=0}else{a[j]=M;Q=c[G>>2]|0}c[G>>2]=Q+1}}while(0);b=b+1|0;}while((b|0)<(g|0));b=H+1|0;if((b|0)<(f|0)){H=b}else{n=330;break}}if((n|0)==321){H=bZ(4)|0;c[H>>2]=2640;bs(H|0,12384,0)}else if((n|0)==322){mE(0)}else if((n|0)==327){R=bZ(4)|0;S=R;c[S>>2]=2696;bs(R|0,12384,0)}else if((n|0)==328){R=bZ(4)|0;S=R;c[S>>2]=2696;bs(R|0,12384,0)}else if((n|0)==330){return}}function cY(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;a[b+28|0]=1;a[b+29|0]=0;f=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;g=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;h=(f|0)>0;if(e){if(!h){return}e=(g|0)>0;i=b+16|0;j=0;L413:while(1){if(e){k=0;while(1){l=a$(d|0)|0;if((l|0)==-1){m=365;break L413}if((k|0)<(g|0)){n=l&255;l=k;o=128;while(1){p=c[i>>2]|0;q=(n&o|0)!=0|0;r=p+(j*12|0)+4|0;s=c[r>>2]|0;t=p+(j*12|0)+8|0;do{if((s|0)==(c[t>>2]|0)){u=p+(j*12|0)|0;v=c[u>>2]|0;w=s-v|0;x=w+1|0;if((x|0)<0){m=371;break L413}if(w>>>0>1073741822>>>0){y=2147483647;m=374}else{z=w<<1;A=z>>>0<x>>>0?x:z;if((A|0)==0){B=0;C=0}else{y=A;m=374}}if((m|0)==374){m=0;B=o8(y)|0;C=y}A=B+w|0;z=B+C|0;if((A|0)!=0){a[A]=q}A=B+x|0;pl(B|0,v|0,w)|0;c[u>>2]=B;c[r>>2]=A;c[t>>2]=z;if((v|0)==0){break}pb(v)}else{if((s|0)==0){D=0}else{a[s]=q;D=c[r>>2]|0}c[r>>2]=D+1}}while(0);r=o>>>1;q=l+1|0;if((r|0)!=0&(q|0)<(g|0)){l=q;o=r}else{E=q;break}}}else{E=k}if((E|0)<(g|0)){k=E}else{break}}}k=j+1|0;if((k|0)<(f|0)){j=k}else{m=382;break}}if((m|0)==365){j=bZ(4)|0;c[j>>2]=2696;bs(j|0,12384,0)}else if((m|0)==371){mE(0)}else if((m|0)==382){return}}else{if(!h){return}h=(g|0)>0;j=b+16|0;b=0;L450:while(1){if(h){E=0;while(1){D=a$(d|0)|0;if((D|0)==-1){m=344;break L450}if((E|0)<(g|0)){B=D&255;D=E;C=128;while(1){y=c[j>>2]|0;i=(B&C|0)==0|0;e=y+(b*12|0)+4|0;k=c[e>>2]|0;o=y+(b*12|0)+8|0;do{if((k|0)==(c[o>>2]|0)){l=y+(b*12|0)|0;n=c[l>>2]|0;q=k-n|0;r=q+1|0;if((r|0)<0){m=350;break L450}if(q>>>0>1073741822>>>0){F=2147483647;m=353}else{s=q<<1;t=s>>>0<r>>>0?r:s;if((t|0)==0){G=0;H=0}else{F=t;m=353}}if((m|0)==353){m=0;G=o8(F)|0;H=F}t=G+q|0;s=G+H|0;if((t|0)!=0){a[t]=i}t=G+r|0;pl(G|0,n|0,q)|0;c[l>>2]=G;c[e>>2]=t;c[o>>2]=s;if((n|0)==0){break}pb(n)}else{if((k|0)==0){I=0}else{a[k]=i;I=c[e>>2]|0}c[e>>2]=I+1}}while(0);e=C>>>1;i=D+1|0;if((e|0)!=0&(i|0)<(g|0)){D=i;C=e}else{J=i;break}}}else{J=E}if((J|0)<(g|0)){E=J}else{break}}}E=b+1|0;if((E|0)<(f|0)){b=E}else{m=384;break}}if((m|0)==344){b=bZ(4)|0;c[b>>2]=2696;bs(b|0,12384,0)}else if((m|0)==350){mE(0)}else if((m|0)==384){return}}}function cZ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=c_(d)|0;if((f|0)==0){g=bZ(4)|0;c[g>>2]=1952;bs(g|0,12384,0)}g=(f|0)>255;h=g?-1:f&255;a[b+28|0]=h;a[b+29|0]=(h&255)>>>1;h=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;i=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;if((h|0)<=0){return}j=(i|0)>0;k=b+16|0;b=0;L490:while(1){if(j){l=0;do{m=c_(d)|0;if((m|0)>(f|0)){n=392;break L490}o=e?f-m|0:m;if(g){p=((o*255|0|0)/(f|0)|0)&255}else{p=o&255}o=c[k>>2]|0;m=o+(b*12|0)+4|0;q=c[m>>2]|0;r=o+(b*12|0)+8|0;do{if((q|0)==(c[r>>2]|0)){s=o+(b*12|0)|0;t=c[s>>2]|0;u=q-t|0;v=u+1|0;if((v|0)<0){n=400;break L490}if(u>>>0>1073741822>>>0){w=2147483647;n=403}else{x=u<<1;y=x>>>0<v>>>0?v:x;if((y|0)==0){z=0;A=0}else{w=y;n=403}}if((n|0)==403){n=0;z=o8(w)|0;A=w}y=z+u|0;x=z+A|0;if((y|0)!=0){a[y]=p}y=z+v|0;pl(z|0,t|0,u)|0;c[s>>2]=z;c[m>>2]=y;c[r>>2]=x;if((t|0)==0){break}pb(t)}else{if((q|0)==0){B=0}else{a[q]=p;B=c[m>>2]|0}c[m>>2]=B+1}}while(0);l=l+1|0;}while((l|0)<(i|0))}l=b+1|0;if((l|0)<(h|0)){b=l}else{n=412;break}}if((n|0)==400){mE(0)}else if((n|0)==392){b=bZ(4)|0;c[b>>2]=3328;bs(b|0,12384,0)}else if((n|0)==412){return}}function c_(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;b=a$(a|0)|0;if((b|0)==-1){d=bZ(4)|0;e=d;c[e>>2]=2696;bs(d|0,12384,0);return 0}else{f=0;g=b}while(1){h=g&255;if(h<<24>>24==35|f&h<<24>>24!=10){i=1}else{j=g&255;if((aO(j|0)|0)==0){break}else{i=0}}b=a$(a|0)|0;if((b|0)==-1){k=429;break}else{f=i;g=b}}if((k|0)==429){d=bZ(4)|0;e=d;c[e>>2]=2696;bs(d|0,12384,0);return 0}if((j-48|0)>>>0<10>>>0){l=0;m=h}else{h=bZ(4)|0;c[h>>2]=2952;bs(h|0,12384,0);return 0}L534:while(1){h=m&255;if(((-2147483601-h|0)/10|0|0)<(l|0)){k=421;break}n=h-48+(l*10|0)|0;h=0;while(1){o=a$(a|0)|0;if((o|0)==-1){k=424;break L534}p=o&255;if(p<<24>>24==35|h&p<<24>>24!=10){h=1}else{break}}if(((o&255)-48|0)>>>0<10>>>0){l=n;m=p}else{k=427;break}}if((k|0)==421){p=bZ(4)|0;c[p>>2]=2792;bs(p|0,12384,0);return 0}else if((k|0)==424){p=bZ(4)|0;c[p>>2]=2696;bs(p|0,12384,0);return 0}else if((k|0)==427){return n|0}return 0}function c$(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=c_(d)|0;if((f|0)==0){g=bZ(4)|0;c[g>>2]=1952;bs(g|0,12384,0)}if((f|0)>255){g=bZ(4)|0;c[g>>2]=2552;bs(g|0,12384,0)}g=b+28|0;a[g]=f&255;a[b+29|0]=f>>>1&127;f=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;h=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;if((f|0)<=0){return}i=(h|0)>0;j=b+16|0;b=0;L555:while(1){if(i){k=0;do{l=a$(d|0)|0;if((l|0)==-1){m=438;break L555}n=l&255;l=a[g]|0;if((n&255)>>>0>(l&255)>>>0){m=440;break L555}o=e?l-n&255:n;n=c[j>>2]|0;l=n+(b*12|0)+4|0;p=c[l>>2]|0;q=n+(b*12|0)+8|0;do{if((p|0)==(c[q>>2]|0)){r=n+(b*12|0)|0;s=c[r>>2]|0;t=p-s|0;u=t+1|0;if((u|0)<0){m=446;break L555}if(t>>>0>1073741822>>>0){v=2147483647;m=449}else{w=t<<1;x=w>>>0<u>>>0?u:w;if((x|0)==0){y=0;z=0}else{v=x;m=449}}if((m|0)==449){m=0;y=o8(v)|0;z=v}x=y+t|0;w=y+z|0;if((x|0)!=0){a[x]=o}x=y+u|0;pl(y|0,s|0,t)|0;c[r>>2]=y;c[l>>2]=x;c[q>>2]=w;if((s|0)==0){break}pb(s)}else{if((p|0)==0){A=0}else{a[p]=o;A=c[l>>2]|0}c[l>>2]=A+1}}while(0);k=k+1|0;}while((k|0)<(h|0))}k=b+1|0;if((k|0)<(f|0)){b=k}else{m=458;break}}if((m|0)==440){b=bZ(4)|0;c[b>>2]=3328;bs(b|0,12384,0)}else if((m|0)==438){b=bZ(4)|0;c[b>>2]=2696;bs(b|0,12384,0)}else if((m|0)==458){return}else if((m|0)==446){mE(0)}}function c0(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=c_(d)|0;if((f|0)==0){g=bZ(4)|0;c[g>>2]=2056;bs(g|0,12384,0)}g=(f|0)>255;h=g?-1:f&255;a[b+28|0]=h;a[b+29|0]=(h&255)>>>1;h=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;i=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;if((h|0)<=0){return}j=(i|0)>0;k=b+16|0;b=0;L592:while(1){if(j){l=0;do{m=c_(d)|0;n=c_(d)|0;o=c_(d)|0;if((m|0)>(f|0)|(n|0)>(f|0)|(o|0)>(f|0)){p=465;break L592}if(e){q=(n|0)<(o|0)?o:n;r=f-((m|0)<(q|0)?q:m)|0}else{q=(o|0)<(n|0)?o:n;r=(q|0)<(m|0)?q:m}if(g){s=((r*255|0|0)/(f|0)|0)&255}else{s=r&255}m=c[k>>2]|0;q=m+(b*12|0)+4|0;n=c[q>>2]|0;o=m+(b*12|0)+8|0;do{if((n|0)==(c[o>>2]|0)){t=m+(b*12|0)|0;u=c[t>>2]|0;v=n-u|0;w=v+1|0;if((w|0)<0){p=476;break L592}if(v>>>0>1073741822>>>0){x=2147483647;p=479}else{y=v<<1;z=y>>>0<w>>>0?w:y;if((z|0)==0){A=0;B=0}else{x=z;p=479}}if((p|0)==479){p=0;A=o8(x)|0;B=x}z=A+v|0;y=A+B|0;if((z|0)!=0){a[z]=s}z=A+w|0;pl(A|0,u|0,v)|0;c[t>>2]=A;c[q>>2]=z;c[o>>2]=y;if((u|0)==0){break}pb(u)}else{if((n|0)==0){C=0}else{a[n]=s;C=c[q>>2]|0}c[q>>2]=C+1}}while(0);l=l+1|0;}while((l|0)<(i|0))}l=b+1|0;if((l|0)<(h|0)){b=l}else{p=488;break}}if((p|0)==488){return}else if((p|0)==465){b=bZ(4)|0;c[b>>2]=1768;bs(b|0,12384,0)}else if((p|0)==476){mE(0)}}function c1(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=c_(d)|0;if((f|0)==0){g=bZ(4)|0;c[g>>2]=2056;bs(g|0,12384,0)}if((f|0)>255){g=bZ(4)|0;c[g>>2]=1416;bs(g|0,12384,0)}g=b+28|0;a[g]=f&255;a[b+29|0]=f>>>1&127;f=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;h=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;if((f|0)<=0){return}i=(h|0)>0;j=b+16|0;b=0;L637:while(1){if(i){k=0;do{l=a$(d|0)|0;if((l|0)==-1){m=497;break L637}n=l&255;l=a$(d|0)|0;if((l|0)==-1){m=499;break L637}o=l&255;l=a$(d|0)|0;if((l|0)==-1){m=501;break L637}p=l&255;l=a[g]|0;if((n&255)>>>0>(l&255)>>>0|(o&255)>>>0>(l&255)>>>0|(p&255)>>>0>(l&255)>>>0){m=503;break L637}if(e){q=(o&255)>>>0<(p&255)>>>0?p:o;r=l-((n&255)>>>0<(q&255)>>>0?q:n)&255}else{q=(p&255)>>>0<(o&255)>>>0?p:o;r=(q&255)>>>0<(n&255)>>>0?q:n}n=c[j>>2]|0;q=n+(b*12|0)+4|0;o=c[q>>2]|0;p=n+(b*12|0)+8|0;do{if((o|0)==(c[p>>2]|0)){l=n+(b*12|0)|0;s=c[l>>2]|0;t=o-s|0;u=t+1|0;if((u|0)<0){m=512;break L637}if(t>>>0>1073741822>>>0){v=2147483647;m=515}else{w=t<<1;x=w>>>0<u>>>0?u:w;if((x|0)==0){y=0;z=0}else{v=x;m=515}}if((m|0)==515){m=0;y=o8(v)|0;z=v}x=y+t|0;w=y+z|0;if((x|0)!=0){a[x]=r}x=y+u|0;pl(y|0,s|0,t)|0;c[l>>2]=y;c[q>>2]=x;c[p>>2]=w;if((s|0)==0){break}pb(s)}else{if((o|0)==0){A=0}else{a[o]=r;A=c[q>>2]|0}c[q>>2]=A+1}}while(0);k=k+1|0;}while((k|0)<(h|0))}k=b+1|0;if((k|0)<(f|0)){b=k}else{m=524;break}}if((m|0)==512){mE(0)}else if((m|0)==503){b=bZ(4)|0;c[b>>2]=1768;bs(b|0,12384,0)}else if((m|0)==497){b=bZ(4)|0;c[b>>2]=2696;bs(b|0,12384,0)}else if((m|0)==499){b=bZ(4)|0;c[b>>2]=2696;bs(b|0,12384,0)}else if((m|0)==501){b=bZ(4)|0;c[b>>2]=2696;bs(b|0,12384,0)}else if((m|0)==524){return}}function c2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;f=a|0;dm(f,0,0,0,0);g=a+16|0;h=g|0;c[h>>2]=0;j=a+20|0;c[j>>2]=0;c[a+24>>2]=0;k=a$(b|0)|0;if((k|0)==-1){l=bZ(4)|0;c[l>>2]=2696;bs(l|0,12384,0)}do{if((k&255)<<24>>24==80){l=a$(b|0)|0;if((l|0)==-1){m=bZ(4)|0;c[m>>2]=2696;bs(m|0,12384,0)}m=((l&255)-49&255)>>>0<6>>>0?l&255:0;if((m|0)==0){break}l=c_(b)|0;if((l|0)==0){n=bZ(4)|0;c[n>>2]=848;bs(n|0,12384,0)}dt(f,l);l=c_(b)|0;if((l|0)==0){n=bZ(4)|0;c[n>>2]=512;bs(n|0,12384,0)}ds(f,l);l=a+8|0;n=a|0;o=(c[l>>2]|0)+1-(c[n>>2]|0)|0;do{if((o|0)>=3){p=a+12|0;q=a+4|0;s=(c[p>>2]|0)+1-(c[q>>2]|0)|0;if((s|0)<3){break}if((2147483647/(o|0)|0|0)<(s|0)){t=bZ(4)|0;c[t>>2]=4560;bs(t|0,12384,0)}t=c[j>>2]|0;u=c[h>>2]|0;v=(t-u|0)/12|0;do{if(v>>>0<s>>>0){c4(g,s-v|0);w=c[j>>2]|0}else{if(v>>>0<=s>>>0){w=t;break}x=u+(s*12|0)|0;if((x|0)==(t|0)){w=t;break}else{y=t}while(1){z=y-12|0;c[j>>2]=z;A=c[z>>2]|0;if((A|0)==0){B=z}else{z=y-12+4|0;if((A|0)!=(c[z>>2]|0)){c[z>>2]=A}pb(A);B=c[j>>2]|0}if((x|0)==(B|0)){w=x;break}else{y=B}}}}while(0);t=c[h>>2]|0;if((w|0)!=(t|0)){s=0;u=t;do{t=c[n>>2]|0;v=(c[l>>2]|0)+1|0;x=v-t|0;A=u+(s*12|0)+8|0;z=u+(s*12|0)|0;C=c[z>>2]|0;D=C;do{if(((c[A>>2]|0)-D|0)>>>0<x>>>0){E=u+(s*12|0)+4|0;F=(c[E>>2]|0)-D|0;if((v|0)==(t|0)){G=0}else{G=o8(x)|0}H=G+F|0;I=G+x|0;pl(G|0,C|0,F)|0;c[z>>2]=G;c[E>>2]=H;c[A>>2]=I;if((C|0)==0){break}pb(C)}}while(0);s=s+1|0;u=c[h>>2]|0;}while(s>>>0<(((c[j>>2]|0)-u|0)/12|0)>>>0)}switch(m|0){case 49:{cX(a,b,d);break};case 52:{cY(a,b,d);break};case 50:{cZ(a,b,d);break};case 53:{c$(a,b,d);break};case 51:{c0(a,b,d);break};case 54:{c1(a,b,d);break};default:{}}if((c[3108]|0)<=0){i=e;return}u=c[r>>2]|0;bT(u|0,4336,(s=i,i=i+8|0,c[s>>2]=m,s)|0)|0;i=s;C=(c[l>>2]|0)+1-(c[n>>2]|0)|0;A=(c[p>>2]|0)+1-(c[q>>2]|0)|0;bT(u|0,3848,(s=i,i=i+16|0,c[s>>2]=C,c[s+8>>2]=A,s)|0)|0;i=s;i=e;return}}while(0);n=bZ(4)|0;c[n>>2]=304;bs(n|0,12384,0)}}while(0);e=bZ(4)|0;c[e>>2]=1344;bs(e|0,12384,0)}function c3(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;f=i;if((e-49&255)>>>0>5>>>0){g=0;i=f;return g|0}h=a+8|0;j=a|0;k=(c[h>>2]|0)+1-(c[j>>2]|0)|0;l=a+12|0;m=a+4|0;n=(c[l>>2]|0)+1-(c[m>>2]|0)|0;bT(b|0,3520,(o=i,i=i+24|0,c[o>>2]=e<<24>>24,c[o+8>>2]=k,c[o+16>>2]=n,o)|0)|0;i=o;if((e<<24>>24|0)==52){n=c[m>>2]|0;if((n|0)>(c[l>>2]|0)){g=1;i=f;return g|0}k=a+16|0;p=a+29|0;q=n;while(1){n=c[j>>2]|0;r=c[h>>2]|0;do{if((n|0)<=(r|0)){s=0;t=-128;u=n;v=r;w=n;while(1){x=((d[(c[(c[k>>2]|0)+((q-(c[m>>2]|0)|0)*12|0)>>2]|0)+(u-w)|0]|0)>>>0<=(d[p]|0)>>>0?t:0)|s;y=(t&255)>>>1;if(y<<24>>24==0){z=x&255;aL(z|0,b|0)|0;A=-128;B=0;C=c[h>>2]|0}else{A=y;B=x;C=v}x=u+1|0;if((x|0)>(C|0)){break}s=B;t=A;u=x;v=C;w=c[j>>2]|0}if(A<<24>>24==-128){break}aL(B&255|0,b|0)|0}}while(0);n=q+1|0;if((n|0)>(c[l>>2]|0)){g=1;break}else{q=n}}i=f;return g|0}else if((e<<24>>24|0)==49){q=c[m>>2]|0;if((q|0)>(c[l>>2]|0)){g=1;i=f;return g|0}B=a+16|0;A=a+29|0;C=q;while(1){q=c[j>>2]|0;L824:do{if((q|0)<=(c[h>>2]|0)){p=q;k=q;while(1){aL(((d[(c[(c[B>>2]|0)+((C-(c[m>>2]|0)|0)*12|0)>>2]|0)+(p-k)|0]|0)>>>0<=(d[A]|0)>>>0?49:48)|0,b|0)|0;n=p+1|0;if((n|0)>(c[h>>2]|0)){break L824}p=n;k=c[j>>2]|0}}}while(0);aL(10,b|0)|0;q=C+1|0;if((q|0)>(c[l>>2]|0)){g=1;break}else{C=q}}i=f;return g|0}else{bT(b|0,3440,(o=i,i=i+8|0,c[o>>2]=d[a+28|0]|0,o)|0)|0;i=o;if((e<<24>>24|0)==54){C=c[m>>2]|0;A=c[l>>2]|0;if((C|0)>(A|0)){g=1;i=f;return g|0}B=a+16|0;q=C;C=c[h>>2]|0;k=A;while(1){A=c[j>>2]|0;if((A|0)>(C|0)){D=C;E=k}else{p=A;do{A=d[(c[(c[B>>2]|0)+(q*12|0)>>2]|0)+p|0]|0;bT(b|0,3088,(o=i,i=i+24|0,c[o>>2]=A,c[o+8>>2]=A,c[o+16>>2]=A,o)|0)|0;i=o;p=p+1|0;F=c[h>>2]|0;}while((p|0)<=(F|0));D=F;E=c[l>>2]|0}p=q+1|0;if((p|0)>(E|0)){g=1;break}else{q=p;C=D;k=E}}i=f;return g|0}else if((e<<24>>24|0)==51){E=c[m>>2]|0;if((E|0)>(c[l>>2]|0)){g=1;i=f;return g|0}k=a+16|0;D=E;while(1){E=c[j>>2]|0;C=c[h>>2]|0;q=c[(c[k>>2]|0)+(D*12|0)>>2]|0;if((E|0)<(C|0)){F=E;E=q;while(1){B=d[E+F|0]|0;bT(b|0,3176,(o=i,i=i+24|0,c[o>>2]=B,c[o+8>>2]=B,c[o+16>>2]=B,o)|0)|0;i=o;B=F+1|0;p=c[h>>2]|0;A=c[(c[k>>2]|0)+(D*12|0)>>2]|0;if((B|0)<(p|0)){F=B;E=A}else{G=p;H=A;break}}}else{G=C;H=q}E=d[H+G|0]|0;bT(b|0,3128,(o=i,i=i+24|0,c[o>>2]=E,c[o+8>>2]=E,c[o+16>>2]=E,o)|0)|0;i=o;E=D+1|0;if((E|0)>(c[l>>2]|0)){g=1;break}else{D=E}}i=f;return g|0}else if((e<<24>>24|0)==50){D=c[m>>2]|0;if((D|0)>(c[l>>2]|0)){g=1;i=f;return g|0}G=a+16|0;H=D;while(1){D=c[j>>2]|0;k=c[h>>2]|0;E=c[(c[G>>2]|0)+(H*12|0)>>2]|0;if((D|0)<(k|0)){F=D;D=E;while(1){bT(b|0,3320,(o=i,i=i+8|0,c[o>>2]=d[D+F|0]|0,o)|0)|0;i=o;A=F+1|0;p=c[h>>2]|0;B=c[(c[G>>2]|0)+(H*12|0)>>2]|0;if((A|0)<(p|0)){F=A;D=B}else{I=p;J=B;break}}}else{I=k;J=E}bT(b|0,3440,(o=i,i=i+8|0,c[o>>2]=d[J+I|0]|0,o)|0)|0;i=o;D=H+1|0;if((D|0)>(c[l>>2]|0)){g=1;break}else{H=D}}i=f;return g|0}else if((e<<24>>24|0)==53){e=c[m>>2]|0;m=c[l>>2]|0;if((e|0)>(m|0)){g=1;i=f;return g|0}H=a+16|0;a=e;e=c[h>>2]|0;o=m;while(1){m=c[j>>2]|0;if((m|0)>(e|0)){K=e;L=o}else{I=m;do{aL(d[(c[(c[H>>2]|0)+(a*12|0)>>2]|0)+I|0]|0|0,b|0)|0;I=I+1|0;M=c[h>>2]|0;}while((I|0)<=(M|0));K=M;L=c[l>>2]|0}I=a+1|0;if((I|0)>(L|0)){g=1;break}else{a=I;e=K;o=L}}i=f;return g|0}else{g=1;i=f;return g|0}}return 0}function c4(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if(((h-i|0)/12|0)>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;l=c[f>>2]|0}k=l+12|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b|0;b=c[j>>2]|0;k=(i-b|0)/12|0;i=k+d|0;if(i>>>0>357913941>>>0){mE(0)}l=(h-b|0)/12|0;if(l>>>0>178956969>>>0){m=357913941;n=658}else{b=l<<1;l=b>>>0<i>>>0?i:b;if((l|0)==0){o=0;p=0}else{m=l;n=658}}if((n|0)==658){o=o8(m*12|0)|0;p=m}m=o+(k*12|0)|0;k=d;d=m;do{if((d|0)==0){q=0}else{c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;q=d}d=q+12|0;k=k-1|0;}while((k|0)!=0);k=o+(p*12|0)|0;p=c[j>>2]|0;o=c[f>>2]|0;do{if((o|0)==(p|0)){c[j>>2]=m;c[f>>2]=d;c[e>>2]=k;r=p}else{q=o;l=m;L854:while(1){s=l-12|0;b=q-12|0;do{if((s|0)!=0){i=s|0;c[i>>2]=0;h=l-12+4|0;c[h>>2]=0;g=l-12+8|0;c[g>>2]=0;t=q-12+4|0;u=c[t>>2]|0;v=b|0;w=c[v>>2]|0;if((u|0)==(w|0)){break}x=u-w|0;if((x|0)<0){n=668;break L854}w=o8(x)|0;c[h>>2]=w;c[i>>2]=w;c[g>>2]=w+x;x=c[v>>2]|0;v=c[t>>2]|0;if((x|0)==(v|0)){break}else{y=x;z=w}do{if((z|0)==0){A=0}else{a[z]=a[y]|0;A=c[h>>2]|0}z=A+1|0;c[h>>2]=z;y=y+1|0;}while((y|0)!=(v|0))}}while(0);if((b|0)==(p|0)){break}else{q=b;l=s}}if((n|0)==668){mE(0)}l=c[j>>2]|0;q=c[f>>2]|0;c[j>>2]=s;c[f>>2]=d;c[e>>2]=k;if((l|0)==(q|0)){r=l;break}else{B=q}while(1){q=B-12|0;v=c[q>>2]|0;if((v|0)!=0){h=B-12+4|0;if((v|0)!=(c[h>>2]|0)){c[h>>2]=v}pb(v)}if((l|0)==(q|0)){r=l;break}else{B=q}}}}while(0);if((r|0)==0){return}pb(r);return}function c5(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0;dm(b|0,0,0,(c[d+8>>2]|0)-1|0,(c[d+4>>2]|0)-1|0);f=b+16|0;g=f|0;c[g>>2]=0;h=b+20|0;c[h>>2]=0;c[b+24>>2]=0;i=b+12|0;j=b+4|0;k=c[j>>2]|0;l=(c[i>>2]|0)+1|0;if((l|0)==(k|0)){m=0}else{c4(f,l-k|0);m=c[h>>2]|0}k=c[g>>2]|0;l=b+8|0;f=b|0;if((m|0)!=(k|0)){m=0;n=k;do{k=c[f>>2]|0;o=(c[l>>2]|0)+1|0;p=o-k|0;q=n+(m*12|0)+8|0;r=n+(m*12|0)|0;s=c[r>>2]|0;t=s;do{if(((c[q>>2]|0)-t|0)>>>0<p>>>0){u=n+(m*12|0)+4|0;v=(c[u>>2]|0)-t|0;if((o|0)==(k|0)){w=0}else{w=o8(p)|0}x=w+v|0;y=w+p|0;pl(w|0,s|0,v)|0;c[r>>2]=w;c[u>>2]=x;c[q>>2]=y;if((s|0)==0){break}pb(s)}}while(0);m=m+1|0;n=c[g>>2]|0;}while(m>>>0<(((c[h>>2]|0)-n|0)/12|0)>>>0)}n=(c[i>>2]|0)+1-(c[j>>2]|0)|0;j=(c[l>>2]|0)+1-(c[f>>2]|0)|0;f=c[d+12>>2]|0;if((f|0)==1){l=b+28|0;a[l]=-1;a[b+29|0]=127;i=(n|0)>0;if(e){if(!i){return}h=(j|0)>0;m=d|0;w=0;s=0;L940:while(1){L942:do{if(h){q=w;r=1;while(1){p=c[g>>2]|0;k=(a[l]|0)-(a[(c[m>>2]|0)+q|0]|0)&255;o=p+(s*12|0)+4|0;t=c[o>>2]|0;y=p+(s*12|0)+8|0;do{if((t|0)==(c[y>>2]|0)){x=p+(s*12|0)|0;u=c[x>>2]|0;v=t-u|0;z=v+1|0;if((z|0)<0){break L940}if(v>>>0>1073741822>>>0){A=2147483647;B=805}else{C=v<<1;D=C>>>0<z>>>0?z:C;if((D|0)==0){E=0;F=0}else{A=D;B=805}}if((B|0)==805){B=0;E=o8(A)|0;F=A}D=E+v|0;C=E+F|0;if((D|0)!=0){a[D]=k}D=E+z|0;pl(E|0,u|0,v)|0;c[x>>2]=E;c[o>>2]=D;c[y>>2]=C;if((u|0)==0){break}pb(u)}else{if((t|0)==0){G=0}else{a[t]=k;G=c[o>>2]|0}c[o>>2]=G+1}}while(0);o=q+1|0;if((r|0)>=(j|0)){H=o;break L942}q=o;r=r+1|0}}else{H=w}}while(0);r=s+1|0;if((r|0)<(n|0)){w=H;s=r}else{B=846;break}}if((B|0)==846){return}mE(0)}else{if(!i){return}i=(j|0)>0;s=d|0;H=0;w=0;L908:while(1){L910:do{if(i){G=H;E=1;while(1){F=c[g>>2]|0;A=(c[s>>2]|0)+G|0;m=F+(w*12|0)+4|0;l=c[m>>2]|0;h=F+(w*12|0)+8|0;do{if((l|0)==(c[h>>2]|0)){r=F+(w*12|0)|0;q=c[r>>2]|0;o=l-q|0;k=o+1|0;if((k|0)<0){break L908}if(o>>>0>1073741822>>>0){I=2147483647;B=787}else{t=o<<1;y=t>>>0<k>>>0?k:t;if((y|0)==0){J=0;K=0}else{I=y;B=787}}if((B|0)==787){B=0;J=o8(I)|0;K=I}y=J+o|0;t=J+K|0;if((y|0)!=0){a[y]=a[A]|0}y=J+k|0;pl(J|0,q|0,o)|0;c[r>>2]=J;c[m>>2]=y;c[h>>2]=t;if((q|0)==0){break}pb(q)}else{if((l|0)==0){L=0}else{a[l]=a[A]|0;L=c[m>>2]|0}c[m>>2]=L+1}}while(0);m=G+1|0;if((E|0)>=(j|0)){M=m;break L910}G=m;E=E+1|0}}else{M=H}}while(0);E=w+1|0;if((E|0)<(n|0)){H=M;w=E}else{B=845;break}}if((B|0)==845){return}mE(0)}}else if((f|0)==0){a[b+28|0]=1;a[b+29|0]=0;w=(n|0)>0;if(!e){if(!w){return}M=(j|0)>0;H=d|0;L=0;J=0;L974:while(1){L976:do{if(M){K=L;I=1;while(1){s=c[g>>2]|0;i=(a[(c[H>>2]|0)+K|0]|0)==0|0;E=s+(J*12|0)+4|0;G=c[E>>2]|0;m=s+(J*12|0)+8|0;do{if((G|0)==(c[m>>2]|0)){A=s+(J*12|0)|0;l=c[A>>2]|0;h=G-l|0;F=h+1|0;if((F|0)<0){break L974}if(h>>>0>1073741822>>>0){N=2147483647;B=761}else{q=h<<1;t=q>>>0<F>>>0?F:q;if((t|0)==0){O=0;P=0}else{N=t;B=761}}if((B|0)==761){B=0;O=o8(N)|0;P=N}t=O+h|0;q=O+P|0;if((t|0)!=0){a[t]=i}t=O+F|0;pl(O|0,l|0,h)|0;c[A>>2]=O;c[E>>2]=t;c[m>>2]=q;if((l|0)==0){break}pb(l)}else{if((G|0)==0){Q=0}else{a[G]=i;Q=c[E>>2]|0}c[E>>2]=Q+1}}while(0);E=K+1|0;if((I|0)>=(j|0)){R=E;break L976}K=E;I=I+1|0}}else{R=L}}while(0);I=J+1|0;if((I|0)<(n|0)){L=R;J=I}else{B=844;break}}if((B|0)==844){return}mE(0)}if(!w){return}w=d|0;if((j|0)>0){S=0;T=0}else{J=0;do{J=J+1|0;}while((J|0)<(n|0));return}L1010:while(1){J=S;R=1;while(1){L=c[g>>2]|0;Q=(a[(c[w>>2]|0)+J|0]|0)!=0|0;O=L+(T*12|0)+4|0;P=c[O>>2]|0;N=L+(T*12|0)+8|0;do{if((P|0)==(c[N>>2]|0)){H=L+(T*12|0)|0;M=c[H>>2]|0;I=P-M|0;K=I+1|0;if((K|0)<0){break L1010}if(I>>>0>1073741822>>>0){U=2147483647;B=742}else{E=I<<1;i=E>>>0<K>>>0?K:E;if((i|0)==0){V=0;W=0}else{U=i;B=742}}if((B|0)==742){B=0;V=o8(U)|0;W=U}i=V+I|0;E=V+W|0;if((i|0)!=0){a[i]=Q}i=V+K|0;pl(V|0,M|0,I)|0;c[H>>2]=V;c[O>>2]=i;c[N>>2]=E;if((M|0)==0){break}pb(M)}else{if((P|0)==0){X=0}else{a[P]=Q;X=c[O>>2]|0}c[O>>2]=X+1}}while(0);Y=J+1|0;if((R|0)>=(j|0)){break}J=Y;R=R+1|0}R=T+1|0;if((R|0)<(n|0)){S=Y;T=R}else{B=843;break}}if((B|0)==843){return}mE(0)}else if((f|0)==2){f=b+28|0;a[f]=-1;a[b+29|0]=127;if((n|0)<=0){return}b=(j|0)>0;T=d|0;d=0;Y=0;L1041:while(1){if(b){S=d;X=0;while(1){V=c[T>>2]|0;W=a[V+S|0]|0;U=a[V+(S+1)|0]|0;w=a[V+(S+2)|0]|0;if(e){V=(U&255)>>>0<(w&255)>>>0?w:U;Z=(a[f]|0)-((W&255)>>>0<(V&255)>>>0?V:W)&255}else{V=(w&255)>>>0<(U&255)>>>0?w:U;Z=(V&255)>>>0<(W&255)>>>0?V:W}W=c[g>>2]|0;V=W+(Y*12|0)+4|0;U=c[V>>2]|0;w=W+(Y*12|0)+8|0;do{if((U|0)==(c[w>>2]|0)){R=W+(Y*12|0)|0;J=c[R>>2]|0;O=U-J|0;Q=O+1|0;if((Q|0)<0){break L1041}if(O>>>0>1073741822>>>0){_=2147483647;B=828}else{P=O<<1;N=P>>>0<Q>>>0?Q:P;if((N|0)==0){$=0;aa=0}else{_=N;B=828}}if((B|0)==828){B=0;$=o8(_)|0;aa=_}N=$+O|0;P=$+aa|0;if((N|0)!=0){a[N]=Z}N=$+Q|0;pl($|0,J|0,O)|0;c[R>>2]=$;c[V>>2]=N;c[w>>2]=P;if((J|0)==0){break}pb(J)}else{if((U|0)==0){ab=0}else{a[U]=Z;ab=c[V>>2]|0}c[V>>2]=ab+1}}while(0);V=X+1|0;U=S+3|0;if((V|0)<(j|0)){S=U;X=V}else{ac=U;break}}}else{ac=d}X=Y+1|0;if((X|0)<(n|0)){d=ac;Y=X}else{B=848;break}}if((B|0)==848){return}mE(0)}else{return}}function c6(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;g=b|0;h=b;i=e;c[h>>2]=c[i>>2];c[h+4>>2]=c[i+4>>2];c[h+8>>2]=c[i+8>>2];c[h+12>>2]=c[i+12>>2];i=b+16|0;h=i|0;c[h>>2]=0;j=b+20|0;c[j>>2]=0;c[b+24>>2]=0;a[b+28|0]=a[e+28|0]|0;a[b+29|0]=a[e+29|0]|0;do{if((f|0)<2){k=852}else{if(((c[e+8>>2]|0)+1-(c[e>>2]|0)|0)<(f|0)){k=852;break}l=c[e+12>>2]|0;m=c[e+4>>2]|0;if((l+1-m|0)<(f|0)){k=852}else{n=l;o=m}}}while(0);if((k|0)==852){gM(3248);n=c[e+12>>2]|0;o=c[e+4>>2]|0}m=ag(f,f)|0;ds(g,(n+1-o|0)/(f|0)|0);dt(g,((c[e+8>>2]|0)+1-(c[e>>2]|0)|0)/(f|0)|0);g=b+12|0;o=b+4|0;n=(c[g>>2]|0)+1-(c[o>>2]|0)|0;l=c[j>>2]|0;p=c[h>>2]|0;q=(l-p|0)/12|0;do{if(q>>>0<n>>>0){c4(i,n-q|0)}else{if(q>>>0<=n>>>0){break}r=p+(n*12|0)|0;if((r|0)==(l|0)){break}else{s=l}while(1){t=s-12|0;c[j>>2]=t;u=c[t>>2]|0;if((u|0)==0){v=t}else{t=s-12+4|0;if((u|0)!=(c[t>>2]|0)){c[t>>2]=u}pb(u);v=c[j>>2]|0}if((r|0)==(v|0)){break}else{s=v}}}}while(0);if(((c[g>>2]|0)+1-(c[o>>2]|0)|0)<=0){return}v=b+8|0;s=b|0;b=e+16|0;e=0;j=c[v>>2]|0;l=c[s>>2]|0;L1099:while(1){n=ag(e,f)|0;p=n+f|0;q=c[h>>2]|0;i=j+1|0;r=i-l|0;u=q+(e*12|0)+8|0;t=q+(e*12|0)|0;w=c[t>>2]|0;x=w;do{if(((c[u>>2]|0)-x|0)>>>0<r>>>0){y=q+(e*12|0)+4|0;z=(c[y>>2]|0)-x|0;if((i|0)==(l|0)){A=0}else{A=o8(r)|0}B=A+z|0;C=A+r|0;pl(A|0,w|0,z)|0;c[t>>2]=A;c[y>>2]=B;c[u>>2]=C;if((w|0)==0){break}pb(w)}}while(0);w=c[h>>2]|0;u=c[v>>2]|0;t=c[s>>2]|0;if((u+1-t|0)>0){r=(f|0)>0;i=w+(e*12|0)+4|0;x=w+(e*12|0)+8|0;q=w+(e*12|0)|0;w=0;while(1){C=ag(w,f)|0;B=C+f|0;if(r){y=c[b>>2]|0;z=0;D=n;while(1){E=c[y+(D*12|0)>>2]|0;F=z;G=C;do{F=(d[E+G|0]|0)+F|0;G=G+1|0;}while((G|0)<(B|0));G=D+1|0;if((G|0)<(p|0)){z=F;D=G}else{H=F;break}}}else{H=0}D=((H|0)/(m|0)|0)&255;z=c[i>>2]|0;do{if((z|0)==(c[x>>2]|0)){B=c[q>>2]|0;C=z-B|0;y=C+1|0;if((y|0)<0){break L1099}if(C>>>0>1073741822>>>0){I=2147483647;k=900}else{G=C<<1;E=G>>>0<y>>>0?y:G;if((E|0)==0){J=0;K=0}else{I=E;k=900}}if((k|0)==900){k=0;J=o8(I)|0;K=I}E=J+C|0;G=J+K|0;if((E|0)!=0){a[E]=D}E=J+y|0;pl(J|0,B|0,C)|0;c[q>>2]=J;c[i>>2]=E;c[x>>2]=G;if((B|0)==0){break}pb(B)}else{if((z|0)==0){L=0}else{a[z]=D;L=c[i>>2]|0}c[i>>2]=L+1}}while(0);D=w+1|0;z=c[v>>2]|0;B=c[s>>2]|0;if((D|0)<(z+1-B|0)){w=D}else{M=z;N=B;break}}}else{M=u;N=t}w=e+1|0;if((w|0)<((c[g>>2]|0)+1-(c[o>>2]|0)|0)){e=w;j=M;l=N}else{k=909;break}}if((k|0)==909){return}mE(0)}function c7(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0.0,W=0.0,X=0,Y=0.0,Z=0.0,_=0.0,$=0.0,aa=0.0;if((e|0)==1){f=0;return f|0}g=e+1|0;if((g|0)==0){h=0}else{if(g>>>0>1073741823>>>0){mE(0);return 0}i=o8(g<<2)|0;j=g;k=i;while(1){if((k|0)==0){l=0}else{c[k>>2]=0;l=k}m=j-1|0;if((m|0)==0){h=i;break}else{j=m;k=l+4|0}}}l=b+4|0;k=c[l>>2]|0;j=b+12|0;i=c[j>>2]|0;if((k|0)<=(i|0)){m=a|0;a=c[b>>2]|0;n=c[b+8>>2]|0;o=k;do{if((a|0)<=(n|0)){k=c[m>>2]|0;p=a;do{q=h+((d[(c[k+(o*12|0)>>2]|0)+p|0]|0)<<2)|0;c[q>>2]=(c[q>>2]|0)+1;p=p+1|0;}while((p|0)<=(n|0))}o=o+1|0;}while((o|0)<=(i|0))}i=(g|0)!=0;if(i){o=o8(g<<2)|0;n=o;if((o|0)!=0){c[n>>2]=c[h>>2]}r=n;s=o;t=n+(g<<2)|0}else{n=o8(4)|0;o=n;if((n|0)!=0){c[o>>2]=c[h>>2]}r=o;s=n;t=n+4|0}n=s+4|0;if(i){i=o8(g<<3)|0;s=i;if((i|0)!=0){c[s>>2]=0;c[s+4>>2]=0}u=s;v=i;w=s+(g<<3)|0}else{g=o8(8)|0;s=g;if((g|0)!=0){c[s>>2]=0;c[s+4>>2]=0}u=s;v=g;w=g+8|0}do{if((e|0)<1){x=0;y=u;z=r}else{g=t;s=n;i=r;o=w;a=v+8|0;m=u;p=1;L1192:while(1){k=p-1|0;q=h+(p<<2)|0;A=(c[q>>2]|0)+(c[i+(k<<2)>>2]|0)|0;do{if((s|0)==(g|0)){B=s-i|0;C=B>>2;D=C+1|0;if(D>>>0>1073741823>>>0){E=950;break L1192}if(C>>>0>536870910>>>0){F=1073741823;E=954}else{G=B>>1;H=G>>>0<D>>>0?D:G;if((H|0)==0){I=0;J=0}else{F=H;E=954}}if((E|0)==954){E=0;I=o8(F<<2)|0;J=F}H=I+(C<<2)|0;C=I+(J<<2)|0;if((H|0)!=0){c[H>>2]=A}H=I+(D<<2)|0;D=I;G=i;pl(D|0,G|0,B)|0;if((i|0)==0){L=I;M=H;N=C;break}pb(G);L=I;M=H;N=C}else{if((s|0)!=0){c[s>>2]=A}L=i;M=s+4|0;N=g}}while(0);A=m+(k<<3)|0;C=ag(c[q>>2]|0,p)|0;H=pp(C,(C|0)<0|0?-1:0,c[A>>2]|0,c[A+4>>2]|0)|0;A=K;do{if((a|0)==(o|0)){C=a-m|0;G=C>>3;B=G+1|0;if(B>>>0>536870911>>>0){E=965;break L1192}if(G>>>0>268435454>>>0){O=536870911;E=969}else{D=C>>2;P=D>>>0<B>>>0?B:D;if((P|0)==0){Q=0;R=0}else{O=P;E=969}}if((E|0)==969){E=0;Q=o8(O<<3)|0;R=O}P=Q+(G<<3)|0;G=Q+(R<<3)|0;if((P|0)!=0){c[P>>2]=H;c[P+4>>2]=A}P=Q+(B<<3)|0;B=Q;D=m;pl(B|0,D|0,C)|0;if((m|0)==0){S=Q;T=P;U=G;break}pb(D);S=Q;T=P;U=G}else{if((a|0)!=0){c[a>>2]=H;c[a+4>>2]=A}S=m;T=a+8|0;U=o}}while(0);A=p+1|0;if((A|0)>(e|0)){E=981;break}else{g=N;s=M;i=L;o=U;a=T;m=S;p=A}}if((E|0)==981){p=S+(e<<3)|0;V=+((c[p>>2]|0)>>>0)+ +(c[p+4>>2]|0)*4294967296.0;if((e|0)<=0){x=0;y=S;z=L;break}p=b+8|0;m=b|0;W=0.0;a=0;o=0;while(1){i=c[L+(o<<2)>>2]|0;do{if((i|0)>0){s=ag((c[p>>2]|0)+1-(c[m>>2]|0)|0,(c[j>>2]|0)+1-(c[l>>2]|0)|0)|0;if((i|0)>=(s|0)){X=a;Y=W;break}g=S+(o<<3)|0;Z=+((c[g>>2]|0)>>>0)+ +(c[g+4>>2]|0)*4294967296.0;_=+(i|0);$=+(s-i|0);aa=Z/_-(V-Z)/$;Z=$*_*aa*aa;if(Z<=W){X=a;Y=W;break}X=o;Y=Z}else{X=a;Y=W}}while(0);i=o+1|0;if((i|0)<(e|0)){W=Y;a=X;o=i}else{x=X;y=S;z=L;break}}}else if((E|0)==950){mE(0);return 0}else if((E|0)==965){mE(0);return 0}}}while(0);if((y|0)!=0){pb(y)}if((z|0)!=0){pb(z)}if((h|0)==0){f=x;return f|0}pb(h);f=x;return f|0}function c8(b,c){b=b|0;c=c|0;if(c>>>0<256>>>0){a[b+29|0]=((ag(d[b+28|0]|0,c)|0)/255|0)&255;return}else{a[b+29|0]=(c7(b+16|0,b|0,d[b+28|0]|0)|0)&255;return}}function c9(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[g>>2];g=c[b>>2]|0;h=g;j=c[d>>2]|0;d=j;k=(d-h|0)/12|0;l=g+(k*12|0)|0;c[a>>2]=l;a=c[e>>2]|0;if((j|0)==(a|0)){i=f;return}j=((a-d|0)/12|0)+k|0;d=g+(j*12|0)|0;a=b+4|0;b=c[a>>2]|0;if((d|0)==(b|0)){m=l;n=d}else{e=k+(((b+(~j*12|0)+(-h|0)|0)>>>0)/12|0)+1|0;h=l;l=d;while(1){if((h|0)!=(l|0)){de(h,c[l>>2]|0,c[l+4>>2]|0)}d=l+12|0;if((d|0)==(b|0)){break}else{h=h+12|0;l=d}}m=g+(e*12|0)|0;n=c[a>>2]|0}if((m|0)==(n|0)){i=f;return}else{o=n}while(1){n=o-12|0;c[a>>2]=n;e=c[n>>2]|0;if((e|0)==0){p=n}else{n=o-12+4|0;if((e|0)!=(c[n>>2]|0)){c[n>>2]=e}pb(e);p=c[a>>2]|0}if((m|0)==(p|0)){break}else{o=p}}i=f;return}function da(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=b+4|0;f=c[e>>2]|0;g=c[d+4>>2]|0;h=(f|0)<(g|0)?g:f;f=c[b+12>>2]|0;i=d+12|0;j=c[i>>2]|0;k=(j|0)<(f|0)?j:f;do{if((h|0)==(g|0)){if((gu(d,g)|0)<=-1){break}if((gv(d,g)|0)<=-1){break}f=gu(d,g)|0;if((f|0)>(gv(d,g)|0)){break}j=b+16|0;l=b|0;m=f;do{a[(c[(c[j>>2]|0)+((g-(c[e>>2]|0)|0)*12|0)>>2]|0)+(m-(c[l>>2]|0))|0]=0;m=m+1|0;}while((m|0)<=(gv(d,g)|0))}}while(0);do{if((k|0)==(c[i>>2]|0)){if((gu(d,k)|0)<=-1){break}if((gv(d,k)|0)<=-1){break}g=gu(d,k)|0;if((g|0)>(gv(d,k)|0)){break}m=b+16|0;l=b|0;j=g;do{a[(c[(c[m>>2]|0)+((k-(c[e>>2]|0)|0)*12|0)>>2]|0)+(j-(c[l>>2]|0))|0]=0;j=j+1|0;}while((j|0)<=(gv(d,k)|0))}}while(0);i=gu(d,h)|0;j=gv(d,h)|0;l=h+1|0;if((l|0)>(k|0)){return}h=b|0;m=b+8|0;g=b+16|0;b=j;j=i;i=l;while(1){l=gu(d,i)|0;f=gv(d,i)|0;n=(l|0)<0?j:l;l=(f|0)<0?b:f;L1307:do{if((n|j|0)>-1){f=c[h>>2]|0;o=(n|0)<(j|0)?n:j;p=(f|0)<(o|0)?o:f;o=c[m>>2]|0;q=(j|0)<(n|0)?n:j;r=(q|0)<(o|0)?q:o;if((p|0)>(r|0)){break}else{s=p;t=f}while(1){a[(c[(c[g>>2]|0)+((i-(c[e>>2]|0)|0)*12|0)>>2]|0)+(s-t)|0]=0;f=s+1|0;if((f|0)>(r|0)){break L1307}s=f;t=c[h>>2]|0}}}while(0);L1313:do{if((l|b|0)>-1){r=c[h>>2]|0;f=(l|0)<(b|0)?l:b;p=(r|0)<(f|0)?f:r;f=c[m>>2]|0;o=(b|0)<(l|0)?l:b;q=(o|0)<(f|0)?o:f;if((p|0)>(q|0)){break}else{u=p;v=r}while(1){a[(c[(c[g>>2]|0)+((i-(c[e>>2]|0)|0)*12|0)>>2]|0)+(u-v)|0]=0;r=u+1|0;if((r|0)>(q|0)){break L1313}u=r;v=c[h>>2]|0}}}while(0);q=i+1|0;if((q|0)>(k|0)){break}else{b=l;j=n;i=q}}return}function db(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=b|0;f=c[e>>2]|0;g=c[d>>2]|0;h=(f|0)<(g|0)?g:f;i=b+4|0;j=c[i>>2]|0;k=d+4|0;l=c[k>>2]|0;m=(j|0)<(l|0)?l:j;n=c[b+8>>2]|0;o=d+8|0;p=c[o>>2]|0;q=(p|0)<(n|0)?p:n;n=c[b+12>>2]|0;p=d+12|0;d=c[p>>2]|0;r=(d|0)<(n|0)?d:n;if((h|0)!=(g|0)|(m|0)>(r|0)){s=l}else{l=b+16|0;n=m;d=j;j=f;while(1){a[(c[(c[l>>2]|0)+((n-d|0)*12|0)>>2]|0)+(g-j)|0]=0;f=n+1|0;if((f|0)>(r|0)){break}n=f;d=c[i>>2]|0;j=c[e>>2]|0}s=c[k>>2]|0}if(!((m|0)!=(s|0)|(h|0)>(q|0))){s=b+16|0;k=h;do{a[(c[(c[s>>2]|0)+((m-(c[i>>2]|0)|0)*12|0)>>2]|0)+(k-(c[e>>2]|0))|0]=0;k=k+1|0;}while((k|0)<=(q|0))}if(!((q|0)!=(c[o>>2]|0)|(m|0)>(r|0))){o=b+16|0;k=m;do{a[(c[(c[o>>2]|0)+((k-(c[i>>2]|0)|0)*12|0)>>2]|0)+(q-(c[e>>2]|0))|0]=0;k=k+1|0;}while((k|0)<=(r|0))}if((r|0)!=(c[p>>2]|0)|(h|0)>(q|0)){return}p=b+16|0;b=h;do{a[(c[(c[p>>2]|0)+((r-(c[i>>2]|0)|0)*12|0)>>2]|0)+(b-(c[e>>2]|0))|0]=0;b=b+1|0;}while((b|0)<=(q|0));return}function dc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=b|0;f=c[e>>2]|0;g=d+4|0;h=c[g>>2]|0;i=d|0;j=c[i>>2]|0;if((h|0)==(j|0)){k=c[b+8>>2]|0;l=0;m=(f|0)<0?0:f;n=(k|0)>0?0:k}else{k=c[j>>2]|0;o=c[b+8>>2]|0;p=c[h-20+8>>2]|0;l=c[j>>2]|0;m=(f|0)<(k|0)?k:f;n=(p|0)<(o|0)?p:o}if((m|0)==(l|0)){l=fW(d,m)|0;if((l|0)<=(fV(d,m)|0)){o=b+4|0;p=b+12|0;f=b+16|0;k=l;do{l=c[o>>2]|0;do{if((k|0)>=(l|0)){if((k|0)>(c[p>>2]|0)){break}a[(c[(c[f>>2]|0)+((k-l|0)*12|0)>>2]|0)+(m-(c[e>>2]|0))|0]=0}}while(0);k=k+1|0;}while((k|0)<=(fV(d,m)|0))}q=c[g>>2]|0;r=c[i>>2]|0}else{q=h;r=j}if((q|0)==(r|0)){s=0}else{s=c[q-20+8>>2]|0}do{if((n|0)==(s|0)){q=fW(d,n)|0;if((q|0)>(fV(d,n)|0)){break}r=b+4|0;j=b+12|0;h=b+16|0;i=q;do{q=c[r>>2]|0;do{if((i|0)>=(q|0)){if((i|0)>(c[j>>2]|0)){break}a[(c[(c[h>>2]|0)+((i-q|0)*12|0)>>2]|0)+(n-(c[e>>2]|0))|0]=0}}while(0);i=i+1|0;}while((i|0)<=(fV(d,n)|0))}}while(0);if((m|0)>(n|0)){return}s=b+4|0;i=b+12|0;h=b+16|0;b=m;do{m=fW(d,b)|0;j=c[s>>2]|0;do{if((m|0)>=(j|0)){if((m|0)>(c[i>>2]|0)){break}a[(c[(c[h>>2]|0)+((m-j|0)*12|0)>>2]|0)+(b-(c[e>>2]|0))|0]=0}}while(0);j=fV(d,b)|0;m=c[s>>2]|0;do{if((j|0)>=(m|0)){if((j|0)>(c[i>>2]|0)){break}a[(c[(c[h>>2]|0)+((j-m|0)*12|0)>>2]|0)+(b-(c[e>>2]|0))|0]=0}}while(0);b=b+1|0;}while((b|0)<=(n|0));return}function dd(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0;f=i;i=i+144|0;g=f|0;h=f+16|0;j=f+32|0;k=f+48|0;l=f+64|0;m=f+72|0;n=f+88|0;o=f+96|0;p=f+112|0;if((e|0)<-1){c6(p,b,-e|0);q=b;r=p;c[q>>2]=c[r>>2];c[q+4>>2]=c[r+4>>2];c[q+8>>2]=c[r+8>>2];c[q+12>>2]=c[r+12>>2];r=p+16|0;q=p+20|0;dl(b+16|0,c[r>>2]|0,c[q>>2]|0);a[b+28|0]=a[p+28|0]|0;a[b+29|0]=a[p+29|0]|0;p=c[r>>2]|0;if((p|0)==0){s=1;i=f;return s|0}t=c[q>>2]|0;if((p|0)==(t|0)){u=p}else{v=t;while(1){t=v-12|0;c[q>>2]=t;w=c[t>>2]|0;if((w|0)==0){x=t}else{t=v-12+4|0;if((w|0)!=(c[t>>2]|0)){c[t>>2]=w}pb(w);x=c[q>>2]|0}if((p|0)==(x|0)){break}else{v=x}}u=c[r>>2]|0}pb(u);s=1;i=f;return s|0}if((e|0)<=1){s=0;i=f;return s|0}u=b|0;if((2147483647/(e|0)|0|0)<(ag((c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0,(c[b+8>>2]|0)+1-(c[b>>2]|0)|0)|0)){r=bZ(4)|0;c[r>>2]=3920;bs(r|0,12384,0);return 0}r=b+28|0;do{if((a[r]|0)==1){x=(e|0)!=0;if(x&(e&1|0)==0){v=b+20|0;p=b+16|0;q=c[p>>2]|0;w=(c[v>>2]|0)-q|0;t=(w|0)/12|0;y=(c[q+4>>2]|0)-(c[q>>2]|0)|0;dh(m,t<<1);q=m+4|0;z=c[q>>2]|0;A=m|0;B=c[A>>2]|0;if((z|0)==(B|0)){C=z}else{D=y<<1;E=(z-B|0)/12|0;F=0;while(1){G=B+(F*12|0)|0;a[n]=1;H=B+(F*12|0)+4|0;I=c[H>>2]|0;J=c[G>>2]|0;K=I-J|0;do{if(K>>>0<D>>>0){dk(G,D-K|0,n)}else{if(K>>>0<=D>>>0){break}L=J+D|0;if((L|0)==(I|0)){break}c[H>>2]=L}}while(0);H=F+1|0;if(H>>>0<E>>>0){F=H}else{C=B;break}}}B=c[p>>2]|0;if((w|0)>0){F=(y|0)>0;E=y-1|0;D=t-1|0;H=0;I=B;while(1){J=H<<1;if(F){K=I+(H*12|0)|0;G=(H|0)>0;L=H-1|0;M=(H|0)<(D|0);N=H+1|0;O=G^1;P=M^1;Q=C+((J|1)*12|0)|0;R=C+(J*12|0)|0;J=0;do{S=c[K>>2]|0;do{if((a[S+J|0]|0)==0){T=(J|0)>0;if(T){U=(a[S+(J-1)|0]|0)==0}else{U=0}if(G){V=(a[(c[(c[p>>2]|0)+(L*12|0)>>2]|0)+J|0]|0)==0}else{V=0}W=(J|0)<(E|0);if(W){X=(a[S+(J+1)|0]|0)==0}else{X=0}if(M){Y=(a[(c[(c[p>>2]|0)+(N*12|0)>>2]|0)+J|0]|0)==0}else{Y=0}Z=T^1;if(O|Z){_=0}else{_=(a[(c[(c[p>>2]|0)+(L*12|0)>>2]|0)+(J-1)|0]|0)==0}T=W^1;if(O|T){$=0}else{$=(a[(c[(c[p>>2]|0)+(L*12|0)>>2]|0)+(J+1)|0]|0)==0}if(P|Z){aa=0}else{aa=(a[(c[(c[p>>2]|0)+(N*12|0)>>2]|0)+(J-1)|0]|0)==0}if(P|T){ab=0}else{ab=(a[(c[(c[p>>2]|0)+(N*12|0)>>2]|0)+(J+1)|0]|0)==0}T=$|aa;if(!(T&((U|V|_)^1))){a[(c[R>>2]|0)+(J<<1)|0]=0}Z=_|ab;if(!(Z&((X|V|$)^1))){a[(c[R>>2]|0)+(J<<1|1)|0]=0}if(!(Z&((U|Y|aa)^1))){a[(c[Q>>2]|0)+(J<<1)|0]=0}if(T&((X|Y|ab)^1)){break}a[(c[Q>>2]|0)+(J<<1|1)|0]=0}}while(0);J=J+1|0;}while((J|0)<(y|0));ac=c[p>>2]|0;ad=N}else{ac=I;ad=H+1|0}if((ad|0)<(t|0)){H=ad;I=ac}else{ae=ac;break}}}else{ae=B}c[p>>2]=C;c[A>>2]=ae;I=c[v>>2]|0;c[v>>2]=z;c[q>>2]=I;H=b+24|0;t=m+8|0;y=c[H>>2]|0;c[H>>2]=c[t>>2];c[t>>2]=y;if((ae|0)!=0){if((ae|0)==(I|0)){af=ae}else{y=I;while(1){I=y-12|0;c[q>>2]=I;t=c[I>>2]|0;if((t|0)==0){ah=I}else{H=y-12+4|0;if((t|0)==(c[H>>2]|0)){ai=I}else{c[H>>2]=t;ai=c[q>>2]|0}pb(t);ah=ai}if((ae|0)==(ah|0)){break}else{y=ah}}af=c[A>>2]|0}pb(af)}aj=(e|0)/2|0;break}if(!(x&((e|0)%3|0|0)==0)){aj=e;break}y=b+20|0;q=b+16|0;z=c[q>>2]|0;v=(c[y>>2]|0)-z|0;p=(v|0)/12|0;B=(c[z+4>>2]|0)-(c[z>>2]|0)|0;dh(k,p*3|0);z=k+4|0;t=c[z>>2]|0;H=k|0;I=c[H>>2]|0;if((t|0)==(I|0)){ak=t}else{E=B*3|0;D=(t-I|0)/12|0;F=0;while(1){w=I+(F*12|0)|0;a[l]=1;J=I+(F*12|0)+4|0;Q=c[J>>2]|0;R=c[w>>2]|0;P=Q-R|0;do{if(P>>>0<E>>>0){dk(w,E-P|0,l)}else{if(P>>>0<=E>>>0){break}L=R+E|0;if((L|0)==(Q|0)){break}c[J>>2]=L}}while(0);J=F+1|0;if(J>>>0<D>>>0){F=J}else{ak=I;break}}}if((v|0)>0){I=(B|0)>0;F=B-1|0;D=p-1|0;E=0;while(1){x=E*3|0;if(I){A=(c[q>>2]|0)+(E*12|0)|0;J=(E|0)>0;Q=E-1|0;R=(E|0)<(D|0);P=E+1|0;w=J^1;N=R^1;L=ak+(x*12|0)|0;O=ak+((x+1|0)*12|0)|0;M=ak+((x+2|0)*12|0)|0;x=0;while(1){G=x*3|0;K=(x|0)>0;if(K){al=(a[(c[A>>2]|0)+(x-1)|0]|0)==0}else{al=0}if(J){am=(a[(c[(c[q>>2]|0)+(Q*12|0)>>2]|0)+x|0]|0)==0}else{am=0}S=(x|0)<(F|0);if(S){an=(a[(c[A>>2]|0)+(x+1)|0]|0)==0}else{an=0}if(R){ao=(a[(c[(c[q>>2]|0)+(P*12|0)>>2]|0)+x|0]|0)==0}else{ao=0}T=K^1;if(w|T){ap=0}else{ap=(a[(c[(c[q>>2]|0)+(Q*12|0)>>2]|0)+(x-1)|0]|0)==0}K=S^1;if(w|K){aq=0}else{aq=(a[(c[(c[q>>2]|0)+(Q*12|0)>>2]|0)+(x+1)|0]|0)==0}if(N|T){ar=0}else{ar=(a[(c[(c[q>>2]|0)+(P*12|0)>>2]|0)+(x-1)|0]|0)==0}if(N|K){as=0}else{as=(a[(c[(c[q>>2]|0)+(P*12|0)>>2]|0)+(x+1)|0]|0)==0}do{if((a[(c[A>>2]|0)+x|0]|0)==0){K=aq|ar;if(!(K&((al|am|ap)^1))){a[(c[L>>2]|0)+G|0]=0}T=G+1|0;a[(c[L>>2]|0)+T|0]=0;S=ap|as;Z=G+2|0;if(!(S&((an|am|aq)^1))){a[(c[L>>2]|0)+Z|0]=0}a[(c[O>>2]|0)+Z|0]=0;a[(c[O>>2]|0)+T|0]=0;a[(c[O>>2]|0)+G|0]=0;if(!(S&((al|ao|ar)^1))){a[(c[M>>2]|0)+G|0]=0}a[(c[M>>2]|0)+T|0]=0;if(K&((an|ao|as)^1)){break}a[(c[M>>2]|0)+Z|0]=0}else{Z=al^1;K=am^1;T=ap^1;if(!(Z|K|T|aq&ar)){a[(c[L>>2]|0)+G|0]=0}S=aq^1;do{if(!(an^1|K|S)){if(!(T|as^1)){break}a[(c[L>>2]|0)+(G+2)|0]=0}}while(0);K=ar^1;do{if(!(Z|ao^1|K)){if(!(T|as^1)){break}a[(c[M>>2]|0)+G|0]=0}}while(0);if(!(as&(ao&an)&(S|K))){break}a[(c[M>>2]|0)+(G+2)|0]=0}}while(0);G=x+1|0;if((G|0)<(B|0)){x=G}else{at=P;break}}}else{at=E+1|0}if((at|0)<(p|0)){E=at}else{break}}}E=c[q>>2]|0;c[q>>2]=ak;c[H>>2]=E;p=c[y>>2]|0;c[y>>2]=t;c[z>>2]=p;B=b+24|0;F=k+8|0;D=c[B>>2]|0;c[B>>2]=c[F>>2];c[F>>2]=D;if((E|0)!=0){if((E|0)==(p|0)){au=E}else{D=p;while(1){p=D-12|0;c[z>>2]=p;F=c[p>>2]|0;if((F|0)==0){av=p}else{B=D-12+4|0;if((F|0)==(c[B>>2]|0)){aw=p}else{c[B>>2]=F;aw=c[z>>2]|0}pb(F);av=aw}if((E|0)==(av|0)){break}else{D=av}}au=c[H>>2]|0}pb(au)}aj=(e|0)/3|0}else{aj=e}}while(0);do{if((aj|0)>1){e=b+20|0;au=b+16|0;av=c[au>>2]|0;aw=(c[e>>2]|0)-av|0;k=(aw|0)/12|0;ak=(c[av+4>>2]|0)-(c[av>>2]|0)|0;av=h|0;c[av>>2]=0;at=h+4|0;c[at>>2]=0;an=h+8|0;c[an>>2]=0;di(h,ag(k,aj)|0);ao=c[au>>2]|0;L1585:do{if((aw|0)>0){as=j|0;ar=j+4|0;aq=j+8|0;ap=(ak|0)>0;am=(aj|0)>0;al=0;l=ao;L1587:while(1){c[as>>2]=0;c[ar>>2]=0;c[aq>>2]=0;af=c[at>>2]|0;do{if((af|0)==(c[an>>2]|0)){dj(h,j);ah=c[as>>2]|0;if((ah|0)==0){break}if((ah|0)!=(c[ar>>2]|0)){c[ar>>2]=ah}pb(ah)}else{if((af|0)==0){ax=0}else{c[af>>2]=0;c[af+4>>2]=0;c[af+8>>2]=0;ax=c[at>>2]|0}c[at>>2]=ax+12}}while(0);if(ap){af=l+(al*12|0)|0;ah=0;while(1){ae=a[(c[af>>2]|0)+ah|0]|0;L1605:do{if(am){ai=1;while(1){m=c[at>>2]|0;C=m-12+4|0;ac=c[C>>2]|0;ad=m-12+8|0;do{if((ac|0)==(c[ad>>2]|0)){ab=m-12|0;Y=c[ab>>2]|0;X=ac-Y|0;aa=X+1|0;if((aa|0)<0){ay=1276;break L1587}if(X>>>0>1073741822>>>0){az=2147483647;ay=1280}else{U=X<<1;$=U>>>0<aa>>>0?aa:U;if(($|0)==0){aA=0;aB=0}else{az=$;ay=1280}}if((ay|0)==1280){ay=0;aA=o8(az)|0;aB=az}$=aA+X|0;U=aA+aB|0;if(($|0)!=0){a[$]=ae}$=aA+aa|0;pl(aA|0,Y|0,X)|0;c[ab>>2]=aA;c[C>>2]=$;c[ad>>2]=U;if((Y|0)==0){break}pb(Y)}else{if((ac|0)==0){aC=0}else{a[ac]=ae;aC=c[C>>2]|0}c[C>>2]=aC+1}}while(0);if((ai|0)>=(aj|0)){break L1605}ai=ai+1|0}}}while(0);ae=ah+1|0;if((ae|0)<(ak|0)){ah=ae}else{aD=2;break}}}else{aD=2}while(1){ah=c[at>>2]|0;af=ah-12|0;if((ah|0)==(c[an>>2]|0)){dj(h,af)}else{do{if((ah|0)!=0){ae=ah|0;c[ae>>2]=0;K=ah+4|0;c[K>>2]=0;S=ah+8|0;c[S>>2]=0;ai=ah-12+4|0;C=c[ai>>2]|0;ac=af|0;ad=c[ac>>2]|0;if((C|0)==(ad|0)){break}m=C-ad|0;if((m|0)<0){ay=1300;break L1587}ad=o8(m)|0;c[K>>2]=ad;c[ae>>2]=ad;c[S>>2]=ad+m;m=c[ac>>2]|0;ac=c[ai>>2]|0;if((m|0)==(ac|0)){break}else{aE=m;aF=ad}do{if((aF|0)==0){aG=0}else{a[aF]=a[aE]|0;aG=c[K>>2]|0}aF=aG+1|0;c[K>>2]=aF;aE=aE+1|0;}while((aE|0)!=(ac|0))}}while(0);c[at>>2]=(c[at>>2]|0)+12}if((aD|0)>=(aj|0)){break}aD=aD+1|0}af=al+1|0;ah=c[au>>2]|0;if((af|0)<(k|0)){al=af;l=ah}else{aH=ah;break L1585}}if((ay|0)==1276){mE(0);return 0}else if((ay|0)==1300){mE(0);return 0}}else{aH=ao}}while(0);c[au>>2]=c[av>>2];c[av>>2]=aH;ao=c[e>>2]|0;c[e>>2]=c[at>>2];c[at>>2]=ao;k=b+24|0;ak=c[k>>2]|0;c[k>>2]=c[an>>2];c[an>>2]=ak;if((aH|0)!=0){if((aH|0)==(ao|0)){aI=aH}else{ak=ao;while(1){ao=ak-12|0;c[at>>2]=ao;aw=c[ao>>2]|0;if((aw|0)==0){aJ=ao}else{ao=ak-12+4|0;if((aw|0)!=(c[ao>>2]|0)){c[ao>>2]=aw}pb(aw);aJ=c[at>>2]|0}if((aH|0)==(aJ|0)){break}else{ak=aJ}}aI=c[av>>2]|0}pb(aI)}if((d[r]|0)>>>0<=1>>>0){aK=e;break}if((aj|0)>=4){ak=(aj|0)/2|0;at=ak<<1|1;an=ag(at,at)|0;aw=c[au>>2]|0;ao=((c[e>>2]|0)-aw|0)/12|0;H=c[aw+4>>2]|0;l=c[aw>>2]|0;aw=H-l|0;if((ao|0)<(at|0)|(aw|0)<(at|0)){aK=e;break}dh(o,ao);at=o|0;al=c[at>>2]|0;am=0;do{ap=c[au>>2]|0;if((al|0)!=(ap|0)){de(al+(am*12|0)|0,c[ap+(am*12|0)>>2]|0,c[ap+(am*12|0)+4>>2]|0)}am=am+1|0;}while((am|0)<(ak|0));am=ao-ak|0;av=(ak|0)<(am|0);if(av){ap=(H|0)==(l|0);ar=ak;while(1){as=al+(ar*12|0)+8|0;aq=al+(ar*12|0)|0;ah=c[aq>>2]|0;af=ah;do{if(((c[as>>2]|0)-af|0)>>>0<aw>>>0){ac=al+(ar*12|0)+4|0;K=(c[ac>>2]|0)-af|0;if(ap){aL=0}else{aL=o8(aw)|0}ad=aL+K|0;m=aL+aw|0;pl(aL|0,ah|0,K)|0;c[aq>>2]=aL;c[ac>>2]=ad;c[as>>2]=m;if((ah|0)==0){break}pb(ah)}}while(0);ah=ar+1|0;if((ah|0)<(am|0)){ar=ah}else{aM=am;break}}}else{aM=am}do{ar=c[au>>2]|0;if((al|0)!=(ar|0)){de(al+(aM*12|0)|0,c[ar+(aM*12|0)>>2]|0,c[ar+(aM*12|0)+4>>2]|0)}aM=aM+1|0;}while((aM|0)<(ao|0));L1693:do{if(av){ao=aw-ak|0;ar=(ak|0)<(ao|0);ap=-ak|0;l=(ak|0)>(ap|0);H=an<<1;ah=ak;L1695:while(1){as=(c[au>>2]|0)+(ah*12|0)|0;aq=al+(ah*12|0)|0;af=as|0;m=al+(ah*12|0)+4|0;ad=al+(ah*12|0)+8|0;ac=aq|0;K=0;do{ai=(c[af>>2]|0)+K|0;S=c[m>>2]|0;do{if((S|0)==(c[ad>>2]|0)){ae=c[ac>>2]|0;C=S-ae|0;Y=C+1|0;if((Y|0)<0){ay=1482;break L1695}if(C>>>0>1073741822>>>0){aN=2147483647;ay=1486}else{U=C<<1;$=U>>>0<Y>>>0?Y:U;if(($|0)==0){aO=0;aP=0}else{aN=$;ay=1486}}if((ay|0)==1486){ay=0;aO=o8(aN)|0;aP=aN}$=aO+C|0;U=aO+aP|0;if(($|0)!=0){a[$]=a[ai]|0}$=aO+Y|0;pl(aO|0,ae|0,C)|0;c[ac>>2]=aO;c[m>>2]=$;c[ad>>2]=U;if((ae|0)==0){break}pb(ae)}else{if((S|0)==0){aQ=0}else{a[S]=a[ai]|0;aQ=c[m>>2]|0}c[m>>2]=aQ+1}}while(0);K=K+1|0;}while((K|0)<(ak|0));if(ar){K=al+(ah*12|0)+4|0;m=al+(ah*12|0)+8|0;ad=aq|0;ac=ak;do{if(l){af=c[au>>2]|0;ai=0;S=ap;while(1){ae=c[af+((S+ah|0)*12|0)>>2]|0;aR=ai;U=ap;do{aR=(d[ae+(U+ac)|0]|0)+aR|0;U=U+1|0;}while((U|0)<(ak|0));U=S+1|0;if((U|0)<(ak|0)){ai=aR;S=U}else{break}}aS=aR<<1}else{aS=0}S=((aS+an|0)/(H|0)|0)&255;ai=c[K>>2]|0;do{if((ai|0)==(c[m>>2]|0)){af=c[ad>>2]|0;U=ai-af|0;ae=U+1|0;if((ae|0)<0){ay=1505;break L1695}if(U>>>0>1073741822>>>0){aT=2147483647;ay=1509}else{$=U<<1;C=$>>>0<ae>>>0?ae:$;if((C|0)==0){aU=0;aV=0}else{aT=C;ay=1509}}if((ay|0)==1509){ay=0;aU=o8(aT)|0;aV=aT}C=aU+U|0;$=aU+aV|0;if((C|0)!=0){a[C]=S}C=aU+ae|0;pl(aU|0,af|0,U)|0;c[ad>>2]=aU;c[K>>2]=C;c[m>>2]=$;if((af|0)==0){break}pb(af)}else{if((ai|0)==0){aW=0}else{a[ai]=S;aW=c[K>>2]|0}c[K>>2]=aW+1}}while(0);ac=ac+1|0;}while((ac|0)<(ao|0))}ac=as|0;K=al+(ah*12|0)+4|0;m=al+(ah*12|0)+8|0;ad=aq|0;S=ao;do{ai=(c[ac>>2]|0)+S|0;af=c[K>>2]|0;do{if((af|0)==(c[m>>2]|0)){$=c[ad>>2]|0;C=af-$|0;U=C+1|0;if((U|0)<0){ay=1521;break L1695}if(C>>>0>1073741822>>>0){aX=2147483647;ay=1525}else{ae=C<<1;Y=ae>>>0<U>>>0?U:ae;if((Y|0)==0){aY=0;aZ=0}else{aX=Y;ay=1525}}if((ay|0)==1525){ay=0;aY=o8(aX)|0;aZ=aX}Y=aY+C|0;ae=aY+aZ|0;if((Y|0)!=0){a[Y]=a[ai]|0}Y=aY+U|0;pl(aY|0,$|0,C)|0;c[ad>>2]=aY;c[K>>2]=Y;c[m>>2]=ae;if(($|0)==0){break}pb($)}else{if((af|0)==0){a_=0}else{a[af]=a[ai]|0;a_=c[K>>2]|0}c[K>>2]=a_+1}}while(0);S=S+1|0;}while((S|0)<(aw|0));ah=ah+1|0;if((ah|0)>=(am|0)){break L1693}}if((ay|0)==1482){mE(0);return 0}else if((ay|0)==1505){mE(0);return 0}else if((ay|0)==1521){mE(0);return 0}}}while(0);am=c[au>>2]|0;c[au>>2]=al;c[at>>2]=am;aw=o+4|0;an=c[e>>2]|0;c[e>>2]=c[aw>>2];c[aw>>2]=an;ak=o+8|0;av=c[k>>2]|0;c[k>>2]=c[ak>>2];c[ak>>2]=av;if((am|0)==0){aK=e;break}if((am|0)==(an|0)){a$=am}else{av=an;while(1){an=av-12|0;c[aw>>2]=an;ak=c[an>>2]|0;if((ak|0)==0){a0=an}else{ah=av-12+4|0;if((ak|0)==(c[ah>>2]|0)){a1=an}else{c[ah>>2]=ak;a1=c[aw>>2]|0}pb(ak);a0=a1}if((am|0)==(a0|0)){break}else{av=a0}}a$=c[at>>2]|0}pb(a$);aK=e;break}av=c[au>>2]|0;am=(c[e>>2]|0)-av|0;aw=(am|0)/12|0;al=c[av+4>>2]|0;ak=c[av>>2]|0;av=al-ak|0;if((am|0)<36|(av|0)<3){aK=e;break}dh(g,aw);am=g|0;ah=c[am>>2]|0;an=c[au>>2]|0;if((ah|0)!=(an|0)){de(ah,c[an>>2]|0,c[an+4>>2]|0)}an=aw-1|0;aw=(an|0)>1;if(aw){ao=(al|0)==(ak|0);ak=1;do{al=ah+(ak*12|0)+8|0;H=ah+(ak*12|0)|0;ap=c[H>>2]|0;l=ap;do{if(((c[al>>2]|0)-l|0)>>>0<av>>>0){ar=ah+(ak*12|0)+4|0;S=(c[ar>>2]|0)-l|0;if(ao){a2=0}else{a2=o8(av)|0}K=a2+S|0;m=a2+av|0;pl(a2|0,ap|0,S)|0;c[H>>2]=a2;c[ar>>2]=K;c[al>>2]=m;if((ap|0)==0){break}pb(ap)}}while(0);ak=ak+1|0;}while((ak|0)<(an|0))}ak=c[au>>2]|0;if((ah|0)!=(ak|0)){de(ah+(an*12|0)|0,c[ak+(an*12|0)>>2]|0,c[ak+(an*12|0)+4>>2]|0)}L1808:do{if(aw){ak=(aj|0)<3;ao=av-1|0;at=(ao|0)>1;ap=1;L1810:while(1){al=c[au>>2]|0;H=al+((ap-1|0)*12|0)|0;l=ap+1|0;m=al+(l*12|0)|0;K=ah+(ap*12|0)|0;ar=al+(ap*12|0)|0;al=c[ar>>2]|0;S=ah+(ap*12|0)+4|0;ad=c[S>>2]|0;ac=ah+(ap*12|0)+8|0;do{if((ad|0)==(c[ac>>2]|0)){aq=K|0;as=c[aq>>2]|0;ai=ad-as|0;af=ai+1|0;if((af|0)<0){ay=1373;break L1810}if(ai>>>0>1073741822>>>0){a3=2147483647;ay=1377}else{$=ai<<1;ae=$>>>0<af>>>0?af:$;if((ae|0)==0){a4=0;a5=0}else{a3=ae;ay=1377}}if((ay|0)==1377){ay=0;a4=o8(a3)|0;a5=a3}ae=a4+ai|0;$=a4+a5|0;if((ae|0)!=0){a[ae]=a[al]|0}ae=a4+af|0;pl(a4|0,as|0,ai)|0;c[aq>>2]=a4;c[S>>2]=ae;c[ac>>2]=$;if((as|0)==0){break}pb(as)}else{if((ad|0)==0){a6=0}else{a[ad]=a[al]|0;a6=c[S>>2]|0}c[S>>2]=a6+1}}while(0);do{if(ak){if(!at){break}al=H|0;ad=m|0;as=K|0;$=1;while(1){ae=$-1|0;aq=c[al>>2]|0;ai=$+1|0;af=c[ar>>2]|0;Y=c[ad>>2]|0;C=(((d[aq+ae|0]|0)+5+(d[aq+$|0]|0)+(d[aq+ai|0]|0)+(d[af+ae|0]|0)+(d[af+$|0]<<1)+(d[af+ai|0]|0)+(d[Y+ae|0]|0)+(d[Y+$|0]|0)+(d[Y+ai|0]|0)|0)/10|0)&255;Y=c[S>>2]|0;do{if((Y|0)==(c[ac>>2]|0)){ae=c[as>>2]|0;af=Y-ae|0;aq=af+1|0;if((aq|0)<0){ay=1393;break L1810}if(af>>>0>1073741822>>>0){a7=2147483647;ay=1397}else{U=af<<1;ab=U>>>0<aq>>>0?aq:U;if((ab|0)==0){a8=0;a9=0}else{a7=ab;ay=1397}}if((ay|0)==1397){ay=0;a8=o8(a7)|0;a9=a7}ab=a8+af|0;U=a8+a9|0;if((ab|0)!=0){a[ab]=C}ab=a8+aq|0;pl(a8|0,ae|0,af)|0;c[as>>2]=a8;c[S>>2]=ab;c[ac>>2]=U;if((ae|0)==0){break}pb(ae)}else{if((Y|0)==0){ba=0}else{a[Y]=C;ba=c[S>>2]|0}c[S>>2]=ba+1}}while(0);if((ai|0)<(ao|0)){$=ai}else{break}}}else{if(!at){break}$=H|0;as=m|0;ad=K|0;al=1;while(1){C=al-1|0;Y=c[$>>2]|0;ae=al+1|0;U=c[ar>>2]|0;ab=c[as>>2]|0;af=((((d[Y+al|0]|0)+(d[Y+C|0]|0)+(d[Y+ae|0]|0)+(d[U+C|0]|0)+(d[U+al|0]|0)+(d[U+ae|0]|0)+(d[ab+C|0]|0)+(d[ab+al|0]|0)+(d[ab+ae|0]|0)<<1)+9|0)/18|0)&255;ab=c[S>>2]|0;do{if((ab|0)==(c[ac>>2]|0)){C=c[ad>>2]|0;U=ab-C|0;Y=U+1|0;if((Y|0)<0){ay=1408;break L1810}if(U>>>0>1073741822>>>0){bb=2147483647;ay=1412}else{aq=U<<1;X=aq>>>0<Y>>>0?Y:aq;if((X|0)==0){bc=0;bd=0}else{bb=X;ay=1412}}if((ay|0)==1412){ay=0;bc=o8(bb)|0;bd=bb}X=bc+U|0;aq=bc+bd|0;if((X|0)!=0){a[X]=af}X=bc+Y|0;pl(bc|0,C|0,U)|0;c[ad>>2]=bc;c[S>>2]=X;c[ac>>2]=aq;if((C|0)==0){break}pb(C)}else{if((ab|0)==0){be=0}else{a[ab]=af;be=c[S>>2]|0}c[S>>2]=be+1}}while(0);if((ae|0)<(ao|0)){al=ae}else{break}}}}while(0);m=(c[ar>>2]|0)+ao|0;H=c[S>>2]|0;do{if((H|0)==(c[ac>>2]|0)){al=K|0;ad=c[al>>2]|0;as=H-ad|0;$=as+1|0;if(($|0)<0){ay=1423;break L1810}if(as>>>0>1073741822>>>0){bf=2147483647;ay=1427}else{af=as<<1;ab=af>>>0<$>>>0?$:af;if((ab|0)==0){bg=0;bh=0}else{bf=ab;ay=1427}}if((ay|0)==1427){ay=0;bg=o8(bf)|0;bh=bf}ab=bg+as|0;af=bg+bh|0;if((ab|0)!=0){a[ab]=a[m]|0}ab=bg+$|0;pl(bg|0,ad|0,as)|0;c[al>>2]=bg;c[S>>2]=ab;c[ac>>2]=af;if((ad|0)==0){break}pb(ad)}else{if((H|0)==0){bi=0}else{a[H]=a[m]|0;bi=c[S>>2]|0}c[S>>2]=bi+1}}while(0);if((l|0)<(an|0)){ap=l}else{break L1808}}if((ay|0)==1373){mE(0);return 0}else if((ay|0)==1393){mE(0);return 0}else if((ay|0)==1408){mE(0);return 0}else if((ay|0)==1423){mE(0);return 0}}}while(0);an=c[au>>2]|0;c[au>>2]=ah;c[am>>2]=an;av=g+4|0;aw=c[e>>2]|0;c[e>>2]=c[av>>2];c[av>>2]=aw;ap=g+8|0;ao=c[k>>2]|0;c[k>>2]=c[ap>>2];c[ap>>2]=ao;if((an|0)==0){aK=e;break}if((an|0)==(aw|0)){bj=an}else{ao=aw;while(1){aw=ao-12|0;c[av>>2]=aw;ap=c[aw>>2]|0;if((ap|0)==0){bk=aw}else{at=ao-12+4|0;if((ap|0)==(c[at>>2]|0)){bl=aw}else{c[at>>2]=ap;bl=c[av>>2]|0}pb(ap);bk=bl}if((an|0)==(bk|0)){break}else{ao=bk}}bj=c[am>>2]|0}pb(bj);aK=e}else{aK=b+20|0}}while(0);bj=b+16|0;ds(u,((c[aK>>2]|0)-(c[bj>>2]|0)|0)/12|0);aK=c[bj>>2]|0;dt(u,(c[aK+4>>2]|0)-(c[aK>>2]|0)|0);s=1;i=f;return s|0}function de(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=e-d|0;g=b+8|0;h=c[g>>2]|0;i=b|0;j=c[i>>2]|0;k=j;if(f>>>0<=(h-k|0)>>>0){l=b+4|0;m=(c[l>>2]|0)-k|0;if(f>>>0<=m>>>0){pn(j|0,d|0,f|0)|0;k=j+f|0;n=c[l>>2]|0;if((k|0)==(n|0)){return}else{o=n}do{o=o-1|0;}while((k|0)!=(o|0));c[l>>2]=k;return}k=d+m|0;pn(j|0,d|0,m|0)|0;if((k|0)==(e|0)){return}m=k;k=c[l>>2]|0;do{if((k|0)==0){p=0}else{a[k]=a[m]|0;p=c[l>>2]|0}k=p+1|0;c[l>>2]=k;m=m+1|0;}while((m|0)!=(e|0));return}if((j|0)==0){q=h}else{h=b+4|0;if((j|0)!=(c[h>>2]|0)){c[h>>2]=j}pb(j);c[g>>2]=0;c[h>>2]=0;c[i>>2]=0;q=0}if((f|0)<0){mE(0)}do{if(q>>>0>1073741822>>>0){r=2147483647}else{h=q<<1;j=h>>>0<f>>>0?f:h;if((j|0)>=0){r=j;break}mE(0)}}while(0);f=o8(r)|0;q=b+4|0;c[q>>2]=f;c[i>>2]=f;c[g>>2]=f+r;if((d|0)==(e|0)){return}else{s=d;t=f}do{if((t|0)==0){u=0}else{a[t]=a[s]|0;u=c[q>>2]|0}t=u+1|0;c[q>>2]=t;s=s+1|0;}while((s|0)!=(e|0));return}function df(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=b+8|0;f=b+4|0;g=c[f>>2]|0;h=c[e>>2]|0;i=g;if((h-i|0)>>>0>=d>>>0){j=d;k=g;do{if((k|0)==0){l=0}else{a[k]=0;l=c[f>>2]|0}k=l+1|0;c[f>>2]=k;j=j-1|0;}while((j|0)!=0);return}j=b|0;b=c[j>>2]|0;k=i-b|0;i=k+d|0;if((i|0)<0){mE(0)}l=h-b|0;if(l>>>0>1073741822>>>0){m=2147483647;n=1587}else{b=l<<1;l=b>>>0<i>>>0?i:b;if((l|0)==0){o=0;p=0}else{m=l;n=1587}}if((n|0)==1587){o=o8(m)|0;p=m}m=d;d=o+k|0;do{if((d|0)==0){q=0}else{a[d]=0;q=d}d=q+1|0;m=m-1|0;}while((m|0)!=0);m=o+p|0;p=c[j>>2]|0;q=(c[f>>2]|0)-p|0;n=o+(k-q)|0;pl(n|0,p|0,q)|0;c[j>>2]=n;c[f>>2]=d;c[e>>2]=m;if((p|0)==0){return}pb(p);return}function dg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=b|0;f=c[e>>2]|0;g=b+4|0;h=c[g>>2]|0;i=d+4|0;j=c[i>>2]|0;do{if((h|0)==(f|0)){k=f;l=j}else{m=h;n=j;L1986:while(1){o=n-12|0;p=m-12|0;do{if((o|0)!=0){q=o|0;c[q>>2]=0;r=n-12+4|0;c[r>>2]=0;s=n-12+8|0;c[s>>2]=0;t=m-12+4|0;u=c[t>>2]|0;v=p|0;w=c[v>>2]|0;if((u|0)==(w|0)){break}x=u-w|0;if((x|0)<0){break L1986}w=o8(x)|0;c[r>>2]=w;c[q>>2]=w;c[s>>2]=w+x;x=c[v>>2]|0;v=c[t>>2]|0;if((x|0)==(v|0)){break}else{y=x;z=w}do{if((z|0)==0){A=0}else{a[z]=a[y]|0;A=c[r>>2]|0}z=A+1|0;c[r>>2]=z;y=y+1|0;}while((y|0)!=(v|0))}}while(0);B=(c[i>>2]|0)-12|0;c[i>>2]=B;if((p|0)==(f|0)){C=1617;break}else{m=p;n=B}}if((C|0)==1617){k=c[e>>2]|0;l=B;break}mE(0)}}while(0);c[e>>2]=l;c[i>>2]=k;k=d+8|0;l=c[g>>2]|0;c[g>>2]=c[k>>2];c[k>>2]=l;l=b+8|0;b=d+12|0;k=c[l>>2]|0;c[l>>2]=c[b>>2];c[b>>2]=k;c[d>>2]=c[i>>2];return}function dh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;if((b|0)==0){return}if(b>>>0>357913941>>>0){mE(0)}a=o8(b*12|0)|0;c[e>>2]=a;c[d>>2]=a;c[f>>2]=a+(b*12|0);f=b;b=a;do{if((b|0)==0){g=0}else{c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;g=c[e>>2]|0}b=g+12|0;c[e>>2]=b;f=f-1|0;}while((f|0)!=0);return}function di(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+24|0;e=d|0;f=a+8|0;g=c[a>>2]|0;if((((c[f>>2]|0)-g|0)/12|0)>>>0>=b>>>0){i=d;return}h=((c[a+4>>2]|0)-g|0)/12|0;g=e+12|0;c[g>>2]=0;c[e+16>>2]=f;if((b|0)==0){j=0}else{j=o8(b*12|0)|0}f=e|0;c[f>>2]=j;k=j+(h*12|0)|0;h=e+8|0;c[h>>2]=k;l=e+4|0;c[l>>2]=k;c[g>>2]=j+(b*12|0);dg(a,e);e=c[l>>2]|0;l=c[h>>2]|0;if((e|0)!=(l|0)){a=l;while(1){l=a-12|0;c[h>>2]=l;b=c[l>>2]|0;if((b|0)==0){m=l}else{j=a-12+4|0;if((b|0)==(c[j>>2]|0)){n=l}else{c[j>>2]=b;n=c[h>>2]|0}pb(b);m=n}if((e|0)==(m|0)){break}else{a=m}}}m=c[f>>2]|0;if((m|0)==0){i=d;return}pb(m);i=d;return}function dj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=i;i=i+24|0;f=e|0;g=b+8|0;h=g;j=c[b>>2]|0;k=((c[b+4>>2]|0)-j|0)/12|0;l=k+1|0;if(l>>>0>357913941>>>0){mE(0)}m=((c[g>>2]|0)-j|0)/12|0;if(m>>>0>178956969>>>0){j=f+12|0;c[j>>2]=0;c[f+16>>2]=h;n=357913941;o=j;p=1671}else{j=m<<1;m=j>>>0<l>>>0?l:j;j=f+12|0;c[j>>2]=0;c[f+16>>2]=h;if((m|0)==0){q=0;r=0;s=j}else{n=m;o=j;p=1671}}if((p|0)==1671){q=o8(n*12|0)|0;r=n;s=o}o=f|0;c[o>>2]=q;n=q+(k*12|0)|0;p=f+8|0;c[p>>2]=n;j=f+4|0;c[j>>2]=n;c[s>>2]=q+(r*12|0);do{if((n|0)!=0){r=n|0;c[r>>2]=0;s=q+(k*12|0)+4|0;c[s>>2]=0;m=q+(k*12|0)+8|0;c[m>>2]=0;h=c[d+4>>2]|0;l=c[d>>2]|0;if((h|0)==(l|0)){break}g=h-l|0;if((g|0)<0){mE(0)}t=o8(g)|0;c[s>>2]=t;c[r>>2]=t;c[m>>2]=t+g;g=l;l=t;do{if((l|0)==0){u=0}else{a[l]=a[g]|0;u=c[s>>2]|0}l=u+1|0;c[s>>2]=l;g=g+1|0;}while((g|0)!=(h|0))}}while(0);c[p>>2]=q+((k+1|0)*12|0);dg(b,f);f=c[j>>2]|0;j=c[p>>2]|0;if((f|0)!=(j|0)){b=j;while(1){j=b-12|0;c[p>>2]=j;k=c[j>>2]|0;if((k|0)==0){v=j}else{q=b-12+4|0;if((k|0)==(c[q>>2]|0)){w=j}else{c[q>>2]=k;w=c[p>>2]|0}pb(k);v=w}if((f|0)==(v|0)){break}else{b=v}}}v=c[o>>2]|0;if((v|0)==0){i=e;return}pb(v);i=e;return}function dk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=b+8|0;g=b+4|0;h=c[g>>2]|0;i=c[f>>2]|0;j=h;if((i-j|0)>>>0>=d>>>0){k=d;l=h;do{if((l|0)==0){m=0}else{a[l]=a[e]|0;m=c[g>>2]|0}l=m+1|0;c[g>>2]=l;k=k-1|0;}while((k|0)!=0);return}k=b|0;b=c[k>>2]|0;l=j-b|0;j=l+d|0;if((j|0)<0){mE(0)}m=i-b|0;if(m>>>0>1073741822>>>0){n=2147483647;o=1715}else{b=m<<1;m=b>>>0<j>>>0?j:b;if((m|0)==0){p=0;q=0}else{n=m;o=1715}}if((o|0)==1715){p=o8(n)|0;q=n}n=d;d=p+l|0;do{if((d|0)==0){r=0}else{a[d]=a[e]|0;r=d}d=r+1|0;n=n-1|0;}while((n|0)!=0);n=p+q|0;q=c[k>>2]|0;r=(c[g>>2]|0)-q|0;e=p+(l-r)|0;pl(e|0,q|0,r)|0;c[k>>2]=e;c[g>>2]=d;c[f>>2]=n;if((q|0)==0){return}pb(q);return}function dl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;f=d;g=(e-f|0)/12|0;h=b+8|0;i=c[h>>2]|0;j=b|0;k=c[j>>2]|0;l=k;if(g>>>0>((i-l|0)/12|0)>>>0){if((k|0)==0){m=i}else{i=b+4|0;n=c[i>>2]|0;if((k|0)==(n|0)){o=k}else{p=n;while(1){n=p-12|0;c[i>>2]=n;q=c[n>>2]|0;if((q|0)==0){r=n}else{n=p-12+4|0;if((q|0)!=(c[n>>2]|0)){c[n>>2]=q}pb(q);r=c[i>>2]|0}if((k|0)==(r|0)){break}else{p=r}}o=c[j>>2]|0}pb(o);c[h>>2]=0;c[i>>2]=0;c[j>>2]=0;m=0}if(g>>>0>357913941>>>0){mE(0)}i=(m|0)/12|0;do{if(i>>>0>178956969>>>0){s=357913941}else{m=i<<1;o=m>>>0<g>>>0?g:m;if(o>>>0<=357913941>>>0){s=o;break}mE(0)}}while(0);i=o8(s*12|0)|0;o=b+4|0;c[o>>2]=i;c[j>>2]=i;c[h>>2]=i+(s*12|0);if((d|0)==(e|0)){return}else{t=d;u=i}L2133:while(1){if((u|0)==0){v=0}else{i=u|0;c[i>>2]=0;s=u+4|0;c[s>>2]=0;h=u+8|0;c[h>>2]=0;j=t+4|0;m=c[j>>2]|0;r=t|0;p=c[r>>2]|0;do{if((m|0)!=(p|0)){q=m-p|0;if((q|0)<0){break L2133}n=o8(q)|0;c[s>>2]=n;c[i>>2]=n;c[h>>2]=n+q;q=c[r>>2]|0;w=c[j>>2]|0;if((q|0)==(w|0)){break}else{x=q;y=n}do{if((y|0)==0){z=0}else{a[y]=a[x]|0;z=c[s>>2]|0}y=z+1|0;c[s>>2]=y;x=x+1|0;}while((x|0)!=(w|0))}}while(0);v=c[o>>2]|0}s=v+12|0;c[o>>2]=s;j=t+12|0;if((j|0)==(e|0)){A=1799;break}else{t=j;u=s}}if((A|0)==1799){return}mE(0)}u=b+4|0;b=((c[u>>2]|0)-l|0)/12|0;if(g>>>0>b>>>0){B=1;C=d+(b*12|0)|0}else{B=0;C=e}if((C|0)==(d|0)){D=k}else{b=(((C-12+(-f|0)|0)>>>0)/12|0)+1|0;f=k;g=d;while(1){if((f|0)!=(g|0)){de(f,c[g>>2]|0,c[g+4>>2]|0)}d=g+12|0;if((d|0)==(C|0)){break}else{f=f+12|0;g=d}}D=k+(b*12|0)|0}if(!B){B=c[u>>2]|0;if((D|0)==(B|0)){return}else{E=B}while(1){B=E-12|0;c[u>>2]=B;b=c[B>>2]|0;if((b|0)==0){F=B}else{B=E-12+4|0;if((b|0)!=(c[B>>2]|0)){c[B>>2]=b}pb(b);F=c[u>>2]|0}if((D|0)==(F|0)){break}else{E=F}}return}if((C|0)==(e|0)){return}F=C;C=c[u>>2]|0;L2182:while(1){if((C|0)==0){G=0}else{E=C|0;c[E>>2]=0;D=C+4|0;c[D>>2]=0;b=C+8|0;c[b>>2]=0;B=F+4|0;k=c[B>>2]|0;g=F|0;f=c[g>>2]|0;do{if((k|0)!=(f|0)){d=k-f|0;if((d|0)<0){break L2182}l=o8(d)|0;c[D>>2]=l;c[E>>2]=l;c[b>>2]=l+d;d=c[g>>2]|0;t=c[B>>2]|0;if((d|0)==(t|0)){break}else{H=d;I=l}do{if((I|0)==0){J=0}else{a[I]=a[H]|0;J=c[D>>2]|0}I=J+1|0;c[D>>2]=I;H=H+1|0;}while((H|0)!=(t|0))}}while(0);G=c[u>>2]|0}D=G+12|0;c[u>>2]=D;B=F+12|0;if((B|0)==(e|0)){A=1803;break}else{F=B;C=D}}if((A|0)==1803){return}mE(0)}function dm(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((e|0)<(b|0)|(f|0)<(d|0)){if((c[3108]|0)>-1){h=c[r>>2]|0;bT(h|0,2592,(h=i,i=i+32|0,c[h>>2]=b,c[h+8>>2]=d,c[h+16>>2]=e,c[h+24>>2]=f,h)|0)|0;i=h}gM(3608)}c[a>>2]=b;c[a+4>>2]=d;c[a+8>>2]=e;c[a+12>>2]=f;i=g;return}function dn(a,b){a=a|0;b=b|0;if((c[a+8>>2]|0)<(b|0)){gM(2728)}c[a>>2]=b;return}function dp(a,b){a=a|0;b=b|0;if((c[a+12>>2]|0)<(b|0)){gM(2272)}c[a+4>>2]=b;return}function dq(a,b){a=a|0;b=b|0;if((c[a>>2]|0)>(b|0)){gM(1864)}c[a+8>>2]=b;return}function dr(a,b){a=a|0;b=b|0;if((c[a+4>>2]|0)>(b|0)){gM(1536)}c[a+12>>2]=b;return}function ds(a,b){a=a|0;b=b|0;if((b|0)<1){gM(1184)}c[a+12>>2]=b-1+(c[a+4>>2]|0);return}function dt(a,b){a=a|0;b=b|0;if((b|0)<1){gM(720)}c[a+8>>2]=b-1+(c[a>>2]|0);return}function du(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[b>>2]|0;e=a|0;if((d|0)<(c[e>>2]|0)){c[e>>2]=d}d=c[b+4>>2]|0;e=a+4|0;if((d|0)<(c[e>>2]|0)){c[e>>2]=d}d=c[b+8>>2]|0;e=a+8|0;if((d|0)>(c[e>>2]|0)){c[e>>2]=d}d=c[b+12>>2]|0;b=a+12|0;if((d|0)<=(c[b>>2]|0)){return}c[b>>2]=d;return}function dv(a,b){a=a|0;b=b|0;var d=0;if((c[a>>2]|0)>(c[b>>2]|0)){d=0;return d|0}if((c[a+4>>2]|0)>(c[b+4>>2]|0)){d=0;return d|0}if((c[a+8>>2]|0)<(c[b+8>>2]|0)){d=0;return d|0}d=(c[a+12>>2]|0)>=(c[b+12>>2]|0);return d|0}function dw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[a>>2]|0)>(d|0)){e=0;return e|0}if((c[a+8>>2]|0)<(d|0)){e=0;return e|0}if((c[a+4>>2]|0)>(b|0)){e=0;return e|0}e=(c[a+12>>2]|0)>=(b|0);return e|0}function dx(a,b){a=a|0;b=b|0;var d=0;if((c[a>>2]|0)>=(c[b>>2]|0)){d=0;return d|0}if((c[a+4>>2]|0)>=(c[b+4>>2]|0)){d=0;return d|0}if((c[a+8>>2]|0)<=(c[b+8>>2]|0)){d=0;return d|0}d=(c[a+12>>2]|0)>(c[b+12>>2]|0);return d|0}function dy(a,b){a=a|0;b=b|0;var d=0,e=0;d=((c[b+8>>2]|0)+(c[b>>2]|0)|0)/2|0;if((c[a>>2]|0)>(d|0)){e=0;return e|0}e=(c[a+8>>2]|0)>=(d|0);return e|0}function dz(a,b){a=a|0;b=b|0;var d=0,e=0;d=((c[b+12>>2]|0)+(c[b+4>>2]|0)|0)/2|0;if((c[a+4>>2]|0)>(d|0)){e=0;return e|0}e=(c[a+12>>2]|0)>=(d|0);return e|0}function dA(a,b){a=a|0;b=b|0;var d=0;if((c[a>>2]|0)>(c[b>>2]|0)){d=0;return d|0}d=(c[a+8>>2]|0)>=(c[b+8>>2]|0);return d|0}function dB(a,b){a=a|0;b=b|0;var d=0;if((c[a>>2]|0)>(b|0)){d=0;return d|0}d=(c[a+8>>2]|0)>=(b|0);return d|0}function dC(a,b){a=a|0;b=b|0;var d=0;if((c[a+4>>2]|0)>(b|0)){d=0;return d|0}d=(c[a+12>>2]|0)>=(b|0);return d|0}function dD(a,b){a=a|0;b=b|0;var d=0;if((c[a>>2]|0)>(c[b+8>>2]|0)){d=0;return d|0}d=(c[a+8>>2]|0)>=(c[b>>2]|0);return d|0}function dE(a,b){a=a|0;b=b|0;var d=0;if((c[a+4>>2]|0)>(c[b+12>>2]|0)){d=0;return d|0}d=(c[a+12>>2]|0)>=(c[b+4>>2]|0);return d|0}function dF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=c[b+12>>2]|0;e=c[a+12>>2]|0;f=c[a+4>>2]|0;a=c[b+4>>2]|0;b=((d|0)<(e|0)?d:e)-((f|0)<(a|0)?a:f)+1|0;if((b|0)<=0){g=0;return g|0}h=e+1-f|0;f=d+1-a|0;a=(b*100|0|0)/(((f|0)<(h|0)?f:h)|0)|0;g=(a|0)>1?a:1;return g|0}function dG(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[b>>2]|0;e=c[b+8>>2]|0;f=(e+d|0)/2|0;g=c[a>>2]|0;h=c[a+8>>2]|0;if(!((g|0)>(f|0)|(h|0)<(f|0))){i=1;return i|0}a=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;b=e+1-d|0;d=(((b|0)<(a|0)?b:a)|0)/2|0;do{if((h+1-g|0)<(d|0)){a=(d+1|0)/2|0;b=(g+h|0)/2|0;if((b-a|0)>(f|0)|(b+a|0)<(f|0)){break}else{i=1}return i|0}}while(0);i=0;return i|0}function dH(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=c[b+4>>2]|0;e=c[b+12>>2]|0;f=(e+d|0)/2|0;g=c[a+4>>2]|0;h=c[a+12>>2]|0;if(!((g|0)>(f|0)|(h|0)<(f|0))){i=1;return i|0}a=e+1-d|0;d=(c[b+8>>2]|0)+1-(c[b>>2]|0)|0;b=(((d|0)<(a|0)?d:a)|0)/2|0;do{if((h+1-g|0)<(b|0)){a=(b+1|0)/2|0;d=(g+h|0)/2|0;if((d-a|0)>(f|0)|(d+a|0)<(f|0)){break}else{i=1}return i|0}}while(0);i=0;return i|0}function dI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=c[b>>2]|0;if((c[a+8>>2]|0)<(d|0)){e=1;return e|0}f=c[a>>2]|0;do{if((f|0)<=(c[b+8>>2]|0)){g=c[a+4>>2]|0;h=c[b+4>>2]|0;if((g|0)<(h|0)){e=1;return e|0}if((g|0)==(h|0)&(f|0)<(d|0)){e=1}else{break}return e|0}}while(0);e=0;return e|0}function dJ(a,b){a=a|0;b=b|0;return(((c[a+8>>2]|0)+(c[a>>2]|0)|0)/2|0|0)<(((c[b+8>>2]|0)+(c[b>>2]|0)|0)/2|0|0)|0}function dK(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;c=a;d=(a|0)<0|0?-1:0;e=pz(c,d,c,d)|0;d=K;c=b;f=(b|0)<0|0?-1:0;g=pz(c,f,c,f)|0;f=pp(g,K,e,d)|0;d=K;e=(a|0)>-1?a:-a|0;a=(b|0)>-1?b:-b|0;b=(e|0)<(a|0)?a:e;g=a+e|0;if((g-b|0)>1){e=b;a=g;while(1){c=(a+e|0)/2|0;h=c;i=(c|0)<0|0?-1:0;j=pz(h,i,h,i)|0;i=K;h=(i|0)<(d|0)|(i|0)==(d|0)&j>>>0<f>>>0;j=h?c:e;i=h?a:c;if((i-j|0)>1){e=j;a=i}else{k=j;l=i;break}}}else{k=b;l=g}g=k;b=(k|0)<0|0?-1:0;a=pz(g,b,g,b)|0;b=pq(f<<1|0>>>31,d<<1|f>>>31,a,K)|0;a=K;f=l;d=(l|0)<0|0?-1:0;g=pz(f,d,f,d)|0;d=K;return((a|0)<(d|0)|(a|0)==(d|0)&b>>>0<g>>>0?k:l)|0}function dL(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=c[b+12>>2]|0;e=c[a+4>>2]|0;if((d|0)<=(e|0)){f=e-d|0;return f|0}d=c[b+4>>2]|0;b=c[a+12>>2]|0;if((d|0)<(b|0)){f=0;return f|0}f=d-b|0;return f|0}function dM(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+4>>2]|0;if((d|0)<(b|0)){e=c[a+12>>2]|0;return((e|0)>(b|0)?0:b-e|0)|0}else{return d-b|0}return 0}function dN(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0,ck=0,cl=0,cm=0,cn=0,co=0,cp=0,cq=0;j=i;i=i+312|0;k=j|0;l=j+8|0;m=j+16|0;n=j+24|0;o=j+32|0;p=j+40|0;q=j+48|0;s=j+56|0;t=j+64|0;u=j+104|0;v=j+144|0;w=j+152|0;x=j+192|0;y=j+200|0;z=j+216|0;A=j+256|0;B=j+272|0;C=j+280|0;D=e|0;E=b;F=e;c[E>>2]=c[F>>2];c[E+4>>2]=c[F+4>>2];c[E+8>>2]=c[F+8>>2];c[E+12>>2]=c[F+12>>2];E=b+16|0;G=pk(f|0)|0;if(G>>>0>4294967279>>>0){h$(0)}if(G>>>0<11>>>0){a[E]=G<<1&255;H=E+1|0}else{I=G+16&-16;J=o8(I)|0;c[b+24>>2]=J;c[E>>2]=I|1;c[b+20>>2]=G;H=J}pl(H|0,f|0,G)|0;a[H+G|0]=0;G=b+28|0;c[G>>2]=0;H=b+32|0;c[H>>2]=0;f=b+36|0;c[f>>2]=0;J=c[g+16>>2]|0;if(J>>>0>100>>>0){i=j;return}I=A|0;c[I>>2]=0;E=A+4|0;c[E>>2]=0;K=A+8|0;c[K>>2]=0;L=z;M=e+29|0;N=a[M]|0;O=y|0;c[O>>2]=0;P=y+4|0;c[P>>2]=0;Q=y+8|0;c[Q>>2]=0;R=e+8|0;S=c[R>>2]|0;T=e|0;U=c[T>>2]|0;V=S+1|0;W=V-U|0;if((V|0)==(U|0)){X=0;Y=0;Z=S;_=U}else{if(W>>>0>1073741823>>>0){mE(0)}U=o8(W<<2)|0;S=W;W=U;do{if((W|0)==0){$=0}else{c[W>>2]=0;$=W}W=$+4|0;S=S-1|0;}while((S|0)!=0);X=U;Y=W;Z=c[R>>2]|0;_=c[T>>2]|0}W=Z+1|0;Z=W-_|0;if((W|0)==(_|0)){aa=0;ab=0}else{if(Z>>>0>1073741823>>>0){mE(0)}_=o8(Z<<2)|0;W=Z;Z=_;while(1){if((Z|0)==0){ac=0}else{c[Z>>2]=0;ac=Z}U=ac+4|0;S=W-1|0;if((S|0)==0){aa=_;ab=U;break}else{W=S;Z=U}}}Z=e+4|0;W=c[Z>>2]|0;_=e+12|0;ac=c[_>>2]|0;L2406:do{if((W|0)>(ac|0)){ad=X;ae=aa}else{U=e+16|0;S=Y;$=X;V=ab;af=aa;ag=W;ah=c[R>>2]|0;ai=ac;L2408:while(1){aj=c[T>>2]|0;if((aj|0)>(ah|0)){ak=ah;al=ai}else{am=aj;an=ah;ao=aj;while(1){aj=am-ao|0;L2413:do{if((d[(c[(c[U>>2]|0)+((ag-(c[Z>>2]|0)|0)*12|0)>>2]|0)+aj|0]|0)>>>0>(N&255)>>>0){c[$+(aj<<2)>>2]=0}else{if((aj|0)>0){ap=aj-1|0;aq=c[af+(ap<<2)>>2]|0;ar=c[$+(ap<<2)>>2]|0}else{aq=0;ar=0}ap=af+(aj<<2)|0;as=c[ap>>2]|0;if((am|0)<(an|0)){at=c[af+(aj+1<<2)>>2]|0}else{at=0}do{if((ar|0)==0){if((aq|0)!=0){eb(aq|0,ag,am);au=aq;break}if((as|0)!=0){eb(as|0,ag,am);au=as;break}if((at|0)!=0){eb(at|0,ag,am);c[$+(aj<<2)>>2]=at;break L2413}av=o8(40)|0;aw=av;d1(av,am,ag,am,ag);c[av+28>>2]=0;c[av+32>>2]=0;c[av+36>>2]=0;a[(c[(c[av+16>>2]|0)+((ag-(c[av+4>>2]|0)|0)*12|0)>>2]|0)+(am-(c[av>>2]|0))|0]=1;av=c[P>>2]|0;if((av|0)!=(c[Q>>2]|0)){if((av|0)!=0){c[av>>2]=aw}c[P>>2]=av+4;au=aw;break}ax=c[O>>2]|0;ay=av-ax|0;av=ay>>2;az=av+1|0;if(az>>>0>1073741823>>>0){break L2408}if(av>>>0>536870910>>>0){aA=1073741823;aB=2013}else{aC=ay>>1;aD=aC>>>0<az>>>0?az:aC;if((aD|0)==0){aE=0;aF=0}else{aA=aD;aB=2013}}if((aB|0)==2013){aB=0;aE=o8(aA<<2)|0;aF=aA}aD=aE+(av<<2)|0;av=aE+(aF<<2)|0;if((aD|0)!=0){c[aD>>2]=aw}aD=aE+(az<<2)|0;az=aE;aC=ax;pl(az|0,aC|0,ay)|0;c[O>>2]=aE;c[P>>2]=aD;c[Q>>2]=av;if((ax|0)==0){au=aw;break}pb(aC);au=aw}else{eb(ar|0,ag,am);au=ar}}while(0);c[$+(aj<<2)>>2]=au;if((at|0)==0|(au|0)==(at|0)){break}do{if((c[au+4>>2]|0)>(c[at+4>>2]|0)){as=aj+1|0;aw=$+(as<<2)|0;if((as|0)==0){aG=at;aH=au;break}else{aI=$}while(1){if((c[aI>>2]|0)==(au|0)){c[aI>>2]=at}as=aI+4|0;if((as|0)==(aw|0)){aG=at;aH=au;break}else{aI=as}}}else{if((ap|0)==(V|0)){aG=au;aH=at;break}else{aJ=ap}while(1){if((c[aJ>>2]|0)==(at|0)){c[aJ>>2]=au}aw=aJ+4|0;if((aw|0)==(V|0)){aG=au;aH=at;break}else{aJ=aw}}}}while(0);ap=c[P>>2]|0;aw=c[O>>2]|0;as=ap;aC=as-aw>>2;ax=aC;av=aC+1073741823|0;while(1){aK=ax-1|0;if((ax|0)<=0){break}if((c[aw+(aK<<2)>>2]|0)==(aH|0)){break}else{ax=aK;av=av+1073741823&1073741823}}if((aK|0)<0){gM(3648)}ax=aK<<2>>2;aC=aw+(ax+1<<2)|0;aD=as-aC|0;ay=aD>>2;az=aw+(ax<<2)|0;aL=aC;pn(az|0,aL|0,aD|0)|0;if((aw+(ay+ax<<2)|0)!=(ap|0)){c[P>>2]=ap+(~((ap-4+(-(aw+(ay+(av<<2>>2)<<2)|0)|0)|0)>>>2)<<2)}d9(aG|0,aH|0);if((aH|0)==0){break}eu(aH);pb(aH)}}while(0);aj=am+1|0;aM=c[R>>2]|0;if((aj|0)>(aM|0)){break}am=aj;an=aM;ao=c[T>>2]|0}ak=aM;al=c[_>>2]|0}ao=ag+1|0;if((ao|0)>(al|0)){ad=af;ae=$;break L2406}else{an=$;am=S;S=V;$=af;ag=ao;ah=ak;ai=al;af=an;V=am}}mE(0)}}while(0);al=(J|0)<100;do{if(al){if((c[P>>2]|0)-(c[O>>2]|0)>>2>>>0<=3>>>0){break}dT(D,y);ak=c[O>>2]|0;aM=(c[P>>2]|0)-ak|0;aH=aM>>2;if((aM|0)>0){aM=0;aG=0;aK=ak;while(1){aJ=aK+(aM<<2)|0;at=c[aJ>>2]|0;au=(c[at+12>>2]|0)+1-(c[at+4>>2]|0)|0;do{if((au|0)>4){aB=2055}else{aI=(c[at+8>>2]|0)+1-(c[at>>2]|0)|0;if((aI|0)>4){aB=2055;break}if(!((au|0)>2|(aI|0)>2)){aN=aG;aO=aK;break}if((ee(at|0)|0)>5){aB=2055}else{aN=aG;aO=aK}}}while(0);if((aB|0)==2055){aB=0;c[aJ>>2]=c[aK+(aG<<2)>>2];au=c[O>>2]|0;c[au+(aG<<2)>>2]=at;aN=aG+1|0;aO=au}au=aM+1|0;if((au|0)<(aH|0)){aM=au;aG=aN;aK=aO}else{aP=aN;aQ=aO;break}}}else{aP=0;aQ=ak}do{if((aP|0)<(aH|0)){aK=aP;do{aG=c[aQ+(aK<<2)>>2]|0;if((aG|0)!=0){eu(aG);pb(aG)}aK=aK+1|0;}while((aK|0)<(aH|0));aK=aQ+(aP<<2)|0;at=c[P>>2]|0;aJ=aP<<2>>2;if((aK|0)==(at|0)){aR=aK;break}aG=at;at=aQ+((aG-aK>>2)+aJ<<2)|0;aK=aG-at|0;aG=aK>>2;aM=aQ+(aJ<<2)|0;au=at;pn(aM|0,au|0,aK|0)|0;aK=aQ+(aG+aJ<<2)|0;aJ=c[P>>2]|0;if((aK|0)==(aJ|0)){aR=aK;break}aG=aJ+(~((aJ-4+(-aK|0)|0)>>>2)<<2)|0;c[P>>2]=aG;aR=aG}else{aR=c[P>>2]|0}}while(0);aH=c[O>>2]|0;ak=aH;aG=(aR-ak>>2)-1|0;if((aG|0)>-1){aK=aG;aJ=aG;aG=aR;au=aR;aM=aR;while(1){at=aJ<<2>>2;aI=c[aH+(aK<<2)>>2]|0;ar=(c[aI+12>>2]|0)+1-(c[aI+4>>2]|0)|0;aE=(c[aI+8>>2]|0)+1-(c[aI>>2]|0)|0;do{if((ar|0)>(aE*35|0|0)|(aE|0)>(ar*25|0|0)){if((aI|0)==0){aS=aG}else{eu(aI);pb(aI);aS=au}aF=aK<<2>>2;aA=aH+(aF+1<<2)|0;aq=aS-aA|0;N=aq>>2;ac=aH+(aF<<2)|0;W=aA;pn(ac|0,W|0,aq|0)|0;if((aH+(N+aF<<2)|0)==(aM|0)){aT=aM;aU=aM;aV=aM;break}aF=aM+(~((aM-4+(-(aH+(N+at<<2)|0)|0)|0)>>>2)<<2)|0;c[P>>2]=aF;aT=aF;aU=aF;aV=aF}else{aT=aG;aU=au;aV=aM}}while(0);at=aK-1|0;if((at|0)>-1){aK=at;aJ=aJ+1073741823&1073741823;aG=aT;au=aU;aM=aV}else{aW=aU;break}}}else{aW=aR}aM=aW-ak|0;au=aM>>2;if((aM|0)>0){aX=0}else{break}while(1){aM=c[aH+(aX<<2)>>2]|0;aG=aM+12|0;aJ=c[aG>>2]|0;aK=aM+4|0;at=c[aK>>2]|0;do{if((aJ+1-at|0)>=11){aI=aM|0;ar=c[aI>>2]|0;aE=aM+8|0;aF=c[aE>>2]|0;if((ar|0)>(aF|0)){aB=2085}else{N=c[c[aM+16>>2]>>2]|0;aq=0;W=ar;while(1){if((a[N+(W-ar)|0]|0)==0){aY=aq}else{ac=aq+1|0;if((aq|0)>0){aZ=ac;break}else{aY=ac}}ac=W+1|0;if((ac|0)>(aF|0)){aZ=aY;break}else{aq=aY;W=ac}}if((aZ|0)<2){aB=2085}else{a_=ar;a$=aF;a0=aJ}}if((aB|0)==2085){aB=0;ex(aM,at+1|0);a_=c[aI>>2]|0;a$=c[aE>>2]|0;a0=c[aG>>2]|0}if((a_|0)<=(a$|0)){W=c[(c[aM+16>>2]|0)+((a0-(c[aK>>2]|0)|0)*12|0)>>2]|0;aq=0;N=a_;while(1){if((a[W+(N-a_)|0]|0)==0){a1=aq}else{ac=aq+1|0;if((aq|0)>0){a2=ac;break}else{a1=ac}}ac=N+1|0;if((ac|0)>(a$|0)){a2=a1;break}else{aq=a1;N=ac}}if((a2|0)>=2){break}}ez(aM,a0-1|0)}}while(0);aM=aX+1|0;if((aM|0)<(au|0)){aX=aM}else{a3=0;break}}do{ak=c[aH+(a3<<2)>>2]|0;aM=ak+8|0;aK=c[aM>>2]|0;aG=ak|0;at=c[aG>>2]|0;do{if((aK+1-at|0)>=6){aJ=ak+4|0;N=c[aJ>>2]|0;aq=ak+12|0;W=c[aq>>2]|0;if((N|0)>(W|0)){aB=2102}else{aE=c[ak+16>>2]|0;aI=0;aF=N;while(1){if((a[c[aE+((aF-N|0)*12|0)>>2]|0]|0)==0){a4=aI}else{ar=aI+1|0;if((aI|0)>0){a5=ar;break}else{a4=ar}}ar=aF+1|0;if((ar|0)>(W|0)){a5=a4;break}else{aI=a4;aF=ar}}if((a5|0)<2){aB=2102}else{a6=N;a7=W;a8=aK}}if((aB|0)==2102){aB=0;ev(ak,at+1|0);a6=c[aJ>>2]|0;a7=c[aq>>2]|0;a8=c[aM>>2]|0}if((a6|0)<=(a7|0)){aF=c[ak+16>>2]|0;aI=a8-(c[aG>>2]|0)|0;aE=0;ar=a6;while(1){if((a[(c[aF+((ar-a6|0)*12|0)>>2]|0)+aI|0]|0)==0){a9=aE}else{ac=aE+1|0;if((aE|0)>0){ba=ac;break}else{a9=ac}}ac=ar+1|0;if((ac|0)>(a7|0)){ba=a9;break}else{aE=a9;ar=ac}}if((ba|0)>=2){break}}ey(ak,a8-1|0)}}while(0);a3=a3+1|0;}while((a3|0)<(au|0))}}while(0);do{if(h){a3=c[R>>2]|0;a8=c[T>>2]|0;if((a3+1-a8|0)<=200){bb=a8;bc=a3;aB=2433;break}if(((c[_>>2]|0)+1-(c[Z>>2]|0)|0)<=200){bb=a8;bc=a3;aB=2433;break}ba=c[P>>2]|0;a9=c[O>>2]|0;if(ba-a9>>2>>>0<=3>>>0){bb=a8;bc=a3;aB=2433;break}a3=t;a8=u;a7=w;do{if((ba|0)!=(a9|0)){a6=dX(y)|0;a5=c[c[O>>2]>>2]|0;a4=a5;c[a8>>2]=c[a4>>2];c[a8+4>>2]=c[a4+4>>2];c[a8+8>>2]=c[a4+8>>2];c[a8+12>>2]=c[a4+12>>2];a4=c[u+4>>2]|0;aX=(c[u+12>>2]|0)+1|0;a0=aX-a4|0;a2=c[a5>>2]|0;a1=c[a5+8>>2]|0;a5=u+16|0;c[a5>>2]=0;a$=u+20|0;c[a$>>2]=0;a_=u+24|0;c[a_>>2]=0;if((aX|0)==(a4|0)){bd=0}else{if(a0>>>0>536870911>>>0){mE(0)}a4=o8(a0<<3)|0;c[a$>>2]=a4;c[a5>>2]=a4;c[a_>>2]=a4+(a0<<3);a_=a2|0;a2=a1|0;a1=a0;a0=a4;do{if((a0|0)==0){be=0}else{a4=a0;c[a4>>2]=a_;c[a4+4>>2]=a2;be=a0}a0=be+8|0;a1=a1-1|0;}while((a1|0)!=0);c[a$>>2]=a0;bd=a0}a1=u+28|0;c[a1>>2]=0;a2=u+32|0;c[a2>>2]=0;c[u+36>>2]=0;a_=c[E>>2]|0;do{if((a_|0)==(c[K>>2]|0)){dU(A,u);a4=c[a1>>2]|0;if((a4|0)==0){break}aX=c[a2>>2]|0;if((a4|0)!=(aX|0)){c[a2>>2]=aX+(~((aX-4+(-a4|0)|0)>>>2)<<2)}pb(a4)}else{if((a_|0)==0){bf=0}else{a4=a_;c[a4>>2]=c[a8>>2];c[a4+4>>2]=c[a8+4>>2];c[a4+8>>2]=c[a8+8>>2];c[a4+12>>2]=c[a8+12>>2];a4=a_+16|0;c[a4>>2]=0;aX=a_+20|0;c[aX>>2]=0;aZ=a_+24|0;c[aZ>>2]=0;aY=c[a5>>2]|0;aW=bd-aY|0;aR=aW>>3;do{if((aR|0)!=0){if(aR>>>0>536870911>>>0){mE(0)}aU=o8(aW)|0;c[aX>>2]=aU;c[a4>>2]=aU;c[aZ>>2]=aU+(aR<<3);if((aY|0)==(bd|0)){break}else{bg=aY;bh=aU}do{if((bh|0)==0){bi=0}else{aU=bg;aV=bh;aT=c[aU+4>>2]|0;c[aV>>2]=c[aU>>2];c[aV+4>>2]=aT;bi=c[aX>>2]|0}bh=bi+8|0;c[aX>>2]=bh;bg=bg+8|0;}while((bg|0)!=(bd|0))}}while(0);c[a_+28>>2]=0;c[a_+32>>2]=0;c[a_+36>>2]=0;bf=c[E>>2]|0}c[E>>2]=bf+40}}while(0);a_=c[a5>>2]|0;a2=a_;if((a_|0)!=0){a1=c[a$>>2]|0;if((a_|0)!=(a1|0)){c[a$>>2]=a1+(~((a1-8+(-a2|0)|0)>>>3)<<3)}pb(a_)}a_=c[E>>2]|0;a2=c[O>>2]|0;a1=a_-40+32|0;a0=c[a1>>2]|0;if((a0|0)==(c[a_-40+36>>2]|0)){d0(a_-40+28|0,a2)}else{if((a0|0)==0){bj=0}else{c[a0>>2]=c[a2>>2];bj=c[a1>>2]|0}c[a1>>2]=bj+4}a1=c[P>>2]|0;L2645:do{if(a1-a2>>2>>>0>1>>>0){a0=a6*10|0;a_=w+12|0;aX=w+4|0;aY=w+16|0;aR=w+20|0;aZ=w+24|0;a4=w+28|0;aW=w+32|0;av=w+36|0;aw=a6<<1;ap=o|0;as=p|0;aT=q|0;aV=1;aU=a2;L2647:while(1){aS=c[aU+(aV<<2)>>2]|0;aQ=aS|0;L2649:do{if(((c[aS+12>>2]|0)+1-(c[aS+4>>2]|0)|0)>(a0|0)){if((aS|0)==0){break}eu(aS);pb(aS)}else{aP=c[E>>2]|0;aO=c[I>>2]|0;do{if((aP|0)==(aO|0)){bk=aP}else{aN=-1;au=0;aH=aO;while(1){do{if((gA(aH+(au*40|0)|0,aQ)|0)<(aw|0)){if((aN|0)<0){bl=au;bm=au;break}ak=c[I>>2]|0;gy(ak+(aN*40|0)|0,ak+(au*40|0)|0);c[ap>>2]=c[ak+(aN*40|0)+32>>2];aG=ak+(au*40|0)+28|0;c[as>>2]=c[aG>>2];aM=ak+(au*40|0)+32|0;c[aT>>2]=c[aM>>2];d_(s,ak+(aN*40|0)+28|0,o,p,q);ak=c[aG>>2]|0;aG=c[aM>>2]|0;if((ak|0)!=(aG|0)){c[aM>>2]=aG+(~((aG-4+(-ak|0)|0)>>>2)<<2)}ak=c[I>>2]|0;aG=(au*40|0|0)/40|0;aM=ak+(aG*40|0)|0;at=aG+1|0;aK=ak+(at*40|0)|0;ar=c[E>>2]|0;if((aK|0)==(ar|0)){bn=aM;bo=aK}else{aE=((ar+((-2-aG|0)*40|0)+(-ak|0)|0)>>>0)/40|0;aG=aM;aM=aK;while(1){aK=aG;aI=aM;c[aK>>2]=c[aI>>2];c[aK+4>>2]=c[aI+4>>2];c[aK+8>>2]=c[aI+8>>2];c[aK+12>>2]=c[aI+12>>2];dZ(aG+16|0,c[aM+16>>2]|0,c[aM+20>>2]|0);dY(aG+28|0,c[aM+28>>2]|0,c[aM+32>>2]|0);aI=aM+40|0;if((aI|0)==(ar|0)){break}else{aG=aG+40|0;aM=aI}}bn=ak+((aE+at|0)*40|0)|0;bo=c[E>>2]|0}if((bn|0)!=(bo|0)){aM=bo;do{c[E>>2]=aM-40;aG=c[aM-40+28>>2]|0;ar=aG;if((aG|0)!=0){aI=aM-40+32|0;aK=c[aI>>2]|0;if((aG|0)!=(aK|0)){c[aI>>2]=aK+(~((aK-4+(-ar|0)|0)>>>2)<<2)}pb(aG)}aG=c[aM-40+16>>2]|0;ar=aG;if((aG|0)!=0){aK=aM-40+20|0;aI=c[aK>>2]|0;if((aG|0)!=(aI|0)){c[aK>>2]=aI+(~((aI-8+(-ar|0)|0)>>>3)<<3)}pb(aG)}aM=c[E>>2]|0;}while((bn|0)!=(aM|0))}bl=au-1|0;bm=aN}else{bl=au;bm=aN}}while(0);aM=bl+1|0;bp=c[E>>2]|0;bq=c[I>>2]|0;if(aM>>>0<((bp-bq|0)/40|0)>>>0){aN=bm;au=aM;aH=bq}else{break}}if((bm|0)<=-1){bk=bp;break}gz(bq+(bm*40|0)|0,aQ);aH=c[I>>2]|0;c[v>>2]=aS;au=aH+(bm*40|0)+32|0;aN=c[au>>2]|0;if((aN|0)==(c[aH+(bm*40|0)+36>>2]|0)){d0(aH+(bm*40|0)+28|0,v);break L2649}if((aN|0)==0){br=0}else{c[aN>>2]=aS;br=c[au>>2]|0}c[au>>2]=br+4;break L2649}}while(0);aO=aS;c[a7>>2]=c[aO>>2];c[a7+4>>2]=c[aO+4>>2];c[a7+8>>2]=c[aO+8>>2];c[a7+12>>2]=c[aO+12>>2];aO=c[aX>>2]|0;aP=(c[a_>>2]|0)+1|0;au=aP-aO|0;aN=c[aS>>2]|0;aH=c[aS+8>>2]|0;c[aY>>2]=0;c[aR>>2]=0;c[aZ>>2]=0;if((aP|0)==(aO|0)){bs=bk}else{if(au>>>0>536870911>>>0){aB=2213;break L2647}aO=o8(au<<3)|0;c[aR>>2]=aO;c[aY>>2]=aO;c[aZ>>2]=aO+(au<<3);aP=aN|0;aN=aH|0;aH=au;au=aO;do{if((au|0)==0){bt=0}else{aO=au;c[aO>>2]=aP;c[aO+4>>2]=aN;bt=au}au=bt+8|0;aH=aH-1|0;}while((aH|0)!=0);c[aR>>2]=au;bs=c[E>>2]|0}c[a4>>2]=0;c[aW>>2]=0;c[av>>2]=0;if((bs|0)==(c[K>>2]|0)){dU(A,w)}else{do{if((bs|0)!=0){aH=bs;c[aH>>2]=c[a7>>2];c[aH+4>>2]=c[a7+4>>2];c[aH+8>>2]=c[a7+8>>2];c[aH+12>>2]=c[a7+12>>2];aH=bs+16|0;c[aH>>2]=0;aN=bs+20|0;c[aN>>2]=0;aP=bs+24|0;c[aP>>2]=0;aO=(c[aR>>2]|0)-(c[aY>>2]|0)|0;aM=aO>>3;do{if((aM|0)!=0){if(aM>>>0>536870911>>>0){aB=2227;break L2647}at=o8(aO)|0;c[aN>>2]=at;c[aH>>2]=at;c[aP>>2]=at+(aM<<3);aE=c[aY>>2]|0;ak=c[aR>>2]|0;if((aE|0)==(ak|0)){break}else{bu=aE;bv=at}do{if((bv|0)==0){bw=0}else{at=bu;aE=bv;aG=c[at+4>>2]|0;c[aE>>2]=c[at>>2];c[aE+4>>2]=aG;bw=c[aN>>2]|0}bv=bw+8|0;c[aN>>2]=bv;bu=bu+8|0;}while((bu|0)!=(ak|0))}}while(0);aN=bs+28|0;c[aN>>2]=0;aM=bs+32|0;c[aM>>2]=0;aP=bs+36|0;c[aP>>2]=0;aH=(c[aW>>2]|0)-(c[a4>>2]|0)|0;aO=aH>>2;if((aO|0)==0){break}if(aO>>>0>1073741823>>>0){aB=2242;break L2647}ak=o8(aH)|0;c[aM>>2]=ak;c[aN>>2]=ak;c[aP>>2]=ak+(aO<<2);aO=c[a4>>2]|0;aP=c[aW>>2]|0;if((aO|0)==(aP|0)){break}else{bx=aO;by=ak}do{if((by|0)==0){bz=0}else{c[by>>2]=c[bx>>2];bz=c[aM>>2]|0}by=bz+4|0;c[aM>>2]=by;bx=bx+4|0;}while((bx|0)!=(aP|0))}}while(0);c[E>>2]=(c[E>>2]|0)+40}au=c[a4>>2]|0;aP=au;if((au|0)!=0){aM=c[aW>>2]|0;if((au|0)!=(aM|0)){c[aW>>2]=aM+(~((aM-4+(-aP|0)|0)>>>2)<<2)}pb(au)}au=c[aY>>2]|0;aP=au;if((au|0)!=0){aM=c[aR>>2]|0;if((au|0)!=(aM|0)){c[aR>>2]=aM+(~((aM-8+(-aP|0)|0)>>>3)<<3)}pb(au)}au=c[E>>2]|0;c[x>>2]=aS;aP=au-40+32|0;aM=c[aP>>2]|0;if((aM|0)==(c[au-40+36>>2]|0)){d0(au-40+28|0,x);break}if((aM|0)==0){bA=0}else{c[aM>>2]=aS;bA=c[aP>>2]|0}c[aP>>2]=bA+4}}while(0);aS=aV+1|0;aQ=c[P>>2]|0;aP=c[O>>2]|0;if(aS>>>0<aQ-aP>>2>>>0){aV=aS;aU=aP}else{bB=aP;bC=aQ;break L2645}}if((aB|0)==2213){mE(0)}else if((aB|0)==2227){mE(0)}else if((aB|0)==2242){mE(0)}}else{bB=a2;bC=a1}}while(0);if((bB|0)!=(bC|0)){c[P>>2]=bC+(~((bC-4+(-bB|0)|0)>>>2)<<2)}a1=c[E>>2]|0;a2=c[I>>2]|0;if((a1|0)==(a2|0)){bD=0}else{bD=c[a2+12>>2]|0}a6=(a1-a2|0)/40|0;do{if(a6>>>0>1>>>0){a1=0;a$=0;a5=0;aU=bD;aV=1;aR=a2;L2771:while(1){do{if((c[aR+(aV*40|0)+4>>2]|0)>(aU|0)){if((a$|0)!=(a1|0)){if((a$|0)!=0){c[a$>>2]=aV}bE=a5;bF=a$+4|0;bG=a1;break}aY=a$-a5|0;aW=aY>>2;a4=aW+1|0;if(a4>>>0>1073741823>>>0){aB=2293;break L2771}if(aW>>>0>536870910>>>0){bH=1073741823;aB=2297}else{av=aY>>1;aZ=av>>>0<a4>>>0?a4:av;if((aZ|0)==0){bI=0;bJ=0}else{bH=aZ;aB=2297}}if((aB|0)==2297){aB=0;bI=o8(bH<<2)|0;bJ=bH}aZ=bI+(aW<<2)|0;aW=bI+(bJ<<2)|0;if((aZ|0)!=0){c[aZ>>2]=aV}aZ=bI+(a4<<2)|0;a4=bI;av=a5;pl(a4|0,av|0,aY)|0;if((a5|0)==0){bE=bI;bF=aZ;bG=aW;break}pb(av);bE=bI;bF=aZ;bG=aW}else{bE=a5;bF=a$;bG=a1}}while(0);aW=c[I>>2]|0;aZ=c[aW+(aV*40|0)+12>>2]|0;av=aV+1|0;bK=((c[E>>2]|0)-aW|0)/40|0;if(av>>>0<bK>>>0){a1=bG;a$=bF;a5=bE;aU=(aU|0)<(aZ|0)?aZ:aU;aV=av;aR=aW}else{break}}if((aB|0)==2293){mE(0)}if((bF|0)==(bG|0)){bL=bK;bM=bE;bN=bG;aB=2317;break}if((bF|0)!=0){c[bF>>2]=bK}bO=bE;bP=bF+4|0}else{bL=a6;bM=0;bN=0;aB=2317}}while(0);do{if((aB|0)==2317){a6=bN-bM|0;a2=a6>>2;aR=a2+1|0;if(aR>>>0>1073741823>>>0){mE(0)}if(a2>>>0>536870910>>>0){bQ=1073741823;aB=2322}else{aV=a6>>1;aU=aV>>>0<aR>>>0?aR:aV;if((aU|0)==0){bR=0}else{bQ=aU;aB=2322}}if((aB|0)==2322){bR=o8(bQ<<2)|0}aU=bR+(a2<<2)|0;if((aU|0)!=0){c[aU>>2]=bL}aU=bR+(aR<<2)|0;aR=bR;a2=bM;pl(aR|0,a2|0,a6)|0;if((bM|0)==0){bO=bR;bP=aU;break}pb(a2);bO=bR;bP=aU}}while(0);aU=bP-bO>>2;L2818:do{if((aU|0)!=0){a2=k|0;a6=l|0;aR=m|0;aV=t+16|0;a5=t+20|0;a$=t+24|0;a1=t+28|0;aW=t+32|0;av=t+36|0;aZ=0;aY=0;L2820:while(1){a4=c[bO+(aY<<2)>>2]|0;a_=aZ+1|0;aX=a_>>>0<a4>>>0;if(aX){aT=aZ;as=a_;while(1){ap=aT;aw=as;do{a0=c[I>>2]|0;aQ=dI(a0+(aw*40|0)|0,a0+(ap*40|0)|0)|0;ap=aQ?aw:ap;aw=aw+1|0;}while(aw>>>0<a4>>>0);do{if((ap|0)!=(aT|0)){aw=c[I>>2]|0;aQ=aw+(ap*40|0)|0;a0=aw+(aT*40|0)|0;c[a3>>2]=c[a0>>2];c[a3+4>>2]=c[a0+4>>2];c[a3+8>>2]=c[a0+8>>2];c[a3+12>>2]=c[a0+12>>2];aP=aw+(aT*40|0)+16|0;c[aV>>2]=0;c[a5>>2]=0;c[a$>>2]=0;aS=aw+(aT*40|0)+20|0;aM=aP|0;au=(c[aS>>2]|0)-(c[aM>>2]|0)|0;ak=au>>3;do{if((ak|0)!=0){if(ak>>>0>536870911>>>0){aB=2338;break L2820}aO=o8(au)|0;c[a5>>2]=aO;c[aV>>2]=aO;c[a$>>2]=aO+(ak<<3);aN=c[aM>>2]|0;aH=c[aS>>2]|0;if((aN|0)==(aH|0)){break}else{bS=aN;bU=aO}do{if((bU|0)==0){bV=0}else{aO=bS;aN=bU;aG=c[aO+4>>2]|0;c[aN>>2]=c[aO>>2];c[aN+4>>2]=aG;bV=c[a5>>2]|0}bU=bV+8|0;c[a5>>2]=bU;bS=bS+8|0;}while((bS|0)!=(aH|0))}}while(0);aS=aw+(aT*40|0)+28|0;c[a1>>2]=0;c[aW>>2]=0;c[av>>2]=0;aM=aw+(aT*40|0)+32|0;ak=aS|0;au=(c[aM>>2]|0)-(c[ak>>2]|0)|0;aH=au>>2;do{if((aH|0)!=0){if(aH>>>0>1073741823>>>0){aB=2352;break L2820}aG=o8(au)|0;c[aW>>2]=aG;c[a1>>2]=aG;c[av>>2]=aG+(aH<<2);aN=c[ak>>2]|0;aO=c[aM>>2]|0;if((aN|0)==(aO|0)){break}else{bW=aN;bX=aG}do{if((bX|0)==0){bY=0}else{c[bX>>2]=c[bW>>2];bY=c[aW>>2]|0}bX=bY+4|0;c[aW>>2]=bX;bW=bW+4|0;}while((bW|0)!=(aO|0))}}while(0);aM=aQ;c[a0>>2]=c[aM>>2];c[a0+4>>2]=c[aM+4>>2];c[a0+8>>2]=c[aM+8>>2];c[a0+12>>2]=c[aM+12>>2];dZ(aP,c[aw+(ap*40|0)+16>>2]|0,c[aw+(ap*40|0)+20>>2]|0);dY(aS,c[aw+(ap*40|0)+28>>2]|0,c[aw+(ap*40|0)+32>>2]|0);c[aM>>2]=c[a3>>2];c[aM+4>>2]=c[a3+4>>2];c[aM+8>>2]=c[a3+8>>2];c[aM+12>>2]=c[a3+12>>2];if((aQ|0)!=(t|0)){dZ(aw+(ap*40|0)+16|0,c[aV>>2]|0,c[a5>>2]|0);dY(aw+(ap*40|0)+28|0,c[a1>>2]|0,c[aW>>2]|0)}aM=c[a1>>2]|0;ak=aM;if((aM|0)!=0){aH=c[aW>>2]|0;if((aM|0)!=(aH|0)){c[aW>>2]=aH+(~((aH-4+(-ak|0)|0)>>>2)<<2)}pb(aM)}aM=c[aV>>2]|0;if((aM|0)==0){break}ak=c[a5>>2]|0;if((aM|0)!=(ak|0)){c[a5>>2]=ak+(~((ak-8+(-aM|0)|0)>>>3)<<3)}pb(aM)}}while(0);ap=as+1|0;if(ap>>>0<a4>>>0){aT=as;as=ap}else{break}}}as=a4-aZ|0;aT=as>>>0>1>>>0;ap=aZ>>>0<a4>>>0;L2869:do{if(aT&ap){aM=aZ;ak=c[I>>2]|0;while(1){if((c[ak+(aM*40|0)+32>>2]|0)-(c[ak+(aM*40|0)+28>>2]|0)>>2>>>0>80>>>0){bZ=a4;break L2869}aH=dL(ak+(aM*40|0)|0,ak+(aZ*40|0)|0)|0;au=c[I>>2]|0;if((aH|0)>((c[au+(aM*40|0)+12>>2]|0)+2-(c[au+(aM*40|0)+4>>2]|0)+(c[au+(aZ*40|0)+12>>2]|0)-(c[au+(aZ*40|0)+4>>2]|0)|0)){bZ=a4;break L2869}aH=aM+1|0;if(aH>>>0<a4>>>0){aM=aH;ak=au}else{b_=1;aB=2395;break}}}else{b_=aT;aB=2395}}while(0);do{if((aB|0)==2395){aB=0;if(b_&ap){aT=aZ;while(1){ak=c[I>>2]|0;aM=c[ak+(aT*40|0)+12>>2]|0;au=c[ak+(aT*40|0)+4>>2]|0;aH=(aM+1-au|0)<=((dX(ak+(aT*40|0)+28|0)|0)<<2|0);ak=aT+1|0;if(aH&ak>>>0<a4>>>0){aT=ak}else{b$=aH;break}}}else{b$=b_}if(!b$){bZ=a4;break}aT=c[I>>2]|0;if(aX){aH=a_;ak=aT;while(1){gy(ak+(aZ*40|0)|0,ak+(aH*40|0)|0);c[a2>>2]=c[ak+(aZ*40|0)+32>>2];au=ak+(aH*40|0)+28|0;c[a6>>2]=c[au>>2];aM=ak+(aH*40|0)+32|0;c[aR>>2]=c[aM>>2];d_(n,ak+(aZ*40|0)+28|0,k,l,m);aO=c[au>>2]|0;au=c[aM>>2]|0;if((aO|0)!=(au|0)){c[aM>>2]=au+(~((au-4+(-aO|0)|0)>>>2)<<2)}aO=aH+1|0;au=c[I>>2]|0;if(aO>>>0<a4>>>0){aH=aO;ak=au}else{b0=au;break}}}else{b0=aT}ak=b0;aH=(a_*40|0|0)/40|0;au=b0+(aH*40|0)|0;do{if((a_|0)!=(a4|0)){aO=(((a4-a_|0)*40|0|0)/40|0)+aH|0;aM=b0+(aO*40|0)|0;aG=c[E>>2]|0;if((aM|0)==(aG|0)){b1=au;b2=aM}else{aN=aH+1+(((aG+(~aO*40|0)+(-ak|0)|0)>>>0)/40|0)|0;aO=au;aE=aM;while(1){aM=aO;at=aE;c[aM>>2]=c[at>>2];c[aM+4>>2]=c[at+4>>2];c[aM+8>>2]=c[at+8>>2];c[aM+12>>2]=c[at+12>>2];if((aO|0)!=(aE|0)){dZ(aO+16|0,c[aE+16>>2]|0,c[aE+20>>2]|0);dY(aO+28|0,c[aE+28>>2]|0,c[aE+32>>2]|0)}at=aE+40|0;if((at|0)==(aG|0)){break}else{aO=aO+40|0;aE=at}}b1=b0+(aN*40|0)|0;b2=c[E>>2]|0}if((b1|0)==(b2|0)){break}else{b3=b2}do{c[E>>2]=b3-40;aE=c[b3-40+28>>2]|0;aO=aE;if((aE|0)!=0){aG=b3-40+32|0;aw=c[aG>>2]|0;if((aE|0)!=(aw|0)){c[aG>>2]=aw+(~((aw-4+(-aO|0)|0)>>>2)<<2)}pb(aE)}aE=c[b3-40+16>>2]|0;aO=aE;if((aE|0)!=0){aw=b3-40+20|0;aG=c[aw>>2]|0;if((aE|0)!=(aG|0)){c[aw>>2]=aG+(~((aG-8+(-aO|0)|0)>>>3)<<3)}pb(aE)}b3=c[E>>2]|0;}while((b1|0)!=(b3|0))}}while(0);au=1-as|0;ak=aY;while(1){aH=bO+(ak<<2)|0;c[aH>>2]=au+(c[aH>>2]|0);aH=ak+1|0;if(aH>>>0<aU>>>0){ak=aH}else{bZ=a_;break}}}}while(0);a_=aY+1|0;if(a_>>>0<aU>>>0){aZ=bZ;aY=a_}else{break L2818}}if((aB|0)==2338){mE(0)}else if((aB|0)==2352){mE(0)}}}while(0);if((bO|0)==0){break}pb(bO)}}while(0);if(!al){break}a3=c[E>>2]|0;a7=c[I>>2]|0;if(((a3-a7|0)/40|0)>>>0<2>>>0|(a3|0)==(a7|0)){break}else{b4=0;b5=a7}do{dT(b5+(b4*40|0)|0,b5+(b4*40|0)+28|0);b4=b4+1|0;b5=c[I>>2]|0;}while(b4>>>0<(((c[E>>2]|0)-b5|0)/40|0)>>>0)}else{bb=c[T>>2]|0;bc=c[R>>2]|0;aB=2433}}while(0);if((aB|0)==2433){c[L>>2]=c[F>>2];c[L+4>>2]=c[F+4>>2];c[L+8>>2]=c[F+8>>2];c[L+12>>2]=c[F+12>>2];aB=c[z+4>>2]|0;R=(c[z+12>>2]|0)+1|0;T=R-aB|0;b5=z+16|0;c[b5>>2]=0;b4=z+20|0;c[b4>>2]=0;al=z+24|0;c[al>>2]=0;if((R|0)==(aB|0)){b6=0}else{if(T>>>0>536870911>>>0){mE(0)}aB=o8(T<<3)|0;c[b4>>2]=aB;c[b5>>2]=aB;c[al>>2]=aB+(T<<3);al=bb|0;bb=bc|0;bc=T;T=aB;do{if((T|0)==0){b7=0}else{aB=T;c[aB>>2]=al;c[aB+4>>2]=bb;b7=T}T=b7+8|0;bc=bc-1|0;}while((bc|0)!=0);c[b4>>2]=T;b6=T}T=z+28|0;c[T>>2]=0;bc=z+32|0;c[bc>>2]=0;c[z+36>>2]=0;b7=c[E>>2]|0;do{if((b7|0)==(c[K>>2]|0)){dU(A,z);bb=c[T>>2]|0;if((bb|0)==0){break}al=c[bc>>2]|0;if((bb|0)!=(al|0)){c[bc>>2]=al+(~((al-4+(-bb|0)|0)>>>2)<<2)}pb(bb)}else{if((b7|0)==0){b8=0}else{bb=b7;c[bb>>2]=c[L>>2];c[bb+4>>2]=c[L+4>>2];c[bb+8>>2]=c[L+8>>2];c[bb+12>>2]=c[L+12>>2];bb=b7+16|0;c[bb>>2]=0;al=b7+20|0;c[al>>2]=0;aB=b7+24|0;c[aB>>2]=0;R=c[b5>>2]|0;bO=b6-R|0;bZ=bO>>3;do{if((bZ|0)!=0){if(bZ>>>0>536870911>>>0){mE(0)}b3=o8(bO)|0;c[al>>2]=b3;c[bb>>2]=b3;c[aB>>2]=b3+(bZ<<3);if((R|0)==(b6|0)){break}else{b9=R;ca=b3}do{if((ca|0)==0){cb=0}else{b3=b9;b1=ca;b2=c[b3+4>>2]|0;c[b1>>2]=c[b3>>2];c[b1+4>>2]=b2;cb=c[al>>2]|0}ca=cb+8|0;c[al>>2]=ca;b9=b9+8|0;}while((b9|0)!=(b6|0))}}while(0);c[b7+28>>2]=0;c[b7+32>>2]=0;c[b7+36>>2]=0;b8=c[E>>2]|0}c[E>>2]=b8+40}}while(0);b8=c[b5>>2]|0;b5=b8;if((b8|0)!=0){b7=c[b4>>2]|0;if((b8|0)!=(b7|0)){c[b4>>2]=b7+(~((b7-8+(-b5|0)|0)>>>3)<<3)}pb(b8)}b8=c[E>>2]|0;b5=b8-40+28|0;b7=c[b5>>2]|0;c[b5>>2]=c[O>>2];c[O>>2]=b7;b7=b8-40+32|0;b5=c[b7>>2]|0;c[b7>>2]=c[P>>2];c[P>>2]=b5;b5=b8-40+36|0;b8=c[b5>>2]|0;c[b5>>2]=c[Q>>2];c[Q>>2]=b8}b8=c[E>>2]|0;Q=c[I>>2]|0;if((b8|0)!=(Q|0)){b5=0;b7=Q;Q=b8;while(1){b8=b7+(b5*40|0)+32|0;b4=b7+(b5*40|0)+28|0;b6=c[b4>>2]|0;if((c[b8>>2]|0)==(b6|0)){cc=Q;cd=b7}else{b9=0;ca=b6;do{eG(c[ca+(b9<<2)>>2]|0);b9=b9+1|0;ca=c[b4>>2]|0;}while(b9>>>0<(c[b8>>2]|0)-ca>>2>>>0);cc=c[E>>2]|0;cd=c[I>>2]|0}ca=b5+1|0;if(ca>>>0<((cc-cd|0)/40|0)>>>0){b5=ca;b7=cd;Q=cc}else{break}}}if((ae|0)!=0){pb(ae)}if((ad|0)!=0){pb(ad)}ad=c[O>>2]|0;O=ad;if((ad|0)!=0){ae=c[P>>2]|0;if((ad|0)!=(ae|0)){c[P>>2]=ae+(~((ae-4+(-O|0)|0)>>>2)<<2)}pb(ad)}if((c[3108]|0)>0){ad=c[r>>2]|0;O=((c[E>>2]|0)-(c[I>>2]|0)|0)/40|0;bT(ad|0,1832,(ce=i,i=i+8|0,c[ce>>2]=O,ce)|0)|0;i=ce}L3008:do{if((J|0)>97){O=c[g+8>>2]|0;if((O|0)==0){break}ad=((c[E>>2]|0)-(c[I>>2]|0)|0)/40|0;bT(O|0,664,(ce=i,i=i+8|0,c[ce>>2]=ad,ce)|0)|0;i=ce;ad=c[E>>2]|0;ae=c[I>>2]|0;if((ad|0)==(ae|0)){cf=0}else{P=(ad-ae|0)/40|0;ad=0;cc=0;while(1){Q=((c[ae+(cc*40|0)+32>>2]|0)-(c[ae+(cc*40|0)+28>>2]|0)>>2)+ad|0;cd=cc+1|0;if(cd>>>0<P>>>0){ad=Q;cc=cd}else{cf=Q;break}}}bT(O|0,376,(ce=i,i=i+8|0,c[ce>>2]=cf,ce)|0)|0;i=ce;cc=c[E>>2]|0;ad=c[I>>2]|0;if((cc|0)==(ad|0)){break}P=0;ae=ad;Q=(cc-ad|0)/40|0;while(1){ad=P+1|0;bT(O|0,144,(ce=i,i=i+16|0,c[ce>>2]=ad,c[ce+8>>2]=Q,ce)|0)|0;i=ce;cc=(c[ae+(P*40|0)+12>>2]|0)+1-(c[ae+(P*40|0)+4>>2]|0)|0;bT(O|0,4496,(ce=i,i=i+16|0,c[ce>>2]=(c[ae+(P*40|0)+8>>2]|0)+1-(c[ae+(P*40|0)>>2]|0),c[ce+8>>2]=cc,ce)|0)|0;i=ce;cc=c[I>>2]|0;bT(O|0,4024,(ce=i,i=i+8|0,c[ce>>2]=(c[cc+(P*40|0)+32>>2]|0)-(c[cc+(P*40|0)+28>>2]|0)>>2,ce)|0)|0;i=ce;cc=ae+(P*40|0)+32|0;cd=ae+(P*40|0)+28|0;b7=c[cd>>2]|0;if((c[cc>>2]|0)!=(b7|0)){b5=0;ca=b7;do{eE(c[ca+(b5<<2)>>2]|0,O);b5=b5+1|0;ca=c[cd>>2]|0;}while(b5>>>0<(c[cc>>2]|0)-ca>>2>>>0)}ca=c[I>>2]|0;cc=((c[E>>2]|0)-ca|0)/40|0;if(ad>>>0<cc>>>0){P=ad;ae=ca;Q=cc}else{break}}}else{if((J|0)>95|(J-90|0)>>>0<4>>>0){break}Q=c[I>>2]|0;if((c[E>>2]|0)!=(Q|0)){ae=(J|0)<90;P=g|0;O=g+4|0;cc=0;ca=Q;do{Q=o8(28)|0;b5=Q;eK(b5,D,ca+(cc*40|0)|0,ca+(cc*40|0)+28|0);c[B>>2]=b5;cd=c[Q+20>>2]|0;b7=c[Q+16>>2]|0;if((cd|0)!=(b7|0)&ae){eN(b5,P,O);cg=c[Q+20>>2]|0;ch=c[Q+16>>2]|0}else{cg=cd;ch=b7}do{if((cg|0)==(ch|0)){if((Q|0)==0){break}eM(b5);pb(Q)}else{b7=c[H>>2]|0;if((b7|0)==(c[f>>2]|0)){dQ(G,B);break}if((b7|0)==0){ci=0}else{c[b7>>2]=b5;ci=c[H>>2]|0}c[H>>2]=ci+4}}while(0);cc=cc+1|0;ca=c[I>>2]|0;}while(cc>>>0<(((c[E>>2]|0)-ca|0)/40|0)>>>0)}if((J|0)==0){break}ca=g+8|0;if((c[ca>>2]|0)==0){break}if((J|0)>85){cc=(J|0)>87;O=(J&1|0)!=0;P=b+28|0;ae=c[P>>2]|0;if(((c[H>>2]|0)-ae|0)>0){cj=0;ck=ae}else{break}while(1){eP(c[ck+(cj<<2)>>2]|0,g,cc,O);cj=cj+1|0;ck=c[P>>2]|0;if((cj|0)>=((c[H>>2]|0)-ck>>2|0)){break L3008}}}P=J-70|0;if(P>>>0>=8>>>0){break}O=C;c[O>>2]=c[F>>2];c[O+4>>2]=c[F+4>>2];c[O+8>>2]=c[F+8>>2];c[O+12>>2]=c[F+12>>2];dS(C+16|0,e+16|0);a[C+28|0]=a[e+28|0]|0;a[C+29|0]=a[M]|0;do{if((P&1|0)!=0){O=c[I>>2]|0;if((c[E>>2]|0)==(O|0)){break}if((J|0)==71){cc=0;ae=O;do{da(C,ae+(cc*40|0)|0);cc=cc+1|0;ae=c[I>>2]|0;}while(cc>>>0<(((c[E>>2]|0)-ae|0)/40|0)>>>0)}else{ae=0;cc=O;do{db(C,cc+(ae*40|0)|0);ae=ae+1|0;cc=c[I>>2]|0;}while(ae>>>0<(((c[E>>2]|0)-cc|0)/40|0)>>>0)}}}while(0);do{if((P&2|0)!=0){cc=b+28|0;ae=c[cc>>2]|0;if(((c[H>>2]|0)-ae|0)>0){cl=0;cm=ae}else{break}do{eR(c[cm+(cl<<2)>>2]|0,C);cl=cl+1|0;cm=c[cc>>2]|0;}while((cl|0)<((c[H>>2]|0)-cm>>2|0))}}while(0);do{if((P&4|0)!=0){cc=b+28|0;ae=c[cc>>2]|0;if(((c[H>>2]|0)-ae|0)>0){cn=0;co=ae}else{break}do{eQ(c[co+(cn<<2)>>2]|0,C);cn=cn+1|0;co=c[cc>>2]|0;}while((cn|0)<((c[H>>2]|0)-co>>2|0))}}while(0);c3(C,c[ca>>2]|0,a[g+20|0]|0)|0;P=C+16|0;cc=c[P>>2]|0;if((cc|0)==0){break}ae=C+20|0;O=c[ae>>2]|0;if((cc|0)==(O|0)){cp=cc}else{b5=O;while(1){O=b5-12|0;c[ae>>2]=O;Q=c[O>>2]|0;if((Q|0)==0){cq=O}else{O=b5-12+4|0;if((Q|0)!=(c[O>>2]|0)){c[O>>2]=Q}pb(Q);cq=c[ae>>2]|0}if((cc|0)==(cq|0)){break}else{b5=cq}}cp=c[P>>2]|0}pb(cp)}}while(0);dR(A|0);i=j;return}function dO(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=b+32|0;e=b+28|0;f=c[e>>2]|0;g=(c[d>>2]|0)-f|0;if((g|0)>0){h=g>>2;g=f;while(1){i=h-1|0;j=c[g+(i<<2)>>2]|0;if((j|0)==0){k=g}else{eM(j);pb(j);k=c[e>>2]|0}if((i|0)>0){h=i;g=k}else{l=k;break}}}else{l=f}f=l;if((l|0)!=0){k=c[d>>2]|0;if((l|0)!=(k|0)){c[d>>2]=k+(~((k-4+(-f|0)|0)>>>2)<<2)}pb(l)}if((a[b+16|0]&1)==0){return}pb(c[b+24>>2]|0);return}function dP(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((b|0)<0){d=a+28|0}else{e=a+28|0;f=c[e>>2]|0;if(((c[a+32>>2]|0)-f>>2|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}}while(0);gM(3360);g=c[d>>2]|0;h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}function dQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=f;h=(c[d>>2]|0)-g|0;i=h>>2;j=i+1|0;if(j>>>0>1073741823>>>0){mE(0)}k=a+8|0;a=(c[k>>2]|0)-g|0;if(a>>2>>>0>536870910>>>0){l=1073741823;m=2632}else{g=a>>1;a=g>>>0<j>>>0?j:g;if((a|0)==0){n=0;o=0}else{l=a;m=2632}}if((m|0)==2632){n=o8(l<<2)|0;o=l}l=n+(i<<2)|0;i=n+(o<<2)|0;if((l|0)!=0){c[l>>2]=c[b>>2]}b=n+(j<<2)|0;j=n;l=f;pl(j|0,l|0,h)|0;c[e>>2]=n;c[d>>2]=b;c[k>>2]=i;if((f|0)==0){return}pb(l);return}function dR(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a|0;d=c[b>>2]|0;if((d|0)==0){return}e=a+4|0;a=c[e>>2]|0;if((d|0)==(a|0)){f=d}else{g=a;do{c[e>>2]=g-40;a=c[g-40+28>>2]|0;h=a;if((a|0)!=0){i=g-40+32|0;j=c[i>>2]|0;if((a|0)!=(j|0)){c[i>>2]=j+(~((j-4+(-h|0)|0)>>>2)<<2)}pb(a)}a=c[g-40+16>>2]|0;h=a;if((a|0)!=0){j=g-40+20|0;i=c[j>>2]|0;if((a|0)!=(i|0)){c[j>>2]=i+(~((i-8+(-h|0)|0)>>>3)<<3)}pb(a)}g=c[e>>2]|0;}while((d|0)!=(g|0));f=c[b>>2]|0}pb(f);return}function dS(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=b|0;c[e>>2]=0;f=b+4|0;c[f>>2]=0;g=b+8|0;c[g>>2]=0;b=d+4|0;h=c[b>>2]|0;i=d|0;d=c[i>>2]|0;if((h|0)==(d|0)){return}j=h-d|0;d=(j|0)/12|0;if(d>>>0>357913941>>>0){mE(0)}h=o8(j)|0;c[f>>2]=h;c[e>>2]=h;c[g>>2]=h+(d*12|0);d=c[i>>2]|0;i=c[b>>2]|0;if((d|0)==(i|0)){return}else{k=d;l=h}L3173:while(1){if((l|0)==0){m=0}else{h=l|0;c[h>>2]=0;d=l+4|0;c[d>>2]=0;b=l+8|0;c[b>>2]=0;g=k+4|0;e=c[g>>2]|0;j=k|0;n=c[j>>2]|0;do{if((e|0)!=(n|0)){o=e-n|0;if((o|0)<0){break L3173}p=o8(o)|0;c[d>>2]=p;c[h>>2]=p;c[b>>2]=p+o;o=c[j>>2]|0;q=c[g>>2]|0;if((o|0)==(q|0)){break}else{r=o;s=p}do{if((s|0)==0){t=0}else{a[s]=a[r]|0;t=c[d>>2]|0}s=t+1|0;c[d>>2]=s;r=r+1|0;}while((r|0)!=(q|0))}}while(0);m=c[f>>2]|0}d=m+12|0;c[f>>2]=d;g=k+12|0;if((g|0)==(i|0)){u=2694;break}else{k=g;l=d}}if((u|0)==2694){return}mE(0)}function dT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;d=b+4|0;e=c[d>>2]|0;f=b|0;b=c[f>>2]|0;if((e|0)==(b|0)){return}g=a+8|0;h=a|0;i=a+12|0;j=a+4|0;a=0;k=b;b=e;l=0;m=e;L3196:while(1){e=l<<2>>2;n=a<<2>>2;o=n+1|0;p=k;q=b;r=m;while(1){s=c[p+(a<<2)>>2]|0;t=s|0;u=s+8|0;v=s|0;if(((c[u>>2]|0)+1-(c[v>>2]|0)<<1|0)<((c[g>>2]|0)+1-(c[h>>2]|0)|0)){break}w=p+(o<<2)|0;x=q-w|0;y=x>>2;z=p+(n<<2)|0;A=w;pn(z|0,A|0,x|0)|0;x=c[d>>2]|0;if((p+(y+n<<2)|0)!=(x|0)){c[d>>2]=x+(~((x-4+(-(p+(e+y<<2)|0)|0)|0)>>>2)<<2)}y=s|0;x=(ee(y)|0)<<2;A=s+12|0;z=c[A>>2]|0;w=s+4|0;B=c[w>>2]|0;C=z+1-B|0;D=c[u>>2]|0;E=c[v>>2]|0;F=D+1-E|0;L3204:do{if((x|0)>(ag(C*3|0,F)|0)){G=D;H=E;I=z;J=B;K=2721}else{L=c[f>>2]|0;M=(c[d>>2]|0)-L>>2;L3206:do{if(a>>>0<M>>>0){N=0;O=a;while(1){P=c[L+(O<<2)>>2]|0;Q=c[P+4>>2]|0;if((Q|0)>(z|0)){R=N;break L3206}S=((ag((c[P+8>>2]|0)+1-(c[P>>2]|0)|0,1-Q+(c[P+12>>2]|0)|0)|0)>15)+N|0;P=O+1|0;if(P>>>0<M>>>0){N=S;O=P}else{R=S;break}}}else{R=0}}while(0);if((R|0)>((ag(F,C)|0)/400|0|0)){G=D;H=E;I=z;J=B;K=2721;break}M=(ee(y)|0)<<2;if((M|0)<=(ag((c[u>>2]|0)+1-(c[v>>2]|0)|0,(c[A>>2]|0)+1-(c[w>>2]|0)|0)|0)){if((s|0)==0){break}eu(s);pb(s);break}eG(s);M=s+32|0;L=s+28|0;O=(c[M>>2]|0)-(c[L>>2]|0)|0;N=c[A>>2]|0;S=c[w>>2]|0;P=N+1-S|0;Q=c[u>>2]|0;T=c[v>>2]|0;U=Q+1-T|0;if((O>>2|0)<(((U|0)<(P|0)?U:P)|0)&(O|0)>0){V=0}else{G=Q;H=T;I=N;J=S;K=2721;break}while(1){S=eA(s,V)|0;N=ag((c[S+12>>2]|0)+1-(c[S+4>>2]|0)<<2,(c[S+8>>2]|0)+1-(c[S>>2]|0)|0)|0;S=c[A>>2]|0;T=c[w>>2]|0;Q=c[u>>2]|0;O=c[v>>2]|0;if((N|0)<(ag(Q+1-O|0,S+1-T|0)|0)){W=Q;X=O;Y=S;Z=T}else{T=(ee(eA(s,V)|0)|0)<<2;S=c[A>>2]|0;O=c[w>>2]|0;Q=c[u>>2]|0;N=c[v>>2]|0;if((T|0)<(ag(Q+1-N|0,S+1-O|0)|0)){W=Q;X=N;Y=S;Z=O}else{break}}O=V+1|0;if((O|0)<((c[M>>2]|0)-(c[L>>2]|0)>>2|0)){V=O}else{G=W;H=X;I=Y;J=Z;K=2721;break L3204}}if((s|0)==0){break}eu(s);pb(s)}}while(0);do{if((K|0)==2721){K=0;if(((G+1-H|0)*5|0|0)>((c[g>>2]|0)+1-(c[h>>2]|0)<<2|0)){if(((I+1-J|0)*5|0|0)>((c[i>>2]|0)+1-(c[j>>2]|0)<<2|0)){K=2723;break L3196}}v=c[f>>2]|0;u=(c[d>>2]|0)-v>>2;L3230:do{if(u>>>0>a>>>0){w=u;A=u+1073741823|0;y=v;while(1){B=A<<2>>2;z=w-1|0;E=c[y+(z<<2)>>2]|0;do{if(dv(t,E|0)|0){if((E|0)!=0){eu(E);pb(E)}D=c[f>>2]|0;C=z<<2>>2;F=D+(C+1<<2)|0;x=(c[d>>2]|0)-F|0;L=x>>2;M=D+(C<<2)|0;O=F;pn(M|0,O|0,x|0)|0;x=c[d>>2]|0;if((D+(L+C<<2)|0)==(x|0)){break}c[d>>2]=x+(~((x-4+(-(D+(L+B<<2)|0)|0)|0)>>>2)<<2)}}while(0);if(z>>>0<=a>>>0){break L3230}w=z;A=A+1073741823&1073741823;y=c[f>>2]|0}}}while(0);if((s|0)==0){break}eu(s);pb(s)}}while(0);t=c[d>>2]|0;v=c[f>>2]|0;u=t;if(a>>>0<u-v>>2>>>0){p=v;q=u;r=t}else{K=2754;break L3196}}q=a+1|0;e=r;if(q>>>0<e-p>>2>>>0){a=q;k=p;b=e;l=l+1&1073741823;m=r}else{K=2752;break}}if((K|0)==2752){return}else if((K|0)==2754){return}else if((K|0)==2723){K=c[d>>2]|0;m=c[f>>2]|0;do{if((K|0)!=(m|0)){l=0;b=m;k=K;while(1){a=c[b+(l<<2)>>2]|0;if((a|0)==0){_=k;$=b}else{eu(a);pb(a);_=c[d>>2]|0;$=c[f>>2]|0}a=l+1|0;if(a>>>0<_-$>>2>>>0){l=a;b=$;k=_}else{break}}if(($|0)==(_|0)){break}c[d>>2]=_+(~((_-4+(-$|0)|0)>>>2)<<2)}}while(0);if((s|0)==0){return}eu(s);pb(s);return}}function dU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=a+4|0;e=c[d>>2]|0;f=a|0;g=c[f>>2]|0;h=g;i=(e-h|0)/40|0;j=i+1|0;if(j>>>0>107374182>>>0){mE(0)}k=a+8|0;a=((c[k>>2]|0)-h|0)/40|0;if(a>>>0>53687090>>>0){l=107374182;m=2761}else{h=a<<1;a=h>>>0<j>>>0?j:h;if((a|0)==0){n=0;o=0}else{l=a;m=2761}}if((m|0)==2761){n=o8(l*40|0)|0;o=l}l=n+(i*40|0)|0;m=n+(o*40|0)|0;if((l|0)==0){p=g;q=e}else{e=l;g=b;c[e>>2]=c[g>>2];c[e+4>>2]=c[g+4>>2];c[e+8>>2]=c[g+8>>2];c[e+12>>2]=c[g+12>>2];dW(n+(i*40|0)+16|0,b+16|0);dV(n+(i*40|0)+28|0,b+28|0);p=c[f>>2]|0;q=c[d>>2]|0}b=n+(j*40|0)|0;do{if((q|0)==(p|0)){c[f>>2]=l;c[d>>2]=b;c[k>>2]=m;r=q}else{j=q;n=l;while(1){s=n-40|0;i=j-40|0;if((s|0)!=0){g=s;e=i;c[g>>2]=c[e>>2];c[g+4>>2]=c[e+4>>2];c[g+8>>2]=c[e+8>>2];c[g+12>>2]=c[e+12>>2];dW(n-40+16|0,j-40+16|0);dV(n-40+28|0,j-40+28|0)}if((i|0)==(p|0)){break}else{j=i;n=s}}n=c[f>>2]|0;j=c[d>>2]|0;c[f>>2]=s;c[d>>2]=b;c[k>>2]=m;if((n|0)==(j|0)){r=n;break}else{t=j}while(1){j=t-40|0;i=c[t-40+28>>2]|0;e=i;if((i|0)!=0){g=t-40+32|0;o=c[g>>2]|0;if((i|0)!=(o|0)){c[g>>2]=o+(~((o-4+(-e|0)|0)>>>2)<<2)}pb(i)}i=c[t-40+16>>2]|0;e=i;if((i|0)!=0){o=t-40+20|0;g=c[o>>2]|0;if((i|0)!=(g|0)){c[o>>2]=g+(~((g-8+(-e|0)|0)>>>3)<<3)}pb(i)}if((n|0)==(j|0)){r=n;break}else{t=j}}}}while(0);if((r|0)==0){return}pb(r);return}function dV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;a=b+4|0;g=b|0;b=(c[a>>2]|0)-(c[g>>2]|0)|0;h=b>>2;if((h|0)==0){return}if(h>>>0>1073741823>>>0){mE(0)}i=o8(b)|0;c[e>>2]=i;c[d>>2]=i;c[f>>2]=i+(h<<2);h=c[g>>2]|0;g=c[a>>2]|0;if((h|0)==(g|0)){return}else{j=h;k=i}do{if((k|0)==0){l=0}else{c[k>>2]=c[j>>2];l=c[e>>2]|0}k=l+4|0;c[e>>2]=k;j=j+4|0;}while((j|0)!=(g|0));return}function dW(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;a=b+4|0;g=b|0;b=(c[a>>2]|0)-(c[g>>2]|0)|0;h=b>>3;if((h|0)==0){return}if(h>>>0>536870911>>>0){mE(0)}i=o8(b)|0;c[e>>2]=i;c[d>>2]=i;c[f>>2]=i+(h<<3);h=c[g>>2]|0;g=c[a>>2]|0;if((h|0)==(g|0)){return}else{j=h;k=i}do{if((k|0)==0){l=0}else{i=j;h=k;a=c[i+4>>2]|0;c[h>>2]=c[i>>2];c[h+4>>2]=a;l=c[e>>2]|0}k=l+8|0;c[e>>2]=k;j=j+8|0;}while((j|0)!=(g|0));return}function dX(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;b=i;i=i+16|0;d=b|0;e=d|0;c[e>>2]=0;f=d+4|0;c[f>>2]=0;c[d+8>>2]=0;g=a+4|0;h=c[g>>2]|0;j=a|0;a=c[j>>2]|0;if((h|0)==(a|0)){k=0;i=b;return k|0}else{l=0;m=0;n=a;o=h}while(1){h=c[n+(l<<2)>>2]|0;a=(c[h+12>>2]|0)+1-(c[h+4>>2]|0)|0;if(a>>>0>9>>>0&((c[h+8>>2]|0)+1-(c[h>>2]|0)|0)>>>0<(a*3|0)>>>0){h=c[f>>2]|0;p=c[e>>2]|0;q=h-p>>2;do{if(a>>>0<q>>>0){r=p}else{s=a+1|0;if(q>>>0<s>>>0){d$(d,s-q|0);r=c[e>>2]|0;break}if(q>>>0<=s>>>0){r=p;break}t=p+(s<<2)|0;if((t|0)==(h|0)){r=p;break}c[f>>2]=h+(~((h-4+(-t|0)|0)>>>2)<<2);r=p}}while(0);p=r+(a<<2)|0;c[p>>2]=(c[p>>2]|0)+1;u=m+1|0;v=c[g>>2]|0;w=c[j>>2]|0}else{u=m;v=o;w=n}p=l+1|0;if(p>>>0<v-w>>2>>>0){l=p;m=u;n=w;o=v}else{break}}o=c[f>>2]|0;n=c[e>>2]|0;do{if((o|0)==(n|0)){if((v|0)==(w|0)){x=0;y=n;z=n;break}else{A=0;B=u;C=w;D=n;E=n}while(1){m=c[C+(A<<2)>>2]|0;l=(c[m+12>>2]|0)+1-(c[m+4>>2]|0)|0;m=D-E>>2;do{if(l>>>0<m>>>0){F=E}else{r=l+1|0;if(m>>>0<r>>>0){d$(d,r-m|0);F=c[e>>2]|0;break}if(m>>>0<=r>>>0){F=E;break}p=E+(r<<2)|0;if((p|0)==(D|0)){F=E;break}c[f>>2]=D+(~((D-4+(-p|0)|0)>>>2)<<2);F=E}}while(0);m=F+(l<<2)|0;c[m>>2]=(c[m>>2]|0)+1;m=B+1|0;p=A+1|0;r=c[j>>2]|0;h=c[f>>2]|0;q=c[e>>2]|0;if(p>>>0<(c[g>>2]|0)-r>>2>>>0){A=p;B=m;C=r;D=h;E=q}else{G=m;H=h;I=q;J=2873;break}}}else{G=u;H=o;I=n;J=2873}}while(0);do{if((J|0)==2873){if((H|0)==(I|0)){x=0;y=I;z=I;break}n=H-I>>2;o=G*9|0;u=0;E=0;D=0;C=0;while(1){B=c[I+(E<<2)>>2]|0;A=B+D|0;if((A*10|0)>>>0>=G>>>0&(D*10|0)>>>0<o>>>0){K=(ag(B,E)|0)+C|0;L=B+u|0}else{K=C;L=u}B=E+1|0;if(B>>>0<n>>>0){u=L;E=B;D=A;C=K}else{break}}if((L|0)==0){x=K;y=I;z=H;break}x=(K|0)/(L|0)|0;y=I;z=H}}while(0);if((y|0)==0){k=x;i=b;return k|0}if((y|0)!=(z|0)){c[f>>2]=z+(~((z-4+(-y|0)|0)>>>2)<<2)}pb(y);k=x;i=b;return k|0}function dY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=b;f=d-e>>2;g=a+8|0;h=c[g>>2]|0;i=a|0;j=c[i>>2]|0;k=j;if(f>>>0<=h-k>>2>>>0){l=a+4|0;m=(c[l>>2]|0)-k|0;n=m>>2;if(f>>>0<=n>>>0){o=d-e|0;e=o>>2;p=j;q=b;pn(p|0,q|0,o|0)|0;o=j+(e<<2)|0;e=c[l>>2]|0;if((o|0)==(e|0)){return}c[l>>2]=e+(~((e-4+(-o|0)|0)>>>2)<<2);return}o=b+(n<<2)|0;n=j;e=b;pn(n|0,e|0,m|0)|0;if((o|0)==(d|0)){return}m=o;o=c[l>>2]|0;do{if((o|0)==0){r=0}else{c[o>>2]=c[m>>2];r=c[l>>2]|0}o=r+4|0;c[l>>2]=o;m=m+4|0;}while((m|0)!=(d|0));return}if((j|0)==0){s=h}else{h=a+4|0;m=c[h>>2]|0;if((j|0)!=(m|0)){c[h>>2]=m+(~((m-4+(-k|0)|0)>>>2)<<2)}pb(j);c[g>>2]=0;c[h>>2]=0;c[i>>2]=0;s=0}if(f>>>0>1073741823>>>0){mE(0)}h=s;do{if(h>>2>>>0>536870910>>>0){t=1073741823}else{s=h>>1;j=s>>>0<f>>>0?f:s;if(j>>>0<=1073741823>>>0){t=j;break}mE(0)}}while(0);f=o8(t<<2)|0;h=a+4|0;c[h>>2]=f;c[i>>2]=f;c[g>>2]=f+(t<<2);if((b|0)==(d|0)){return}else{u=b;v=f}do{if((v|0)==0){w=0}else{c[v>>2]=c[u>>2];w=c[h>>2]|0}v=w+4|0;c[h>>2]=v;u=u+4|0;}while((u|0)!=(d|0));return}function dZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=b;f=d-e>>3;g=a+8|0;h=c[g>>2]|0;i=a|0;j=c[i>>2]|0;k=j;if(f>>>0<=h-k>>3>>>0){l=a+4|0;m=(c[l>>2]|0)-k|0;n=m>>3;if(f>>>0<=n>>>0){o=d-e|0;e=o>>3;p=j;q=b;pn(p|0,q|0,o|0)|0;o=j+(e<<3)|0;e=c[l>>2]|0;if((o|0)==(e|0)){return}c[l>>2]=e+(~((e-8+(-o|0)|0)>>>3)<<3);return}o=b+(n<<3)|0;n=j;e=b;pn(n|0,e|0,m|0)|0;if((o|0)==(d|0)){return}m=o;o=c[l>>2]|0;do{if((o|0)==0){r=0}else{e=m;n=o;q=c[e+4>>2]|0;c[n>>2]=c[e>>2];c[n+4>>2]=q;r=c[l>>2]|0}o=r+8|0;c[l>>2]=o;m=m+8|0;}while((m|0)!=(d|0));return}if((j|0)==0){s=h}else{h=a+4|0;m=c[h>>2]|0;if((j|0)!=(m|0)){c[h>>2]=m+(~((m-8+(-k|0)|0)>>>3)<<3)}pb(j);c[g>>2]=0;c[h>>2]=0;c[i>>2]=0;s=0}if(f>>>0>536870911>>>0){mE(0)}h=s;do{if(h>>3>>>0>268435454>>>0){t=536870911}else{s=h>>2;j=s>>>0<f>>>0?f:s;if(j>>>0<=536870911>>>0){t=j;break}mE(0)}}while(0);f=o8(t<<3)|0;h=a+4|0;c[h>>2]=f;c[i>>2]=f;c[g>>2]=f+(t<<3);if((b|0)==(d|0)){return}else{u=b;v=f}do{if((v|0)==0){w=0}else{f=u;b=v;t=c[f+4>>2]|0;c[b>>2]=c[f>>2];c[b+4>>2]=t;w=c[h>>2]|0}v=w+8|0;c[h>>2]=v;u=u+8|0;}while((u|0)!=(d|0));return}function d_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;g=i;h=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[h>>2];h=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[h>>2];h=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[h>>2];h=b|0;j=c[h>>2]|0;k=j;l=(c[d>>2]|0)-k|0;d=l>>2;m=j+(d<<2)|0;n=e|0;e=c[n>>2]|0;o=c[f>>2]|0;f=o-e|0;p=f>>2;if((f|0)<=0){q=m;r=a|0;c[r>>2]=q;i=g;return}f=b+8|0;s=b+4|0;b=c[s>>2]|0;t=c[f>>2]|0;u=b;if((p|0)<=(t-u>>2|0)){v=u-m>>2;do{if((p|0)>(v|0)){w=e+(v<<2)|0;if((w|0)==(o|0)){x=v;y=o;z=b;break}else{A=w;B=b}while(1){if((B|0)==0){C=0}else{c[B>>2]=c[A>>2];C=c[s>>2]|0}D=C+4|0;c[s>>2]=D;E=A+4|0;if((E|0)==(o|0)){x=v;y=w;z=D;break}else{A=E;B=D}}}else{x=p;y=o;z=b}}while(0);if((x|0)<=0){q=m;r=a|0;c[r>>2]=q;i=g;return}x=z-(j+(p+d<<2))|0;B=x>>2;A=j+(B+d<<2)|0;if(A>>>0<b>>>0){d=A;A=z;do{if((A|0)==0){F=0}else{c[A>>2]=c[d>>2];F=c[s>>2]|0}d=d+4|0;A=F+4|0;c[s>>2]=A;}while(d>>>0<b>>>0);G=c[n>>2]|0}else{G=e}n=z+(-B<<2)|0;B=m;pn(n|0,B|0,x|0)|0;x=y-G|0;y=G;pn(B|0,y|0,x|0)|0;q=m;r=a|0;c[r>>2]=q;i=g;return}x=(u-k>>2)+p|0;if(x>>>0>1073741823>>>0){mE(0)}p=t-k|0;if(p>>2>>>0>536870910>>>0){H=1073741823;I=m;J=l>>2;K=2966}else{k=p>>1;p=k>>>0<x>>>0?x:k;k=m;x=l>>2;if((p|0)==0){L=0;M=0;N=k;O=x}else{H=p;I=k;J=x;K=2966}}if((K|0)==2966){L=o8(H<<2)|0;M=H;N=I;O=J}J=L+(O<<2)|0;I=L+(M<<2)|0;if((e|0)==(o|0)){P=J;Q=j;R=b}else{b=e;e=J;do{if((e|0)==0){S=0}else{c[e>>2]=c[b>>2];S=e}e=S+4|0;b=b+4|0;}while((b|0)!=(o|0));P=e;Q=c[h>>2]|0;R=c[s>>2]|0}e=N-Q|0;o=L+(O-(e>>2)<<2)|0;O=o;L=Q;pl(O|0,L|0,e)|0;e=R-N|0;N=e>>2;R=P;L=m;pl(R|0,L|0,e)|0;e=c[h>>2]|0;c[h>>2]=o;c[s>>2]=P+(N<<2);c[f>>2]=I;if((e|0)==0){q=J;r=a|0;c[r>>2]=q;i=g;return}pb(e);q=J;r=a|0;c[r>>2]=q;i=g;return}function d$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;d=a+8|0;e=a+4|0;f=c[e>>2]|0;g=c[d>>2]|0;h=f;if(g-h>>2>>>0>=b>>>0){i=b;j=f;do{if((j|0)==0){k=0}else{c[j>>2]=0;k=c[e>>2]|0}j=k+4|0;c[e>>2]=j;i=i-1|0;}while((i|0)!=0);return}i=a|0;a=c[i>>2]|0;j=h-a>>2;h=j+b|0;if(h>>>0>1073741823>>>0){mE(0)}k=g-a|0;if(k>>2>>>0>536870910>>>0){l=1073741823;m=2988}else{a=k>>1;k=a>>>0<h>>>0?h:a;if((k|0)==0){n=0;o=0}else{l=k;m=2988}}if((m|0)==2988){n=o8(l<<2)|0;o=l}l=b;b=n+(j<<2)|0;do{if((b|0)==0){p=0}else{c[b>>2]=0;p=b}b=p+4|0;l=l-1|0;}while((l|0)!=0);l=n+(o<<2)|0;o=c[i>>2]|0;p=(c[e>>2]|0)-o|0;m=n+(j-(p>>2)<<2)|0;j=m;n=o;pl(j|0,n|0,p)|0;c[i>>2]=m;c[e>>2]=b;c[d>>2]=l;if((o|0)==0){return}pb(n);return}function d0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=f;h=(c[d>>2]|0)-g|0;i=h>>2;j=i+1|0;if(j>>>0>1073741823>>>0){mE(0)}k=a+8|0;a=(c[k>>2]|0)-g|0;if(a>>2>>>0>536870910>>>0){l=1073741823;m=3003}else{g=a>>1;a=g>>>0<j>>>0?j:g;if((a|0)==0){n=0;o=0}else{l=a;m=3003}}if((m|0)==3003){n=o8(l<<2)|0;o=l}l=n+(i<<2)|0;i=n+(o<<2)|0;if((l|0)!=0){c[l>>2]=c[b>>2]}b=n+(j<<2)|0;j=n;l=f;pl(j|0,l|0,h)|0;c[e>>2]=n;c[d>>2]=b;c[k>>2]=i;if((f|0)==0){return}pb(l);return}function d1(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;i=i+8|0;j=h|0;dm(b|0,d,e,f,g);g=b+16|0;f=b+12|0;e=b+4|0;dh(g,(c[f>>2]|0)+1-(c[e>>2]|0)|0);if(((c[f>>2]|0)+1-(c[e>>2]|0)|0)<=0){i=h;return}d=g|0;g=b+8|0;k=b|0;b=0;do{l=c[d>>2]|0;m=l+(b*12|0)|0;n=(c[g>>2]|0)+1-(c[k>>2]|0)|0;a[j]=0;o=l+(b*12|0)+4|0;l=c[o>>2]|0;p=c[m>>2]|0;q=l-p|0;do{if(q>>>0<n>>>0){dk(m,n-q|0,j)}else{if(q>>>0<=n>>>0){break}r=p+n|0;if((r|0)==(l|0)){break}c[o>>2]=r}}while(0);b=b+1|0;}while((b|0)<((c[f>>2]|0)+1-(c[e>>2]|0)|0));i=h;return}function d2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=b;g=e;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];g=b+16|0;dh(g,(c[e+12>>2]|0)+1-(c[e+4>>2]|0)|0);if(!(dv(d|0,e)|0)){gM(1024)}e=b|0;f=c[e>>2]|0;h=f-(c[d>>2]|0)|0;i=b+4|0;j=c[i>>2]|0;k=j-(c[d+4>>2]|0)|0;l=b+12|0;if(((c[l>>2]|0)+1-j|0)<=0){return}j=g|0;g=b+8|0;b=d+16|0;d=0;m=c[g>>2]|0;n=f;while(1){f=c[j>>2]|0;o=f+(d*12|0)|0;p=m+1-n|0;q=f+(d*12|0)+4|0;f=c[q>>2]|0;r=c[o>>2]|0;s=f-r|0;do{if(s>>>0<p>>>0){df(o,p-s|0)}else{if(s>>>0<=p>>>0){break}t=r+p|0;if((t|0)==(f|0)){break}c[q>>2]=t}}while(0);q=c[g>>2]|0;f=c[e>>2]|0;if((q+1-f|0)>0){p=(c[b>>2]|0)+((k+d|0)*12|0)|0;r=(c[j>>2]|0)+(d*12|0)|0;s=0;while(1){a[(c[r>>2]|0)+s|0]=a[(c[p>>2]|0)+(h+s)|0]|0;o=s+1|0;t=c[g>>2]|0;u=c[e>>2]|0;if((o|0)<(t+1-u|0)){s=o}else{v=t;w=u;break}}}else{v=q;w=f}s=d+1|0;if((s|0)<((c[l>>2]|0)+1-(c[i>>2]|0)|0)){d=s;m=v;n=w}else{break}}return}function d3(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=b|0;k=b|0;l=c[k>>2]|0;if((l|0)==(d|0)){i=e;return}m=(c[b+12>>2]|0)-(c[b+4>>2]|0)|0;n=(m|0)>-1;L3604:do{if((l|0)>(d|0)){if(!n){break}o=b+16|0;p=f|0;q=m;r=l;while(1){s=(c[o>>2]|0)+(q*12|0)|0;c[p>>2]=c[s>>2];a[g]=0;d4(h,s,f,r-d|0,g);if((q|0)<=0){break L3604}q=q-1|0;r=c[k>>2]|0}}else{if(!n){break}r=b+16|0;q=m;p=l;while(1){o=c[r>>2]|0;s=c[o+(q*12|0)>>2]|0;do{if((p|0)!=(d|0)){t=s+(d-p)|0;u=o+(q*12|0)+4|0;v=(c[u>>2]|0)-t|0;pn(s|0,t|0,v|0)|0;t=s+v|0;if((t|0)==(c[u>>2]|0)){break}c[u>>2]=t}}while(0);if((q|0)<=0){break L3604}q=q-1|0;p=c[k>>2]|0}}}while(0);dn(j,d);i=e;return}function d4(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;h=i;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=c[j>>2]|0;l=k;m=(c[e>>2]|0)-l|0;e=k+m|0;if((f|0)==0){n=e;o=b|0;c[o>>2]=n;i=h;return}p=d+8|0;q=d+4|0;d=c[q>>2]|0;r=c[p>>2]|0;s=d;if((r-s|0)>>>0<f>>>0){t=s-l+f|0;if((t|0)<0){mE(0)}u=r-l|0;if(u>>>0>1073741822>>>0){v=2147483647;w=e;x=3099}else{l=u<<1;u=l>>>0<t>>>0?t:l;l=e;if((u|0)==0){y=0;z=0;A=l}else{v=u;w=l;x=3099}}if((x|0)==3099){y=o8(v)|0;z=v;A=w}w=y+m|0;v=f;x=w;do{if((x|0)==0){B=0}else{a[x]=a[g]|0;B=x}x=B+1|0;v=v-1|0;}while((v|0)!=0);v=y+z|0;z=c[j>>2]|0;l=A-z|0;u=y+(m-l)|0;pl(u|0,z|0,l)|0;l=(c[q>>2]|0)-A|0;pl(x|0,e|0,l)|0;x=c[j>>2]|0;c[j>>2]=u;c[q>>2]=B+(l+1);c[p>>2]=v;if((x|0)==0){n=w;o=b|0;c[o>>2]=n;i=h;return}pb(x);n=w;o=b|0;c[o>>2]=n;i=h;return}w=s-e|0;if(w>>>0<f>>>0){s=f-w|0;x=d;while(1){if((x|0)==0){C=0}else{a[x]=a[g]|0;C=c[q>>2]|0}v=C+1|0;c[q>>2]=v;p=s-1|0;if((p|0)==0){D=w;E=v;break}else{s=p;x=v}}}else{D=f;E=d}if((D|0)==0){n=e;o=b|0;c[o>>2]=n;i=h;return}x=E-(k+(m+f))|0;s=k+(x+m)|0;if(s>>>0<d>>>0){m=s;s=E;do{if((s|0)==0){F=0}else{a[s]=a[m]|0;F=c[q>>2]|0}m=m+1|0;s=F+1|0;c[q>>2]=s;}while(m>>>0<d>>>0)}d=E+(-x|0)|0;pn(d|0,e|0,x|0)|0;do{if(e>>>0>g>>>0){G=g}else{if((c[q>>2]|0)>>>0<=g>>>0){G=g;break}G=g+f|0}}while(0);f=a[G]|0;pm(e|0,f|0,D|0)|0;n=e;o=b|0;c[o>>2]=n;i=h;return}function d5(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=i;i=i+56|0;f=e|0;g=e+8|0;h=e+24|0;j=e+32|0;k=e+40|0;l=e+48|0;m=b|0;n=c[b+4>>2]|0;if((n|0)==(d|0)){i=e;return}o=b+16|0;p=c[o>>2]|0;do{if((n|0)>(d|0)){c[f>>2]=p;q=n-d|0;r=c[b>>2]|0;s=(c[b+8>>2]|0)+1|0;t=s-r|0;u=g|0;c[u>>2]=0;v=g+4|0;c[v>>2]=0;w=g+8|0;c[w>>2]=0;if((s|0)!=(r|0)){if((t|0)<0){mE(0)}r=o8(t)|0;c[v>>2]=r;c[u>>2]=r;c[w>>2]=r+t;w=t;t=r;do{if((t|0)==0){x=0}else{a[t]=0;x=c[v>>2]|0}t=x+1|0;c[v>>2]=t;w=w-1|0;}while((w|0)!=0)}d6(h,o,f,q,g);w=c[u>>2]|0;if((w|0)==0){break}if((w|0)!=(c[v>>2]|0)){c[v>>2]=w}pb(w)}else{c[j>>2]=p;c[k>>2]=p+((d-n|0)*12|0);c9(l,o,j,k)}}while(0);dp(m,d);i=e;return}function d6(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0;h=i;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=d|0;k=c[j>>2]|0;l=k;m=(c[e>>2]|0)-l|0;e=(m|0)/12|0;n=k+(e*12|0)|0;if((f|0)==0){o=n;p=b|0;c[p>>2]=o;i=h;return}q=d+8|0;r=d+4|0;d=c[r>>2]|0;s=c[q>>2]|0;t=d;if(((s-t|0)/12|0)>>>0>=f>>>0){u=(t-n|0)/12|0;L3703:do{if(u>>>0<f>>>0){v=g+4|0;w=g|0;x=f-u|0;y=d;L3705:while(1){do{if((y|0)!=0){z=y|0;c[z>>2]=0;A=y+4|0;c[A>>2]=0;B=y+8|0;c[B>>2]=0;C=c[v>>2]|0;D=c[w>>2]|0;if((C|0)==(D|0)){break}E=C-D|0;if((E|0)<0){break L3705}D=o8(E)|0;c[A>>2]=D;c[z>>2]=D;c[B>>2]=D+E;E=c[w>>2]|0;B=c[v>>2]|0;if((E|0)==(B|0)){break}else{F=E;G=D}do{if((G|0)==0){H=0}else{a[G]=a[F]|0;H=c[A>>2]|0}G=H+1|0;c[A>>2]=G;F=F+1|0;}while((F|0)!=(B|0))}}while(0);B=(c[r>>2]|0)+12|0;c[r>>2]=B;A=x-1|0;if((A|0)==0){I=u;J=B;break L3703}else{x=A;y=B}}mE(0)}else{I=f;J=d}}while(0);if((I|0)==0){o=n;p=b|0;c[p>>2]=o;i=h;return}u=k+((e+f|0)*12|0)|0;F=k+((((J-u|0)/12|0)+e|0)*12|0)|0;L3724:do{if(F>>>0<d>>>0){e=F;k=J;L3725:while(1){if((k|0)==0){K=0}else{G=k|0;c[G>>2]=0;H=k+4|0;c[H>>2]=0;y=k+8|0;c[y>>2]=0;x=e+4|0;v=c[x>>2]|0;w=e|0;B=c[w>>2]|0;do{if((v|0)!=(B|0)){A=v-B|0;if((A|0)<0){break L3725}D=o8(A)|0;c[H>>2]=D;c[G>>2]=D;c[y>>2]=D+A;A=c[w>>2]|0;E=c[x>>2]|0;if((A|0)==(E|0)){break}else{L=A;M=D}do{if((M|0)==0){N=0}else{a[M]=a[L]|0;N=c[H>>2]|0}M=N+1|0;c[H>>2]=M;L=L+1|0;}while((L|0)!=(E|0))}}while(0);K=c[r>>2]|0}e=e+12|0;k=K+12|0;c[r>>2]=k;if(e>>>0>=d>>>0){break L3724}}mE(0)}}while(0);if((J|0)!=(u|0)){u=J;J=F;while(1){F=u-12|0;d=J-12|0;if((u|0)!=(J|0)){de(F,c[d>>2]|0,c[J-12+4>>2]|0)}if((d|0)==(n|0)){break}else{u=F;J=d}}}do{if(n>>>0>g>>>0){O=g}else{if((c[r>>2]|0)>>>0<=g>>>0){O=g;break}O=g+(f*12|0)|0}}while(0);J=O|0;u=O+4|0;d=I;I=n;while(1){if((I|0)!=(O|0)){de(I,c[J>>2]|0,c[u>>2]|0)}F=d-1|0;if((F|0)==0){o=n;break}else{d=F;I=I+12|0}}p=b|0;c[p>>2]=o;i=h;return}I=((t-l|0)/12|0)+f|0;if(I>>>0>357913941>>>0){mE(0)}t=(s-l|0)/12|0;if(t>>>0>178956969>>>0){P=357913941;Q=(m|0)/12|0;R=3202}else{l=t<<1;t=l>>>0<I>>>0?I:l;l=(m|0)/12|0;if((t|0)==0){S=0;T=0;U=l}else{P=t;Q=l;R=3202}}if((R|0)==3202){S=o8(P*12|0)|0;T=P;U=Q}Q=S+(U*12|0)|0;U=S+(T*12|0)|0;T=g+4|0;S=g|0;g=f;f=Q;L3770:do{do{if((f|0)==0){V=0}else{P=f|0;c[P>>2]=0;l=f+4|0;c[l>>2]=0;t=f+8|0;c[t>>2]=0;m=c[T>>2]|0;I=c[S>>2]|0;if((m|0)==(I|0)){V=f;break}s=m-I|0;if((s|0)<0){R=3207;break L3770}I=o8(s)|0;c[l>>2]=I;c[P>>2]=I;c[t>>2]=I+s;s=c[S>>2]|0;t=c[T>>2]|0;if((s|0)==(t|0)){V=f;break}else{W=s;X=I}while(1){if((X|0)==0){Y=0}else{a[X]=a[W]|0;Y=c[l>>2]|0}I=Y+1|0;c[l>>2]=I;s=W+1|0;if((s|0)==(t|0)){V=f;break}else{W=s;X=I}}}}while(0);f=V+12|0;g=g-1|0;}while((g|0)!=0);if((R|0)==3207){mE(0)}g=c[j>>2]|0;L3787:do{if((g|0)==(n|0)){Z=Q}else{V=n;X=Q;L3788:while(1){W=X-12|0;Y=V-12|0;do{if((W|0)!=0){T=W|0;c[T>>2]=0;S=X-12+4|0;c[S>>2]=0;t=X-12+8|0;c[t>>2]=0;l=V-12+4|0;I=c[l>>2]|0;s=Y|0;P=c[s>>2]|0;if((I|0)==(P|0)){break}m=I-P|0;if((m|0)<0){break L3788}P=o8(m)|0;c[S>>2]=P;c[T>>2]=P;c[t>>2]=P+m;m=c[s>>2]|0;s=c[l>>2]|0;if((m|0)==(s|0)){break}else{_=m;$=P}do{if(($|0)==0){aa=0}else{a[$]=a[_]|0;aa=c[S>>2]|0}$=aa+1|0;c[S>>2]=$;_=_+1|0;}while((_|0)!=(s|0))}}while(0);if((Y|0)==(g|0)){Z=W;break L3787}else{V=Y;X=W}}mE(0)}}while(0);g=c[r>>2]|0;do{if((g|0)==(n|0)){ab=f;ac=n}else{_=n;$=f;L3805:while(1){do{if(($|0)==0){ad=0}else{aa=$|0;c[aa>>2]=0;X=$+4|0;c[X>>2]=0;V=$+8|0;c[V>>2]=0;s=_+4|0;S=c[s>>2]|0;P=_|0;m=c[P>>2]|0;if((S|0)==(m|0)){ad=$;break}l=S-m|0;if((l|0)<0){break L3805}m=o8(l)|0;c[X>>2]=m;c[aa>>2]=m;c[V>>2]=m+l;l=c[P>>2]|0;P=c[s>>2]|0;if((l|0)==(P|0)){ad=$;break}else{ae=l;af=m}while(1){if((af|0)==0){ag=0}else{a[af]=a[ae]|0;ag=c[X>>2]|0}m=ag+1|0;c[X>>2]=m;l=ae+1|0;if((l|0)==(P|0)){ad=$;break}else{ae=l;af=m}}}}while(0);W=_+12|0;ah=ad+12|0;if((W|0)==(g|0)){R=3257;break}else{_=W;$=ah}}if((R|0)==3257){ab=ah;ac=c[r>>2]|0;break}mE(0)}}while(0);ah=c[j>>2]|0;c[j>>2]=Z;c[r>>2]=ab;c[q>>2]=U;if((ah|0)!=(ac|0)){U=ac;while(1){ac=U-12|0;q=c[ac>>2]|0;if((q|0)!=0){ab=U-12+4|0;if((q|0)!=(c[ab>>2]|0)){c[ab>>2]=q}pb(q)}if((ah|0)==(ac|0)){break}else{U=ac}}}if((ah|0)==0){o=Q;p=b|0;c[p>>2]=o;i=h;return}pb(ah);o=Q;p=b|0;c[p>>2]=o;i=h;return}function d7(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+8|0;f=e|0;g=b+8|0;if((c[g>>2]|0)==(d|0)){i=e;return}dq(b|0,d);d=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;if((d|0)<=0){i=e;return}h=b+16|0;j=b|0;b=d;do{b=b-1|0;d=c[h>>2]|0;k=d+(b*12|0)|0;l=(c[g>>2]|0)+1-(c[j>>2]|0)|0;a[f]=0;m=d+(b*12|0)+4|0;d=c[m>>2]|0;n=c[k>>2]|0;o=d-n|0;do{if(o>>>0<l>>>0){dk(k,l-o|0,f)}else{if(o>>>0<=l>>>0){break}p=n+l|0;if((p|0)==(d|0)){break}c[m>>2]=p}}while(0);}while((b|0)>0);i=e;return}function d8(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+8|0;f=e|0;g=b+12|0;h=c[g>>2]|0;if((h|0)==(d|0)){i=e;return}j=b+4|0;k=h+1-(c[j>>2]|0)|0;dr(b|0,d);d=b+16|0;h=(c[g>>2]|0)+1-(c[j>>2]|0)|0;l=b+20|0;m=c[l>>2]|0;n=d|0;o=c[n>>2]|0;p=(m-o|0)/12|0;do{if(p>>>0<h>>>0){c4(d,h-p|0)}else{if(p>>>0<=h>>>0){break}q=o+(h*12|0)|0;if((q|0)==(m|0)){break}else{r=m}while(1){s=r-12|0;c[l>>2]=s;t=c[s>>2]|0;if((t|0)==0){u=s}else{s=r-12+4|0;if((t|0)!=(c[s>>2]|0)){c[s>>2]=t}pb(t);u=c[l>>2]|0}if((q|0)==(u|0)){break}else{r=u}}}}while(0);if((k|0)>=((c[g>>2]|0)+1-(c[j>>2]|0)|0)){i=e;return}u=b+8|0;r=b|0;b=k;do{k=c[n>>2]|0;l=k+(b*12|0)|0;m=(c[u>>2]|0)+1-(c[r>>2]|0)|0;a[f]=0;h=k+(b*12|0)+4|0;k=c[h>>2]|0;o=c[l>>2]|0;p=k-o|0;do{if(p>>>0<m>>>0){dk(l,m-p|0,f)}else{if(p>>>0<=m>>>0){break}d=o+m|0;if((d|0)==(k|0)){break}c[h>>2]=d}}while(0);b=b+1|0;}while((b|0)<((c[g>>2]|0)+1-(c[j>>2]|0)|0));i=e;return}function d9(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;ea(b,d|0);e=d+4|0;f=c[e>>2]|0;g=d+12|0;h=c[g>>2]|0;if((f|0)>(h|0)){return}i=d|0;j=d+8|0;k=d+16|0;d=b+4|0;l=b+16|0;m=b|0;b=f;f=c[j>>2]|0;n=h;while(1){h=c[i>>2]|0;if((h|0)>(f|0)){o=f;p=n}else{q=h;r=f;s=h;while(1){if((a[(c[(c[k>>2]|0)+((b-(c[e>>2]|0)|0)*12|0)>>2]|0)+(q-s)|0]|0)==0){t=r}else{a[(c[(c[l>>2]|0)+((b-(c[d>>2]|0)|0)*12|0)>>2]|0)+(q-(c[m>>2]|0))|0]=1;t=c[j>>2]|0}h=q+1|0;if((h|0)>(t|0)){break}q=h;r=t;s=c[i>>2]|0}o=t;p=c[g>>2]|0}s=b+1|0;if((s|0)>(p|0)){break}else{b=s;f=o;n=p}}return}function ea(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+8|0;f=e|0;g=c[d>>2]|0;h=b|0;j=b|0;if((g|0)<(c[j>>2]|0)){d3(b,g)}g=c[d+4>>2]|0;k=b+4|0;if((g|0)<(c[k>>2]|0)){d5(b,g)}g=c[d+8>>2]|0;l=b+8|0;m=c[l>>2]|0;do{if((g|0)>(m|0)){if((m|0)==(g|0)){break}dq(h,g);n=(c[b+12>>2]|0)+1-(c[k>>2]|0)|0;if((n|0)<=0){break}o=b+16|0;p=n;do{p=p-1|0;n=c[o>>2]|0;q=n+(p*12|0)|0;r=(c[l>>2]|0)+1-(c[j>>2]|0)|0;a[f]=0;s=n+(p*12|0)+4|0;n=c[s>>2]|0;t=c[q>>2]|0;u=n-t|0;do{if(u>>>0<r>>>0){dk(q,r-u|0,f)}else{if(u>>>0<=r>>>0){break}v=t+r|0;if((v|0)==(n|0)){break}c[s>>2]=v}}while(0);}while((p|0)>0)}}while(0);f=c[d+12>>2]|0;if((f|0)<=(c[b+12>>2]|0)){i=e;return}d8(b,f);i=e;return}function eb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+8|0;g=f|0;h=b|0;j=b+8|0;k=c[j>>2]|0;do{if((k|0)<(e|0)){if((k|0)==(e|0)){break}dq(h,e);l=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;if((l|0)<=0){break}m=b+16|0;n=b|0;o=l;do{o=o-1|0;l=c[m>>2]|0;p=l+(o*12|0)|0;q=(c[j>>2]|0)+1-(c[n>>2]|0)|0;a[g]=0;r=l+(o*12|0)+4|0;l=c[r>>2]|0;s=c[p>>2]|0;t=l-s|0;do{if(t>>>0<q>>>0){dk(p,q-t|0,g)}else{if(t>>>0<=q>>>0){break}u=s+q|0;if((u|0)==(l|0)){break}c[r>>2]=u}}while(0);}while((o|0)>0)}else{if((c[b>>2]|0)<=(e|0)){break}d3(b,e)}}while(0);do{if((c[b+12>>2]|0)<(d|0)){d8(b,d);v=b+4|0}else{g=b+4|0;if((c[g>>2]|0)<=(d|0)){v=g;break}d5(b,d);v=g}}while(0);a[(c[(c[b+16>>2]|0)+((d-(c[v>>2]|0)|0)*12|0)>>2]|0)+(e-(c[b>>2]|0))|0]=1;i=f;return}function ec(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=c[b+4>>2]|0;e=b+12|0;f=c[e>>2]|0;L3944:do{if((d|0)>(f|0)){g=d}else{h=c[b>>2]|0;i=c[b+8>>2]|0;j=b+16|0;k=d;while(1){l=h;while(1){if((l|0)>(i|0)){break}if((a[(c[(c[j>>2]|0)+((k-d|0)*12|0)>>2]|0)+(l-h)|0]|0)==0){l=l+1|0}else{g=k;break L3944}}l=k+1|0;if((l|0)>(f|0)){g=l;break}else{k=l}}}}while(0);if((f|0)<(g|0)){m=0;return m|0}k=c[b>>2]|0;h=c[b+8>>2]|0;j=b+16|0;i=f;L3956:while(1){l=k;while(1){if((l|0)>(h|0)){break}if((a[(c[(c[j>>2]|0)+((i-d|0)*12|0)>>2]|0)+(l-k)|0]|0)==0){l=l+1|0}else{break L3956}}l=i-1|0;if((l|0)<(g|0)){m=0;n=3381;break}else{i=l}}if((n|0)==3381){return m|0}if((g|0)>(d|0)){d5(b,g);o=c[e>>2]|0}else{o=f}if((i|0)>=(o|0)){m=1;return m|0}d8(b,i);m=1;return m|0}function ed(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;d=i;i=i+8|0;e=d|0;f=b|0;g=b|0;h=c[g>>2]|0;j=b+8|0;k=c[j>>2]|0;L3973:do{if((h|0)>(k|0)){l=h}else{m=c[b+4>>2]|0;n=c[b+12>>2]|0;o=b+16|0;p=h;while(1){q=m;while(1){if((q|0)>(n|0)){break}if((a[(c[(c[o>>2]|0)+((q-m|0)*12|0)>>2]|0)+(p-h)|0]|0)==0){q=q+1|0}else{l=p;break L3973}}q=p+1|0;if((q|0)>(k|0)){l=q;break}else{p=q}}}}while(0);L3982:do{if((k|0)<(l|0)){r=k}else{p=c[b+4>>2]|0;m=c[b+12>>2]|0;o=b+16|0;n=k;while(1){q=p;while(1){if((q|0)>(m|0)){break}if((a[(c[(c[o>>2]|0)+((q-p|0)*12|0)>>2]|0)+(n-h)|0]|0)==0){q=q+1|0}else{r=n;break L3982}}q=n-1|0;if((q|0)<(l|0)){r=q;break}else{n=q}}}}while(0);if((l|0)>=(r|0)){s=0;i=d;return s|0}if((l|0)>(h|0)){d3(b,l);t=c[j>>2]|0}else{t=k}if((r|0)>=(t|0)){s=1;i=d;return s|0}if((t|0)==(r|0)){s=1;i=d;return s|0}dq(f,r);r=(c[b+12>>2]|0)+1-(c[b+4>>2]|0)|0;if((r|0)<=0){s=1;i=d;return s|0}f=b+16|0;b=r;while(1){r=b-1|0;t=c[f>>2]|0;k=t+(r*12|0)|0;l=(c[j>>2]|0)+1-(c[g>>2]|0)|0;a[e]=0;h=t+(r*12|0)+4|0;t=c[h>>2]|0;n=c[k>>2]|0;p=t-n|0;do{if(p>>>0<l>>>0){dk(k,l-p|0,e)}else{if(p>>>0<=l>>>0){break}o=n+l|0;if((o|0)==(t|0)){break}c[h>>2]=o}}while(0);if((r|0)>0){b=r}else{s=1;break}}i=d;return s|0}function ee(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;d=c[b+4>>2]|0;e=c[b+12>>2]|0;if((d|0)>(e|0)){f=0;return f|0}g=c[b>>2]|0;h=c[b+8>>2]|0;i=b+16|0;if((g|0)>(h|0)){b=d;while(1){j=b+1|0;if((j|0)>(e|0)){f=0;break}else{b=j}}return f|0}else{k=0;l=d}while(1){b=c[(c[i>>2]|0)+((l-d|0)*12|0)>>2]|0;j=k;m=g;do{j=((a[b+(m-g)|0]|0)!=0)+j|0;m=m+1|0;}while((m|0)<=(h|0));m=l+1|0;if((m|0)>(e|0)){f=j;break}else{k=j;l=m}}return f|0}function ef(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=c[b+12>>2]|0;e=c[b+4>>2]|0;f=d+1-e|0;g=c[b+8>>2]|0;h=c[b>>2]|0;i=g+1-h|0;j=((i|0)<(f|0)?i:f)*29|0;f=(j|0)/100|0;i=f+h|0;k=g-f|0;l=(j|0)>99;if(l){j=b+16|0;m=0;n=0;while(1){o=i-m|0;p=m+k|0;if((o|0)>(p|0)){q=n}else{r=c[(c[j>>2]|0)+(m*12|0)>>2]|0;s=o;o=n;while(1){t=((a[r+(s-h)|0]|0)!=0)+o|0;u=s+1|0;if((u|0)>(p|0)){q=t;break}else{s=u;o=t}}}o=m+1|0;if((o|0)<(f|0)){m=o;n=q}else{v=q;break}}}else{v=0}q=e+f|0;n=d-f|0;L4040:do{if((q|0)>(n|0)){w=v}else{m=b+16|0;if((h|0)>(g|0)){j=q;while(1){o=j+1|0;if((o|0)>(n|0)){w=v;break L4040}else{j=o}}}else{x=q;y=v}while(1){j=c[(c[m>>2]|0)+((x-e|0)*12|0)>>2]|0;o=h;s=y;do{s=((a[j+(o-h)|0]|0)!=0)+s|0;o=o+1|0;}while((o|0)<=(g|0));o=x+1|0;if((o|0)>(n|0)){w=s;break}else{x=o;y=s}}}}while(0);if(!l){z=w;return z|0}l=b+16|0;b=w;w=f;while(1){f=w-1|0;y=i-f|0;x=f+k|0;if((y|0)>(x|0)){A=b}else{n=c[(c[l>>2]|0)+((d+(1-w)-e|0)*12|0)>>2]|0;g=b;v=y;while(1){y=((a[n+(v-h)|0]|0)!=0)+g|0;q=v+1|0;if((q|0)>(x|0)){A=y;break}else{g=y;v=q}}}if((f|0)>0){b=A;w=f}else{z=A;break}}return z|0}function eg(a){a=a|0;var b=0,d=0;b=(c[a+12>>2]|0)+1-(c[a+4>>2]|0)|0;d=(c[a+8>>2]|0)+1-(c[a>>2]|0)|0;a=(((d|0)<(b|0)?d:b)*29|0|0)/100|0;return(ag(d,b)|0)-(ag(a<<1,a+1|0)|0)|0}function eh(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=c[b>>2]|0;h=b+4|0;i=b+16|0;b=e;while(1){if((b|0)<=(g|0)){j=3453;break}e=b-1|0;if((a[(c[(c[i>>2]|0)+((d-(c[h>>2]|0)|0)*12|0)>>2]|0)+(e-g)|0]|0)!=0^f){b=e}else{j=3452;break}}if((j|0)==3453){return b|0}else if((j|0)==3452){return b|0}return 0}function ei(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=c[b+4>>2]|0;h=b+16|0;i=b|0;b=d;while(1){if((b|0)<=(g|0)){j=3459;break}d=b-1|0;if((a[(c[(c[h>>2]|0)+((d-g|0)*12|0)>>2]|0)+(e-(c[i>>2]|0))|0]|0)!=0^f){b=d}else{j=3458;break}}if((j|0)==3458){return b|0}else if((j|0)==3459){return b|0}return 0}function ej(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[b+8>>2]|0;h=b+4|0;i=b+16|0;j=b|0;b=e;while(1){if((b|0)>=(g|0)){k=3465;break}e=b+1|0;if((a[(c[(c[i>>2]|0)+((d-(c[h>>2]|0)|0)*12|0)>>2]|0)+(e-(c[j>>2]|0))|0]|0)!=0^f){b=e}else{k=3464;break}}if((k|0)==3465){return b|0}else if((k|0)==3464){return b|0}return 0}function ek(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=c[b+12>>2]|0;h=b+4|0;i=b+16|0;j=b|0;b=d;while(1){if((b|0)>=(g|0)){k=3471;break}d=b+1|0;if((a[(c[(c[i>>2]|0)+((d-(c[h>>2]|0)|0)*12|0)>>2]|0)+(e-(c[j>>2]|0))|0]|0)!=0^f){b=d}else{k=3470;break}}if((k|0)==3470){return b|0}else if((k|0)==3471){return b|0}return 0}function el(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=c[b+4>>2]|0;g=c[b+16>>2]|0;h=c[b>>2]|0;i=e-h|0;if((a[(c[g+((d-f|0)*12|0)>>2]|0)+i|0]|0)!=0){j=0;return j|0}k=f+1|0;l=d;while(1){if((l|0)<=(k|0)){break}m=l-1|0;if((a[(c[g+((m-f|0)*12|0)>>2]|0)+i|0]|0)==0){l=m}else{break}}k=(c[b+12>>2]|0)-1|0;b=d;while(1){if((b|0)>=(k|0)){break}d=b+1|0;if((a[(c[g+((d-f|0)*12|0)>>2]|0)+i|0]|0)==0){b=d}else{break}}L4103:do{if((l|0)>(b|0)){n=e}else{i=e;d=l;m=b;L4104:while(1){o=i-1|0;if((o|0)<(h|0)){n=o;break L4103}if((d|0)>(f+1|0)){p=(((a[(c[g+((d-f|0)*12|0)>>2]|0)+(o-h)|0]|0)==0)<<31>>31)+d|0}else{p=d}if((m|0)<(k|0)){q=((a[(c[g+((m-f|0)*12|0)>>2]|0)+(o-h)|0]|0)==0)+m|0}else{q=m}r=p;while(1){if((r|0)>(q|0)){s=q;break}if((a[(c[g+((r-f|0)*12|0)>>2]|0)+(o-h)|0]|0)==0){s=q;break}else{r=r+1|0}}while(1){if((r|0)>(s|0)){n=o;break L4103}if((a[(c[g+((s-f|0)*12|0)>>2]|0)+(o-h)|0]|0)==0){i=o;d=r;m=s;continue L4104}else{s=s-1|0}}}}}while(0);j=(n|0)<(h|0);return j|0}function em(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=c[b+4>>2]|0;g=c[b+16>>2]|0;h=c[b>>2]|0;i=c[g+((d-f|0)*12|0)>>2]|0;if((a[i+(e-h)|0]|0)!=0){j=0;return j|0}k=h+1|0;l=e;while(1){if((l|0)<=(k|0)){break}m=l-1|0;if((a[i+(m-h)|0]|0)==0){l=m}else{break}}k=(c[b+8>>2]|0)-1|0;b=e;while(1){if((b|0)>=(k|0)){break}e=b+1|0;if((a[i+(e-h)|0]|0)==0){b=e}else{break}}L4133:do{if((l|0)>(b|0)){n=d}else{i=d;e=l;m=b;L4134:while(1){o=i-1|0;if((o|0)<(f|0)){n=o;break L4133}if((e|0)>(h+1|0)){p=(((a[(c[g+((o-f|0)*12|0)>>2]|0)+(e-h)|0]|0)==0)<<31>>31)+e|0}else{p=e}if((m|0)<(k|0)){q=((a[(c[g+((o-f|0)*12|0)>>2]|0)+(m-h)|0]|0)==0)+m|0}else{q=m}r=p;while(1){if((r|0)>(q|0)){s=q;break}if((a[(c[g+((o-f|0)*12|0)>>2]|0)+(r-h)|0]|0)==0){s=q;break}else{r=r+1|0}}while(1){if((r|0)>(s|0)){n=o;break L4133}if((a[(c[g+((o-f|0)*12|0)>>2]|0)+(s-h)|0]|0)==0){i=o;e=r;m=s;continue L4134}else{s=s-1|0}}}}}while(0);j=(n|0)<(f|0);return j|0}function en(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=c[b+4>>2]|0;g=c[b+16>>2]|0;h=c[b>>2]|0;i=e-h|0;if((a[(c[g+((d-f|0)*12|0)>>2]|0)+i|0]|0)!=0){j=0;return j|0}k=f+1|0;l=d;while(1){if((l|0)<=(k|0)){break}m=l-1|0;if((a[(c[g+((m-f|0)*12|0)>>2]|0)+i|0]|0)==0){l=m}else{break}}k=(c[b+12>>2]|0)-1|0;m=d;while(1){if((m|0)>=(k|0)){break}d=m+1|0;if((a[(c[g+((d-f|0)*12|0)>>2]|0)+i|0]|0)==0){m=d}else{break}}i=c[b+8>>2]|0;L4163:do{if((l|0)>(m|0)){n=e}else{b=e;d=l;o=m;L4164:while(1){p=b+1|0;if((p|0)>(i|0)){n=p;break L4163}if((d|0)>(f+1|0)){q=(((a[(c[g+((d-f|0)*12|0)>>2]|0)+(p-h)|0]|0)==0)<<31>>31)+d|0}else{q=d}if((o|0)<(k|0)){r=((a[(c[g+((o-f|0)*12|0)>>2]|0)+(p-h)|0]|0)==0)+o|0}else{r=o}s=q;while(1){if((s|0)>(r|0)){t=r;break}if((a[(c[g+((s-f|0)*12|0)>>2]|0)+(p-h)|0]|0)==0){t=r;break}else{s=s+1|0}}while(1){if((s|0)>(t|0)){n=p;break L4163}if((a[(c[g+((t-f|0)*12|0)>>2]|0)+(p-h)|0]|0)==0){b=p;d=s;o=t;continue L4164}else{t=t-1|0}}}}}while(0);j=(n|0)>(i|0);return j|0}function eo(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=c[b+4>>2]|0;g=c[b+16>>2]|0;h=c[b>>2]|0;i=c[g+((d-f|0)*12|0)>>2]|0;if((a[i+(e-h)|0]|0)!=0){j=0;return j|0}k=h+1|0;l=e;while(1){if((l|0)<=(k|0)){break}m=l-1|0;if((a[i+(m-h)|0]|0)==0){l=m}else{break}}k=(c[b+8>>2]|0)-1|0;m=e;while(1){if((m|0)>=(k|0)){break}e=m+1|0;if((a[i+(e-h)|0]|0)==0){m=e}else{break}}i=c[b+12>>2]|0;L4193:do{if((l|0)>(m|0)){n=d}else{b=d;e=l;o=m;L4194:while(1){p=b+1|0;if((p|0)>(i|0)){n=p;break L4193}if((e|0)>(h+1|0)){q=(((a[(c[g+((p-f|0)*12|0)>>2]|0)+(e-h)|0]|0)==0)<<31>>31)+e|0}else{q=e}if((o|0)<(k|0)){r=((a[(c[g+((p-f|0)*12|0)>>2]|0)+(o-h)|0]|0)==0)+o|0}else{r=o}s=q;while(1){if((s|0)>(r|0)){t=r;break}if((a[(c[g+((p-f|0)*12|0)>>2]|0)+(s-h)|0]|0)==0){t=r;break}else{s=s+1|0}}while(1){if((s|0)>(t|0)){n=p;break L4193}if((a[(c[g+((p-f|0)*12|0)>>2]|0)+(t-h)|0]|0)==0){b=p;e=s;o=t;continue L4194}else{t=t-1|0}}}}}while(0);j=(n|0)>(i|0);return j|0}function ep(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+24|0;k=f+32|0;l=b+4|0;m=b+16|0;n=b|0;o=c[n>>2]|0;if((a[(c[(c[m>>2]|0)+((d-(c[l>>2]|0)|0)*12|0)>>2]|0)+(e-o)|0]|0)==0){p=d;i=f;return p|0}q=g|0;c[q>>2]=0;r=g+4|0;c[r>>2]=0;s=g+8|0;c[s>>2]=0;t=b+8|0;b=(c[t>>2]|0)+1|0;u=b-o|0;if((b|0)==(o|0)){v=e}else{if((b|0)==(o|0)){w=0}else{w=o8(u)|0}c[q>>2]=w;c[r>>2]=w;c[s>>2]=w+u;v=e}while(1){if((v|0)<=(o|0)){break}u=v-1|0;if((a[(c[(c[m>>2]|0)+((d-(c[l>>2]|0)|0)*12|0)>>2]|0)+(u-o)|0]|0)==0){x=3571;break}else{v=u}}do{if((x|0)==3571){u=v-o|0;a[h]=0;w=c[r>>2]|0;s=c[q>>2]|0;b=w-s|0;if(b>>>0<u>>>0){dk(g,u-b|0,h);break}if(b>>>0<=u>>>0){break}b=s+u|0;if((b|0)==(w|0)){break}c[r>>2]=b}}while(0);h=c[t>>2]|0;o=e;while(1){if((o|0)>=(h|0)){x=3578;break}e=o+1|0;v=c[n>>2]|0;if((a[(c[(c[m>>2]|0)+((d-(c[l>>2]|0)|0)*12|0)>>2]|0)+(e-v)|0]|0)==0){y=v;break}else{o=e}}if((x|0)==3578){y=c[n>>2]|0}x=o-y+1|0;a[j]=1;y=c[r>>2]|0;e=c[q>>2]|0;v=y-e|0;do{if(v>>>0<x>>>0){dk(g,x-v|0,j);z=c[t>>2]|0}else{if(v>>>0<=x>>>0){z=h;break}b=e+x|0;if((b|0)==(y|0)){z=h;break}c[r>>2]=b;z=h}}while(0);do{if((o|0)<(z|0)){h=z+1-(c[n>>2]|0)|0;a[k]=0;y=c[r>>2]|0;x=c[q>>2]|0;e=y-x|0;if(e>>>0<h>>>0){dk(g,h-e|0,k);break}if(e>>>0<=h>>>0){break}e=x+h|0;if((e|0)==(y|0)){break}c[r>>2]=e}}while(0);k=d-1|0;L4252:do{if((k|0)<(c[l>>2]|0)){A=d}else{g=d;z=k;while(1){o=c[t>>2]|0;e=c[n>>2]|0;if((o+1-e|0)>0){B=0;C=0;D=e;E=o}else{A=g;break L4252}while(1){o=(c[q>>2]|0)+C|0;do{if((a[o]|0)==0){F=B;G=E;H=D}else{if((a[(c[(c[m>>2]|0)+((z-(c[l>>2]|0)|0)*12|0)>>2]|0)+C|0]|0)!=0){F=1;G=E;H=D;break}a[o]=0;F=B;G=c[t>>2]|0;H=c[n>>2]|0}}while(0);o=C+1|0;if((o|0)<(G+1-H|0)){B=F;C=o;D=H;E=G}else{break}}if(!F){A=g;break L4252}o=G+1-H|0;if((o|0)>1){e=1;y=H;h=G;while(1){x=c[q>>2]|0;do{if((a[x+(e-1)|0]|0)==0){I=h;J=y}else{v=x+e|0;if((a[v]|0)!=0){I=h;J=y;break}if((a[(c[(c[m>>2]|0)+((z-(c[l>>2]|0)|0)*12|0)>>2]|0)+e|0]|0)==0){I=h;J=y;break}a[v]=1;I=c[t>>2]|0;J=c[n>>2]|0}}while(0);x=e+1|0;v=I+1-J|0;if((x|0)<(v|0)){e=x;y=J;h=I}else{K=v;break}}}else{K=o}h=K-2|0;L4272:do{if((h|0)>-1){y=h;while(1){e=c[q>>2]|0;do{if((a[e+(y+1)|0]|0)!=0){v=e+y|0;if((a[v]|0)!=0){break}if((a[(c[(c[m>>2]|0)+((z-(c[l>>2]|0)|0)*12|0)>>2]|0)+y|0]|0)==0){break}a[v]=1}}while(0);if((y|0)<=0){break L4272}y=y-1|0}}}while(0);h=z-1|0;if((h|0)<(c[l>>2]|0)){A=z;break}else{g=z;z=h}}}}while(0);l=c[q>>2]|0;if((l|0)==0){p=A;i=f;return p|0}if((l|0)!=(c[r>>2]|0)){c[r>>2]=l}pb(l);p=A;i=f;return p|0}function eq(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;f=i;i=i+40|0;g=f|0;h=f+16|0;j=f+24|0;k=f+32|0;l=b+4|0;m=b+16|0;n=b|0;o=c[n>>2]|0;if((a[(c[(c[m>>2]|0)+((d-(c[l>>2]|0)|0)*12|0)>>2]|0)+(e-o)|0]|0)==0){p=d;i=f;return p|0}q=g|0;c[q>>2]=0;r=g+4|0;c[r>>2]=0;s=g+8|0;c[s>>2]=0;t=b+8|0;u=(c[t>>2]|0)+1|0;v=u-o|0;if((u|0)==(o|0)){w=e}else{if((u|0)==(o|0)){x=0}else{x=o8(v)|0}c[q>>2]=x;c[r>>2]=x;c[s>>2]=x+v;w=e}while(1){if((w|0)<=(o|0)){break}v=w-1|0;if((a[(c[(c[m>>2]|0)+((d-(c[l>>2]|0)|0)*12|0)>>2]|0)+(v-o)|0]|0)==0){y=3633;break}else{w=v}}do{if((y|0)==3633){v=w-o|0;a[h]=0;x=c[r>>2]|0;s=c[q>>2]|0;u=x-s|0;if(u>>>0<v>>>0){dk(g,v-u|0,h);break}if(u>>>0<=v>>>0){break}u=s+v|0;if((u|0)==(x|0)){break}c[r>>2]=u}}while(0);h=c[t>>2]|0;o=e;while(1){if((o|0)>=(h|0)){y=3640;break}e=o+1|0;w=c[n>>2]|0;if((a[(c[(c[m>>2]|0)+((d-(c[l>>2]|0)|0)*12|0)>>2]|0)+(e-w)|0]|0)==0){z=w;break}else{o=e}}if((y|0)==3640){z=c[n>>2]|0}y=o-z+1|0;a[j]=1;z=c[r>>2]|0;e=c[q>>2]|0;w=z-e|0;do{if(w>>>0<y>>>0){dk(g,y-w|0,j);A=c[t>>2]|0}else{if(w>>>0<=y>>>0){A=h;break}u=e+y|0;if((u|0)==(z|0)){A=h;break}c[r>>2]=u;A=h}}while(0);do{if((o|0)<(A|0)){h=A+1-(c[n>>2]|0)|0;a[k]=0;z=c[r>>2]|0;y=c[q>>2]|0;e=z-y|0;if(e>>>0<h>>>0){dk(g,h-e|0,k);break}if(e>>>0<=h>>>0){break}e=y+h|0;if((e|0)==(z|0)){break}c[r>>2]=e}}while(0);k=d+1|0;g=b+12|0;L4331:do{if((k|0)>(c[g>>2]|0)){B=d}else{b=d;A=k;while(1){o=c[t>>2]|0;e=c[n>>2]|0;if((o+1-e|0)>0){C=0;D=0;E=e;F=o}else{B=b;break L4331}while(1){o=(c[q>>2]|0)+D|0;do{if((a[o]|0)==0){G=C;H=F;I=E}else{if((a[(c[(c[m>>2]|0)+((A-(c[l>>2]|0)|0)*12|0)>>2]|0)+D|0]|0)!=0){G=1;H=F;I=E;break}a[o]=0;G=C;H=c[t>>2]|0;I=c[n>>2]|0}}while(0);o=D+1|0;if((o|0)<(H+1-I|0)){C=G;D=o;E=I;F=H}else{break}}if(!G){B=b;break L4331}o=H+1-I|0;if((o|0)>1){e=1;z=I;h=H;while(1){y=c[q>>2]|0;do{if((a[y+(e-1)|0]|0)==0){J=h;K=z}else{w=y+e|0;if((a[w]|0)!=0){J=h;K=z;break}if((a[(c[(c[m>>2]|0)+((A-(c[l>>2]|0)|0)*12|0)>>2]|0)+e|0]|0)==0){J=h;K=z;break}a[w]=1;J=c[t>>2]|0;K=c[n>>2]|0}}while(0);y=e+1|0;w=J+1-K|0;if((y|0)<(w|0)){e=y;z=K;h=J}else{L=w;break}}}else{L=o}h=L-2|0;L4351:do{if((h|0)>-1){z=h;while(1){e=c[q>>2]|0;do{if((a[e+(z+1)|0]|0)!=0){w=e+z|0;if((a[w]|0)!=0){break}if((a[(c[(c[m>>2]|0)+((A-(c[l>>2]|0)|0)*12|0)>>2]|0)+z|0]|0)==0){break}a[w]=1}}while(0);if((z|0)<=0){break L4351}z=z-1|0}}}while(0);h=A+1|0;if((h|0)>(c[g>>2]|0)){B=A;break}else{b=A;A=h}}}}while(0);g=c[q>>2]|0;if((g|0)==0){p=B;i=f;return p|0}if((g|0)!=(c[r>>2]|0)){c[r>>2]=g}pb(g);p=B;i=f;return p|0}function er(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;e=c[b+4>>2]|0;f=((c[b+12>>2]|0)+e|0)/2|0;g=b|0;h=b+8|0;i=b+16|0;j=e;k=0;l=0;m=0;while(1){n=j+1|0;if((n|0)>=(f|0)){o=0;p=3703;break}q=c[g>>2]|0;r=c[h>>2]|0;if((q|0)>(r|0)){s=m;t=0;u=-1;v=-2;w=k}else{x=c[(c[i>>2]|0)+((n-e|0)*12|0)>>2]|0;y=m;z=0;A=-1;B=-2;C=0;D=q;E=k;while(1){F=(a[x+(D-q)|0]|0)!=0;if(F){if(C){G=z;H=y}else{I=z+1|0;G=I;H=(I|0)==2?D:y}J=E;K=D;L=(A|0)<0?D:A;M=G;N=H}else{J=C&(z|0)==1?D-1|0:E;K=B;L=A;M=z;N=y}I=D+1|0;if((I|0)>(r|0)){s=N;t=M;u=L;v=K;w=J;break}else{y=N;z=M;A=L;B=K;C=F;D=I;E=J}}}E=v-u+1|0;if((E*10|0|0)<=(l*9|0|0)){o=0;p=3706;break}if((t|0)>1){p=3696;break}else{j=n;k=w;l=(E|0)>(l|0)?E:l;m=s}}if((p|0)==3696){if((t|0)!=2){o=0;return o|0}if(em(b,n,w+1|0)|0){o=0;return o|0}t=eq(b,n,w)|0;w=eq(b,n,s)|0;if(!((t|0)>(n|0)&(w|0)>(n|0))){o=0;return o|0}if((d|0)==0){o=1;return o|0}c[d>>2]=t-w;o=1;return o|0}else if((p|0)==3706){return o|0}else if((p|0)==3703){return o|0}return 0}function es(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=c[b+12>>2]|0;f=c[b+4>>2]|0;L4404:do{if((e|0)>((((e-f|0)*80|0|0)/100|0)+f|0)){g=c[b>>2]|0;h=c[b+8>>2]|0;i=b+16|0;j=0;k=e;while(1){l=g;while(1){if((l|0)>(h|0)){m=h;break}if((a[(c[(c[i>>2]|0)+((k-f|0)*12|0)>>2]|0)+(l-g)|0]|0)==0){l=l+1|0}else{m=h;break}}while(1){if((m|0)<=(l|0)){break}if((a[(c[(c[i>>2]|0)+((k-f|0)*12|0)>>2]|0)+(m-g)|0]|0)==0){m=m-1|0}else{break}}n=m-l+1|0;o=(n|0)>(j|0)?n:j;if((n<<2|0)>=(h+1-g|0)){n=l;do{n=n+1|0;if((n|0)>=(m|0)){p=o;q=k;break L4404}}while((a[(c[(c[i>>2]|0)+((k-f|0)*12|0)>>2]|0)+(n-g)|0]|0)!=0)}n=k-1|0;if((n|0)>((((e-f|0)*80|0|0)/100|0)+f|0)){j=o;k=n}else{p=o;q=n;break}}}else{p=0;q=e}}while(0);if((q|0)<=((((e-f|0)*80|0|0)/100|0)+f|0)){r=0;return r|0}m=q-1|0;q=(e+f|0)/2|0;if((m|0)<=(q|0)){r=0;return r|0}e=c[b>>2]|0;k=c[b+8>>2]|0;j=b+16|0;if((e|0)>(k|0)){g=p;i=m;while(1){if((g&268435456|0)==0){r=0;s=3743;break}h=i-1|0;if((h|0)>(q|0)){g=(g|0)<0?0:g;i=h}else{r=0;s=3746;break}}if((s|0)==3743){return r|0}else if((s|0)==3746){return r|0}}else{t=0;u=p;v=0;w=m}while(1){m=c[(c[j>>2]|0)+((w-f|0)*12|0)>>2]|0;p=t;i=0;g=v;h=-1;n=-2;l=0;x=e;while(1){y=(a[m+(x-e)|0]|0)!=0;if(y){if(l){z=i;A=p}else{B=i+1|0;z=B;A=(B|0)==2?x:p}C=x;D=(h|0)<0?x:h;E=g;F=z;G=A}else{C=n;D=h;E=l&(i|0)==1?x-1|0:g;F=i;G=p}B=x+1|0;if((B|0)>(k|0)){break}else{p=G;i=F;g=E;h=D;n=C;l=y;x=B}}x=C-D+1|0;if((F|0)>2){r=0;s=3749;break}if((x*10|0|0)<=(u<<3|0)){r=0;s=3742;break}l=(x|0)>(u|0)?x:u;if((F|0)==2){if((G-E|0)>1){s=3737;break}}x=w-1|0;if((x|0)>(q|0)){t=G;u=l;v=E;w=x}else{r=0;s=3745;break}}if((s|0)==3745){return r|0}else if((s|0)==3737){if(eo(b,w,E+1|0)|0){r=0;return r|0}if((d|0)==0){r=1;return r|0}v=ep(b,w,E)|0;c[d>>2]=v-(ep(b,w,G)|0);r=1;return r|0}else if((s|0)==3742){return r|0}else if((s|0)==3749){return r|0}return 0}function et(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;e=b;c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];dS(a+16|0,b+16|0);e=a+28|0;d=b+28|0;eJ(e,d);b=a+32|0;a=e|0;e=c[a>>2]|0;if((c[b>>2]|0)==(e|0)){return}f=d|0;d=0;g=e;do{e=o8(28)|0;h=c[(c[f>>2]|0)+(d<<2)>>2]|0;i=h;c[e>>2]=c[i>>2];c[e+4>>2]=c[i+4>>2];c[e+8>>2]=c[i+8>>2];c[e+12>>2]=c[i+12>>2];dS(e+16|0,h+16|0);c[(c[a>>2]|0)+(d<<2)>>2]=e;d=d+1|0;g=c[a>>2]|0;}while(d>>>0<(c[b>>2]|0)-g>>2>>>0);return}function eu(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;b=a+32|0;d=c[b>>2]|0;e=a+28|0;f=c[e>>2]|0;if((d|0)==(f|0)){g=d;h=f;i=d}else{j=0;k=f;f=d;while(1){d=c[k+(j<<2)>>2]|0;if((d|0)==0){l=f;m=k}else{n=d+16|0;o=c[n>>2]|0;if((o|0)!=0){p=d+20|0;q=c[p>>2]|0;if((o|0)==(q|0)){r=o}else{s=q;while(1){q=s-12|0;c[p>>2]=q;t=c[q>>2]|0;if((t|0)==0){u=q}else{q=s-12+4|0;if((t|0)!=(c[q>>2]|0)){c[q>>2]=t}pb(t);u=c[p>>2]|0}if((o|0)==(u|0)){break}else{s=u}}r=c[n>>2]|0}pb(r)}pb(d);l=c[b>>2]|0;m=c[e>>2]|0}s=j+1|0;o=m;if(s>>>0<l-o>>2>>>0){j=s;k=m;f=l}else{g=m;h=o;i=l;break}}}if((g|0)!=0){if((g|0)!=(i|0)){c[b>>2]=i+(~((i-4+(-h|0)|0)>>>2)<<2)}pb(g)}g=a+16|0;h=c[g>>2]|0;if((h|0)==0){return}i=a+20|0;a=c[i>>2]|0;if((h|0)==(a|0)){v=h}else{b=a;while(1){a=b-12|0;c[i>>2]=a;l=c[a>>2]|0;if((l|0)==0){w=a}else{a=b-12+4|0;if((l|0)!=(c[a>>2]|0)){c[a>>2]=l}pb(l);w=c[i>>2]|0}if((h|0)==(w|0)){break}else{b=w}}v=c[g>>2]|0}pb(v);return}function ev(a,b){a=a|0;b=b|0;var d=0;d=c[a>>2]|0;if((d|0)==(b|0)){return}d3(a|0,b);if((b-d|0)<=0){return}ew(a|0,a+28|0);return}function ew(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=b+4|0;e=b|0;b=c[e>>2]|0;f=((c[d>>2]|0)-b>>2)-1|0;if((f|0)<=-1){return}g=f;h=f;f=b;while(1){b=h<<2>>2;i=c[f+(g<<2)>>2]|0;do{if(!(dx(a,i|0)|0)){if((i|0)!=0){j=i+16|0;k=c[j>>2]|0;if((k|0)!=0){l=i+20|0;m=c[l>>2]|0;if((k|0)==(m|0)){n=k}else{o=m;while(1){m=o-12|0;c[l>>2]=m;p=c[m>>2]|0;if((p|0)==0){q=m}else{m=o-12+4|0;if((p|0)!=(c[m>>2]|0)){c[m>>2]=p}pb(p);q=c[l>>2]|0}if((k|0)==(q|0)){break}else{o=q}}n=c[j>>2]|0}pb(n)}pb(i)}o=c[e>>2]|0;k=g<<2>>2;l=o+(k+1<<2)|0;p=(c[d>>2]|0)-l|0;m=p>>2;r=o+(k<<2)|0;s=l;pn(r|0,s|0,p|0)|0;p=c[d>>2]|0;if((o+(m+k<<2)|0)==(p|0)){break}c[d>>2]=p+(~((p-4+(-(o+(m+b<<2)|0)|0)|0)>>>2)<<2)}}while(0);b=g-1|0;if((b|0)<=-1){break}g=b;h=h+1073741823&1073741823;f=c[e>>2]|0}return}function ex(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;if((d|0)==(b|0)){return}d5(a|0,b);if((b-d|0)<=0){return}ew(a|0,a+28|0);return}function ey(a,b){a=a|0;b=b|0;var d=0;d=c[a+8>>2]|0;if((d|0)==(b|0)){return}d7(a|0,b);if((b-d|0)>=0){return}ew(a|0,a+28|0);return}function ez(a,b){a=a|0;b=b|0;var d=0;d=c[a+12>>2]|0;if((d|0)==(b|0)){return}d8(a|0,b);if((b-d|0)>=0){return}ew(a|0,a+28|0);return}function eA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((b|0)<0){d=a+28|0}else{e=a+28|0;f=c[e>>2]|0;if(((c[a+32>>2]|0)-f>>2|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}}while(0);gM(632);g=c[d>>2]|0;h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}function eB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;if(!(dw(b|0,d,e)|0)){f=0;return f|0}if((a[(c[(c[b+16>>2]|0)+((d-(c[b+4>>2]|0)|0)*12|0)>>2]|0)+(e-(c[b>>2]|0))|0]|0)!=0){f=1;return f|0}g=b+32|0;h=b+28|0;b=c[h>>2]|0;if(((c[g>>2]|0)-b|0)>0){i=0;j=b}else{f=0;return f|0}while(1){b=dw(c[j+(i<<2)>>2]|0,d,e)|0;k=c[h>>2]|0;if(b){b=c[k+(i<<2)>>2]|0;if((a[(c[(c[b+16>>2]|0)+((d-(c[b+4>>2]|0)|0)*12|0)>>2]|0)+(e-(c[b>>2]|0))|0]|0)!=0){break}}b=i+1|0;if((b|0)<((c[g>>2]|0)-k>>2|0)){i=b;j=k}else{f=0;l=3872;break}}if((l|0)==3872){return f|0}f=~i;return f|0}function eC(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;b=a+12|0;d=a+4|0;e=(c[b>>2]|0)+1-(c[d>>2]|0)|0;f=a+8|0;g=a|0;h=(c[f>>2]|0)+1-(c[g>>2]|0)|0;i=(((h|0)<(e|0)?h:e)|0)/2|0;e=0;while(1){if((e|0)>=(i|0)){j=i;break}if((eB(a,(c[b>>2]|0)-e|0,(c[g>>2]|0)+e|0)|0)==1){j=e;break}h=e+1|0;if((eB(a,(c[b>>2]|0)-e|0,h+(c[g>>2]|0)|0)|0)==1){j=e;break}else{e=h}}e=0;while(1){if((e|0)>=(i|0)){k=i;break}if((eB(a,(c[d>>2]|0)+e|0,(c[f>>2]|0)-e|0)|0)==1){k=e;break}else{e=e+1|0}}if((k|0)<=1){l=0;return l|0}l=(j*3|0|0)<=(k|0);return l|0}function eD(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;b=a+12|0;d=a+4|0;e=(c[b>>2]|0)+1-(c[d>>2]|0)|0;f=a+8|0;g=a|0;h=c[g>>2]|0;i=(c[f>>2]|0)+1-h|0;j=(i|0)<(e|0)?i:e;e=(j|0)/2|0;L4617:do{if((i|0)>3){if((j|0)>1){k=0;l=0;m=e;n=e;o=0;p=h}else{q=0;while(1){r=q+1|0;if((r|0)<((i|0)/4|0|0)){q=r}else{s=0;t=0;u=e;v=e;break L4617}}}while(1){q=m;r=n;w=0;x=0;y=0;z=p;while(1){A=y+o|0;if((eB(a,(c[d>>2]|0)+y|0,A+z|0)|0)==1){B=w+1|0;C=(q|0)>(y|0)?y:q}else{B=w;C=q}if((eB(a,(c[b>>2]|0)-y|0,(c[f>>2]|0)-A|0)|0)==1){D=x+1|0;E=(r|0)>(y|0)?y:r}else{D=x;E=r}A=y+1|0;if((A|0)>=(e|0)){break}q=C;r=E;w=B;x=D;y=A;z=c[g>>2]|0}z=c[g>>2]|0;y=(k|0)<(B|0)?B:k;x=(l|0)<(D|0)?D:l;w=o+1|0;if((w|0)<(((c[f>>2]|0)+1-z|0)/4|0|0)){k=y;l=x;m=C;n=E;o=w;p=z}else{s=y;t=x;u=C;v=E;break}}}else{s=0;t=0;u=e;v=e}}while(0);if(!((u|0)>(v|0)|(v|0)==0)){F=0;return F|0}v=s<<1;if((v|0)<(t|0)){F=1;return F|0}else{return(v|0)==(t|0)&(t|0)>3|0}return 0}function eE(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=b+4|0;f=c[e>>2]|0;g=b+12|0;if((f|0)>(c[g>>2]|0)){h=aL(10,d|0)|0;return}i=b|0;j=b+8|0;k=b+16|0;b=f;do{f=c[i>>2]|0;L4647:do{if((f|0)<=(c[j>>2]|0)){l=f;m=f;while(1){if((a[(c[(c[k>>2]|0)+((b-(c[e>>2]|0)|0)*12|0)>>2]|0)+(l-m)|0]|0)==0){aM(2504,2,1,d|0)|0}else{aM(3144,2,1,d|0)|0}n=l+1|0;if((n|0)>(c[j>>2]|0)){break L4647}l=n;m=c[i>>2]|0}}}while(0);aL(10,d|0)|0;b=b+1|0;}while((b|0)<=(c[g>>2]|0));h=aL(10,d|0)|0;return}function eF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((b|0)<0){d=a+28|0;e=3919}else{f=a+28|0;g=c[f>>2]|0;if(((c[a+32>>2]|0)-g>>2|0)>(b|0)){h=g}else{d=f;e=3919}}if((e|0)==3919){gM(1800);h=c[d>>2]|0}d=a+28|0;d9(a|0,c[h+(b<<2)>>2]|0);h=c[d>>2]|0;e=c[h+(b<<2)>>2]|0;if((e|0)==0){i=h}else{h=e+16|0;f=c[h>>2]|0;if((f|0)!=0){g=e+20|0;j=c[g>>2]|0;if((f|0)==(j|0)){k=f}else{l=j;while(1){j=l-12|0;c[g>>2]=j;m=c[j>>2]|0;if((m|0)==0){n=j}else{j=l-12+4|0;if((m|0)!=(c[j>>2]|0)){c[j>>2]=m}pb(m);n=c[g>>2]|0}if((f|0)==(n|0)){break}else{l=n}}k=c[h>>2]|0}pb(k)}pb(e);i=c[d>>2]|0}d=b<<2>>2;e=i+(d+1<<2)|0;k=a+32|0;a=(c[k>>2]|0)-e|0;h=a>>2;n=i+(d<<2)|0;l=e;pn(n|0,l|0,a|0)|0;a=c[k>>2]|0;if((i+(h+d<<2)|0)==(a|0)){return}c[k>>2]=a+(~((a-4+(-(i+(h+(b<<2>>2)<<2)|0)|0)|0)>>>2)<<2);return}function eG(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0;d=i;i=i+24|0;e=d|0;f=d+16|0;g=b+28|0;h=b+32|0;j=c[h>>2]|0;k=g|0;l=c[k>>2]|0;do{if((j|0)!=(l|0)){m=0;n=l;o=j;while(1){p=c[n+(m<<2)>>2]|0;if((p|0)==0){q=o;r=n}else{s=p+16|0;t=c[s>>2]|0;if((t|0)!=0){u=p+20|0;v=c[u>>2]|0;if((t|0)==(v|0)){w=t}else{x=v;while(1){v=x-12|0;c[u>>2]=v;y=c[v>>2]|0;if((y|0)==0){z=v}else{v=x-12+4|0;if((y|0)!=(c[v>>2]|0)){c[v>>2]=y}pb(y);z=c[u>>2]|0}if((t|0)==(z|0)){break}else{x=z}}w=c[s>>2]|0}pb(w)}pb(p);q=c[h>>2]|0;r=c[k>>2]|0}x=m+1|0;if(x>>>0<q-r>>2>>>0){m=x;n=r;o=q}else{break}}if((r|0)==(q|0)){break}c[h>>2]=q+(~((q-4+(-r|0)|0)>>>2)<<2)}}while(0);r=b|0;q=b+12|0;w=b+4|0;if(((c[q>>2]|0)+1-(c[w>>2]|0)|0)<3){i=d;return}z=b+8|0;j=b|0;l=(c[z>>2]|0)+1-(c[j>>2]|0)|0;if((l|0)<3){i=d;return}if(l>>>0>1073741823>>>0){mE(0)}o=o8(l<<2)|0;n=l;m=o;do{if((m|0)==0){A=0}else{c[m>>2]=0;A=m}m=A+4|0;n=n-1|0;}while((n|0)!=0);n=o+(l<<2)|0;l=c[j>>2]|0;A=(c[z>>2]|0)+1|0;x=A-l|0;t=e|0;c[t>>2]=0;u=e+4|0;c[u>>2]=0;y=e+8|0;c[y>>2]=0;if((A|0)==(l|0)){B=0}else{if(x>>>0>1073741823>>>0){mE(0)}l=o8(x<<2)|0;c[u>>2]=l;c[t>>2]=l;c[y>>2]=l+(x<<2);A=x;x=l;do{if((x|0)==0){C=0}else{c[x>>2]=0;C=x}x=C+4|0;A=A-1|0;}while((A|0)!=0);c[u>>2]=x;B=x}x=c[w>>2]|0;L4738:do{if((x|0)>(c[q>>2]|0)){D=o}else{A=b|0;C=b+16|0;l=b+36|0;v=n;E=m;F=o;G=x;H=B;I=x;while(1){J=c[t>>2]|0;c[t>>2]=F;c[u>>2]=E;K=c[y>>2]|0;c[y>>2]=v;c[F>>2]=(a[c[(c[C>>2]|0)+((G-I|0)*12|0)>>2]|0]|0)!=0?b:0;L=c[j>>2]|0;M=L+1|0;N=c[z>>2]|0;if((M|0)<(N|0)){O=M;M=L;while(1){P=O-M|0;do{if((a[(c[(c[C>>2]|0)+((G-(c[w>>2]|0)|0)*12|0)>>2]|0)+P|0]|0)==0){Q=c[(c[t>>2]|0)+(P-1<<2)>>2]|0;R=J+(P<<2)|0;S=c[R>>2]|0;T=(Q|0)==0;U=(S|0)==0;do{if(T|U){c[f>>2]=0;if(!(T|(Q|0)==(A|0))){eH(g,J,H,e,Q,P);V=0;break}if(U|(S|0)==(A|0)){V=0;break}eH(g,J,H,e,S,P);V=0}else{if((Q|0)!=(A|0)){c[f>>2]=Q;eb(Q,G,O);V=Q;break}if((S|0)!=(A|0)){c[f>>2]=S;eb(S,G,O);V=S;break}W=o8(28)|0;X=W;d1(X,O,G,O,G);c[f>>2]=X;a[(c[(c[W+16>>2]|0)+((G-(c[W+4>>2]|0)|0)*12|0)>>2]|0)+(O-(c[W>>2]|0))|0]=1;W=c[h>>2]|0;if((W|0)==(c[l>>2]|0)){eI(g,f);V=c[f>>2]|0;break}if((W|0)==0){Y=0}else{c[W>>2]=X;Y=c[h>>2]|0}c[h>>2]=Y+4;V=X}}while(0);U=c[t>>2]|0;c[U+(P<<2)>>2]=V;if((V|0)==0|(Q|0)==(S|0)|(Q|0)==(A|0)|(S|0)==(A|0)){break}do{if((c[Q+4>>2]|0)>(c[S+4>>2]|0)){T=P+1|0;X=U+(T<<2)|0;if((T|0)==0){Z=S;_=Q;break}else{$=U}while(1){if((c[$>>2]|0)==(Q|0)){c[$>>2]=S}T=$+4|0;if((T|0)==(X|0)){Z=S;_=Q;break}else{$=T}}}else{if((R|0)==(H|0)){Z=Q;_=S;break}else{aa=R}while(1){if((c[aa>>2]|0)==(S|0)){c[aa>>2]=Q}X=aa+4|0;if((X|0)==(H|0)){Z=Q;_=S;break}else{aa=X}}}}while(0);S=c[h>>2]|0;Q=c[k>>2]|0;R=S-Q>>2;U=R;X=R+1073741823|0;while(1){ab=U-1|0;if((U|0)<=0){break}if((c[Q+(ab<<2)>>2]|0)==(_|0)){break}else{U=ab;X=X+1073741823&1073741823}}if((ab|0)<0){gM(888);ac=c[k>>2]|0;ad=c[h>>2]|0}else{ac=Q;ad=S}U=ab<<2>>2;R=ac+(U+1<<2)|0;T=ad-R|0;W=T>>2;ae=ac+(U<<2)|0;af=R;pn(ae|0,af|0,T|0)|0;T=c[h>>2]|0;if((ac+(W+U<<2)|0)!=(T|0)){c[h>>2]=T+(~((T-4+(-(ac+(W+(X<<2>>2)<<2)|0)|0)|0)>>>2)<<2)}d9(Z,_);if((_|0)==0){break}W=_+16|0;T=c[W>>2]|0;if((T|0)!=0){U=_+20|0;af=c[U>>2]|0;if((T|0)==(af|0)){ag=T}else{ae=af;while(1){af=ae-12|0;c[U>>2]=af;R=c[af>>2]|0;if((R|0)==0){ah=af}else{af=ae-12+4|0;if((R|0)!=(c[af>>2]|0)){c[af>>2]=R}pb(R);ah=c[U>>2]|0}if((T|0)==(ah|0)){break}else{ae=ah}}ag=c[W>>2]|0}pb(ag)}pb(_)}else{c[(c[t>>2]|0)+(P<<2)>>2]=A}}while(0);P=O+1|0;ae=c[z>>2]|0;T=c[j>>2]|0;if((P|0)<(ae|0)){O=P;M=T}else{ai=ae;aj=T;break}}}else{ai=N;aj=L}do{if((a[(c[(c[C>>2]|0)+((G-(c[w>>2]|0)|0)*12|0)>>2]|0)+(ai-aj)|0]|0)==0){M=ai+1-aj|0;O=c[(c[t>>2]|0)+(M-2<<2)>>2]|0;if((O|0)==0|(O|0)==(A|0)){break}eH(g,J,H,e,O,M-1|0)}}while(0);L=G+1|0;if((L|0)>(c[q>>2]|0)){D=J;break L4738}v=K;E=H;F=J;G=L;H=c[u>>2]|0;I=c[w>>2]|0}}}while(0);w=c[k>>2]|0;q=((c[h>>2]|0)-w>>2)-1|0;L4821:do{if((q|0)>-1){e=q;g=q;aj=w;while(1){ai=g<<2>>2;j=c[aj+(e<<2)>>2]|0;do{if(dx(r,j|0)|0){z=(c[j+12>>2]|0)+1-(c[j+4>>2]|0)|0;if((z|0)>4){break}_=(c[j+8>>2]|0)+1-(c[j>>2]|0)|0;if((_|0)>4){break}if(!((z|0)>2|(_|0)>2)){ak=4044;break}if((ee(j)|0)<=3){ak=4044}}else{ak=4044}}while(0);do{if((ak|0)==4044){ak=0;if((j|0)!=0){J=j+16|0;K=c[J>>2]|0;if((K|0)!=0){_=j+20|0;z=c[_>>2]|0;if((K|0)==(z|0)){al=K}else{ag=z;while(1){z=ag-12|0;c[_>>2]=z;ah=c[z>>2]|0;if((ah|0)==0){am=z}else{z=ag-12+4|0;if((ah|0)!=(c[z>>2]|0)){c[z>>2]=ah}pb(ah);am=c[_>>2]|0}if((K|0)==(am|0)){break}else{ag=am}}al=c[J>>2]|0}pb(al)}pb(j)}ag=c[k>>2]|0;K=e<<2>>2;_=ag+(K+1<<2)|0;ah=(c[h>>2]|0)-_|0;z=ah>>2;Z=ag+(K<<2)|0;ac=_;pn(Z|0,ac|0,ah|0)|0;ah=c[h>>2]|0;if((ag+(z+K<<2)|0)==(ah|0)){break}c[h>>2]=ah+(~((ah-4+(-(ag+(z+ai<<2)|0)|0)|0)>>>2)<<2)}}while(0);ai=e-1|0;if((ai|0)<=-1){break L4821}e=ai;g=g+1073741823&1073741823;aj=c[k>>2]|0}}}while(0);k=c[t>>2]|0;t=k;if((k|0)!=0){h=c[u>>2]|0;if((k|0)!=(h|0)){c[u>>2]=h+(~((h-4+(-t|0)|0)>>>2)<<2)}pb(k)}if((D|0)==0){i=d;return}pb(D);i=d;return}function eH(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b+(g<<2)|0;if((h|0)!=(d|0)){b=h;do{if((c[b>>2]|0)==(f|0)){c[b>>2]=0}b=b+4|0;}while((b|0)!=(d|0))}d=c[e>>2]|0;e=d+(g<<2)|0;if((g|0)!=0){g=d;do{if((c[g>>2]|0)==(f|0)){c[g>>2]=0}g=g+4|0;}while((g|0)!=(e|0))}e=a+4|0;g=c[e>>2]|0;d=a|0;a=c[d>>2]|0;b=g-a>>2;h=b;i=b+1073741823|0;while(1){j=h-1|0;if((h|0)<=0){break}if((c[a+(j<<2)>>2]|0)==(f|0)){break}else{h=j;i=i+1073741823&1073741823}}if((j|0)<0){gM(560);k=c[d>>2]|0;l=c[e>>2]|0}else{k=a;l=g}g=j<<2>>2;j=k+(g+1<<2)|0;a=l-j|0;l=a>>2;d=k+(g<<2)|0;h=j;pn(d|0,h|0,a|0)|0;a=c[e>>2]|0;if((k+(l+g<<2)|0)!=(a|0)){c[e>>2]=a+(~((a-4+(-(k+(l+(i<<2>>2)<<2)|0)|0)|0)>>>2)<<2)}if((f|0)==0){return}i=f+16|0;l=c[i>>2]|0;if((l|0)!=0){k=f+20|0;a=c[k>>2]|0;if((l|0)==(a|0)){m=l}else{e=a;while(1){a=e-12|0;c[k>>2]=a;g=c[a>>2]|0;if((g|0)==0){n=a}else{a=e-12+4|0;if((g|0)!=(c[a>>2]|0)){c[a>>2]=g}pb(g);n=c[k>>2]|0}if((l|0)==(n|0)){break}else{e=n}}m=c[i>>2]|0}pb(m)}pb(f);return}function eI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=f;h=(c[d>>2]|0)-g|0;i=h>>2;j=i+1|0;if(j>>>0>1073741823>>>0){mE(0)}k=a+8|0;a=(c[k>>2]|0)-g|0;if(a>>2>>>0>536870910>>>0){l=1073741823;m=4108}else{g=a>>1;a=g>>>0<j>>>0?j:g;if((a|0)==0){n=0;o=0}else{l=a;m=4108}}if((m|0)==4108){n=o8(l<<2)|0;o=l}l=n+(i<<2)|0;i=n+(o<<2)|0;if((l|0)!=0){c[l>>2]=c[b>>2]}b=n+(j<<2)|0;j=n;l=f;pl(j|0,l|0,h)|0;c[e>>2]=n;c[d>>2]=b;c[k>>2]=i;if((f|0)==0){return}pb(l);return}function eJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;a=b+4|0;g=b|0;b=(c[a>>2]|0)-(c[g>>2]|0)|0;h=b>>2;if((h|0)==0){return}if(h>>>0>1073741823>>>0){mE(0)}i=o8(b)|0;c[e>>2]=i;c[d>>2]=i;c[f>>2]=i+(h<<2);h=c[g>>2]|0;g=c[a>>2]|0;if((h|0)==(g|0)){return}else{j=h;k=i}do{if((k|0)==0){l=0}else{c[k>>2]=c[j>>2];l=c[e>>2]|0}k=l+4|0;c[e>>2]=k;j=j+4|0;}while((j|0)!=(g|0));return}function eK(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bg=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bO=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b$=0,b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0;f=i;i=i+56|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+40|0;m=f+48|0;n=a;o=d;c[n>>2]=c[o>>2];c[n+4>>2]=c[o+4>>2];c[n+8>>2]=c[o+8>>2];c[n+12>>2]=c[o+12>>2];o=a+16|0;n=o|0;c[n>>2]=0;d=a+20|0;c[d>>2]=0;p=a+24|0;c[p>>2]=0;q=e+4|0;r=c[q>>2]|0;s=e|0;e=c[s>>2]|0;if((r|0)==(e|0)){i=f;return}t=k|0;u=k+4|0;v=k+8|0;w=0;x=0;y=0;z=0;A=0;B=0;C=0;D=0;E=0;F=0;G=e;e=r;L4945:while(1){r=F+1|0;H=e-G>>2;L4947:do{if(r>>>0<H>>>0){I=c[(c[G+(F<<2)>>2]|0)+12>>2]|0;J=r;while(1){K=c[G+(J<<2)>>2]|0;if((c[K+4>>2]|0)>(I|0)){L=J;break L4947}M=c[K+12>>2]|0;K=J+1|0;if(K>>>0<H>>>0){I=(I|0)<(M|0)?M:I;J=K}else{L=K;break}}}else{L=r}}while(0);c[t>>2]=0;c[u>>2]=0;c[v>>2]=0;r=F>>>0<L>>>0;do{if(r){H=F;J=0;I=G;while(1){K=c[I+(H<<2)>>2]|0;M=(c[K+12>>2]|0)+1-(c[K+4>>2]|0)|0;do{if((M|0)<10){N=J}else{O=(c[K+8>>2]|0)+1-(c[K>>2]|0)|0;if((M|0)>=(O*5|0|0)|(O|0)>=(M*3|0|0)){N=J;break}O=c[u>>2]|0;P=c[t>>2]|0;Q=O-P>>2;do{if(M>>>0<Q>>>0){R=P}else{S=M+1|0;if(Q>>>0<S>>>0){d$(k,S-Q|0);R=c[t>>2]|0;break}if(Q>>>0<=S>>>0){R=P;break}T=P+(S<<2)|0;if((T|0)==(O|0)){R=P;break}c[u>>2]=O+(~((O-4+(-T|0)|0)>>>2)<<2);R=P}}while(0);P=R+(M<<2)|0;c[P>>2]=(c[P>>2]|0)+1;N=J+1|0}}while(0);M=H+1|0;if(M>>>0>=L>>>0){break}H=M;J=N;I=c[s>>2]|0}I=c[u>>2]|0;J=c[t>>2]|0;do{if((I|0)==(J|0)){if(r){U=F;V=N;W=J;X=J}else{Y=w;Z=x;_=y;$=z;aa=A;ab=B;ac=C;ad=D;ae=E;af=J;break}while(1){H=c[(c[s>>2]|0)+(U<<2)>>2]|0;M=(c[H+12>>2]|0)+1-(c[H+4>>2]|0)|0;H=W-X>>2;do{if(M>>>0<H>>>0){ah=X}else{K=M+1|0;if(H>>>0<K>>>0){d$(k,K-H|0);ah=c[t>>2]|0;break}if(H>>>0<=K>>>0){ah=X;break}P=X+(K<<2)|0;if((P|0)==(W|0)){ah=X;break}c[u>>2]=W+(~((W-4+(-P|0)|0)>>>2)<<2);ah=X}}while(0);H=ah+(M<<2)|0;c[H>>2]=(c[H>>2]|0)+1;H=V+1|0;P=U+1|0;K=c[u>>2]|0;O=c[t>>2]|0;if(P>>>0<L>>>0){U=P;V=H;W=K;X=O}else{ai=H;aj=K;ak=O;al=4193;break}}}else{ai=N;aj=I;ak=J;al=4193}}while(0);do{if((al|0)==4193){al=0;do{if((aj|0)==(ak|0)){am=0}else{J=aj-ak>>2;I=ai*9|0;O=0;K=0;H=0;P=0;while(1){Q=c[ak+(K<<2)>>2]|0;T=Q+O|0;if((T*10|0)>>>0>=ai>>>0&(O*10|0)>>>0<I>>>0){an=(ag(Q,K)|0)+P|0;ao=Q+H|0}else{an=P;ao=H}Q=K+1|0;if(Q>>>0<J>>>0){O=T;K=Q;H=ao;P=an}else{break}}if((ao|0)==0){am=an;break}am=(an|0)/(ao|0)|0}}while(0);if(!r){Y=w;Z=x;_=y;$=z;aa=A;ab=B;ac=C;ad=D;ae=E;af=ak;break}P=am<<1;H=w;K=x;O=y;J=z;I=A;M=B;Q=C;T=D;S=E;ap=F;while(1){aq=c[(c[s>>2]|0)+(ap<<2)>>2]|0;ar=(c[aq+12>>2]|0)+1-(c[aq+4>>2]|0)|0;do{if((ar|0)<10){as=1}else{at=(c[aq+8>>2]|0)+1-(c[aq>>2]|0)|0;if((ar|0)>=(at*5|0|0)){as=1;break}as=(at|0)>=(ar*3|0|0)}}while(0);do{if((ar|0)>=(P|0)|as&(ar|0)>(am|0)){if((I|0)!=(J|0)){if((I|0)!=0){c[I>>2]=aq}au=S;av=T;aw=Q;ax=M;ay=I+4|0;az=J;aA=O;aB=K;aC=H;break}at=I-M|0;aD=at>>2;aE=aD+1|0;if(aE>>>0>1073741823>>>0){al=4211;break L4945}if(aD>>>0>536870910>>>0){aF=1073741823;al=4215}else{aG=at>>1;aH=aG>>>0<aE>>>0?aE:aG;if((aH|0)==0){aI=0;aJ=0}else{aF=aH;al=4215}}if((al|0)==4215){al=0;aI=o8(aF<<2)|0;aJ=aF}aH=aI+(aD<<2)|0;aD=aI+(aJ<<2)|0;if((aH|0)!=0){c[aH>>2]=aq}aH=aI+(aE<<2)|0;aE=aI;aG=M;pl(aE|0,aG|0,at)|0;if((M|0)==0){au=S;av=T;aw=Q;ax=aI;ay=aH;az=aD;aA=O;aB=K;aC=H;break}pb(aG);au=S;av=T;aw=Q;ax=aI;ay=aH;az=aD;aA=O;aB=K;aC=H}else{if((ar<<1|0)<=(am|0)|(ar|0)<6|as&(ar|0)<(am|0)){if((T|0)!=(Q|0)){if((T|0)!=0){c[T>>2]=aq}au=S;av=T+4|0;aw=Q;ax=M;ay=I;az=J;aA=O;aB=K;aC=H;break}aD=T-S|0;aH=aD>>2;aG=aH+1|0;if(aG>>>0>1073741823>>>0){al=4227;break L4945}if(aH>>>0>536870910>>>0){aK=1073741823;al=4231}else{at=aD>>1;aE=at>>>0<aG>>>0?aG:at;if((aE|0)==0){aL=0;aM=0}else{aK=aE;al=4231}}if((al|0)==4231){al=0;aL=o8(aK<<2)|0;aM=aK}aE=aL+(aH<<2)|0;aH=aL+(aM<<2)|0;if((aE|0)!=0){c[aE>>2]=aq}aE=aL+(aG<<2)|0;aG=aL;at=S;pl(aG|0,at|0,aD)|0;if((S|0)==0){au=aL;av=aE;aw=aH;ax=M;ay=I;az=J;aA=O;aB=K;aC=H;break}pb(at);au=aL;av=aE;aw=aH;ax=M;ay=I;az=J;aA=O;aB=K;aC=H;break}else{if((K|0)!=(H|0)){if((K|0)!=0){c[K>>2]=aq}au=S;av=T;aw=Q;ax=M;ay=I;az=J;aA=O;aB=K+4|0;aC=H;break}aH=K-O|0;aE=aH>>2;at=aE+1|0;if(at>>>0>1073741823>>>0){al=4242;break L4945}if(aE>>>0>536870910>>>0){aN=1073741823;al=4246}else{aD=aH>>1;aG=aD>>>0<at>>>0?at:aD;if((aG|0)==0){aO=0;aP=0}else{aN=aG;al=4246}}if((al|0)==4246){al=0;aO=o8(aN<<2)|0;aP=aN}aG=aO+(aE<<2)|0;aE=aO+(aP<<2)|0;if((aG|0)!=0){c[aG>>2]=aq}aG=aO+(at<<2)|0;at=aO;aD=O;pl(at|0,aD|0,aH)|0;if((O|0)==0){au=S;av=T;aw=Q;ax=M;ay=I;az=J;aA=aO;aB=aG;aC=aE;break}pb(aD);au=S;av=T;aw=Q;ax=M;ay=I;az=J;aA=aO;aB=aG;aC=aE;break}}}while(0);aq=ap+1|0;if(aq>>>0<L>>>0){H=aC;K=aB;O=aA;J=az;I=ay;M=ax;Q=aw;T=av;S=au;ap=aq}else{break}}Y=aC;Z=aB;_=aA;$=az;aa=ay;ab=ax;ac=aw;ad=av;ae=au;af=c[t>>2]|0}}while(0);if((af|0)==0){aQ=ae;aR=ad;aS=ac;aT=ab;aU=aa;aV=$;aW=_;aX=Z;aY=Y;break}ap=c[u>>2]|0;if((af|0)!=(ap|0)){c[u>>2]=ap+(~((ap-4+(-af|0)|0)>>>2)<<2)}pb(af);aQ=ae;aR=ad;aS=ac;aT=ab;aU=aa;aV=$;aW=_;aX=Z;aY=Y}else{aQ=E;aR=D;aS=C;aT=B;aU=A;aV=z;aW=y;aX=x;aY=w}}while(0);aZ=c[q>>2]|0;a_=c[s>>2]|0;if(L>>>0<aZ-a_>>2>>>0){w=aY;x=aX;y=aW;z=aV;A=aU;B=aT;C=aS;D=aR;E=aQ;F=L;G=a_;e=aZ}else{al=4259;break}}if((al|0)==4227){mE(0)}else if((al|0)==4259){e=a_;do{if((aX|0)==(aW|0)){if((aZ|0)==(a_|0)){break}else{a$=0;a0=a_;a1=aZ}while(1){G=c[a0+(a$<<2)>>2]|0;if((G|0)==0){a2=a1;a3=a0}else{eu(G);pb(G);a2=c[q>>2]|0;a3=c[s>>2]|0}G=a$+1|0;if(G>>>0<a2-a3>>2>>>0){a$=G;a0=a3;a1=a2}else{break}}if((a3|0)==(a2|0)){break}c[q>>2]=a2+(~((a2-4+(-a3|0)|0)>>>2)<<2)}else{if((a_|0)!=(aZ|0)){c[q>>2]=aZ+(~((aZ-4+(-e|0)|0)>>>2)<<2)}G=o8(28)|0;L=G;pm(G|0,0,28)|0;c[l>>2]=L;G=c[d>>2]|0;if((G|0)==(c[p>>2]|0)){eS(o,l);a4=c[d>>2]|0}else{if((G|0)==0){a5=0}else{c[G>>2]=L;a5=c[d>>2]|0}L=a5+4|0;c[d>>2]=L;a4=L}L=a+16|0;G=c[L>>2]|0;F=(a4-G>>2)-1|0;E=c[G+(F<<2)>>2]|0;G=o8(40)|0;D=c[aW>>2]|0;aS=D;c[G>>2]=c[aS>>2];c[G+4>>2]=c[aS+4>>2];c[G+8>>2]=c[aS+8>>2];c[G+12>>2]=c[aS+12>>2];aS=G+20|0;C=o8(4)|0;B=C;c[aS>>2]=B;c[G+16>>2]=B;c[G+24>>2]=C+4;if((C|0)==0){a6=0}else{c[B>>2]=D;a6=B}c[aS>>2]=a6+4;c[G+28>>2]=0;c[G+32>>2]=0;c[G+36>>2]=0;fJ(E,G,0)|0;G=aX-aW>>2;if(G>>>0>1>>>0){E=g|0;aS=1;B=F;while(1){D=c[aW+(aS<<2)>>2]|0;C=B-2|0;A=D|0;aV=D+12|0;z=(F|0)<(C|0)?C:F;C=c[n>>2]|0;L5096:while(1){y=c[C+(z<<2)>>2]|0;x=0;aY=(c[y+20>>2]|0)-(c[y+16>>2]|0)>>2;L5098:while(1){if((aY|0)>0){a7=aY}else{a8=0;a9=0;break}while(1){ba=a7-1|0;bb=fF(c[(c[n>>2]|0)+(z<<2)>>2]|0,ba)|0;bc=bb|0;if(!(dy(A,bc)|0)){if(!(dy(bc,A)|0)){break}}if((ba|0)>0){a7=ba}else{a8=0;a9=0;break L5098}}if(dJ(A,bc)|0){x=bb;aY=ba}else{al=4296;break}}do{if((al|0)==4296){al=0;if((bb|0)==0){a8=0;a9=0;break}if(dz(bc,A)|0){al=4306;break L5096}if(dz(A,bc)|0){al=4306;break L5096}else{a8=bb;a9=1}}}while(0);aY=(x|0)!=0;if(aY){y=x|0;if(dz(y,A)|0){al=4306;break}if(dz(A,y)|0){al=4306;break}}if(a9){if((c[a8+4>>2]|0)>(c[aV>>2]|0)){al=4316;break}}if(aY){if((c[x+4>>2]|0)>(c[aV>>2]|0)){al=4316;break}}if(a9){if((dF(a8|0,A)|0)>5){al=4330;break}}if(aY){if((dF(x|0,A)|0)>5){al=4330;break}}aY=z+1|0;bd=c[d>>2]|0;y=c[L>>2]|0;if((aY|0)<(bd-y>>2|0)){z=aY;C=y}else{al=4337;break}}if((al|0)==4330){al=0;C=c[(c[n>>2]|0)+(z<<2)>>2]|0;A=o8(40)|0;aV=A;y=D;c[A>>2]=c[y>>2];c[A+4>>2]=c[y+4>>2];c[A+8>>2]=c[y+8>>2];c[A+12>>2]=c[y+12>>2];y=A+20|0;aY=o8(4)|0;w=aY;c[y>>2]=w;c[A+16>>2]=w;c[A+24>>2]=aY+4;if((aY|0)==0){be=0}else{c[w>>2]=D;be=w}c[y>>2]=be+4;c[A+28>>2]=0;c[A+32>>2]=0;c[A+36>>2]=0;fJ(C,aV,0)|0;bf=z}else if((al|0)==4337){al=0;aV=o8(28)|0;C=aV;pm(aV|0,0,28)|0;c[m>>2]=C;if((bd|0)==(c[p>>2]|0)){eS(o,m);bg=c[d>>2]|0}else{if((bd|0)==0){bh=0}else{c[bd>>2]=C;bh=c[d>>2]|0}C=bh+4|0;c[d>>2]=C;bg=C}C=c[L>>2]|0;aV=(bg-C>>2)-1|0;A=c[C+(aV<<2)>>2]|0;C=o8(40)|0;y=D;c[C>>2]=c[y>>2];c[C+4>>2]=c[y+4>>2];c[C+8>>2]=c[y+8>>2];c[C+12>>2]=c[y+12>>2];y=C+20|0;w=o8(4)|0;aY=w;c[y>>2]=aY;c[C+16>>2]=aY;c[C+24>>2]=w+4;if((w|0)==0){bi=0}else{c[aY>>2]=D;bi=aY}c[y>>2]=bi+4;c[C+28>>2]=0;c[C+32>>2]=0;c[C+36>>2]=0;fJ(A,C,0)|0;bf=aV}else if((al|0)==4306){al=0;aV=c[(c[n>>2]|0)+(z<<2)>>2]|0;C=o8(40)|0;A=D;c[C>>2]=c[A>>2];c[C+4>>2]=c[A+4>>2];c[C+8>>2]=c[A+8>>2];c[C+12>>2]=c[A+12>>2];A=C+20|0;y=o8(4)|0;aY=y;c[A>>2]=aY;c[C+16>>2]=aY;c[C+24>>2]=y+4;if((y|0)==0){bj=0}else{c[aY>>2]=D;bj=aY}c[A>>2]=bj+4;c[C+28>>2]=0;c[C+32>>2]=0;c[C+36>>2]=0;fJ(aV,C,0)|0;bf=z}else if((al|0)==4316){al=0;c[E>>2]=(c[n>>2]|0)+(z<<2);C=o8(28)|0;aV=C;pm(C|0,0,28)|0;c[h>>2]=aV;eT(j,o,g,h);aV=c[(c[n>>2]|0)+(z<<2)>>2]|0;C=o8(40)|0;A=D;c[C>>2]=c[A>>2];c[C+4>>2]=c[A+4>>2];c[C+8>>2]=c[A+8>>2];c[C+12>>2]=c[A+12>>2];A=C+20|0;aY=o8(4)|0;y=aY;c[A>>2]=y;c[C+16>>2]=y;c[C+24>>2]=aY+4;if((aY|0)==0){bk=0}else{c[y>>2]=D;bk=y}c[A>>2]=bk+4;c[C+28>>2]=0;c[C+32>>2]=0;c[C+36>>2]=0;fJ(aV,C,0)|0;bf=z}C=aS+1|0;if(C>>>0<G>>>0){aS=C;B=bf}else{break}}}B=c[d>>2]|0;aS=c[L>>2]|0;G=B-aS|0;L5175:do{if((G|0)>0){E=G>>2;F=B;C=aS;while(1){aV=E-1|0;A=c[C+(aV<<2)>>2]|0;do{if((c[A+20>>2]|0)==(c[A+16>>2]|0)){if((A|0)==0){bl=C;bm=F}else{fB(A);pb(A);bl=c[n>>2]|0;bm=c[d>>2]|0}y=aV<<2>>2;aY=bl+(y+1<<2)|0;w=bm-aY|0;Y=w>>2;Z=bl+(y<<2)|0;_=aY;pn(Z|0,_|0,w|0)|0;w=bl+(Y+y<<2)|0;y=c[d>>2]|0;if((w|0)==(y|0)){bn=w;break}Y=y+(~((y-4+(-w|0)|0)>>>2)<<2)|0;c[d>>2]=Y;bn=Y}else{bn=F}}while(0);if((aV|0)<=0){break L5175}E=aV;F=bn;C=c[n>>2]|0}}}while(0);eL(o);aS=c[L>>2]|0;if(((c[d>>2]|0)-aS|0)>0){B=0;G=aS;do{fC(c[G+(B<<2)>>2]|0);B=B+1|0;G=c[L>>2]|0;}while((B|0)<((c[d>>2]|0)-G>>2|0))}G=aU-aT>>2;if((G|0)!=0){B=0;aS=0;while(1){C=c[aT+(B<<2)>>2]|0;F=C+12|0;E=C|0;z=C+8|0;D=aS;while(1){if((D|0)<=0){break}A=c[F>>2]|0;if((A|0)<(fX(c[(c[n>>2]|0)+(D<<2)>>2]|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0)){D=D-1|0}else{break}}A=C+4|0;x=D;while(1){Y=c[d>>2]|0;w=c[L>>2]|0;if((x|0)>=(Y-w>>2|0)){bo=Y;bp=w;break}Y=c[A>>2]|0;if((Y|0)<=(fX(c[w+(x<<2)>>2]|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0)){al=4377;break}x=x+1|0}if((al|0)==4377){al=0;bo=c[d>>2]|0;bp=c[L>>2]|0}L5211:do{if((x|0)<(bo-bp>>2|0)){D=c[bp+(x<<2)>>2]|0;w=c[D+12>>2]|0;Y=fE(D)|0;y=(c[F>>2]|0)+1-(c[A>>2]|0)|0;do{if((y|0)<=(Y*3|0|0)){if((y|0)>(Y<<1|0)){_=c[(fF(D,w)|0)>>2]|0;if((_|0)>=(c[E>>2]|0)){break}}_=o8(40)|0;Z=_;aY=C;c[_>>2]=c[aY>>2];c[_+4>>2]=c[aY+4>>2];c[_+8>>2]=c[aY+8>>2];c[_+12>>2]=c[aY+12>>2];aY=_+20|0;$=o8(4)|0;aa=$;c[aY>>2]=aa;c[_+16>>2]=aa;c[_+24>>2]=$+4;if(($|0)==0){bq=0}else{c[aa>>2]=C;bq=aa}c[aY>>2]=bq+4;c[_+28>>2]=0;c[_+32>>2]=0;c[_+36>>2]=0;fJ(D,Z,0)|0;br=x;break L5211}}while(0);Y=(c[D+20>>2]|0)-(c[D+16>>2]|0)>>2;do{if((Y|0)!=0){y=w+1|0;aV=Y-1|0;Z=c[(fF(D,(aV|0)<(y|0)?aV:y)|0)>>2]|0;if((Z|0)>(((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0|0)){break}if((C|0)==0){br=x;break L5211}eu(C);pb(C);br=x;break L5211}}while(0);Y=o8(40)|0;w=Y;Z=C;c[Y>>2]=c[Z>>2];c[Y+4>>2]=c[Z+4>>2];c[Y+8>>2]=c[Z+8>>2];c[Y+12>>2]=c[Z+12>>2];Z=Y+20|0;y=o8(4)|0;aV=y;c[Z>>2]=aV;c[Y+16>>2]=aV;c[Y+24>>2]=y+4;if((y|0)==0){bs=0}else{c[aV>>2]=C;bs=aV}c[Z>>2]=bs+4;c[Y+28>>2]=0;c[Y+32>>2]=0;c[Y+36>>2]=0;fJ(D,w,1)|0;br=x}else{w=x-1|0;if((C|0)==0){br=w;break}eu(C);pb(C);br=w}}while(0);C=B+1|0;if(C>>>0<G>>>0){B=C;aS=br}else{break}}}aS=aR-aQ>>2;if((aS|0)!=0){B=0;G=0;while(1){C=c[aQ+(B<<2)>>2]|0;x=C+12|0;E=C|0;z=C+8|0;A=G;while(1){if((A|0)<=0){al=4410;break}F=c[x>>2]|0;w=A-1|0;if((F|0)<(fW(c[(c[n>>2]|0)+(A<<2)>>2]|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0)){A=w}else{bt=w;break}}if((al|0)==4410){al=0;bt=A-1|0}w=(bt|0)>0?bt:0;F=C+4|0;Y=A;while(1){Z=c[d>>2]|0;aV=c[L>>2]|0;if((Y|0)>=(Z-aV>>2|0)){bu=Z;bv=aV;break}Z=c[F>>2]|0;if((Z|0)<=(fV(c[aV+(Y<<2)>>2]|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0)){al=4418;break}Y=Y+1|0}if((al|0)==4418){al=0;bu=c[d>>2]|0;bv=c[L>>2]|0}do{if((Y|0)<(bu-bv>>2|0)){bw=Y;bx=w;al=4433}else{A=Y-1|0;aV=c[bv+(A<<2)>>2]|0;Z=fG(aV,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0;y=c[F>>2]|0;_=fV(aV|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0;aY=c[aV>>2]|0;aa=(c[aV+4>>2]|0)==(aY|0);if(aa){by=0}else{by=(c[aY+16>>2]|0)/2|0}if((y|0)<=(by+_|0)){bw=A;bx=A;al=4433;break}if((Z|0)!=0){if(aa){bz=0}else{bz=(c[aY+16>>2]|0)/2|0}if((c[F>>2]|0)<=(bz+(c[Z+12>>2]|0)|0)){bw=A;bx=A;al=4433;break}}if((C|0)==0){bA=A;break}eu(C);pb(C);bA=A}}while(0);if((al|0)==4433){al=0;Y=(bw-bx|0)>1?bw-1|0:bx;if((bw|0)==(Y|0)){bB=bw}else{w=c[F>>2]|0;A=fV(c[(c[n>>2]|0)+(Y<<2)>>2]|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0;Z=fW(c[(c[n>>2]|0)+(bw<<2)>>2]|0,((c[z>>2]|0)+(c[E>>2]|0)|0)/2|0)|0;bB=(w-A<<1|0)<(Z-(c[x>>2]|0)|0)?Y:bw}Y=c[(c[n>>2]|0)+(bB<<2)>>2]|0;Z=o8(40)|0;A=Z;w=C;c[Z>>2]=c[w>>2];c[Z+4>>2]=c[w+4>>2];c[Z+8>>2]=c[w+8>>2];c[Z+12>>2]=c[w+12>>2];w=Z+20|0;aY=o8(4)|0;aa=aY;c[w>>2]=aa;c[Z+16>>2]=aa;c[Z+24>>2]=aY+4;if((aY|0)==0){bC=0}else{c[aa>>2]=C;bC=aa}c[w>>2]=bC+4;c[Z+28>>2]=0;c[Z+32>>2]=0;c[Z+36>>2]=0;fJ(Y,A,0)|0;bA=bB}A=B+1|0;if(A>>>0<aS>>>0){B=A;G=bA}else{break}}}G=c[d>>2]|0;B=c[L>>2]|0;aS=G-B|0;L5291:do{if((aS|0)>8){A=c[B+((aS>>2)-1<<2)>>2]|0;Y=A+20|0;Z=A+16|0;L5293:do{if(((c[Y>>2]|0)-(c[Z>>2]|0)|0)>0){w=b+12|0;aa=0;aY=0;while(1){_=c[(fF(A,aa)|0)+12>>2]|0;if((_|0)<(c[w>>2]|0)){bD=aY;bE=c[Y>>2]|0;bF=c[Z>>2]|0}else{_=aY+1|0;y=c[Y>>2]|0;aV=c[Z>>2]|0;if((_<<1|0)<(y-aV>>2|0)){bD=_;bE=y;bF=aV}else{break}}aV=aa+1|0;if((aV|0)<(bE-bF>>2|0)){aa=aV;aY=bD}else{break L5293}}aY=c[d>>2]|0;aa=c[L>>2]|0;w=(aY-aa>>2)-1|0;D=c[aa+(w<<2)>>2]|0;if((D|0)==0){bG=aa;bH=aY}else{fB(D);pb(D);bG=c[n>>2]|0;bH=c[d>>2]|0}D=w<<2>>2;w=bG+(D+1<<2)|0;aY=bH-w|0;aa=aY>>2;aV=bG+(D<<2)|0;y=w;pn(aV|0,y|0,aY|0)|0;aY=bG+(aa+D<<2)|0;D=c[d>>2]|0;if((aY|0)==(D|0)){break}c[d>>2]=D+(~((D-4+(-aY|0)|0)>>>2)<<2)}}while(0);Z=c[c[n>>2]>>2]|0;Y=c[b+4>>2]|0;A=(Y|0)<1?1:Y;Y=Z+20|0;C=Z+16|0;L5309:do{if(((c[Y>>2]|0)-(c[C>>2]|0)|0)>0){x=0;E=0;while(1){if((c[(fF(Z,x)|0)+4>>2]|0)>(A|0)){bI=E;bJ=c[Y>>2]|0;bK=c[C>>2]|0}else{z=E+1|0;F=c[Y>>2]|0;aY=c[C>>2]|0;if((z<<1|0)<(F-aY>>2|0)){bI=z;bJ=F;bK=aY}else{break}}aY=x+1|0;if((aY|0)<(bJ-bK>>2|0)){x=aY;E=bI}else{break L5309}}E=c[n>>2]|0;x=c[E>>2]|0;if((x|0)==0){bL=E}else{fB(x);pb(x);bL=c[n>>2]|0}x=bL+4|0;E=(c[d>>2]|0)-x|0;aY=E>>2;F=bL;z=x;pn(F|0,z|0,E|0)|0;E=bL+(aY<<2)|0;aY=c[d>>2]|0;if((E|0)==(aY|0)){bM=E;break L5291}z=aY+(~((aY-4+(-E|0)|0)>>>2)<<2)|0;c[d>>2]=z;bM=z;break L5291}}while(0);bM=c[d>>2]|0}else{bM=G}}while(0);G=c[L>>2]|0;if(((bM-G>>2)-1|0)>0){aS=0;B=G;while(1){G=c[B+(aS<<2)>>2]|0;C=aS+1|0;Y=c[B+(C<<2)>>2]|0;A=G+20|0;Z=G+16|0;z=Y+20|0;E=Y+16|0;L5328:do{if(((c[A>>2]|0)-(c[Z>>2]|0)>>2|0)>((c[z>>2]|0)-(c[E>>2]|0)>>1|0)){bN=C}else{aY=fE(G)|0;if((aY<<1|0)>=(fE(Y)|0)){bN=C;break}aY=aS<<2>>2;F=aY+1|0;x=0;L5333:while(1){if((x|0)>=((c[A>>2]|0)-(c[Z>>2]|0)>>2|0)){bN=C;break L5328}D=fF(G,x)|0;aa=D|0;y=D+12|0;aV=c[y>>2]|0;w=c[D+4>>2]|0;L5338:do{if((aV+1-w<<1|0)<(fE(Y)|0)){if(!1){break}_=D|0;$=D+8|0;ab=0;while(1){if((ab|0)>=((c[z>>2]|0)-(c[E>>2]|0)>>2|0)){break L5338}ac=fF(Y,ab)|0;ad=ac|0;do{if((c[ac+8>>2]|0)>=(c[_>>2]|0)){if((c[ac>>2]|0)>(c[$>>2]|0)){break L5338}if(!(dy(ad,aa)|0)){if(!(dy(aa,ad)|0)){break}}ae=c[ac+4>>2]|0;af=c[y>>2]|0;if((ae-af|0)<(fE(Y)|0)){break L5333}}}while(0);if(1){ab=ab+1|0}else{break}}}}while(0);if(1){x=x+1|0}else{bN=C;break L5328}}fN(Y,G);x=c[n>>2]|0;y=c[x+(aS<<2)>>2]|0;if((y|0)==0){bO=x}else{fB(y);pb(y);bO=c[n>>2]|0}y=bO+(F<<2)|0;x=(c[d>>2]|0)-y|0;aa=x>>2;D=bO+(aY<<2)|0;w=y;pn(D|0,w|0,x|0)|0;x=bO+(aa+aY<<2)|0;aa=c[d>>2]|0;if((x|0)==(aa|0)){bN=aS;break}c[d>>2]=aa+(~((aa-4+(-x|0)|0)>>>2)<<2);bN=aS}}while(0);G=c[L>>2]|0;if((bN|0)<(((c[d>>2]|0)-G>>2)-1|0)){aS=bN;B=G}else{break}}}eL(o);B=c[d>>2]|0;aS=c[L>>2]|0;do{if((B-aS|0)>0){G=0;Y=aS;do{fD(c[Y+(G<<2)>>2]|0);G=G+1|0;bP=c[d>>2]|0;Y=c[L>>2]|0;bQ=bP-Y|0;}while((G|0)<(bQ>>2|0));if((bQ|0)<=8){bR=bP;bS=Y;break}if((bP-Y|0)>8){bT=0;bU=2;bV=Y}else{bR=bP;bS=Y;break}while(1){G=c[bV+(bT<<2)>>2]|0;C=bT+1|0;E=c[bV+(C<<2)>>2]|0;z=c[bV+(bU<<2)>>2]|0;do{if(((c[E+20>>2]|0)-(c[E+16>>2]|0)|0)<=8){if(((c[G+20>>2]|0)-(c[G+16>>2]|0)|0)<16){break}if(((c[z+20>>2]|0)-(c[z+16>>2]|0)|0)<16){break}Z=G+4|0;A=G|0;x=c[A>>2]|0;if((c[Z>>2]|0)==(x|0)){bW=0}else{bW=c[x+16>>2]|0}x=z+4|0;aa=z|0;w=c[aa>>2]|0;if((c[x>>2]|0)==(w|0)){bX=0}else{bX=c[w+16>>2]|0}if(!(gN(bW,bX,10,1)|0)){break}w=c[E>>2]|0;if((c[E+4>>2]|0)==(w|0)){bY=0}else{bY=c[w+16>>2]<<3}w=c[A>>2]|0;if((c[Z>>2]|0)==(w|0)){bZ=0}else{bZ=c[w+16>>2]|0}w=c[aa>>2]|0;if((c[x>>2]|0)==(w|0)){b_=0}else{b_=c[w+16>>2]|0}if((bY|0)>(b_+bZ|0)){break}w=c[n>>2]|0;x=c[w+(C<<2)>>2]|0;if((x|0)==0){b$=w}else{fB(x);pb(x);b$=c[n>>2]|0}x=C<<2>>2;w=b$+(x+1<<2)|0;aa=(c[d>>2]|0)-w|0;Z=aa>>2;A=b$+(x<<2)|0;D=w;pn(A|0,D|0,aa|0)|0;aa=b$+(Z+x<<2)|0;x=c[d>>2]|0;if((aa|0)==(x|0)){break}c[d>>2]=x+(~((x-4+(-aa|0)|0)>>>2)<<2)}}while(0);E=bT+3|0;z=c[d>>2]|0;G=c[L>>2]|0;if((E|0)<(z-G>>2|0)){bT=C;bU=E;bV=G}else{bR=z;bS=G;break}}}else{bR=B;bS=aS}}while(0);if((bR-bS|0)>0){aS=0;B=bS;while(1){Y=c[B+(aS<<2)>>2]|0;G=Y+20|0;do{if((c[Y+12>>2]|0)==0){z=Y+16|0;if(((c[G>>2]|0)-(c[z>>2]|0)|0)<=8){b0=z;break}E=fF(Y,0)|0;aY=fF(Y,1)|0;F=fF(Y,2)|0;if(((c[E+20>>2]|0)-(c[E+16>>2]|0)|0)!=4){b0=z;break}aa=c[E+8>>2]|0;x=c[aY+8>>2]|0;Z=c[aY>>2]|0;D=ag((c[E+12>>2]|0)+1-(c[E+4>>2]|0)<<2,aa+1-(c[E>>2]|0)|0)|0;if((D|0)>=(ag(x+1-Z|0,(c[aY+12>>2]|0)+1-(c[aY+4>>2]|0)|0)|0)){b0=z;break}aY=c[Y>>2]|0;E=(c[Y+4>>2]|0)==(aY|0);if(E){b1=0}else{b1=c[aY+16>>2]<<1}if((Z-aa|0)<=(b1|0)){b0=z;break}aa=c[F>>2]|0;if((D|0)>=(ag((c[F+8>>2]|0)+1-aa|0,(c[F+12>>2]|0)+1-(c[F+4>>2]|0)|0)|0)){b0=z;break}if(E){b2=0}else{b2=c[aY+16>>2]|0}if((aa-x|0)>=(b2|0)){b0=z;break}fI(Y,0);b0=z}else{b0=Y+16|0}}while(0);z=(c[G>>2]|0)-(c[b0>>2]|0)|0;do{if((z|0)>8){x=fF(Y,(z>>2)-1|0)|0;aa=fF(Y,((c[G>>2]|0)-(c[b0>>2]|0)>>2)-2|0)|0;aY=fF(Y,((c[G>>2]|0)-(c[b0>>2]|0)>>2)-3|0)|0;if(((c[x+20>>2]|0)-(c[x+16>>2]|0)|0)!=4){break}E=c[x>>2]|0;F=c[aa+8>>2]|0;D=c[aa>>2]|0;Z=ag((c[x+12>>2]|0)+1-(c[x+4>>2]|0)<<2,(c[x+8>>2]|0)+1-E|0)|0;if((Z|0)>=(ag(F+1-D|0,(c[aa+12>>2]|0)+1-(c[aa+4>>2]|0)|0)|0)){break}aa=c[Y>>2]|0;x=(c[Y+4>>2]|0)==(aa|0);if(x){b3=0}else{b3=c[aa+16>>2]<<1}if((E-F|0)<=(b3|0)){break}F=c[aY+8>>2]|0;if((Z|0)>=(ag(F+1-(c[aY>>2]|0)|0,(c[aY+12>>2]|0)+1-(c[aY+4>>2]|0)|0)|0)){break}if(x){b4=0}else{b4=c[aa+16>>2]|0}if((D-F|0)>=(b4|0)){break}fI(Y,((c[G>>2]|0)-(c[b0>>2]|0)>>2)-1|0)}}while(0);G=aS+1|0;Y=c[d>>2]|0;z=c[L>>2]|0;if((G|0)<(Y-z>>2|0)){aS=G;B=z}else{b5=Y;b6=z;break}}}else{b5=bR;b6=bS}if((b5-b6|0)>0){b7=0;b8=b6}else{break}do{fM(c[b8+(b7<<2)>>2]|0);b7=b7+1|0;b8=c[L>>2]|0;}while((b7|0)<((c[d>>2]|0)-b8>>2|0))}}while(0);if((aQ|0)!=0){pb(aQ)}if((aT|0)!=0){pb(aT)}if((aW|0)==0){i=f;return}pb(aW);i=f;return}else if((al|0)==4242){mE(0)}else if((al|0)==4211){mE(0)}}function eL(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;b=a+4|0;d=a|0;a=c[d>>2]|0;if((c[b>>2]|0)==(a|0)){return}else{e=0;f=a}do{a=c[f+(e<<2)>>2]|0;g=a+20|0;h=a+16|0;L5475:do{if((((c[g>>2]|0)-(c[h>>2]|0)>>2)-1|0)>0){i=0;while(1){j=i+1|0;L5478:while(1){k=fF(a,i)|0;l=c[g>>2]|0;m=c[h>>2]|0;if((j|0)>=(l-m>>2|0)){n=l;o=m;break}m=k|0;l=k+4|0;p=k+12|0;q=j;L5481:while(1){r=fF(a,q)|0;do{if(dD(m,r|0)|0){s=r+4|0;t=r+12|0;u=(((c[p>>2]|0)+(c[l>>2]|0)|0)/2|0|0)<(((c[t>>2]|0)+(c[s>>2]|0)|0)/2|0|0);v=u?k:r;w=u?r:k;u=w|0;x=v|0;if(dy(u,x)|0){break L5481}if(dy(x,u)|0){break L5481}if((c[w+4>>2]|0)>(c[v+12>>2]|0)){if((((c[w+8>>2]|0)+(c[w>>2]|0)|0)/2|0|0)<(((c[v+8>>2]|0)+(c[v>>2]|0)|0)/2|0|0)){break L5481}}if(((c[w+20>>2]|0)-(c[w+16>>2]|0)|0)!=8){break}v=fk(w,0)|0;u=ag((c[v+12>>2]|0)+1-(c[v+4>>2]|0)<<1,(c[v+8>>2]|0)+1-(c[v>>2]|0)|0)|0;v=fk(w,1)|0;if((u|0)>=(ag((c[v+8>>2]|0)+1-(c[v>>2]|0)|0,(c[v+12>>2]|0)+1-(c[v+4>>2]|0)|0)|0)){break}if(dz(fk(w,0)|0,x)|0){break L5481}}}while(0);x=q+1|0;v=c[g>>2]|0;u=c[h>>2]|0;if((x|0)<(v-u>>2|0)){q=x}else{n=v;o=u;break L5478}}m=ag((c[p>>2]|0)+1-(c[l>>2]|0)<<6,(c[k+8>>2]|0)+1-(c[k>>2]|0)|0)|0;u=fl(r)|0;do{if((m|0)<(ag((c[u+8>>2]|0)+1-(c[u>>2]|0)|0,(c[u+12>>2]|0)+1-(c[u+4>>2]|0)|0)|0)){y=i}else{v=ag((c[t>>2]|0)+1-(c[s>>2]|0)<<6,(c[r+8>>2]|0)+1-(c[r>>2]|0)|0)|0;x=fl(k)|0;if((v|0)<(ag((c[x+8>>2]|0)+1-(c[x>>2]|0)|0,(c[x+12>>2]|0)+1-(c[x+4>>2]|0)|0)|0)){y=q;break}if((w|0)==(r|0)){fu(r,k);y=i;break}else{fu(k,r);y=q;break}}}while(0);fI(a,y);if((i|0)>=(((c[g>>2]|0)-(c[h>>2]|0)>>2)-1|0)){break L5475}}if((j|0)<((n-o>>2)-1|0)){i=j}else{break}}}}while(0);e=e+1|0;f=c[d>>2]|0;}while(e>>>0<(c[b>>2]|0)-f>>2>>>0);return}function eM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a+20|0;d=a+16|0;a=c[d>>2]|0;e=(c[b>>2]|0)-a|0;if((e|0)>0){f=e>>2;e=a;while(1){g=f-1|0;h=c[e+(g<<2)>>2]|0;if((h|0)==0){i=e}else{fB(h);pb(h);i=c[d>>2]|0}if((g|0)>0){f=g;e=i}else{j=i;break}}}else{j=a}if((j|0)==0){return}a=c[b>>2]|0;if((j|0)!=(a|0)){c[b>>2]=a+(~((a-4+(-j|0)|0)>>>2)<<2)}pb(j);return}function eN(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a+20|0;k=c[j>>2]|0;l=a+16|0;m=c[l>>2]|0;if((k-m|0)>0){n=0;o=m;while(1){fR(c[o+(n<<2)>>2]|0,b);g8(c[(c[l>>2]|0)+(n<<2)>>2]|0,b);p=n+1|0;q=c[j>>2]|0;r=c[l>>2]|0;if((p|0)<(q-r>>2|0)){n=p;o=r}else{s=q;t=r;break}}}else{s=k;t=m}do{if((c[d>>2]|0)==0){u=s;v=t}else{if((s-t|0)>0){w=0;x=t}else{u=s;v=t;break}while(1){fS(c[x+(w<<2)>>2]|0,d);m=w+1|0;k=c[j>>2]|0;o=c[l>>2]|0;if((m|0)<(k-o>>2|0)){w=m;x=o}else{u=k;v=o;break}}}}while(0);x=u-v|0;if((x|0)>0){w=x>>2;x=v;while(1){d=w-1|0;t=c[x+(d<<2)>>2]|0;s=t+20|0;o=t+16|0;k=0;while(1){if((k|0)>=((c[s>>2]|0)-(c[o>>2]|0)>>2|0)){y=4641;break}m=fF(t,k)|0;if((c[m+32>>2]|0)==(c[m+28>>2]|0)){k=k+1|0}else{break}}do{if((y|0)==4641){y=0;k=c[l>>2]|0;t=c[k+(d<<2)>>2]|0;if((t|0)==0){z=k}else{fB(t);pb(t);z=c[l>>2]|0}t=d<<2>>2;k=z+(t+1<<2)|0;o=(c[j>>2]|0)-k|0;s=o>>2;m=z+(t<<2)|0;n=k;pn(m|0,n|0,o|0)|0;o=z+(s+t<<2)|0;t=c[j>>2]|0;if((o|0)==(t|0)){break}c[j>>2]=t+(~((t-4+(-o|0)|0)>>>2)<<2)}}while(0);if((d|0)<=0){break}w=d;x=c[l>>2]|0}A=c[j>>2]|0;B=c[l>>2]|0}else{A=u;B=v}if((A-B|0)<=8){i=e;return}B=a+16|0;a=fO(c[A-4>>2]|0)|0;A=B|0;v=a-(fO(c[c[A>>2]>>2]|0)|0)|0;a=c[j>>2]|0;u=c[l>>2]|0;x=a-u|0;w=(v|0)/((x>>2)-1|0)|0;L5552:do{if((x|0)>4){v=0;z=w;y=1;o=u;while(1){t=v;s=y;n=o;L5555:while(1){m=c[n+(t<<2)>>2]|0;k=c[n+(s<<2)>>2]|0;b=m+20|0;r=m+16|0;q=k+20|0;p=k+16|0;do{if(gN((c[b>>2]|0)-(c[r>>2]|0)>>2,(c[q>>2]|0)-(c[p>>2]|0)>>2,50,1)|0){C=c[b>>2]|0;D=c[r>>2]|0;if((C|0)==(D|0)){E=0}else{E=(c[(c[C-4>>2]|0)+8>>2]|0)-(c[c[D>>2]>>2]|0)|0}D=c[q>>2]|0;C=c[p>>2]|0;if((D|0)==(C|0)){F=0}else{F=(c[(c[D-4>>2]|0)+8>>2]|0)-(c[c[C>>2]>>2]|0)|0}if(!(gN(E,F,30,1)|0)){break}C=fO(k)|0;G=C-(fO(m)|0)|0;if((G|0)>=(z|0)){break}H=fE(m)|0;I=fE(k)|0;if((H|0)<10|(I|0)<10){break}if(gN(H,I,20,1)|0){break L5555}}}while(0);k=s+1|0;m=c[j>>2]|0;p=c[l>>2]|0;if((k|0)<(m-p>>2|0)){t=s;s=k;n=p}else{J=z;K=m;L=p;break L5552}}n=(G<<1|0)>(I+H|0)?G:z;t=s+1|0;p=c[j>>2]|0;m=c[l>>2]|0;if((t|0)<(p-m>>2|0)){v=s;z=n;y=t;o=m}else{J=n;K=p;L=m;break}}}else{J=w;K=a;L=u}}while(0);if((J|0)<=0){i=e;return}if((K-L|0)<=4){i=e;return}K=f|0;u=0;a=1;w=L;while(1){L=c[w+(u<<2)>>2]|0;G=fO(c[w+(a<<2)>>2]|0)|0;H=G-(fO(L)|0)-J|0;L=u+1|0;if((H<<1|0)>(J|0)){G=H;H=L;while(1){c[K>>2]=(c[A>>2]|0)+(H<<2);I=o8(28)|0;F=I;pm(I|0,0,28)|0;c[g>>2]=F;eT(h,B,f,g);F=G-J|0;I=H+1|0;if((F<<1|0)>(J|0)){G=F;H=I}else{M=I;break}}}else{M=L}H=M+1|0;G=c[l>>2]|0;if((H|0)<((c[j>>2]|0)-G>>2|0)){u=M;a=H;w=G}else{break}}i=e;return}function eO(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((b|0)<0){d=a+16|0}else{e=a+16|0;f=c[e>>2]|0;if(((c[a+20>>2]|0)-f>>2|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}}while(0);gM(88);g=c[d>>2]|0;h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}function eP(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;g=b+8|0;h=a+20|0;j=a+16|0;bT(c[g>>2]|0,2936,(a=i,i=i+8|0,c[a>>2]=(c[h>>2]|0)-(c[j>>2]|0)>>2,a)|0)|0;i=a;k=c[j>>2]|0;l=c[g>>2]|0;if(((c[h>>2]|0)-k|0)>0){m=0;n=k;o=l}else{p=l;q=aL(10,p|0)|0;i=f;return}while(1){l=c[n+(m<<2)>>2]|0;k=m+1|0;bT(o|0,2360,(a=i,i=i+16|0,c[a>>2]=(c[l+20>>2]|0)-(c[l+16>>2]|0)>>2,c[a+8>>2]=k,a)|0)|0;i=a;fP(c[(c[j>>2]|0)+(m<<2)>>2]|0,b,d,e);l=c[j>>2]|0;r=c[g>>2]|0;if((k|0)<((c[h>>2]|0)-l>>2|0)){m=k;n=l;o=r}else{p=r;break}}q=aL(10,p|0)|0;i=f;return}function eQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a+20|0;e=a+16|0;a=c[e>>2]|0;if(((c[d>>2]|0)-a|0)>0){f=0;g=a}else{return}do{fQ(c[g+(f<<2)>>2]|0,b);f=f+1|0;g=c[e>>2]|0;}while((f|0)<((c[d>>2]|0)-g>>2|0));return}function eR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a+20|0;e=a+16|0;a=c[e>>2]|0;if(((c[d>>2]|0)-a|0)>0){f=0;g=a}else{return}do{dc(b,c[g+(f<<2)>>2]|0);f=f+1|0;g=c[e>>2]|0;}while((f|0)<((c[d>>2]|0)-g>>2|0));return}function eS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=f;h=(c[d>>2]|0)-g|0;i=h>>2;j=i+1|0;if(j>>>0>1073741823>>>0){mE(0)}k=a+8|0;a=(c[k>>2]|0)-g|0;if(a>>2>>>0>536870910>>>0){l=1073741823;m=4701}else{g=a>>1;a=g>>>0<j>>>0?j:g;if((a|0)==0){n=0;o=0}else{l=a;m=4701}}if((m|0)==4701){n=o8(l<<2)|0;o=l}l=n+(i<<2)|0;i=n+(o<<2)|0;if((l|0)!=0){c[l>>2]=c[b>>2]}b=n+(j<<2)|0;j=n;l=f;pl(j|0,l|0,h)|0;c[e>>2]=n;c[d>>2]=b;c[k>>2]=i;if((f|0)==0){return}pb(l);return}function eT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;h=c[g>>2]|0;j=h;k=(c[d>>2]|0)-j|0;d=k>>2;l=h+(d<<2)|0;m=b+4|0;n=c[m>>2]|0;o=b+8|0;b=c[o>>2]|0;if(n>>>0<b>>>0){if((l|0)==(n|0)){if((l|0)==0){p=0}else{c[l>>2]=c[e>>2];p=c[m>>2]|0}c[m>>2]=p+4;q=l;r=a|0;c[r>>2]=q;i=f;return}p=n-(h+(d+1<<2))|0;s=p>>2;t=h+(s+d<<2)|0;if(t>>>0<n>>>0){d=t;t=n;do{if((t|0)==0){u=0}else{c[t>>2]=c[d>>2];u=c[m>>2]|0}d=d+4|0;t=u+4|0;c[m>>2]=t;}while(d>>>0<n>>>0)}d=n+(-s<<2)|0;s=l;pn(d|0,s|0,p|0)|0;if(l>>>0>e>>>0){v=e}else{v=(c[m>>2]|0)>>>0>e>>>0?e+4|0:e}c[l>>2]=c[v>>2];q=l;r=a|0;c[r>>2]=q;i=f;return}v=(n-j>>2)+1|0;if(v>>>0>1073741823>>>0){mE(0)}n=b-j|0;if(n>>2>>>0>536870910>>>0){w=1073741823;x=l;y=k>>2;z=4726}else{j=n>>1;n=j>>>0<v>>>0?v:j;j=l;v=k>>2;if((n|0)==0){A=0;B=0;C=j;D=v}else{w=n;x=j;y=v;z=4726}}if((z|0)==4726){A=o8(w<<2)|0;B=w;C=x;D=y}y=A+(D<<2)|0;x=A+(B<<2)|0;do{if((D|0)==(B|0)){if((D|0)>0){E=A+(((D+1|0)/-2|0)+D<<2)|0;F=x;break}w=D<<1;z=(w|0)==0?1:w;w=o8(z<<2)|0;v=w+(z>>>2<<2)|0;j=w+(z<<2)|0;if((A|0)==0){E=v;F=j;break}pb(A);E=v;F=j}else{E=y;F=x}}while(0);if((E|0)!=0){c[E>>2]=c[e>>2]}e=E+4|0;x=c[g>>2]|0;y=C-x|0;A=E+(-(y>>2)<<2)|0;D=A;B=x;pl(D|0,B|0,y)|0;y=(c[m>>2]|0)-C|0;C=y>>2;D=e;e=l;pl(D|0,e|0,y)|0;c[g>>2]=A;c[m>>2]=E+(C+1<<2);c[o>>2]=F;if((x|0)==0){q=E;r=a|0;c[r>>2]=q;i=f;return}pb(B);q=E;r=a|0;c[r>>2]=q;i=f;return}function eU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=(c[a+20>>2]|0)-(c[a+16>>2]|0)>>2;if((e|0)==1){f=fk(a,0)|0;g=(c[f+32>>2]|0)-(c[f+28>>2]|0)>>2;if((g|0)==1){eW(a,b,d);return}else if((g|0)==0){eV(a,b,d);return}else if((g|0)==2){eX(a,d);return}else{return}}else if((e|0)==2){g5(a,b,d);return}else if((e|0)==3){g6(a,b,d);return}else{return}}function eV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0;e=i;i=i+496|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=e+80|0;r=e+88|0;s=e+96|0;t=e+104|0;u=e+112|0;v=e+120|0;w=e+128|0;x=e+136|0;y=e+488|0;z=fk(a,0)|0;gC(x,z);A=gZ(x,d)|0;do{if((A|0)==46){if(((c[z+8>>2]|0)+1-(c[z>>2]|0)|0)<=((c[z+12>>2]|0)+1-(c[z+4>>2]|0)|0)){break}if(!(dC(z|0,((c[d+12>>2]|0)+(c[d+4>>2]|0)|0)/2|0)|0)){break}B=u;c[u>>2]=46;c[B+4>>2]=1;C=a+32|0;D=c[C>>2]|0;E=a+36|0;if((D|0)==(c[E>>2]|0)){eZ(a+28|0,B);F=c[C>>2]|0}else{if((D|0)==0){G=0}else{B=D;D=c[u+4>>2]|0;c[B>>2]=c[u>>2];c[B+4>>2]=D;G=c[C>>2]|0}D=G+8|0;c[C>>2]=D;F=D}D=t;c[t>>2]=45;c[D+4>>2]=0;if((F|0)==(c[E>>2]|0)){eZ(a+28|0,D);eY(x);i=e;return}if((F|0)==0){H=0}else{D=F;E=c[t+4>>2]|0;c[D>>2]=c[t>>2];c[D+4>>2]=E;H=c[C>>2]|0}c[C>>2]=H+8;eY(x);i=e;return}else if((A|0)==0){C=z+12|0;E=z+4|0;D=(c[C>>2]|0)+1-(c[E>>2]|0)|0;if((D|0)<5){eY(x);i=e;return}B=c[z+8>>2]|0;I=c[z>>2]|0;do{if((D|0)<8){if((B+1-I|0)>=6){break}eY(x);i=e;return}}while(0);J=z+8|0;K=z|0;L=B+1-I|0;if((D|0)>(L*10|0|0)|(D*5|0|0)<(L|0)){eY(x);i=e;return}L=gR(x,b)|0;if((L|0)!=0){M=n;c[n>>2]=L;c[M+4>>2]=0;L=a+32|0;N=c[L>>2]|0;if((N|0)==(c[a+36>>2]|0)){eZ(a+28|0,M);eY(x);i=e;return}if((N|0)==0){O=0}else{M=N;N=c[n+4>>2]|0;c[M>>2]=c[n>>2];c[M+4>>2]=N;O=c[L>>2]|0}c[L>>2]=O+8;eY(x);i=e;return}L=gT(x,d)|0;if((L|0)!=0){N=m;c[m>>2]=L;c[N+4>>2]=0;L=a+32|0;M=c[L>>2]|0;if((M|0)==(c[a+36>>2]|0)){eZ(a+28|0,N);eY(x);i=e;return}if((M|0)==0){P=0}else{N=M;M=c[m+4>>2]|0;c[N>>2]=c[m>>2];c[N+4>>2]=M;P=c[L>>2]|0}c[L>>2]=P+8;eY(x);i=e;return}L=gU(x)|0;if((L|0)!=0){M=l;c[l>>2]=L;c[M+4>>2]=0;L=a+32|0;N=c[L>>2]|0;if((N|0)==(c[a+36>>2]|0)){eZ(a+28|0,M);eY(x);i=e;return}if((N|0)==0){Q=0}else{M=N;N=c[l+4>>2]|0;c[M>>2]=c[l>>2];c[M+4>>2]=N;Q=c[L>>2]|0}c[L>>2]=Q+8;eY(x);i=e;return}L=gS(x)|0;if((L|0)!=0){N=k;c[k>>2]=L;c[N+4>>2]=0;L=a+32|0;M=c[L>>2]|0;if((M|0)==(c[a+36>>2]|0)){eZ(a+28|0,N);eY(x);i=e;return}if((M|0)==0){R=0}else{N=M;M=c[k+4>>2]|0;c[N>>2]=c[k>>2];c[N+4>>2]=M;R=c[L>>2]|0}c[L>>2]=R+8;eY(x);i=e;return}do{if(gO(b,2)|0){L=gX(x)|0;if((L|0)==0){break}M=j;c[j>>2]=L;c[M+4>>2]=0;L=a+32|0;N=c[L>>2]|0;if((N|0)==(c[a+36>>2]|0)){eZ(a+28|0,M);eY(x);i=e;return}if((N|0)==0){S=0}else{M=N;N=c[j+4>>2]|0;c[M>>2]=c[j>>2];c[M+4>>2]=N;S=c[L>>2]|0}c[L>>2]=S+8;eY(x);i=e;return}}while(0);D=gQ(x,b)|0;if((D|0)!=0){I=h;c[h>>2]=D;c[I+4>>2]=0;D=a+32|0;B=c[D>>2]|0;if((B|0)==(c[a+36>>2]|0)){eZ(a+28|0,I);eY(x);i=e;return}if((B|0)==0){T=0}else{I=B;B=c[h+4>>2]|0;c[I>>2]=c[h>>2];c[I+4>>2]=B;T=c[D>>2]|0}c[D>>2]=T+8;eY(x);i=e;return}D=gV(x,d)|0;do{if((D|0)==117){if(!(gk(x+60|0)|0)){U=4872;break}B=z|0;I=eh(B,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,c[J>>2]|0,1)|0;L=c[K>>2]|0;if((I|0)>=(((((c[J>>2]|0)-L|0)*90|0|0)/100|0)+L|0)){U=4872;break}if(em(B,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,I)|0){U=4872;break}L=(eh(B,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,I-1|0,0)|0)-1|0;I=c[K>>2]|0;N=c[J>>2]|0;L5805:do{if((L|0)>((((N-I|0)*40|0|0)/100|0)+I|0)){M=x+252|0;V=L;W=c[E>>2]|0;while(1){X=ei(B,((c[C>>2]|0)+W|0)/2|0,V,1)|0;Y=c[E>>2]|0;if((X|0)>(Y|0)){Z=Y}else{Y=ga(M,V-(c[K>>2]|0)|0)|0;X=c[E>>2]|0;if((Y|0)>(((c[C>>2]|0)+1-X|0)/10|0|0)){Z=X}else{break}}X=V-1|0;Y=c[K>>2]|0;_=c[J>>2]|0;if((X|0)>((((_-Y|0)*40|0|0)/100|0)+Y|0)){V=X;W=Z}else{$=X;aa=Y;ab=_;break L5805}}$=V;aa=c[K>>2]|0;ab=c[J>>2]|0}else{$=L;aa=I;ab=N}}while(0);if(!(($|0)>((((ab-aa|0)*40|0|0)/100|0)+aa|0)&($|0)<(ab|0))){U=4872;break}if(!(fq(a,116,$,114,0)|0)){U=4872;break}eY(x);i=e;return}else if((D|0)==78){N=c[E>>2]|0;if(((c[J>>2]|0)+1-(c[K>>2]|0)|0)<=((c[C>>2]|0)+1-N|0)){U=4872;break}do{if((N|0)>=(c[d+4>>2]|0)){I=x+108|0;if((c[x+116>>2]|0)<0){f4(I)}L=(ga(I,((((c[x+148>>2]|0)-(c[x+144>>2]|0)>>2)*50|0)-50|0)/100|0)|0)<<2;if((L|0)>=((c[C>>2]|0)+1-(c[E>>2]|0)|0)){break}L=x+252|0;I=gr(L,0,-1)|0;B=x+260|0;if((c[B>>2]|0)<0){f4(L)}W=x+292|0;M=c[W>>2]|0;_=x+288|0;Y=c[_>>2]|0;if((I|0)<((((M-Y>>2)*40|0)-40|0)/100|0|0)){break}if((c[B>>2]|0)<0){f4(L);ac=c[W>>2]|0;ad=c[_>>2]|0}else{ac=M;ad=Y}if((I|0)>=((((ac-ad>>2)*50|0)-50|0)/100|0|0)){break}if(!(fq(a,114,(c[K>>2]|0)+I|0,118,0)|0)){break}eY(x);i=e;return}}while(0);if((D|0)!=0){U=4872}}else if((D|0)!=0){U=4872}}while(0);if((U|0)==4872){N=f;c[f>>2]=D;c[N+4>>2]=0;I=a+32|0;Y=c[I>>2]|0;if((Y|0)==(c[a+36>>2]|0)){eZ(a+28|0,N);eY(x);i=e;return}if((Y|0)==0){ae=0}else{N=Y;Y=c[f+4>>2]|0;c[N>>2]=c[f>>2];c[N+4>>2]=Y;ae=c[I>>2]|0}c[I>>2]=ae+8;eY(x);i=e;return}I=(c[C>>2]|0)+1-(c[E>>2]|0)|0;Y=(c[J>>2]|0)+1-(c[K>>2]|0)|0;N=x+204|0;L5853:do{if((gs(N,-1)|0)<3){if((gs(N,(((c[C>>2]|0)+1-(c[E>>2]|0)|0)/8|0)+(((((Y|0)<(I|0)?Y:I)|0)/30|0)+1)|0)|0)!=2){M=(c[C>>2]|0)+1-(c[E>>2]|0)|0;if((M|0)<=15){break}if((gs(N,(M|0)/8|0)|0)!=2){break}}M=gW(x,d)|0;L5862:do{if((M|0)==110){_=c[C>>2]|0;if((_|0)<=(((c[d+12>>2]|0)+(c[d+4>>2]|0)|0)/2|0|0)){W=g;c[g>>2]=34;c[W+4>>2]=0;L=a+32|0;B=c[L>>2]|0;if((B|0)==(c[a+36>>2]|0)){eZ(a+28|0,W);eY(x);i=e;return}if((B|0)==0){af=0}else{W=B;B=c[g+4>>2]|0;c[W>>2]=c[g>>2];c[W+4>>2]=B;af=c[L>>2]|0}c[L>>2]=af+8;eY(x);i=e;return}L=x+60|0;B=x+68|0;do{if(((c[J>>2]|0)+1-(c[K>>2]|0)|0)>(_+1-(c[E>>2]|0)|0)){if((c[B>>2]|0)<0){f4(L)}W=(ga(L,((((c[x+100>>2]|0)-(c[x+96>>2]|0)>>2)*10|0)-10|0)/100|0)|0)*10|0;if((W|0)>=((c[J>>2]|0)+1-(c[K>>2]|0)|0)){break}W=x+156|0;X=x+164|0;if((c[X>>2]|0)<0){f4(W)}ag=x+196|0;ah=x+192|0;if(gb(W,((((c[ag>>2]|0)-(c[ah>>2]|0)>>2)*75|0)-75|0)/100|0,2)|0){break}if((c[X>>2]|0)<0){f4(W)}X=(ga(W,((((c[ag>>2]|0)-(c[ah>>2]|0)>>2)*50|0)-50|0)/100|0)|0)*10|0;ah=c[J>>2]|0;if((X|0)<=(ah+1-(c[K>>2]|0)|0)){break}if(em(z|0,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,ah)|0){break}eY(x);i=e;return}}while(0);if((c[B>>2]|0)<0){f4(L)}_=(ga(L,((((c[x+100>>2]|0)-(c[x+96>>2]|0)>>2)*10|0)-10|0)/100|0)|0)<<1;V=x+156|0;do{if((_|0)>((c[J>>2]|0)+1-(c[K>>2]|0)|0)){if((c[x+164>>2]|0)<0){f4(V)}if(gb(V,((((c[x+196>>2]|0)-(c[x+192>>2]|0)>>2)*75|0)-75|0)/100|0,2)|0){break}ah=z|0;X=eh(ah,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,c[J>>2]|0,1)|0;ag=c[K>>2]|0;if((X|0)>(((((c[J>>2]|0)-ag|0)*95|0|0)/100|0)+ag|0)){break}if(em(ah,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,X)|0){break}if(!(fq(a,114,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0,116,0)|0)){break}eY(x);i=e;return}}while(0);if((gs(V,-1)|0)!=1){U=4978;break}if((c[x+164>>2]|0)<0){f4(V)}if(gb(V,((((c[x+196>>2]|0)-(c[x+192>>2]|0)>>2)*75|0)-75|0)/100|0,2)|0){U=4978;break}_=c[E>>2]|0;L=(c[C>>2]|0)-_|0;B=((L*60|0|0)/100|0)+_|0;if((B|0)<=(((L*25|0|0)/100|0)+_|0)){U=4978;break}_=z|0;L=0;X=B;B=0;L5921:while(1){ah=((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0;ag=ah-(eh(_,X,ah,1)|0)|0;if((ag|0)>(B|0)){if(L){ai=ag;U=4933}else{aj=0;ak=ag}}else{if((ag<<1|0)<(B|0)&(B|0)>2|L){ai=B;U=4933}else{aj=0;ak=B}}do{if((U|0)==4933){U=0;if(!(gN(ag,ai,25,1)|0)){aj=1;ak=ai;break}ah=ej(_,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0,1)|0;W=((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0;while(1){if((W|0)>(ah|0)){break}al=ek(_,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,W,1)|0;if((al|0)<(c[C>>2]|0)){break}else{W=W+1|0}}if((W|0)<=(c[K>>2]|0)){aj=1;ak=ai;break}if((W|0)>=(c[J>>2]|0)){aj=1;ak=ai;break}if(fq(a,102,W-1|0,108,0)|0){break L5921}else{aj=1;ak=ai}}}while(0);ag=X-1|0;ah=c[E>>2]|0;if((ag|0)>(((((c[C>>2]|0)-ah|0)*25|0|0)/100|0)+ah|0)){L=aj;X=ag;B=ak}else{U=4978;break L5862}}eY(x);i=e;return}else if((M|0)==107){B=x+60|0;if((c[x+68>>2]|0)<0){f4(B)}X=(ga(B,((((c[x+100>>2]|0)-(c[x+96>>2]|0)>>2)*10|0)-10|0)/100|0)|0)<<1;if((X|0)<=((c[J>>2]|0)+1-(c[K>>2]|0)|0)){U=4978;break}X=x+156|0;if((c[x+164>>2]|0)<0){f4(X)}if(gb(X,((((c[x+196>>2]|0)-(c[x+192>>2]|0)>>2)*75|0)-75|0)/100|0,2)|0){U=4978;break}if(!(fq(a,114,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0,116,0)|0)){U=4978;break}eY(x);i=e;return}else if((M|0)==0){break L5853}else if((M|0)==104){X=x+60|0;if((c[x+68>>2]|0)<0){f4(X)}B=(ga(X,((((c[x+100>>2]|0)-(c[x+96>>2]|0)>>2)*10|0)-10|0)/100|0)|0)<<1;X=x+156|0;if((B|0)<=((c[J>>2]|0)+1-(c[K>>2]|0)|0)){if(!(gp(X,30)|0)){U=4978;break}B=((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0;fq(a,102,B,105,0)|0;eY(x);i=e;return}if((c[x+164>>2]|0)<0){f4(X)}if((ga(X,((((c[x+196>>2]|0)-(c[x+192>>2]|0)>>2)*70|0)-70|0)/100|0)|0)<=1){eY(x);i=e;return}X=c[E>>2]|0;B=ei(z|0,((((c[C>>2]|0)-X|0)*70|0|0)/100|0)+X|0,c[J>>2]|0,1)|0;if((B|0)<=(c[E>>2]|0)){eY(x);i=e;return}B=x+252|0;X=f6(B)|0;L=f8(B)|0;_=c[K>>2]|0;V=c[J>>2]|0;ag=V-_|0;ah=((ag*40|0|0)/100|0)+_|0;if((ah|0)>(((ag*60|0|0)/100|0)+_|0)){am=0;an=_;ao=V}else{V=0;ag=X+1-L|0;L=ah;ah=_;while(1){if((ga(B,L-ah|0)|0)<(ag|0)){ap=ga(B,L-(c[K>>2]|0)|0)|0;aq=L}else{ap=ag;aq=V}_=L+1|0;X=c[K>>2]|0;al=c[J>>2]|0;if((_|0)>((((al-X|0)*60|0|0)/100|0)+X|0)){am=aq;an=X;ao=al;break}else{V=aq;ag=ap;L=_;ah=X}}}if(!((am|0)>(an|0)&(am|0)<(ao|0))){eY(x);i=e;return}fq(a,114,am-1|0,102,0)|0;eY(x);i=e;return}}while(0);if((U|0)==4978){if((M|0)==0){break}}ah=o;c[o>>2]=M;c[ah+4>>2]=0;L=a+32|0;ag=c[L>>2]|0;if((ag|0)==(c[a+36>>2]|0)){eZ(a+28|0,ah);eY(x);i=e;return}if((ag|0)==0){ar=0}else{ah=ag;ag=c[o+4>>2]|0;c[ah>>2]=c[o>>2];c[ah+4>>2]=ag;ar=c[L>>2]|0}c[L>>2]=ar+8;eY(x);i=e;return}}while(0);if((gs(N,-1)|0)==3){do{if((gs(N,((c[C>>2]|0)+1-(c[E>>2]|0)|0)/2|0)|0)==1){if((gs(x+108|0,-1)|0)!=3){break}if((gs(x+60|0,-1)|0)!=2){break}if((gs(x+156|0,-1)|0)!=2){break}I=p;c[p>>2]=42;c[I+4>>2]=0;Y=a+32|0;D=c[Y>>2]|0;if((D|0)==(c[a+36>>2]|0)){eZ(a+28|0,I);eY(x);i=e;return}if((D|0)==0){as=0}else{I=D;D=c[p+4>>2]|0;c[I>>2]=c[p>>2];c[I+4>>2]=D;as=c[Y>>2]|0}c[Y>>2]=as+8;eY(x);i=e;return}}while(0);do{if((eB(z,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0)|0)==0){if((eB(z,(((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0)-1|0,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0)|0)!=0){break}if((eB(z,(((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0)+1|0,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0)|0)!=0){break}Y=z|0;D=eh(Y,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0,1)|0;I=c[K>>2]|0;if((D|0)>(((((c[J>>2]|0)-I|0)*25|0|0)/100|0)+I|0)){break}D=c[E>>2]|0;L=((((c[C>>2]|0)-D|0)*95|0|0)/100|0)+D|0;D=ej(Y,L,(ej(Y,L,(ej(Y,L,I,1)|0)+1|0,0)|0)+1|0,1)|0;if((D|0)<=(c[K>>2]|0)){break}if((D|0)>=(c[J>>2]|0)){break}if(!(fq(a,114,D,110,0)|0)){break}eY(x);i=e;return}}while(0);if((gs(x+108|0,((c[C>>2]|0)+1-(c[E>>2]|0)|0)/3|0)|0)!=1){eY(x);i=e;return}D=q;c[q>>2]=109;c[D+4>>2]=0;I=a+32|0;L=c[I>>2]|0;if((L|0)==(c[a+36>>2]|0)){eZ(a+28|0,D);eY(x);i=e;return}if((L|0)==0){at=0}else{D=L;L=c[q+4>>2]|0;c[D>>2]=c[q>>2];c[D+4>>2]=L;at=c[I>>2]|0}c[I>>2]=at+8;eY(x);i=e;return}I=x+108|0;do{if((gs(N,-1)|0)==4){if((gs(I,((c[C>>2]|0)+1-(c[E>>2]|0)|0)/3|0)|0)!=1){break}L=c[E>>2]|0;D=((((c[C>>2]|0)-L|0)*95|0|0)/100|0)+L|0;L=z|0;Y=ej(L,D,(ej(L,D,(ej(L,D,c[K>>2]|0,1)|0)+1|0,0)|0)+1|0,1)|0;if((Y|0)<=(c[K>>2]|0)){break}if((Y|0)>=(c[J>>2]|0)){break}if(!(fq(a,114,Y,109,0)|0)){break}eY(x);i=e;return}}while(0);if((gs(I,((c[C>>2]|0)+1-(c[E>>2]|0)|0)/4|0)|0)==3){N=z|0;if(es(N,y)|0){eY(x);i=e;return}do{if((gF(x,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0)|0)>=4){if(!(em(N,((c[C>>2]|0)+(c[E>>2]|0)|0)/2|0,((c[J>>2]|0)+(c[K>>2]|0)|0)/2|0)|0)){break}eY(x);i=e;return}}while(0);K=r;c[r>>2]=119;c[K+4>>2]=0;J=a+32|0;E=c[J>>2]|0;if((E|0)==(c[a+36>>2]|0)){eZ(a+28|0,K);eY(x);i=e;return}if((E|0)==0){au=0}else{K=E;E=c[r+4>>2]|0;c[K>>2]=c[r>>2];c[K+4>>2]=E;au=c[J>>2]|0}c[J>>2]=au+8;eY(x);i=e;return}J=g$(x,d)|0;if((J|0)!=0){E=v;c[v>>2]=J;c[E+4>>2]=0;J=a+32|0;K=c[J>>2]|0;if((K|0)==(c[a+36>>2]|0)){eZ(a+28|0,E);eY(x);i=e;return}if((K|0)==0){av=0}else{E=K;K=c[v+4>>2]|0;c[E>>2]=c[v>>2];c[E+4>>2]=K;av=c[J>>2]|0}c[J>>2]=av+8;eY(x);i=e;return}J=gI(x,d)|0;if((J|0)==0){eY(x);i=e;return}K=w;c[w>>2]=J;c[K+4>>2]=0;J=a+32|0;E=c[J>>2]|0;if((E|0)==(c[a+36>>2]|0)){eZ(a+28|0,K);eY(x);i=e;return}if((E|0)==0){aw=0}else{K=E;E=c[w+4>>2]|0;c[K>>2]=c[w>>2];c[K+4>>2]=E;aw=c[J>>2]|0}c[J>>2]=aw+8;eY(x);i=e;return}}while(0);aw=s;c[s>>2]=A;c[aw+4>>2]=0;A=a+32|0;w=c[A>>2]|0;if((w|0)==(c[a+36>>2]|0)){eZ(a+28|0,aw);eY(x);i=e;return}if((w|0)==0){ax=0}else{aw=w;w=c[s+4>>2]|0;c[aw>>2]=c[s>>2];c[aw+4>>2]=w;ax=c[A>>2]|0}c[A>>2]=ax+8;eY(x);i=e;return}function eW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=i;i=i+432|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+384|0;m=e+424|0;n=fk(a,0)|0;o=eA(n,0)|0;if(!(dG(o|0,n|0)|0)){i=e;return}gC(k,n);p=o+4|0;q=n+4|0;r=(c[p>>2]|0)-(c[q>>2]|0)|0;s=n+12|0;t=o+12|0;o=(c[s>>2]|0)-(c[t>>2]|0)|0;u=V(r-o|0)|0;v=((c[t>>2]|0)+1-(c[p>>2]|0)|0)/4|0;do{if((u|0)>(((v|0)>2?v:2)|0)){if(gN(r,o,40,2)|0){w=5119;break}if((r|0)<(o|0)){x=g0(k,d)|0;if((x|0)==0){break}y=h;c[h>>2]=x;c[y+4>>2]=0;x=a+32|0;z=c[x>>2]|0;if((z|0)==(c[a+36>>2]|0)){eZ(a+28|0,y);break}if((z|0)==0){A=0}else{y=z;z=c[h+4>>2]|0;c[y>>2]=c[h>>2];c[y+4>>2]=z;A=c[x>>2]|0}c[x>>2]=A+8;break}if((r|0)<=(o|0)){break}x=g2(k,b)|0;if((x|0)==0){break}z=j;c[j>>2]=x;c[z+4>>2]=0;y=a+32|0;B=c[y>>2]|0;if((B|0)==(c[a+36>>2]|0)){eZ(a+28|0,z)}else{if((B|0)==0){C=0}else{z=B;B=c[j+4>>2]|0;c[z>>2]=c[j>>2];c[z+4>>2]=B;C=c[y>>2]|0}c[y>>2]=C+8}if((x|0)!=243){break}x=c[p>>2]|0;y=(c[t>>2]|0)-(c[s>>2]|0)+x|0;B=y-1|0;if(!((B|0)>(c[q>>2]|0)&(y|0)<(x|0))){break}et(l,n);ez(n,B);ex(l,y);y=o8(40)|0;et(y,l);c[m>>2]=y;B=a+20|0;x=c[B>>2]|0;if((x|0)==(c[a+24>>2]|0)){d0(a+16|0,m)}else{if((x|0)==0){D=0}else{c[x>>2]=y;D=c[B>>2]|0}c[B>>2]=D+4}eu(l)}else{w=5119}}while(0);L6167:do{if((w|0)==5119){l=g1(k,b,d)|0;do{if((l|0)==81){if(!(gN(r,o,40,2)|0)){break}D=g;c[g>>2]=97;c[D+4>>2]=1;m=a+32|0;n=c[m>>2]|0;if((n|0)==(c[a+36>>2]|0)){eZ(a+28|0,D);break}if((n|0)==0){E=0}else{D=n;n=c[g+4>>2]|0;c[D>>2]=c[g>>2];c[D+4>>2]=n;E=c[m>>2]|0}c[m>>2]=E+8}else if((l|0)==0){break L6167}}while(0);m=f;c[f>>2]=l;c[m+4>>2]=0;n=a+32|0;D=c[n>>2]|0;if((D|0)==(c[a+36>>2]|0)){eZ(a+28|0,m);break}if((D|0)==0){F=0}else{m=D;D=c[f+4>>2]|0;c[m>>2]=c[f>>2];c[m+4>>2]=D;F=c[n>>2]|0}c[n>>2]=F+8}}while(0);eY(k);i=e;return}function eX(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0;e=i;i=i+432|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=e+80|0;r=e+88|0;s=e+96|0;t=e+104|0;u=e+112|0;v=e+120|0;w=e+128|0;x=e+136|0;y=e+144|0;z=e+152|0;A=e+160|0;B=e+168|0;C=e+176|0;D=e+184|0;E=e+192|0;F=e+200|0;G=e+208|0;H=e+216|0;I=e+224|0;J=e+232|0;K=e+280|0;L=e+328|0;M=e+376|0;N=e+424|0;O=fk(b,0)|0;P=eA(O,0)|0;Q=eA(O,1)|0;R=O|0;f3(J,R,0);f3(K,R,1);f3(L,R,2);f3(M,R,3);S=Q|0;T=Q+4|0;U=Q+12|0;W=P|0;X=P+4|0;Y=P+12|0;Z=(V((((c[U>>2]|0)+(c[T>>2]|0)|0)/2|0)-(((c[Y>>2]|0)+(c[X>>2]|0)|0)/2|0)|0)|0)*10|0;_=O|0;$=O+12|0;aa=O+4|0;L6194:do{if((Z|0)>((c[$>>2]|0)+1-(c[aa>>2]|0)|0)){ab=5214}else{if(!(dH(W,_)|0)){ab=5214;break}if(!(dH(S,_)|0)){ab=5214;break}ac=c[$>>2]|0;ad=c[Y>>2]|0;ae=c[aa>>2]|0;do{if((ac-ad|0)>((c[X>>2]|0)-ae|0)){af=ad;ag=ae;ah=ac}else{if((ac-(c[U>>2]|0)|0)>((c[T>>2]|0)-ae|0)){af=ad;ag=ae;ah=ac;break}if(!(gg(M)|0)){af=c[Y>>2]|0;ag=c[aa>>2]|0;ah=c[$>>2]|0;break}ai=E;c[E>>2]=109;c[ai+4>>2]=0;aj=b+32|0;ak=c[aj>>2]|0;if((ak|0)==(c[b+36>>2]|0)){eZ(b+28|0,ai);break L6194}if((ak|0)==0){al=0}else{ai=ak;ak=c[E+4>>2]|0;c[ai>>2]=c[E>>2];c[ai+4>>2]=ak;al=c[aj>>2]|0}c[aj>>2]=al+8;break L6194}}while(0);ac=(V(af-((ah+ag|0)/2|0)|0)|0)*5|0;ae=c[$>>2]|0;ad=c[aa>>2]|0;if((ac|0)>(ae+1-ad|0)){break}ac=(V((c[U>>2]|0)-((ad+ae|0)/2|0)|0)|0)*5|0;if((ac|0)>((c[$>>2]|0)+1-(c[aa>>2]|0)|0)){break}if(!(gg(K)|0)){break}if((gs(M,-1)|0)!=2){break}ac=x;c[x>>2]=119;c[ac+4>>2]=0;ae=b+32|0;ad=c[ae>>2]|0;if((ad|0)==(c[b+36>>2]|0)){eZ(b+28|0,ac);break}if((ad|0)==0){am=0}else{ac=ad;ad=c[x+4>>2]|0;c[ac>>2]=c[x>>2];c[ac+4>>2]=ad;am=c[ae>>2]|0}c[ae>>2]=am+8}}while(0);L6228:do{if((ab|0)==5214){if(!(dG(W,_)|0)){break}if(!(dG(S,_)|0)){break}am=P|0;x=O|0;ag=c[x>>2]|0;ah=O+8|0;af=c[ah>>2]|0;al=(af+ag|0)/2|0;if((c[am>>2]|0)>(al|0)){if((c[Q>>2]|0)>(al|0)){break}}al=P+8|0;E=(((af-ag|0)*40|0|0)/100|0)+ag|0;if((c[al>>2]|0)<(E|0)){if((c[Q+8>>2]|0)<(E|0)){break}}E=((c[$>>2]|0)+(c[aa>>2]|0)|0)/2|0;if((c[X>>2]|0)>(E|0)){break}if((c[U>>2]|0)<(E|0)){break}E=ee(P)|0;ag=ee(Q)|0;af=c[ah>>2]|0;Z=((c[x>>2]|0)+af|0)/2|0;ae=((c[al>>2]|0)+(c[am>>2]|0)|0)/2|0;ad=Q|0;ac=Q+8|0;aj=((c[ac>>2]|0)+(c[ad>>2]|0)|0)/2|0;ak=(aj|0)<(ae|0)?aj:ae;ae=af-((ak|0)<(Z|0)?ak:Z)|0;Z=c[aa>>2]|0;ak=(c[Y>>2]|0)-Z|0;af=Z;while(1){Z=ak+1|0;if((Z|0)>=((c[T>>2]|0)-af|0)){break}if((ga(L,Z)|0)>(ae|0)){ab=5231;break}ak=Z;af=c[aa>>2]|0}if((ab|0)==5231){af=f;c[f>>2]=103;c[af+4>>2]=2;ak=b+32|0;ae=c[ak>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break}if((ae|0)==0){an=0}else{af=ae;ae=c[f+4>>2]|0;c[af>>2]=c[f>>2];c[af+4>>2]=ae;an=c[ak>>2]|0}c[ak>>2]=an+8;break}do{if(gN(E,ag,50,1)|0){ak=((c[$>>2]|0)+(c[aa>>2]|0)|0)/2|0;do{if((c[Y>>2]|0)>(ak|0)){if((c[T>>2]|0)>=(ak|0)){break}if(!(dD(W,S)|0)){break}if(dA(W,S)|0){break}ae=g;c[g>>2]=48;c[ae+4>>2]=0;af=b+32|0;Z=c[af>>2]|0;if((Z|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((Z|0)==0){ao=0}else{ae=Z;Z=c[g+4>>2]|0;c[ae>>2]=c[g>>2];c[ae+4>>2]=Z;ao=c[af>>2]|0}c[af>>2]=ao+8;break L6228}}while(0);if((c[Y>>2]|0)>(c[T>>2]|0)){break}do{if(es(R,N)|0){if((c[N>>2]|0)<=(((c[$>>2]|0)+1-(c[aa>>2]|0)|0)/2|0|0)){break}if(!(er(R,N)|0)){break}if((c[N>>2]|0)<=(((c[$>>2]|0)+1-(c[aa>>2]|0)|0)/2|0|0)){break}ak=h;c[h>>2]=115;c[ak+4>>2]=0;af=b+32|0;Z=c[af>>2]|0;if((Z|0)==(c[b+36>>2]|0)){eZ(b+28|0,ak);break L6228}if((Z|0)==0){ap=0}else{ak=Z;Z=c[h+4>>2]|0;c[ak>>2]=c[h>>2];c[ak+4>>2]=Z;ap=c[af>>2]|0}c[af>>2]=ap+8;break L6228}}while(0);do{if(gg(J)|0){if(!(go(J)|0)){if(!(gf(J)|0)){break}if(!(eC(O)|0)){break}}af=j;c[j>>2]=66;c[af+4>>2]=0;Z=b+32|0;ak=c[Z>>2]|0;if((ak|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break L6228}if((ak|0)==0){aq=0}else{af=ak;ak=c[j+4>>2]|0;c[af>>2]=c[j>>2];c[af+4>>2]=ak;aq=c[Z>>2]|0}c[Z>>2]=aq+8;break L6228}}while(0);Z=eh(P,c[Y>>2]|0,(c[al>>2]|0)+1|0,1)|0;do{if((Z-1|0)<=((ej(Q,c[T>>2]|0,(c[ad>>2]|0)-1|0,1)|0)+1|0)){do{if(ge(J)|0){ab=5281}else{if(gh(J)|0){ab=5281;break}if(gp(L,50)|0){break}if((gs(K,-1)|0)!=1){break}ak=l;c[l>>2]=97;c[ak+4>>2]=1;af=b+32|0;ae=c[af>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,ak);break}if((ae|0)==0){ar=0}else{ak=ae;ae=c[l+4>>2]|0;c[ak>>2]=c[l>>2];c[ak+4>>2]=ae;ar=c[af>>2]|0}c[af>>2]=ar+8}}while(0);do{if((ab|0)==5281){af=k;c[k>>2]=101;c[af+4>>2]=1;ae=b+32|0;ak=c[ae>>2]|0;if((ak|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break}if((ak|0)==0){as=0}else{af=ak;ak=c[k+4>>2]|0;c[af>>2]=c[k>>2];c[af+4>>2]=ak;as=c[ae>>2]|0}c[ae>>2]=as+8}}while(0);if(!(gk(M)|0)){break}ae=m;c[m>>2]=36;c[ae+4>>2]=0;ak=b+32|0;af=c[ak>>2]|0;if((af|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((af|0)==0){at=0}else{ae=af;af=c[m+4>>2]|0;c[ae>>2]=c[m>>2];c[ae+4>>2]=af;at=c[ak>>2]|0}c[ak>>2]=at+8;break L6228}}while(0);Z=c[x>>2]|0;ak=((c[ah>>2]|0)+Z|0)/2|0;af=c[al>>2]|0;do{if((ak|0)>((af+(c[am>>2]|0)|0)/2|0|0)){ae=c[ac>>2]|0;if((ak|0)<=((ae+(c[ad>>2]|0)|0)/2|0|0)){break}if((ak|0)<(af|0)&(ak|0)<(ae|0)){break}ae=n;c[n>>2]=38;c[ae+4>>2]=0;aj=b+32|0;ai=c[aj>>2]|0;if((ai|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((ai|0)==0){au=0}else{ae=ai;ai=c[n+4>>2]|0;c[ae>>2]=c[n>>2];c[ae+4>>2]=ai;au=c[aj>>2]|0}c[aj>>2]=au+8;break L6228}}while(0);ak=c[T>>2]|0;af=b|0;aj=b+8|0;ai=O+16|0;ae=c[Y>>2]|0;while(1){av=ae+1|0;if((av|0)>=(ak|0)){break}if((a[(c[(c[ai>>2]|0)+((av-(c[aa>>2]|0)|0)*12|0)>>2]|0)+((((c[aj>>2]|0)+(c[af>>2]|0)|0)/2|0)-Z)|0]|0)==0){ab=5313;break}else{ae=av}}if((ab|0)==5313){ae=o;c[o>>2]=103;c[ae+4>>2]=0;Z=b+32|0;af=c[Z>>2]|0;if((af|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((af|0)==0){aw=0}else{ae=af;af=c[o+4>>2]|0;c[ae>>2]=c[o>>2];c[ae+4>>2]=af;aw=c[Z>>2]|0}c[Z>>2]=aw+8;break L6228}Z=d+12|0;do{if((c[Z>>2]|0)>(((c[U>>2]|0)+ak|0)/2|0|0)){if(!(ge(M)|0)){if(!(gh(M)|0)){break}if(!(gh(K)|0)){break}}af=c[aa>>2]|0;ae=c[d+4>>2]|0;L6376:do{if((af|0)>=(ae|0)){if((1-af+(c[$>>2]|0)|0)>(1-ae+(c[Z>>2]|0)|0)){break}if(gh(J)|0){ab=5331}else{if(ge(J)|0){ab=5331}}do{if((ab|0)==5331){if(gh(L)|0){if((c[ac>>2]|0)<=(c[al>>2]|0)){break}}aj=p;c[p>>2]=101;c[aj+4>>2]=1;ai=b+32|0;av=c[ai>>2]|0;if((av|0)==(c[b+36>>2]|0)){eZ(b+28|0,aj);break L6376}if((av|0)==0){ax=0}else{aj=av;av=c[p+4>>2]|0;c[aj>>2]=c[p>>2];c[aj+4>>2]=av;ax=c[ai>>2]|0}c[ai>>2]=ax+8;break L6376}}while(0);ai=c[ah>>2]|0;if((c[L+8>>2]|0)<0){f4(L)}av=ai-(ga(L,((((c[L+40>>2]|0)-(c[L+36>>2]|0)>>2)*50|0)-50|0)/100|0)|0)|0;if((av|0)<=(c[al>>2]|0)){break}if(gp(L,50)|0){break}av=q;c[q>>2]=97;c[av+4>>2]=1;ai=b+32|0;aj=c[ai>>2]|0;if((aj|0)==(c[b+36>>2]|0)){eZ(b+28|0,av);break}if((aj|0)==0){ay=0}else{av=aj;aj=c[q+4>>2]|0;c[av>>2]=c[q>>2];c[av+4>>2]=aj;ay=c[ai>>2]|0}c[ai>>2]=ay+8}}while(0);ae=c[aa>>2]|0;af=c[$>>2]|0;do{if((c[Y>>2]|0)>((af+ae|0)/2|0|0)){if((c[X>>2]|0)<=((((af-ae|0)*30|0|0)/100|0)+ae|0)){break}ai=r;c[r>>2]=233;c[ai+4>>2]=0;aj=b+32|0;av=c[aj>>2]|0;if((av|0)==(c[b+36>>2]|0)){eZ(b+28|0,ai);break L6228}if((av|0)==0){az=0}else{ai=av;av=c[r+4>>2]|0;c[ai>>2]=c[r>>2];c[ai+4>>2]=av;az=c[aj>>2]|0}c[aj>>2]=az+8;break L6228}}while(0);ae=s;c[s>>2]=56;c[ae+4>>2]=0;af=b+32|0;aj=c[af>>2]|0;if((aj|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((aj|0)==0){aA=0}else{ae=aj;aj=c[s+4>>2]|0;c[ae>>2]=c[s>>2];c[ae+4>>2]=aj;aA=c[af>>2]|0}c[af>>2]=aA+8;break L6228}}while(0);do{if((gs(J,-1)|0)==2){if((gs(L,-1)|0)!=1){break}ak=c[Z>>2]|0;do{if(((ak+(c[d+4>>2]|0)|0)/2|0|0)<(c[Y>>2]|0)){if((ak|0)>=(c[U>>2]|0)){break}af=t;c[t>>2]=103;c[af+4>>2]=0;aj=b+32|0;ae=c[aj>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break L6228}if((ae|0)==0){aB=0}else{af=ae;ae=c[t+4>>2]|0;c[af>>2]=c[t>>2];c[af+4>>2]=ae;aB=c[aj>>2]|0}c[aj>>2]=aB+8;break L6228}}while(0);ak=u;c[u>>2]=97;c[ak+4>>2]=0;aj=b+32|0;ae=c[aj>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,ak);break L6228}if((ae|0)==0){aC=0}else{ak=ae;ae=c[u+4>>2]|0;c[ak>>2]=c[u>>2];c[ak+4>>2]=ae;aC=c[aj>>2]|0}c[aj>>2]=aC+8;break L6228}}while(0);aj=c[Z>>2]|0;ae=(aj+(c[d+4>>2]|0)|0)/2|0;do{if((ae|0)>(c[X>>2]|0)){if((ae|0)>=(c[Y>>2]|0)){if((aj|0)>=(((c[U>>2]|0)+(c[T>>2]|0)|0)/2|0|0)){break}}ak=v;c[v>>2]=103;c[ak+4>>2]=2;af=b+32|0;av=c[af>>2]|0;if((av|0)==(c[b+36>>2]|0)){eZ(b+28|0,ak);break}if((av|0)==0){aD=0}else{ak=av;av=c[v+4>>2]|0;c[ak>>2]=c[v>>2];c[ak+4>>2]=av;aD=c[af>>2]|0}c[af>>2]=aD+8}}while(0);aj=w;c[w>>2]=66;c[aj+4>>2]=1;ae=b+32|0;Z=c[ae>>2]|0;af=b+36|0;if((Z|0)==(c[af>>2]|0)){eZ(b+28|0,aj);aE=c[ae>>2]|0}else{if((Z|0)==0){aF=0}else{aj=Z;Z=c[w+4>>2]|0;c[aj>>2]=c[w>>2];c[aj+4>>2]=Z;aF=c[ae>>2]|0}Z=aF+8|0;c[ae>>2]=Z;aE=Z}Z=y;c[y>>2]=97;c[Z+4>>2]=0;if((aE|0)==(c[af>>2]|0)){eZ(b+28|0,Z);break L6228}if((aE|0)==0){aG=0}else{Z=aE;af=c[y+4>>2]|0;c[Z>>2]=c[y>>2];c[Z+4>>2]=af;aG=c[ae>>2]|0}c[ae>>2]=aG+8;break L6228}}while(0);do{if((E|0)>(ag|0)){if(!(dD(W,S)|0)){break}if(dE(W,S)|0){if(!(dA(W,S)|0)){break L6228}ae=B;c[B>>2]=81;c[ae+4>>2]=0;af=b+32|0;Z=c[af>>2]|0;if((Z|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((Z|0)==0){aH=0}else{ae=Z;Z=c[B+4>>2]|0;c[ae>>2]=c[B>>2];c[ae+4>>2]=Z;aH=c[af>>2]|0}c[af>>2]=aH+8;break L6228}do{if((c[ad>>2]|0)>(((c[ah>>2]|0)+(c[x>>2]|0)|0)/2|0|0)){if((c[U>>2]|0)>=((c[$>>2]|0)-1-(c[Y>>2]|0)+(c[X>>2]|0)|0)){break}af=z;c[z>>2]=57;c[af+4>>2]=0;Z=b+32|0;ae=c[Z>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break L6228}if((ae|0)==0){aI=0}else{af=ae;ae=c[z+4>>2]|0;c[af>>2]=c[z>>2];c[af+4>>2]=ae;aI=c[Z>>2]|0}c[Z>>2]=aI+8;break L6228}}while(0);Z=A;c[A>>2]=103;c[Z+4>>2]=0;ae=b+32|0;af=c[ae>>2]|0;if((af|0)==(c[b+36>>2]|0)){eZ(b+28|0,Z);break L6228}if((af|0)==0){aJ=0}else{Z=af;af=c[A+4>>2]|0;c[Z>>2]=c[A>>2];c[Z+4>>2]=af;aJ=c[ae>>2]|0}c[ae>>2]=aJ+8;break L6228}}while(0);if((E|0)>=(ag|0)){break}if((gs(K,-1)|0)!=1){break}do{if(dD(W,S)|0){if((gs(L,-1)|0)!=1){if(dE(W,S)|0){break}if((c[al>>2]|0)>=(((c[ah>>2]|0)+(c[x>>2]|0)|0)/2|0|0)){break}ae=c[X>>2]|0;if((ae|0)<=(1-ae+(c[aa>>2]|0)+(c[Y>>2]|0)|0)){break}ae=H;c[H>>2]=54;c[ae+4>>2]=0;af=b+32|0;Z=c[af>>2]|0;if((Z|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((Z|0)==0){aK=0}else{ae=Z;Z=c[H+4>>2]|0;c[ae>>2]=c[H>>2];c[ae+4>>2]=Z;aK=c[af>>2]|0}c[af>>2]=aK+8;break L6228}do{if(((c[Y>>2]|0)+1-(c[X>>2]|0)<<1|0)>((c[U>>2]|0)+1-(c[T>>2]|0)|0)){af=(c[ac>>2]|0)+1-(c[ad>>2]|0)|0;if(((c[al>>2]|0)+1-(c[am>>2]|0)<<1|0)<=(af|0)){break}if((af*3|0|0)<((c[ah>>2]|0)+1-(c[x>>2]|0)|0)){break}if(gp(J,50)|0){break}do{if(gh(J)|0){if(!(ge(J)|0)){break}af=C;c[C>>2]=54;c[af+4>>2]=0;Z=b+32|0;ae=c[Z>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break L6228}if((ae|0)==0){aL=0}else{af=ae;ae=c[C+4>>2]|0;c[af>>2]=c[C>>2];c[af+4>>2]=ae;aL=c[Z>>2]|0}c[Z>>2]=aL+8;break L6228}}while(0);Z=D;c[D>>2]=66;c[Z+4>>2]=0;ae=b+32|0;af=c[ae>>2]|0;if((af|0)==(c[b+36>>2]|0)){eZ(b+28|0,Z);break L6228}if((af|0)==0){aM=0}else{Z=af;af=c[D+4>>2]|0;c[Z>>2]=c[D>>2];c[Z+4>>2]=af;aM=c[ae>>2]|0}c[ae>>2]=aM+8;break L6228}}while(0);if((c[ac>>2]|0)<(((c[ah>>2]|0)+(c[x>>2]|0)|0)/2|0|0)){ae=F;c[F>>2]=38;c[ae+4>>2]=0;af=b+32|0;Z=c[af>>2]|0;if((Z|0)==(c[b+36>>2]|0)){eZ(b+28|0,ae);break L6228}if((Z|0)==0){aN=0}else{ae=Z;Z=c[F+4>>2]|0;c[ae>>2]=c[F>>2];c[ae+4>>2]=Z;aN=c[af>>2]|0}c[af>>2]=aN+8;break L6228}else{af=G;c[G>>2]=97;c[af+4>>2]=0;Z=b+32|0;ae=c[Z>>2]|0;if((ae|0)==(c[b+36>>2]|0)){eZ(b+28|0,af);break L6228}if((ae|0)==0){aO=0}else{af=ae;ae=c[G+4>>2]|0;c[af>>2]=c[G>>2];c[af+4>>2]=ae;aO=c[Z>>2]|0}c[Z>>2]=aO+8;break L6228}}}while(0);if((c[Y>>2]|0)>=(c[T>>2]|0)){break}x=I;c[I>>2]=38;c[x+4>>2]=0;ah=b+32|0;ac=c[ah>>2]|0;if((ac|0)==(c[b+36>>2]|0)){eZ(b+28|0,x);break}if((ac|0)==0){aP=0}else{x=ac;ac=c[I+4>>2]|0;c[x>>2]=c[I>>2];c[x+4>>2]=ac;aP=c[ah>>2]|0}c[ah>>2]=aP+8}}while(0);aP=c[M+36>>2]|0;I=aP;if((aP|0)!=0){b=M+40|0;M=c[b>>2]|0;if((aP|0)!=(M|0)){c[b>>2]=M+(~((M-4+(-I|0)|0)>>>2)<<2)}pb(aP)}aP=c[L+36>>2]|0;I=aP;if((aP|0)!=0){M=L+40|0;L=c[M>>2]|0;if((aP|0)!=(L|0)){c[M>>2]=L+(~((L-4+(-I|0)|0)>>>2)<<2)}pb(aP)}aP=c[K+36>>2]|0;I=aP;if((aP|0)!=0){L=K+40|0;K=c[L>>2]|0;if((aP|0)!=(K|0)){c[L>>2]=K+(~((K-4+(-I|0)|0)>>>2)<<2)}pb(aP)}aP=c[J+36>>2]|0;if((aP|0)==0){i=e;return}I=J+40|0;J=c[I>>2]|0;if((aP|0)!=(J|0)){c[I>>2]=J+(~((J-4+(-aP|0)|0)>>>2)<<2)}pb(aP);i=e;return}function eY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=c[a+336>>2]|0;d=b;if((b|0)!=0){e=a+340|0;f=c[e>>2]|0;if((b|0)!=(f|0)){c[e>>2]=f+(~((f-4+(-d|0)|0)>>>2)<<2)}pb(b)}b=c[a+288>>2]|0;d=b;if((b|0)!=0){f=a+292|0;e=c[f>>2]|0;if((b|0)!=(e|0)){c[f>>2]=e+(~((e-4+(-d|0)|0)>>>2)<<2)}pb(b)}b=c[a+240>>2]|0;d=b;if((b|0)!=0){e=a+244|0;f=c[e>>2]|0;if((b|0)!=(f|0)){c[e>>2]=f+(~((f-4+(-d|0)|0)>>>2)<<2)}pb(b)}b=c[a+192>>2]|0;d=b;if((b|0)!=0){f=a+196|0;e=c[f>>2]|0;if((b|0)!=(e|0)){c[f>>2]=e+(~((e-4+(-d|0)|0)>>>2)<<2)}pb(b)}b=c[a+144>>2]|0;d=b;if((b|0)!=0){e=a+148|0;f=c[e>>2]|0;if((b|0)!=(f|0)){c[e>>2]=f+(~((f-4+(-d|0)|0)>>>2)<<2)}pb(b)}b=c[a+96>>2]|0;d=b;if((b|0)!=0){f=a+100|0;e=c[f>>2]|0;if((b|0)!=(e|0)){c[f>>2]=e+(~((e-4+(-d|0)|0)>>>2)<<2)}pb(b)}b=a+48|0;d=c[b>>2]|0;if((d|0)!=0){e=a+52|0;f=c[e>>2]|0;if((d|0)==(f|0)){g=d}else{h=f;while(1){f=h-12|0;c[e>>2]=f;i=c[f>>2]|0;j=i;if((i|0)==0){k=f}else{f=h-12+4|0;l=c[f>>2]|0;if((i|0)!=(l|0)){c[f>>2]=l+(~((l-8+(-j|0)|0)>>>3)<<3)}pb(i);k=c[e>>2]|0}if((d|0)==(k|0)){break}else{h=k}}g=c[b>>2]|0}pb(g)}g=a+36|0;b=c[g>>2]|0;if((b|0)!=0){k=a+40|0;h=c[k>>2]|0;if((b|0)==(h|0)){m=b}else{d=h;while(1){h=d-12|0;c[k>>2]=h;e=c[h>>2]|0;i=e;if((e|0)==0){n=h}else{h=d-12+4|0;j=c[h>>2]|0;if((e|0)!=(j|0)){c[h>>2]=j+(~((j-8+(-i|0)|0)>>>3)<<3)}pb(e);n=c[k>>2]|0}if((b|0)==(n|0)){break}else{d=n}}m=c[g>>2]|0}pb(m)}m=c[a+24>>2]|0;g=m;if((m|0)!=0){n=a+28|0;d=c[n>>2]|0;if((m|0)!=(d|0)){c[n>>2]=d+(~((d-16+(-g|0)|0)>>>4)<<4)}pb(m)}m=c[a+12>>2]|0;if((m|0)==0){return}g=a+16|0;a=c[g>>2]|0;if((m|0)!=(a|0)){c[g>>2]=a+(~((a-16+(-m|0)|0)>>>4)<<4)}pb(m);return}function eZ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=a+4|0;e=a|0;f=c[e>>2]|0;g=f;h=(c[d>>2]|0)-g|0;i=h>>3;j=i+1|0;if(j>>>0>536870911>>>0){mE(0)}k=a+8|0;a=(c[k>>2]|0)-g|0;if(a>>3>>>0>268435454>>>0){l=536870911;m=5562}else{g=a>>2;a=g>>>0<j>>>0?j:g;if((a|0)==0){n=0;o=0}else{l=a;m=5562}}if((m|0)==5562){n=o8(l<<3)|0;o=l}l=n+(i<<3)|0;i=n+(o<<3)|0;if((l|0)!=0){o=b;b=l;l=c[o+4>>2]|0;c[b>>2]=c[o>>2];c[b+4>>2]=l}l=n+(j<<3)|0;j=n;b=f;pl(j|0,b|0,h)|0;c[e>>2]=n;c[d>>2]=l;c[k>>2]=i;if((f|0)==0){return}pb(b);return}function e_(a){a=a|0;var b=0;switch(a|0){case 210:case 211:case 212:case 213:case 214:{b=79;break};case 209:{b=78;break};case 217:case 218:case 219:case 220:{b=85;break};case 224:case 225:case 226:case 227:case 228:case 229:{b=97;break};case 231:{b=99;break};case 241:{b=110;break};case 350:{b=83;break};case 236:case 237:case 238:case 239:case 305:{b=105;break};case 249:case 250:case 251:case 252:{b=117;break};case 221:{b=89;break};case 204:case 205:case 206:case 207:case 304:{b=73;break};case 232:case 233:case 234:case 235:{b=101;break};case 351:{b=115;break};case 192:case 193:case 194:case 195:case 196:case 197:{b=65;break};case 199:{b=67;break};case 287:{b=103;break};case 242:case 243:case 244:case 245:case 246:{b=111;break};case 253:case 255:{b=121;break};case 200:case 201:case 202:case 203:{b=69;break};case 286:{b=71;break};default:{b=0}}return b|0}function e$(a,b){a=a|0;b=b|0;var c=0,d=0;L6721:do{switch(a|0){case 78:{if((b|0)==58){c=5642}else{d=209}break};case 91:case 73:{if((b|0)==58){d=207;break L6721}else if((b|0)==96){d=204;break L6721}else if((b|0)==94){d=206;break L6721}else if((b|0)==39){d=205;break L6721}else{c=5642;break L6721}break};case 79:{if((b|0)==58){d=214;break L6721}else if((b|0)==39){d=211;break L6721}else if((b|0)==94){d=212;break L6721}else if((b|0)==96){d=210;break L6721}else{c=5642;break L6721}break};case 65:{if((b|0)==94){d=194;break L6721}else if((b|0)==58){d=196;break L6721}else if((b|0)==96){d=192;break L6721}else if((b|0)==39){d=193;break L6721}else{c=5642;break L6721}break};case 85:case 86:{if((b|0)==96){d=217;break L6721}else if((b|0)==94){d=219;break L6721}else if((b|0)==58){d=220;break L6721}else if((b|0)==39){d=218;break L6721}else{c=5642;break L6721}break};case 69:{if((b|0)==58){d=203;break L6721}else if((b|0)==94){d=202;break L6721}else if((b|0)==96){d=200;break L6721}else if((b|0)==39){d=201;break L6721}else{c=5642;break L6721}break};case 90:{d=381;break};case 97:{if((b|0)==96){d=224;break L6721}else if((b|0)==94){d=226;break L6721}else if((b|0)==58){d=228;break L6721}else if((b|0)==39){d=225;break L6721}else{c=5642;break L6721}break};case 101:{if((b|0)==96){d=232;break L6721}else if((b|0)==94){d=234;break L6721}else if((b|0)==58){d=235;break L6721}else if((b|0)==39){d=233;break L6721}else{c=5642;break L6721}break};case 57:case 103:{d=287;break};case 124:case 93:case 105:case 108:{if((b|0)==96){d=236;break L6721}else if((b|0)==94){d=238;break L6721}else if((b|0)==58){d=239;break L6721}else if((b|0)==39){d=237;break L6721}else{c=5642;break L6721}break};case 110:{if((b|0)==58){c=5642}else{d=241}break};case 111:{if((b|0)==96){d=242;break L6721}else if((b|0)==94){d=244;break L6721}else if((b|0)==58){d=246;break L6721}else if((b|0)==39){d=243;break L6721}else{c=5642;break L6721}break};case 115:{d=353;break};case 117:case 118:{if((b|0)==96){d=249;break L6721}else if((b|0)==94){d=251;break L6721}else if((b|0)==58){d=252;break L6721}else if((b|0)==39){d=250;break L6721}else{c=5642;break L6721}break};case 121:{if((b|0)==39){d=253;break L6721}else if((b|0)!=58){c=5642;break L6721}d=255;break};case 122:{d=382;break};case 71:{d=286;break};case 83:{d=352;break};default:{c=5642}}}while(0);if((c|0)==5642){d=0}return d|0}function e0(a){a=a|0;var b=0,c=0;if((a|0)<128){if((bz(a|0)|0)==0){b=5646}else{c=1}}else{b=5646}L6787:do{if((b|0)==5646){switch(a|0){case 192:case 193:case 194:case 195:case 196:case 197:case 199:case 200:case 201:case 202:case 203:case 286:case 204:case 205:case 206:case 207:case 304:case 209:case 210:case 211:case 212:case 213:case 214:case 350:case 217:case 218:case 219:case 220:case 221:case 224:case 225:case 226:case 227:case 228:case 229:case 231:case 232:case 233:case 234:case 235:case 287:case 236:case 237:case 238:case 239:case 305:case 241:case 242:case 243:case 244:case 245:case 246:case 351:case 249:case 250:case 251:case 252:case 253:case 255:{c=1;break L6787;break};default:{}}c=(a-48|0)>>>0<10>>>0}}while(0);return c|0}function e1(a){a=a|0;var b=0,c=0;if((a|0)<128){if((bz(a|0)|0)==0){b=5651}else{c=1}}else{b=5651}L6794:do{if((b|0)==5651){switch(a|0){case 192:case 193:case 194:case 195:case 196:case 197:case 199:case 200:case 201:case 202:case 203:case 286:case 204:case 205:case 206:case 207:case 304:case 209:case 210:case 211:case 212:case 213:case 214:case 350:case 217:case 218:case 219:case 220:case 221:case 224:case 225:case 226:case 227:case 228:case 229:case 231:case 232:case 233:case 234:case 235:case 287:case 236:case 237:case 238:case 239:case 305:case 241:case 242:case 243:case 244:case 245:case 246:case 351:case 249:case 250:case 251:case 252:case 253:case 255:{c=1;break L6794;break};default:{}}c=0}}while(0);return c|0}function e2(a){a=a|0;return(a-48|0)>>>0<10>>>0|0}function e3(a){a=a|0;var b=0,c=0,d=0;if((a|0)<128){if((bp(a|0)|0)==0){b=5657}else{c=1}}else{b=5657}L6802:do{if((b|0)==5657){switch(a|0){case 204:case 205:case 206:case 207:case 304:{d=73;b=5677;break};case 200:case 201:case 202:case 203:{d=69;b=5677;break};case 210:case 211:case 212:case 213:case 214:{d=79;b=5677;break};case 217:case 218:case 219:case 220:{d=85;b=5677;break};case 221:{d=89;b=5677;break};case 287:{d=103;b=5677;break};case 249:case 250:case 251:case 252:{d=117;b=5677;break};case 209:{d=78;b=5677;break};case 232:case 233:case 234:case 235:{d=101;b=5677;break};case 242:case 243:case 244:case 245:case 246:{d=111;b=5677;break};case 350:{d=83;b=5677;break};case 224:case 225:case 226:case 227:case 228:case 229:{d=97;b=5677;break};case 241:{d=110;b=5677;break};case 253:case 255:{d=121;b=5677;break};case 231:{d=99;b=5677;break};case 236:case 237:case 238:case 239:case 305:{d=105;b=5677;break};case 351:{d=115;b=5677;break};case 192:case 193:case 194:case 195:case 196:case 197:{d=65;b=5677;break};case 199:{d=67;b=5677;break};case 286:{d=71;b=5677;break};default:{}}if((b|0)==5677){if((bp(d|0)|0)!=0){c=1;break}}if((a-48|0)>>>0<10>>>0){c=1;break}switch(a|0){case 98:case 100:case 102:case 103:case 104:case 105:case 106:case 107:case 108:case 112:case 113:case 116:case 121:case 124:{c=1;break L6802;break};default:{}}c=0}}while(0);return c|0}function e4(a){a=a|0;var b=0,c=0,d=0;if((a|0)<128){if((bp(a|0)|0)==0){b=5684}else{c=1}}else{b=5684}L6833:do{if((b|0)==5684){switch(a|0){case 224:case 225:case 226:case 227:case 228:case 229:{d=97;break};case 232:case 233:case 234:case 235:{d=101;break};case 217:case 218:case 219:case 220:{d=85;break};case 210:case 211:case 212:case 213:case 214:{d=79;break};case 209:{d=78;break};case 199:{d=67;break};case 249:case 250:case 251:case 252:{d=117;break};case 221:{d=89;break};case 200:case 201:case 202:case 203:{d=69;break};case 350:{d=83;break};case 236:case 237:case 238:case 239:case 305:{d=105;break};case 204:case 205:case 206:case 207:case 304:{d=73;break};case 351:{d=115;break};case 242:case 243:case 244:case 245:case 246:{d=111;break};case 286:{d=71;break};case 253:case 255:{d=121;break};case 192:case 193:case 194:case 195:case 196:case 197:{d=65;break};case 241:{d=110;break};case 287:{d=103;break};case 231:{d=99;break};default:{c=0;break L6833}}c=(bp(d|0)|0)!=0}}while(0);return c|0}function e5(a){a=a|0;var b=0,c=0,d=0;if((a|0)<128){if((bn(a|0)|0)==0){b=5708}else{c=1}}else{b=5708}L6860:do{if((b|0)==5708){switch(a|0){case 204:case 205:case 206:case 207:case 304:{d=73;break};case 200:case 201:case 202:case 203:{d=69;break};case 210:case 211:case 212:case 213:case 214:{d=79;break};case 217:case 218:case 219:case 220:{d=85;break};case 221:{d=89;break};case 287:{d=103;break};case 249:case 250:case 251:case 252:{d=117;break};case 209:{d=78;break};case 232:case 233:case 234:case 235:{d=101;break};case 242:case 243:case 244:case 245:case 246:{d=111;break};case 350:{d=83;break};case 224:case 225:case 226:case 227:case 228:case 229:{d=97;break};case 241:{d=110;break};case 253:case 255:{d=121;break};case 231:{d=99;break};case 236:case 237:case 238:case 239:case 305:{d=105;break};case 351:{d=115;break};case 192:case 193:case 194:case 195:case 196:case 197:{d=65;break};case 199:{d=67;break};case 286:{d=71;break};default:{c=0;break L6860}}c=(bn(d|0)|0)!=0}}while(0);return c|0}function e6(a){a=a|0;var b=0,c=0;do{if((a|0)>127){b=5733}else{if((bn(a|0)|0)==0){b=5733;break}switch(a|0){case 99:case 111:case 115:case 117:case 118:case 119:case 120:case 122:case 107:case 112:case 231:case 236:case 237:case 238:case 239:case 242:case 243:case 244:case 245:case 246:case 249:case 250:case 251:case 252:case 351:case 353:case 382:{c=1;break};default:{b=5734}}}}while(0);if((b|0)==5733){switch(a|0){case 107:case 112:case 231:case 236:case 237:case 238:case 239:case 242:case 243:case 244:case 245:case 246:case 249:case 250:case 251:case 252:case 351:case 353:case 382:{c=1;break};default:{b=5734}}}if((b|0)==5734){c=0}return c|0}function e7(a){a=a|0;var b=0;L6894:do{if((a|0)>127){b=0}else{if((bn(a|0)|0)==0){b=0;break}switch(a|0){case 99:case 111:case 115:case 117:case 118:case 119:case 120:case 122:{b=1;break L6894;break};default:{}}b=0}}while(0);return b|0}function e8(a){a=a|0;var b=0;L6900:do{if((a|0)>127){b=0}else{if((bn(a|0)|0)==0){b=0;break}switch(a|0){case 97:case 99:case 101:case 109:case 110:case 111:case 114:case 115:case 117:case 118:case 119:case 120:case 122:{b=1;break L6900;break};default:{}}b=0}}while(0);return b|0}function e9(a){a=a|0;var b=0;if((a|0)<128){b=(aO(a|0)|0)!=0}else{b=0}return b|0}function fa(a){a=a|0;var b=0,c=0,d=0;L6910:do{if((a|0)>127){switch(a|0){case 231:{b=99;c=5771;break L6910;break};case 287:{b=103;c=5771;break L6910;break};case 221:{b=89;c=5771;break L6910;break};case 350:{b=83;c=5771;break L6910;break};case 210:case 211:case 212:case 213:case 214:{b=79;c=5771;break L6910;break};case 253:case 255:{b=121;c=5771;break L6910;break};case 224:case 225:case 226:case 227:case 228:case 229:{b=97;c=5771;break L6910;break};case 204:case 205:case 206:case 207:case 304:{b=73;c=5771;break L6910;break};case 217:case 218:case 219:case 220:{b=85;c=5771;break L6910;break};case 241:{b=110;c=5771;break L6910;break};case 209:{b=78;c=5771;break L6910;break};case 286:{b=71;c=5771;break L6910;break};case 249:case 250:case 251:case 252:{b=117;c=5771;break L6910;break};case 351:{b=115;c=5771;break L6910;break};case 199:{b=67;c=5771;break L6910;break};case 200:case 201:case 202:case 203:{b=69;c=5771;break L6910;break};case 192:case 193:case 194:case 195:case 196:case 197:{b=65;c=5771;break L6910;break};case 242:case 243:case 244:case 245:case 246:{b=111;c=5771;break L6910;break};case 236:case 237:case 238:case 239:case 305:{b=105;c=5771;break L6910;break};case 232:case 233:case 234:case 235:{b=101;c=5771;break L6910;break};default:{d=0;break L6910}}}else{if((a|0)==0){d=0}else{b=a;c=5771}}}while(0);L6933:do{if((c|0)==5771){if((bz(b|0)|0)==0){d=0;break}switch(po(b|0)|0){case 111:case 105:case 101:case 97:case 117:{d=1;break L6933;break};default:{}}d=0}}while(0);return d|0}function fb(a){a=a|0;var b=0;L6939:do{if((a|0)<0){b=0}else{if((a|0)<256){b=a&255;break}switch(a|0){case 305:{b=-3;break L6939;break};case 287:{b=-16;break L6939;break};case 351:{b=-2;break L6939;break};case 353:{b=-88;break L6939;break};case 381:{b=-76;break L6939;break};case 350:{b=-34;break L6939;break};case 8364:{b=-92;break L6939;break};case 352:{b=-90;break L6939;break};case 382:{b=-72;break L6939;break};case 286:{b=-48;break L6939;break};case 304:{b=-35;break L6939;break};default:{b=0;break L6939}}}}while(0);return b|0}function fc(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((b|0)<0){a[15032]=0;return 15032}if((b|0)<128){a[15032]=b&255;a[15033]=0;return 15032}do{if((b|0)<2048){c=192;d=2;e=5798}else{if((b|0)<65536){c=224;d=3;e=5798;break}if((b|0)<2097152){c=240;d=4;e=5798;break}f=(b|0)<67108864;g=f?5:6;h=f?248:252;a[15032+g|0]=0;f=g-1|0;if((f|0)>0){i=h;j=f;e=5800}else{k=b;l=h}}}while(0);if((e|0)==5798){a[15032+d|0]=0;i=c;j=d-1|0;e=5800}if((e|0)==5800){e=0;d=j;j=b;while(1){a[15032+d|0]=(j&63|128)&255;c=e+6|0;h=d-1|0;f=b>>c;if((h|0)>0){e=c;d=h;j=f}else{k=f;l=i;break}}}a[15032]=(k|l)&255;return 15032}function fd(a){a=a|0;var b=0;switch(a|0){case 38:case 66:{b=56;break};case 83:case 115:{b=53;break};case 103:{b=57;break};case 79:case 81:case 111:{b=48;break};case 65:case 113:{b=52;break};case 124:case 73:case 76:case 108:case 305:{b=49;break};case 90:case 122:{b=50;break};case 71:case 98:case 243:{b=54;break};case 74:case 84:{b=55;break};default:{b=a}}return b|0}function fe(a){a=a|0;var b=0;switch(a|0){case 52:{b=113;break};case 55:{b=73;break};case 49:{b=108;break};case 50:{b=90;break};case 56:{b=66;break};case 48:{b=79;break};case 57:{b=103;break};case 54:{b=243;break};case 53:{b=83;break};default:{b=a}}return b|0}function ff(a){a=a|0;var b=0;L7003:do{if((a|0)<128){b=bu(a|0)|0}else{switch(a|0){case 229:{b=197;break L7003;break};case 226:{b=194;break L7003;break};case 232:{b=200;break L7003;break};case 234:{b=202;break L7003;break};case 235:{b=203;break L7003;break};case 241:{b=209;break L7003;break};case 243:{b=211;break L7003;break};case 231:{b=199;break L7003;break};case 239:{b=207;break L7003;break};case 236:{b=204;break L7003;break};case 233:{b=201;break L7003;break};case 225:{b=193;break L7003;break};case 287:{b=286;break L7003;break};case 237:{b=205;break L7003;break};case 244:{b=212;break L7003;break};case 238:{b=206;break L7003;break};case 242:{b=210;break L7003;break};case 245:{b=213;break L7003;break};case 246:{b=214;break L7003;break};case 351:{b=350;break L7003;break};case 249:{b=217;break L7003;break};case 250:{b=218;break L7003;break};case 251:{b=219;break L7003;break};case 252:{b=220;break L7003;break};case 253:{b=221;break L7003;break};case 224:{b=192;break L7003;break};case 227:{b=195;break L7003;break};case 228:{b=196;break L7003;break};default:{b=a;break L7003}}}}while(0);return b|0}function fg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;e=b;c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];e=a+16|0;d=b+16|0;dV(e,d);fA(a+28|0,b+28|0);b=a+20|0;a=e|0;if((c[b>>2]|0)==(c[a>>2]|0)){return}e=d|0;d=0;do{f=o8(40)|0;et(f,c[(c[e>>2]|0)+(d<<2)>>2]|0);c[(c[a>>2]|0)+(d<<2)>>2]=f;d=d+1|0;}while(d>>>0<(c[b>>2]|0)-(c[a>>2]|0)>>2>>>0);return}function fh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((a|0)==(b|0)){return a|0}d=a;e=b;c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];c[d+12>>2]=c[e+12>>2];e=a+16|0;d=a+20|0;f=c[d>>2]|0;g=e|0;h=c[g>>2]|0;if((f|0)!=(h|0)){i=0;j=h;h=f;while(1){f=c[j+(i<<2)>>2]|0;if((f|0)==0){k=h;l=j}else{eu(f);pb(f);k=c[d>>2]|0;l=c[g>>2]|0}f=i+1|0;if(f>>>0<k-l>>2>>>0){i=f;j=l;h=k}else{break}}}k=b+16|0;dY(e,c[k>>2]|0,c[b+20>>2]|0);if((c[d>>2]|0)!=(c[g>>2]|0)){e=k|0;k=0;do{h=o8(40)|0;et(h,c[(c[e>>2]|0)+(k<<2)>>2]|0);c[(c[g>>2]|0)+(k<<2)>>2]=h;k=k+1|0;}while(k>>>0<(c[d>>2]|0)-(c[g>>2]|0)>>2>>>0)}fz(a+28|0,c[b+28>>2]|0,c[b+32>>2]|0);return a|0}function fi(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;b=a+20|0;d=c[b>>2]|0;e=a+16|0;f=c[e>>2]|0;if((d|0)==(f|0)){g=d}else{h=0;i=f;f=d;while(1){d=c[i+(h<<2)>>2]|0;if((d|0)==0){j=f;k=i}else{eu(d);pb(d);j=c[b>>2]|0;k=c[e>>2]|0}d=h+1|0;if(d>>>0<j-k>>2>>>0){h=d;i=k;f=j}else{g=k;break}}}k=c[a+28>>2]|0;j=k;if((k|0)==0){l=g}else{g=a+32|0;a=c[g>>2]|0;if((k|0)!=(a|0)){c[g>>2]=a+(~((a-8+(-j|0)|0)>>>3)<<3)}pb(k);l=c[e>>2]|0}if((l|0)==0){return}e=c[b>>2]|0;if((l|0)!=(e|0)){c[b>>2]=e+(~((e-4+(-l|0)|0)>>>2)<<2)}pb(l);return}function fj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((b|0)<0){d=a+16|0}else{e=a+16|0;f=c[e>>2]|0;if(((c[a+20>>2]|0)-f>>2|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}}while(0);gM(3552);g=c[d>>2]|0;h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}function fk(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((b|0)<0){d=a+16|0}else{e=a+16|0;f=c[e>>2]|0;if(((c[a+20>>2]|0)-f>>2|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}}while(0);gM(4144);g=c[d>>2]|0;h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}function fl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=c[a+16>>2]|0;d=(c[a+20>>2]|0)-b|0;if((d|0)<=4){e=0;f=b+(e<<2)|0;g=c[f>>2]|0;return g|0}a=d>>2;d=0;h=1;while(1){i=c[b+(h<<2)>>2]|0;j=ag((c[i+8>>2]|0)+1-(c[i>>2]|0)|0,(c[i+12>>2]|0)+1-(c[i+4>>2]|0)|0)|0;i=c[b+(d<<2)>>2]|0;k=(j|0)>(ag((c[i+8>>2]|0)+1-(c[i>>2]|0)|0,(c[i+12>>2]|0)+1-(c[i+4>>2]|0)|0)|0);i=k?h:d;k=h+1|0;if((k|0)<(a|0)){d=i;h=k}else{e=i;break}}f=b+(e<<2)|0;g=c[f>>2]|0;return g|0}function fm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;c[e>>2]=b;du(a|0,b|0);h=c[a+16>>2]|0;j=(c[a+20>>2]|0)-h|0;k=j>>2;L7109:do{if((j|0)>0){l=((c[b+12>>2]|0)+(c[b+4>>2]|0)|0)/2|0;m=b|0;n=b+8|0;o=k;while(1){p=o-1|0;q=c[h+(p<<2)>>2]|0;r=((c[q+12>>2]|0)+(c[q+4>>2]|0)|0)/2|0;if((l|0)>(r|0)){s=o;break L7109}if((l|0)==(r|0)){if((((c[n>>2]|0)+(c[m>>2]|0)|0)/2|0|0)>=(((c[q+8>>2]|0)+(c[q>>2]|0)|0)/2|0|0)){s=o;break L7109}}if((p|0)>0){o=p}else{s=p;break}}}else{s=k}}while(0);c[f>>2]=h+(s<<2);fn(g,a+16|0,f,e);i=d;return}function fn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;h=c[g>>2]|0;j=h;k=(c[d>>2]|0)-j|0;d=k>>2;l=h+(d<<2)|0;m=b+4|0;n=c[m>>2]|0;o=b+8|0;b=c[o>>2]|0;if(n>>>0<b>>>0){if((l|0)==(n|0)){if((l|0)==0){p=0}else{c[l>>2]=c[e>>2];p=c[m>>2]|0}c[m>>2]=p+4;q=l;r=a|0;c[r>>2]=q;i=f;return}p=n-(h+(d+1<<2))|0;s=p>>2;t=h+(s+d<<2)|0;if(t>>>0<n>>>0){d=t;t=n;do{if((t|0)==0){u=0}else{c[t>>2]=c[d>>2];u=c[m>>2]|0}d=d+4|0;t=u+4|0;c[m>>2]=t;}while(d>>>0<n>>>0)}d=n+(-s<<2)|0;s=l;pn(d|0,s|0,p|0)|0;if(l>>>0>e>>>0){v=e}else{v=(c[m>>2]|0)>>>0>e>>>0?e+4|0:e}c[l>>2]=c[v>>2];q=l;r=a|0;c[r>>2]=q;i=f;return}v=(n-j>>2)+1|0;if(v>>>0>1073741823>>>0){mE(0)}n=b-j|0;if(n>>2>>>0>536870910>>>0){w=1073741823;x=l;y=k>>2;z=5968}else{j=n>>1;n=j>>>0<v>>>0?v:j;j=l;v=k>>2;if((n|0)==0){A=0;B=0;C=j;D=v}else{w=n;x=j;y=v;z=5968}}if((z|0)==5968){A=o8(w<<2)|0;B=w;C=x;D=y}y=A+(D<<2)|0;x=A+(B<<2)|0;do{if((D|0)==(B|0)){if((D|0)>0){E=A+(((D+1|0)/-2|0)+D<<2)|0;F=x;break}w=D<<1;z=(w|0)==0?1:w;w=o8(z<<2)|0;v=w+(z>>>2<<2)|0;j=w+(z<<2)|0;if((A|0)==0){E=v;F=j;break}pb(A);E=v;F=j}else{E=y;F=x}}while(0);if((E|0)!=0){c[E>>2]=c[e>>2]}e=E+4|0;x=c[g>>2]|0;y=C-x|0;A=E+(-(y>>2)<<2)|0;D=A;B=x;pl(D|0,B|0,y)|0;y=(c[m>>2]|0)-C|0;C=y>>2;D=e;e=l;pl(D|0,e|0,y)|0;c[g>>2]=A;c[m>>2]=E+(C+1<<2);c[o>>2]=F;if((x|0)==0){q=E;r=a|0;c[r>>2]=q;i=f;return}pb(B);q=E;r=a|0;c[r>>2]=q;i=f;return}function fo(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+24|0;g=f|0;h=f+8|0;j=f+16|0;do{if((b|0)<0){k=5990}else{l=c[a+28>>2]|0;if(((c[a+32>>2]|0)-l>>3|0)<(b|0)){k=5990;break}m=l;n=a+28|0}}while(0);if((k|0)==5990){gM(2880);k=a+28|0;m=c[k>>2]|0;n=k}c[g>>2]=m+(b<<3);c[h>>2]=d;c[h+4>>2]=e;fp(j,n,g,h);i=f;return}function fp(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;h=c[g>>2]|0;j=h;k=(c[d>>2]|0)-j|0;d=k>>3;l=h+(d<<3)|0;m=b+4|0;n=c[m>>2]|0;o=b+8|0;b=c[o>>2]|0;if(n>>>0<b>>>0){if((l|0)==(n|0)){if((l|0)==0){p=0}else{q=e;r=l;s=c[q+4>>2]|0;c[r>>2]=c[q>>2];c[r+4>>2]=s;p=c[m>>2]|0}c[m>>2]=p+8;t=l;u=a|0;c[u>>2]=t;i=f;return}p=n-(h+(d+1<<3))|0;s=p>>3;r=h+(s+d<<3)|0;if(r>>>0<n>>>0){d=r;r=n;do{if((r|0)==0){v=0}else{h=d;q=r;w=c[h+4>>2]|0;c[q>>2]=c[h>>2];c[q+4>>2]=w;v=c[m>>2]|0}d=d+8|0;r=v+8|0;c[m>>2]=r;}while(d>>>0<n>>>0)}d=n+(-s<<3)|0;s=l;pn(d|0,s|0,p|0)|0;if(l>>>0>e>>>0){x=e}else{x=(c[m>>2]|0)>>>0>e>>>0?e+8|0:e}p=x;x=l;s=c[p+4>>2]|0;c[x>>2]=c[p>>2];c[x+4>>2]=s;t=l;u=a|0;c[u>>2]=t;i=f;return}s=(n-j>>3)+1|0;if(s>>>0>536870911>>>0){mE(0)}n=b-j|0;if(n>>3>>>0>268435454>>>0){y=536870911;z=l;A=k>>3;B=6009}else{j=n>>2;n=j>>>0<s>>>0?s:j;j=l;s=k>>3;if((n|0)==0){C=0;D=0;E=j;F=s}else{y=n;z=j;A=s;B=6009}}if((B|0)==6009){C=o8(y<<3)|0;D=y;E=z;F=A}A=C+(F<<3)|0;z=C+(D<<3)|0;do{if((F|0)==(D|0)){if((F|0)>0){G=C+(((F+1|0)/-2|0)+F<<3)|0;H=z;break}y=F<<1;B=(y|0)==0?1:y;y=o8(B<<3)|0;s=y+(B>>>2<<3)|0;j=y+(B<<3)|0;if((C|0)==0){G=s;H=j;break}pb(C);G=s;H=j}else{G=A;H=z}}while(0);if((G|0)!=0){z=e;e=G;A=c[z+4>>2]|0;c[e>>2]=c[z>>2];c[e+4>>2]=A}A=G+8|0;e=c[g>>2]|0;z=E-e|0;C=G+(-(z>>3)<<3)|0;F=C;D=e;pl(F|0,D|0,z)|0;z=(c[m>>2]|0)-E|0;E=z>>3;F=A;A=l;pl(F|0,A|0,z)|0;c[g>>2]=C;c[m>>2]=G+(E+1<<3);c[o>>2]=H;if((e|0)==0){t=G;u=a|0;c[u>>2]=t;i=f;return}pb(D);t=G;u=a|0;c[u>>2]=t;i=f;return}function fq(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+24|0;h=g|0;j=g+8|0;k=g+16|0;if((f|0)<0){l=0;i=g;return l|0}m=c[a+16>>2]|0;if(((c[a+20>>2]|0)-m>>2|0)<=(f|0)){l=0;i=g;return l|0}n=c[m+(f<<2)>>2]|0;if((c[n>>2]|0)>(d|0)){l=0;i=g;return l|0}if((c[n+8>>2]|0)<=(d|0)){l=0;i=g;return l|0}n=c[a>>2]|0;m=h;o=a+28|0;p=c[o>>2]|0;q=a+32|0;r=c[q>>2]|0;if((p|0)==(r|0)){s=p}else{t=r+(~((r-8+(-p|0)|0)>>>3)<<3)|0;c[q>>2]=t;s=t}c[h>>2]=~f;c[m+4>>2]=n;n=a+36|0;if((s|0)==(c[n>>2]|0)){eZ(o,m);u=c[q>>2]|0}else{if((s|0)==0){v=0}else{m=s;s=c[h+4>>2]|0;c[m>>2]=c[h>>2];c[m+4>>2]=s;v=c[q>>2]|0}s=v+8|0;c[q>>2]=s;u=s}s=j;c[j>>2]=b;c[s+4>>2]=d;if((u|0)==(c[n>>2]|0)){eZ(o,s);w=c[q>>2]|0}else{if((u|0)==0){x=0}else{s=u;u=c[j+4>>2]|0;c[s>>2]=c[j>>2];c[s+4>>2]=u;x=c[q>>2]|0}u=x+8|0;c[q>>2]=u;w=u}u=c[a+8>>2]|0;a=k;c[k>>2]=e;c[a+4>>2]=u;if((w|0)==(c[n>>2]|0)){eZ(o,a);l=1;i=g;return l|0}if((w|0)==0){y=0}else{a=w;w=c[k+4>>2]|0;c[a>>2]=c[k>>2];c[a+4>>2]=w;y=c[q>>2]|0}c[q>>2]=y+8;l=1;i=g;return l|0}function fr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;if((b|0)<0){e=a+28|0;f=6059}else{g=a+28|0;h=c[g>>2]|0;i=(c[a+32>>2]|0)-h>>3;if((d|0)>-1&(i|0)>(b|0)&(i|0)>(d|0)){j=h}else{e=g;f=6059}}if((f|0)==6059){gM(1912);j=c[e>>2]|0}e=j+(b<<3)|0;b=c[e>>2]|0;c[e>>2]=c[j+(d<<3)>>2];c[(c[a+28>>2]|0)+(d<<3)>>2]=b;return}function fs(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;do{if((b|0)<0){d=a+28|0}else{e=a+28|0;f=c[e>>2]|0;if(((c[a+32>>2]|0)-f>>3|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<3)|0;return h|0}}while(0);gM(1688);g=c[d>>2]|0;h=g+(b<<3)|0;return h|0}function ft(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=c[a+28>>2]|0;e=(c[a+32>>2]|0)-d>>3;a=0;while(1){if((a|0)>=(e|0)){f=0;g=6073;break}if((c[d+(a<<3)>>2]|0)==(b|0)){f=1;g=6072;break}else{a=a+1|0}}if((g|0)==6072){return f|0}else if((g|0)==6073){return f|0}return 0}function fu(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;d=b+20|0;e=c[d>>2]|0;f=b+16|0;b=c[f>>2]|0;if((e-b|0)>0){g=0;h=b;while(1){fm(a,c[h+(g<<2)>>2]|0);i=g+1|0;j=c[d>>2]|0;k=c[f>>2]|0;if((i|0)<(j-k>>2|0)){g=i;h=k}else{l=k;m=j;break}}}else{l=b;m=e}if((l|0)==(m|0)){return}c[d>>2]=m+(~((m-4+(-l|0)|0)>>>2)<<2);return}function fv(a){a=a|0;var b=0,d=0,e=0;b=c[a+28>>2]|0;do{if((c[a+32>>2]|0)!=(b|0)){d=fb(c[b>>2]|0)|0;if(d<<24>>24==0){break}else{e=d}return e|0}}while(0);e=95;return e|0}function fw(b){b=b|0;var d=0,e=0,f=0;d=c[b+28>>2]|0;do{if((c[b+32>>2]|0)!=(d|0)){e=fc(c[d>>2]|0)|0;if((a[e]|0)==0){break}else{f=e}return f|0}}while(0);f=1312;return f|0}function fx(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;h=i;L7298:do{if(f|g){j=d+8|0;k=c[j>>2]|0;l=b+32|0;m=b+28|0;n=(c[l>>2]|0)-(c[m>>2]|0)>>3;bT(k|0,800,(o=i,i=i+8|0,c[o>>2]=n,o)|0)|0;i=o;n=d+21|0;k=0;while(1){p=c[m>>2]|0;if((k|0)>=((c[l>>2]|0)-p>>3|0)){q=j;break L7298}do{if((a[n]&1)==0){r=fb(c[p+(k<<3)>>2]|0)|0;if(r<<24>>24==0){break}s=c[j>>2]|0;t=r&255;r=c[(c[m>>2]|0)+(k<<3)+4>>2]|0;bT(s|0,448,(o=i,i=i+16|0,c[o>>2]=t,c[o+8>>2]=r,o)|0)|0;i=o}else{r=c[j>>2]|0;t=fc(c[p+(k<<3)>>2]|0)|0;s=c[(c[m>>2]|0)+(k<<3)+4>>2]|0;bT(r|0,248,(o=i,i=i+16|0,c[o>>2]=t,c[o+8>>2]=s,o)|0)|0;i=o}}while(0);k=k+1|0}}else{k=b+28|0;m=d+8|0;j=c[k>>2]|0;if(((c[b+32>>2]|0)-j|0)<=0){q=m;break}if((a[d+21|0]&1)!=0){n=c[m>>2]|0;l=fc(c[j>>2]|0)|0;p=c[(c[k>>2]|0)+4>>2]|0;bT(n|0,248,(o=i,i=i+16|0,c[o>>2]=l,c[o+8>>2]=p,o)|0)|0;i=o;q=m;break}p=fb(c[j>>2]|0)|0;if(p<<24>>24==0){q=m;break}j=c[(c[k>>2]|0)+4>>2]|0;bT(c[m>>2]|0,448,(o=i,i=i+16|0,c[o>>2]=p&255,c[o+8>>2]=j,o)|0)|0;i=o;q=m}}while(0);aL(10,c[q>>2]|0)|0;if(!f){i=h;return}f=b|0;d=b+4|0;g=c[d>>2]|0;m=b+8|0;j=c[m>>2]|0;p=b+12|0;k=c[p>>2]|0;bT(c[q>>2]|0,4216,(o=i,i=i+32|0,c[o>>2]=c[f>>2],c[o+8>>2]=g,c[o+16>>2]=j,c[o+24>>2]=k,o)|0)|0;i=o;k=c[q>>2]|0;j=c[m>>2]|0;g=c[f>>2]|0;l=j+1-g|0;n=c[p>>2]|0;s=c[d>>2]|0;t=n+1-s|0;r=(g+j|0)/2|0;u=(s+n|0)/2|0;v=b+20|0;w=b+16|0;b=c[w>>2]|0;if(((c[v>>2]|0)-b|0)>0){x=0;y=0;z=b;do{x=(ee(c[z+(y<<2)>>2]|0)|0)+x|0;y=y+1|0;z=c[w>>2]|0;}while((y|0)<((c[v>>2]|0)-z>>2|0));A=x*100|0;B=c[p>>2]|0;C=c[d>>2]|0;D=c[m>>2]|0;E=c[f>>2]|0}else{A=0;B=n;C=s;D=j;E=g}g=(A|0)/(ag(D+1-E|0,B+1-C|0)|0)|0;bT(k|0,3720,(o=i,i=i+40|0,c[o>>2]=l,c[o+8>>2]=t,c[o+16>>2]=r,c[o+24>>2]=u,c[o+32>>2]=g,o)|0)|0;i=o;g=c[d>>2]|0;u=e+4|0;r=c[u>>2]|0;t=(r|0)<(g|0)?r:g;l=c[p>>2]|0;k=e+12|0;e=c[k>>2]|0;C=(l|0)<(e|0)?e:l;L7323:do{if((t|0)<=(C|0)){B=t;E=g;D=l;A=r;j=e;while(1){s=(B|0)==(E|0);n=(B|0)==((D+E|0)/2|0|0);x=(B|0)==(D|0);z=(B|0)==(A|0);y=(B|0)==((j+A|0)/2|0|0);b=(B|0)==(j|0);F=c[w>>2]|0;do{if(((c[v>>2]|0)-F|0)==4){G=c[F>>2]|0;H=G+32|0;I=G+28|0;if((c[H>>2]|0)==(c[I>>2]|0)){J=0;K=0;L=0;M=0;break}N=(B|0)==(c[(eA(G,0)|0)+4>>2]|0);O=(B|0)==(c[(eA(G,0)|0)+12>>2]|0);if(((c[H>>2]|0)-(c[I>>2]|0)|0)<=4){J=0;K=0;L=O;M=N;break}I=(B|0)==(c[(eA(G,1)|0)+4>>2]|0);J=(B|0)==(c[(eA(G,1)|0)+12>>2]|0);K=I;L=O;M=N}else{J=0;K=0;L=0;M=0}}while(0);F=c[f>>2]|0;N=c[m>>2]|0;L7331:do{if((F|0)<=(N|0)){if(n){P=F;Q=N}else{O=F;while(1){I=0;while(1){G=c[w>>2]|0;if((I|0)>=((c[v>>2]|0)-G>>2|0)){R=46;break}S=eB(c[G+(I<<2)>>2]|0,B,O)|0;if((S|0)!=0){T=6129;break}I=I+1|0}if((T|0)==6129){T=0;R=(S|0)>0?79:45}bT(c[q>>2]|0,3496,(o=i,i=i+8|0,c[o>>2]=R,o)|0)|0;i=o;O=O+1|0;if((O|0)>(c[m>>2]|0)){break L7331}}}do{O=(P|0)==(((c[f>>2]|0)+Q|0)/2|0|0);I=O?43:46;G=0;while(1){H=c[w>>2]|0;if((G|0)>=((c[v>>2]|0)-H>>2|0)){U=I;break}V=eB(c[H+(G<<2)>>2]|0,B,P)|0;if((V|0)!=0){T=6121;break}G=G+1|0}do{if((T|0)==6121){T=0;if((V|0)>0){U=O?67:79;break}else{U=O?61:45;break}}}while(0);bT(c[q>>2]|0,3496,(o=i,i=i+8|0,c[o>>2]=U&255,o)|0)|0;i=o;P=P+1|0;Q=c[m>>2]|0;}while((P|0)<=(Q|0))}}while(0);if(s){F=c[q>>2]|0;bT(F|0,3424,(o=i,i=i+8|0,c[o>>2]=E,o)|0)|0;i=o}if(n){F=c[q>>2]|0;bT(F|0,3304,(o=i,i=i+8|0,c[o>>2]=B,o)|0)|0;i=o}if(x){F=c[q>>2]|0;bT(F|0,3232,(o=i,i=i+8|0,c[o>>2]=D,o)|0)|0;i=o}if(z){F=c[q>>2]|0;bT(F|0,3160,(o=i,i=i+8|0,c[o>>2]=A,o)|0)|0;i=o}if(y){F=c[q>>2]|0;bT(F|0,3104,(o=i,i=i+8|0,c[o>>2]=B,o)|0)|0;i=o}if(b){F=c[q>>2]|0;bT(F|0,3064,(o=i,i=i+8|0,c[o>>2]=j,o)|0)|0;i=o}if(M){F=c[q>>2]|0;bT(F|0,3048,(o=i,i=i+8|0,c[o>>2]=B,o)|0)|0;i=o}if(L){F=c[q>>2]|0;bT(F|0,2920,(o=i,i=i+8|0,c[o>>2]=B,o)|0)|0;i=o}if(K){F=c[q>>2]|0;bT(F|0,2776,(o=i,i=i+8|0,c[o>>2]=B,o)|0)|0;i=o}if(J){F=c[q>>2]|0;bT(F|0,2680,(o=i,i=i+8|0,c[o>>2]=B,o)|0)|0;i=o}aL(10,c[q>>2]|0)|0;F=B+1|0;if((F|0)>(C|0)){break L7323}B=F;E=c[d>>2]|0;D=c[p>>2]|0;A=c[u>>2]|0;j=c[k>>2]|0}}}while(0);aM(2624,2,1,c[q>>2]|0)|0;i=h;return}function fy(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=c[b>>2]|0;if((g|0)==0){i=d;return}b=a+32|0;h=a+28|0;j=c[h>>2]|0;if((c[b>>2]|0)==(j|0)){k=0}else{k=c[j>>2]|0}if((g|0)==3){l=0;m=6184}else if((g|0)==2){n=1;m=6162}else if((g|0)==4){l=1;m=6184}else if((g|0)==1){n=0;m=6162}else{i=d;return}if((m|0)==6184){if(e2(k)|0){i=d;return}if(e9(k)|0){i=d;return}else{o=1}while(1){g=c[b>>2]|0;j=c[h>>2]|0;if((o|0)>=(g-j>>3|0)){p=g;q=j;break}if(e2(c[j+(o<<3)>>2]|0)|0){m=6188;break}else{o=o+1|0}}if((m|0)==6188){j=c[h>>2]|0;g=(c[b>>2]|0)-j|0;if((o|0)>-1&(g|0)>0&(g>>3|0)>(o|0)){r=j}else{gM(1912);r=c[h>>2]|0}j=r|0;g=c[j>>2]|0;c[j>>2]=c[r+(o<<3)>>2];c[(c[h>>2]|0)+(o<<3)>>2]=g;p=c[b>>2]|0;q=c[h>>2]|0}do{if((p|0)!=(q|0)){if(e2(c[q>>2]|0)|0){break}g=fd(c[c[h>>2]>>2]|0)|0;c[c[h>>2]>>2]=g}}while(0);if(!l){i=d;return}l=c[b>>2]|0;q=c[h>>2]|0;do{if((l|0)==(q|0)){s=l;t=a+28|0;u=f}else{if(e2(c[q>>2]|0)|0){i=d;return}p=a+28|0;g=c[p>>2]|0;o=c[b>>2]|0;r=f;if((g|0)==(o|0)){s=o;t=p;u=r;break}j=o+(~((o-8+(-g|0)|0)>>>3)<<3)|0;c[b>>2]=j;s=j;t=p;u=r}}while(0);c[f>>2]=0;c[u+4>>2]=0;if((s|0)==(c[a+36>>2]|0)){eZ(t,u);i=d;return}if((s|0)==0){v=0}else{u=s;s=c[f+4>>2]|0;c[u>>2]=c[f>>2];c[u+4>>2]=s;v=c[b>>2]|0}c[b>>2]=v+8;i=d;return}else if((m|0)==6162){if(e1(k)|0){i=d;return}if(e9(k)|0){i=d;return}else{w=1}while(1){k=c[b>>2]|0;v=c[h>>2]|0;if((w|0)>=(k-v>>3|0)){x=k;y=v;break}if(e1(c[v+(w<<3)>>2]|0)|0){m=6166;break}else{w=w+1|0}}if((m|0)==6166){m=c[h>>2]|0;v=(c[b>>2]|0)-m|0;if((w|0)>-1&(v|0)>0&(v>>3|0)>(w|0)){z=m}else{gM(1912);z=c[h>>2]|0}m=z|0;v=c[m>>2]|0;c[m>>2]=c[z+(w<<3)>>2];c[(c[h>>2]|0)+(w<<3)>>2]=v;x=c[b>>2]|0;y=c[h>>2]|0}do{if((x|0)!=(y|0)){if(e1(c[y>>2]|0)|0){break}v=fe(c[c[h>>2]>>2]|0)|0;c[c[h>>2]>>2]=v}}while(0);if(!n){i=d;return}n=c[b>>2]|0;y=c[h>>2]|0;do{if((n|0)==(y|0)){A=n;B=a+28|0;C=e}else{if(e1(c[y>>2]|0)|0){i=d;return}h=a+28|0;x=c[h>>2]|0;v=c[b>>2]|0;w=e;if((x|0)==(v|0)){A=v;B=h;C=w;break}z=v+(~((v-8+(-x|0)|0)>>>3)<<3)|0;c[b>>2]=z;A=z;B=h;C=w}}while(0);c[e>>2]=0;c[C+4>>2]=0;if((A|0)==(c[a+36>>2]|0)){eZ(B,C);i=d;return}if((A|0)==0){D=0}else{C=A;A=c[e+4>>2]|0;c[C>>2]=c[e>>2];c[C+4>>2]=A;D=c[b>>2]|0}c[b>>2]=D+8;i=d;return}}function fz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;e=b;f=d-e>>3;g=a+8|0;h=c[g>>2]|0;i=a|0;j=c[i>>2]|0;k=j;if(f>>>0<=h-k>>3>>>0){l=a+4|0;m=(c[l>>2]|0)-k|0;n=m>>3;if(f>>>0<=n>>>0){o=d-e|0;e=o>>3;p=j;q=b;pn(p|0,q|0,o|0)|0;o=j+(e<<3)|0;e=c[l>>2]|0;if((o|0)==(e|0)){return}c[l>>2]=e+(~((e-8+(-o|0)|0)>>>3)<<3);return}o=b+(n<<3)|0;n=j;e=b;pn(n|0,e|0,m|0)|0;if((o|0)==(d|0)){return}m=o;o=c[l>>2]|0;do{if((o|0)==0){r=0}else{e=m;n=o;q=c[e+4>>2]|0;c[n>>2]=c[e>>2];c[n+4>>2]=q;r=c[l>>2]|0}o=r+8|0;c[l>>2]=o;m=m+8|0;}while((m|0)!=(d|0));return}if((j|0)==0){s=h}else{h=a+4|0;m=c[h>>2]|0;if((j|0)!=(m|0)){c[h>>2]=m+(~((m-8+(-k|0)|0)>>>3)<<3)}pb(j);c[g>>2]=0;c[h>>2]=0;c[i>>2]=0;s=0}if(f>>>0>536870911>>>0){mE(0)}h=s;do{if(h>>3>>>0>268435454>>>0){t=536870911}else{s=h>>2;j=s>>>0<f>>>0?f:s;if(j>>>0<=536870911>>>0){t=j;break}mE(0)}}while(0);f=o8(t<<3)|0;h=a+4|0;c[h>>2]=f;c[i>>2]=f;c[g>>2]=f+(t<<3);if((b|0)==(d|0)){return}else{u=b;v=f}do{if((v|0)==0){w=0}else{f=u;b=v;t=c[f+4>>2]|0;c[b>>2]=c[f>>2];c[b+4>>2]=t;w=c[h>>2]|0}v=w+8|0;c[h>>2]=v;u=u+8|0;}while((u|0)!=(d|0));return}function fA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a|0;c[d>>2]=0;e=a+4|0;c[e>>2]=0;f=a+8|0;c[f>>2]=0;a=b+4|0;g=b|0;b=(c[a>>2]|0)-(c[g>>2]|0)|0;h=b>>3;if((h|0)==0){return}if(h>>>0>536870911>>>0){mE(0)}i=o8(b)|0;c[e>>2]=i;c[d>>2]=i;c[f>>2]=i+(h<<3);h=c[g>>2]|0;g=c[a>>2]|0;if((h|0)==(g|0)){return}else{j=h;k=i}do{if((k|0)==0){l=0}else{i=j;h=k;a=c[i+4>>2]|0;c[h>>2]=c[i>>2];c[h+4>>2]=a;l=c[e>>2]|0}k=l+8|0;c[e>>2]=k;j=j+8|0;}while((j|0)!=(g|0));return}function fB(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;b=a+20|0;d=c[b>>2]|0;e=a+16|0;f=c[e>>2]|0;if((d|0)==(f|0)){g=d;h=f;i=d}else{j=0;k=f;f=d;while(1){d=c[k+(j<<2)>>2]|0;if((d|0)==0){l=f;m=k}else{fi(d);pb(d);l=c[b>>2]|0;m=c[e>>2]|0}d=j+1|0;n=m;if(d>>>0<l-n>>2>>>0){j=d;k=m;f=l}else{g=m;h=n;i=l;break}}}if((g|0)!=0){if((g|0)!=(i|0)){c[b>>2]=i+(~((i-4+(-h|0)|0)>>>2)<<2)}pb(g)}g=c[a>>2]|0;if((g|0)==0){return}h=a+4|0;a=c[h>>2]|0;if((g|0)!=(a|0)){c[h>>2]=a+(~(((a-20+(-g|0)|0)>>>0)/20|0)*20|0)}pb(g);return}function fC(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;b=i;i=i+16|0;d=b|0;e=d|0;c[e>>2]=0;f=d+4|0;c[f>>2]=0;g=d+8|0;c[g>>2]=0;h=c[a+12>>2]|0;j=a+20|0;k=a+16|0;l=c[k>>2]|0;L7558:do{if(h>>>0<(c[j>>2]|0)-l>>2>>>0){m=h;n=l;L7559:while(1){do{if(!(ft(c[n+(m<<2)>>2]|0,32)|0)){o=c[(c[k>>2]|0)+(m<<2)>>2]|0;p=c[f>>2]|0;if((p|0)!=(c[g>>2]|0)){if((p|0)!=0){q=p;r=o;c[q>>2]=c[r>>2];c[q+4>>2]=c[r+4>>2];c[q+8>>2]=c[r+8>>2];c[q+12>>2]=c[r+12>>2]}c[f>>2]=p+16;break}r=c[e>>2]|0;q=p-r|0;p=q>>4;s=p+1|0;if(s>>>0>268435455>>>0){break L7559}if(p>>>0>134217726>>>0){t=268435455;u=6304}else{v=q>>3;w=v>>>0<s>>>0?s:v;if((w|0)==0){x=0;y=0}else{t=w;u=6304}}if((u|0)==6304){u=0;x=o8(t<<4)|0;y=t}w=x+(p<<4)|0;p=x+(y<<4)|0;if((w|0)!=0){v=w;w=o;c[v>>2]=c[w>>2];c[v+4>>2]=c[w+4>>2];c[v+8>>2]=c[w+8>>2];c[v+12>>2]=c[w+12>>2]}w=x+(s<<4)|0;s=x;v=r;pl(s|0,v|0,q)|0;c[e>>2]=x;c[f>>2]=w;c[g>>2]=p;if((r|0)==0){break}pb(v)}}while(0);m=m+1|0;n=c[k>>2]|0;if(m>>>0>=(c[j>>2]|0)-n>>2>>>0){break L7558}}mE(0)}}while(0);fT(a|0,d);d=c[e>>2]|0;if((d|0)==0){i=b;return}e=c[f>>2]|0;if((d|0)!=(e|0)){c[f>>2]=e+(~((e-16+(-d|0)|0)>>>4)<<4)}pb(d);i=b;return}function fD(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;b=a+12|0;d=c[b>>2]|0;if((d|0)<=0){return}e=a+16|0;f=a+20|0;a=d;d=c[e>>2]|0;g=c[f>>2]|0;while(1){h=c[d+(a-1<<2)>>2]|0;i=(c[h+12>>2]|0)+1-(c[h+4>>2]|0)|0;do{if((a|0)<(g-d>>2|0)){h=0;j=0;k=a;l=d;while(1){if(ft(c[l+(k<<2)>>2]|0,32)|0){m=j;n=h;o=c[e>>2]|0}else{p=c[e>>2]|0;q=c[p+(k<<2)>>2]|0;m=j+1+(c[q+12>>2]|0)-(c[q+4>>2]|0)|0;n=h+1|0;o=p}p=k+1|0;r=c[f>>2]|0;if((p|0)<(r-o>>2|0)){h=n;j=m;k=p;l=o}else{break}}if((n|0)==0){s=m;t=o;u=r;break}s=(m|0)/(n|0)|0;t=o;u=r}else{s=0;t=d;u=g}}while(0);if((i|0)>(s<<1|0)){v=6339;break}l=(c[b>>2]|0)-1|0;c[b>>2]=l;if((l|0)>0){a=l;d=t;g=u}else{v=6340;break}}if((v|0)==6339){return}else if((v|0)==6340){return}}function fE(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;b=c[a+12>>2]|0;d=a+20|0;e=a+16|0;a=c[e>>2]|0;if((b|0)<((c[d>>2]|0)-a>>2|0)){f=0;g=0;h=b;i=a}else{j=0;return j|0}while(1){if(ft(c[i+(h<<2)>>2]|0,32)|0){k=g;l=f;m=c[e>>2]|0}else{a=c[e>>2]|0;b=c[a+(h<<2)>>2]|0;k=g+1+(c[b+12>>2]|0)-(c[b+4>>2]|0)|0;l=f+1|0;m=a}a=h+1|0;if((a|0)<((c[d>>2]|0)-m>>2|0)){f=l;g=k;h=a;i=m}else{break}}if((l|0)==0){j=k;return j|0}j=(k|0)/(l|0)|0;return j|0}function fF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;do{if((b|0)<0){d=a+16|0}else{e=a+16|0;f=c[e>>2]|0;if(((c[a+20>>2]|0)-f>>2|0)>(b|0)){g=f}else{d=e;break}h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}}while(0);gM(3192);g=c[d>>2]|0;h=g+(b<<2)|0;i=c[h>>2]|0;return i|0}function fG(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a+20|0;e=a+16|0;a=0;while(1){f=c[e>>2]|0;if((a|0)>=((c[d>>2]|0)-f>>2|0)){g=0;h=6364;break}if(dB(c[f+(a<<2)>>2]|0,b)|0){break}else{a=a+1|0}}if((h|0)==6364){return g|0}g=c[(c[e>>2]|0)+(a<<2)>>2]|0;return g|0}function fH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d|0;f=c[e>>2]|0;g=b|0;b=d+8|0;d=fW(g,((c[b>>2]|0)+f|0)/2|0)|0;h=c[b>>2]|0;dm(a,f,d,h,fV(g,((c[e>>2]|0)+h|0)/2|0)|0);return}function fI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;if((b|0)<0){d=6369}else{if(((c[a+20>>2]|0)-(c[a+16>>2]|0)>>2|0)<=(b|0)){d=6369}}if((d|0)==6369){gM(3968)}d=a+12|0;e=c[d>>2]|0;if((e|0)>(b|0)){c[d>>2]=e-1}e=a+16|0;d=c[e>>2]|0;f=c[d+(b<<2)>>2]|0;if((f|0)==0){g=d}else{fi(f);pb(f);g=c[e>>2]|0}e=b<<2>>2;f=g+(e+1<<2)|0;d=a+20|0;a=(c[d>>2]|0)-f|0;h=a>>2;i=g+(e<<2)|0;j=f;pn(i|0,j|0,a|0)|0;a=c[d>>2]|0;if((g+(h+e<<2)|0)==(a|0)){return}c[d>>2]=a+(~((a-4+(-(g+(h+(b<<2>>2)<<2)|0)|0)|0)>>>2)<<2);return}function fJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;c[f>>2]=b;b=a+16|0;j=(c[a+20>>2]|0)-(c[b>>2]|0)>>2;while(1){if((j|0)<=0){break}k=j-1|0;if(dJ(c[f>>2]|0,c[(c[b>>2]|0)+(k<<2)>>2]|0)|0){j=k}else{break}}b=a+16|0;c[g>>2]=(c[b>>2]|0)+(j<<2);fK(h,b,g,f);f=a+12|0;a=c[f>>2]|0;if((j|0)<(a|0)){c[f>>2]=a+1;i=e;return j|0}if(!d){i=e;return j|0}c[f>>2]=j+1;i=e;return j|0}function fK(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;f=i;g=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[g>>2];g=b|0;h=c[g>>2]|0;j=h;k=(c[d>>2]|0)-j|0;d=k>>2;l=h+(d<<2)|0;m=b+4|0;n=c[m>>2]|0;o=b+8|0;b=c[o>>2]|0;if(n>>>0<b>>>0){if((l|0)==(n|0)){if((l|0)==0){p=0}else{c[l>>2]=c[e>>2];p=c[m>>2]|0}c[m>>2]=p+4;q=l;r=a|0;c[r>>2]=q;i=f;return}p=n-(h+(d+1<<2))|0;s=p>>2;t=h+(s+d<<2)|0;if(t>>>0<n>>>0){d=t;t=n;do{if((t|0)==0){u=0}else{c[t>>2]=c[d>>2];u=c[m>>2]|0}d=d+4|0;t=u+4|0;c[m>>2]=t;}while(d>>>0<n>>>0)}d=n+(-s<<2)|0;s=l;pn(d|0,s|0,p|0)|0;if(l>>>0>e>>>0){v=e}else{v=(c[m>>2]|0)>>>0>e>>>0?e+4|0:e}c[l>>2]=c[v>>2];q=l;r=a|0;c[r>>2]=q;i=f;return}v=(n-j>>2)+1|0;if(v>>>0>1073741823>>>0){mE(0)}n=b-j|0;if(n>>2>>>0>536870910>>>0){w=1073741823;x=l;y=k>>2;z=6409}else{j=n>>1;n=j>>>0<v>>>0?v:j;j=l;v=k>>2;if((n|0)==0){A=0;B=0;C=j;D=v}else{w=n;x=j;y=v;z=6409}}if((z|0)==6409){A=o8(w<<2)|0;B=w;C=x;D=y}y=A+(D<<2)|0;x=A+(B<<2)|0;do{if((D|0)==(B|0)){if((D|0)>0){E=A+(((D+1|0)/-2|0)+D<<2)|0;F=x;break}w=D<<1;z=(w|0)==0?1:w;w=o8(z<<2)|0;v=w+(z>>>2<<2)|0;j=w+(z<<2)|0;if((A|0)==0){E=v;F=j;break}pb(A);E=v;F=j}else{E=y;F=x}}while(0);if((E|0)!=0){c[E>>2]=c[e>>2]}e=E+4|0;x=c[g>>2]|0;y=C-x|0;A=E+(-(y>>2)<<2)|0;D=A;B=x;pl(D|0,B|0,y)|0;y=(c[m>>2]|0)-C|0;C=y>>2;D=e;e=l;pl(D|0,e|0,y)|0;c[g>>2]=A;c[m>>2]=E+(C+1<<2);c[o>>2]=F;if((x|0)==0){q=E;r=a|0;c[r>>2]=q;i=f;return}pb(B);q=E;r=a|0;c[r>>2]=q;i=f;return}function fL(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+48|0;f=e|0;g=e+8|0;h=e+24|0;j=e+32|0;k=e+40|0;if((b|0)<1){l=6430}else{if(((c[a+20>>2]|0)-(c[a+16>>2]|0)>>2|0)<=(b|0)){l=6430}}if((l|0)==6430){gM(2824)}m=a|0;n=c[a>>2]|0;if((c[a+4>>2]|0)==(n|0)){l=6433}else{if((c[n+16>>2]|0)==0){l=6433}}if((l|0)==6433){gM(2328)}l=a+16|0;a=l|0;n=c[a>>2]|0;o=c[(c[n+(b-1<<2)>>2]|0)+8>>2]|0;p=o+1|0;q=c[c[n+(b<<2)>>2]>>2]|0;n=q-1|0;if((p|0)>(n|0)){r=0;i=e;return r|0}s=(q+o|0)/2|0;o=fW(m,s)|0;dm(g,p,o,n,fV(m,s)|0);s=o8(40)|0;m=s;n=g;c[s>>2]=c[n>>2];c[s+4>>2]=c[n+4>>2];c[s+8>>2]=c[n+8>>2];c[s+12>>2]=c[n+12>>2];n=s+16|0;g=s+28|0;o=g;p=s+32|0;pm(n|0,0,24)|0;n=o8(8)|0;q=n;c[p>>2]=q;c[g>>2]=q;g=n+8|0;c[s+36>>2]=g;if((n|0)==0){t=0}else{s=n;c[s>>2]=32;c[s+4>>2]=d&1;t=q}q=t+8|0;c[p>>2]=q;c[h>>2]=m;do{if(d){m=f;c[f>>2]=9;c[m+4>>2]=0;if((q|0)==(g|0)){eZ(o,m);break}if((q|0)==0){u=0}else{m=q;t=c[f+4>>2]|0;c[m>>2]=c[f>>2];c[m+4>>2]=t;u=c[p>>2]|0}c[p>>2]=u+8}}while(0);c[j>>2]=(c[a>>2]|0)+(b<<2);fK(k,l,j,h);r=1;i=e;return r|0}function fM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0;b=i;i=i+152|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=b+32|0;j=b+40|0;k=b+48|0;l=b+56|0;m=b+64|0;n=b+72|0;o=b+80|0;p=b+88|0;q=b+96|0;r=b+104|0;s=b+112|0;t=b+120|0;u=b+128|0;v=b+136|0;w=b+144|0;x=w;y=i;i=i+8|0;z=y;A=i;i=i+8|0;B=A;C=i;i=i+8|0;D=a+12|0;E=c[D>>2]|0;F=a+20|0;G=a+16|0;H=c[G>>2]|0;do{if((E|0)<((c[F>>2]|0)-H>>2|0)){I=0;J=0;L=E;M=H;while(1){if(ft(c[M+(L<<2)>>2]|0,32)|0){N=J;O=I;P=c[G>>2]|0}else{Q=c[G>>2]|0;R=c[Q+(L<<2)>>2]|0;N=J+1+(c[R+8>>2]|0)-(c[R>>2]|0)|0;O=I+1|0;P=Q}Q=L+1|0;if((Q|0)<((c[F>>2]|0)-P>>2|0)){I=O;J=N;L=Q;M=P}else{break}}M=w;if((O|0)==0){S=M;T=6456;break}c[M>>2]=N;L=x+4|0;c[L>>2]=O;f$(x);J=c[L>>2]|0;L=c[M>>2]|0;I=x+4|0;if((J|0)>0){U=M;V=L;W=J;X=I;T=6458}else{Y=L;Z=M;_=I}}else{S=w;T=6456}}while(0);if((T|0)==6456){c[S>>2]=0;c[x+4>>2]=1;U=w;V=0;W=1;X=x+4|0;T=6458}do{if((T|0)==6458){x=(V|0)<0|0?-1:0;S=W;O=((W|0)<0|0?-1:0)<<1|S>>>31;if((x|0)<(O|0)|(x|0)==(O|0)&V>>>0<(S<<1|0>>>31)>>>0){i=b;return}S=c[X>>2]|0;if((S|0)<=0){Y=V;Z=U;_=X;break}Y=(V|0)/(S|0)|0;Z=U;_=X}}while(0);X=c[w+4>>2]|0;c[v>>2]=c[w>>2];c[v+4>>2]=X;c[u>>2]=3;c[u+4>>2]=1;X=f2(v,u)|0;u=c[X>>2]|0;v=c[X+4>>2]|0;if((v|0)>0){$=(u|0)/(v|0)|0}else{$=u}u=c[D>>2]|0;D=c[F>>2]|0;v=c[G>>2]|0;if((u+1|0)>=(D-v>>2|0)){i=b;return}X=y;U=z+4|0;V=q;W=p|0;S=p+4|0;O=o;x=n|0;N=n+4|0;P=l;H=k|0;E=k+4|0;I=j;M=h|0;L=h+4|0;J=e;Q=d|0;R=d+4|0;aa=g;ab=f|0;ac=f+4|0;ad=A;ae=B+4|0;af=C|0;ag=C+4|0;ah=m;ai=t;aj=s|0;ak=s+4|0;al=u;u=v;v=D;while(1){D=al;am=u;an=v;while(1){ao=D+1|0;ap=an-am>>2;if((ao|0)>=(ap|0)){aq=am;break}if((D|0)>-1&(ap|0)>(D|0)){ar=am}else{gM(3192);ar=c[G>>2]|0}ap=c[ar+(D<<2)>>2]|0;if((ao|0)<0){T=6471}else{if(((c[F>>2]|0)-ar>>2|0)>(ao|0)){as=ar}else{T=6471}}if((T|0)==6471){T=0;gM(3192);as=c[G>>2]|0}if(((c[c[as+(ao<<2)>>2]>>2]|0)-1-(c[ap+8>>2]|0)|0)>($|0)){aq=as;break}D=ao;am=as;an=c[F>>2]|0}if((D|0)<0){at=((c[F>>2]|0)-aq>>2)-1|0}else{at=D}if((at|0)>(al|0)){an=0;am=al;ao=c[aq+(al<<2)>>2]|0;while(1){ap=am+1|0;au=c[aq+(ap<<2)>>2]|0;av=(c[au>>2]|0)-(c[ao+8>>2]|0)-1|0;aw=((av|0)>0?av:0)+an|0;if((ap|0)<(at|0)){an=aw;am=ap;ao=au}else{break}}c[X>>2]=aw;c[U>>2]=at-al;f$(z)}else{c[X>>2]=0;c[U>>2]=1}L7798:do{if((al|0)<(D|0)){ao=c[U>>2]|0;if((ao|0)<=0){ax=D;break}am=c[X>>2]|0;if((am|0)>0){ay=al;az=0;aA=0;aB=0;aC=0;aD=D}else{if((am|0)==0&(ao|0)==1){ay=al;az=0;aA=0;aB=0;aC=0;aD=D}else{ax=D;break}}while(1){if((ay|0)<0){T=6487}else{ao=c[G>>2]|0;if(((c[F>>2]|0)-ao>>2|0)>(ay|0)){aE=ao}else{T=6487}}if((T|0)==6487){T=0;gM(3192);aE=c[G>>2]|0}ao=c[aE+(ay<<2)>>2]|0;am=ay+1|0;if((am|0)<0){T=6490}else{if(((c[F>>2]|0)-aE>>2|0)>(am|0)){aF=aE}else{T=6490}}if((T|0)==6490){T=0;gM(3192);aF=c[G>>2]|0}an=c[aF+(am<<2)>>2]|0;au=an|0;ap=ao+8|0;av=(c[au>>2]|0)-(c[ap>>2]|0)-1|0;L7815:do{if((av|0)<(Y|0)){aG=c[y+4>>2]|0;c[q>>2]=c[y>>2];c[q+4>>2]=aG;c[W>>2]=3;c[S>>2]=1;aG=f2(V,p)|0;aH=c[aG+4>>2]|0;aI=(av|0)==-2147483648;aJ=aI^1;if((aH|0)>0&aJ){aK=c[aG>>2]|0;aG=pq(0,0,aI&1^1,0)|0;aL=((aK|0)<0|0?-1:0)&K;aM=pz(aH,(aH|0)<0|0?-1:0,aI?-2147483647:av,aI?-1:(av|0)<0|0?-1:0)|0;aH=K;if((aL|0)<(aH|0)|(aL|0)==(aH|0)&(aK&aG)>>>0<aM>>>0){T=6506;break}}aM=av*5|0;aG=c[w+4>>2]|0;c[o>>2]=c[w>>2];c[o+4>>2]=aG;c[x>>2]=2;c[N>>2]=1;aG=f2(O,n)|0;aK=c[aG+4>>2]|0;aH=(aM|0)==-2147483648;aL=aH^1;do{if((aK|0)>0&aL){aN=c[aG>>2]|0;aO=pq(0,0,aH&1^1,0)|0;aP=((aN|0)<0|0?-1:0)&K;aQ=pz(aK,(aK|0)<0|0?-1:0,aH?-2147483647:aM,aH?-1:(aM|0)<0|0?-1:0)|0;aR=K;if(!((aP|0)<(aR|0)|(aP|0)==(aR|0)&(aN&aO)>>>0<aQ>>>0)){break}aQ=c[y+4>>2]|0;c[l>>2]=c[y>>2];c[l+4>>2]=aQ;c[H>>2]=2;c[E>>2]=1;aQ=f2(P,k)|0;aO=c[aQ+4>>2]|0;if(!((aO|0)>0&aJ)){break}aN=c[aQ>>2]|0;aQ=pq(0,0,aI&1^1,0)|0;aR=((aN|0)<0|0?-1:0)&K;aP=pz(aO,(aO|0)<0|0?-1:0,aI?-2147483647:av,aI?-1:(av|0)<0|0?-1:0)|0;aO=K;if((aR|0)<(aO|0)|(aR|0)==(aO|0)&(aN&aQ)>>>0<aP>>>0){T=6506;break L7815}}}while(0);aI=((c[ap>>2]|0)+1-(c[ao>>2]|0)|0)*3|0;aJ=c[w+4>>2]|0;c[j>>2]=c[w>>2];c[j+4>>2]=aJ;c[M>>2]=2;c[L>>2]=1;aJ=f2(I,h)|0;aK=c[aJ+4>>2]|0;aG=(aI|0)==-2147483648;do{if((aK|0)>0&(aG^1)){aP=c[aJ>>2]|0;aQ=pq(0,0,aG&1^1,0)|0;aN=((aP|0)<0|0?-1:0)&K;aO=pz(aK,(aK|0)<0|0?-1:0,aG?-2147483647:aI,aG?-1:(aI|0)<0|0?-1:0)|0;aR=K;if(!((aN|0)<(aR|0)|(aN|0)==(aR|0)&(aP&aQ)>>>0<aO>>>0)){break}aO=((c[an+8>>2]|0)+1-(c[au>>2]|0)|0)*3|0;aQ=c[w+4>>2]|0;c[e>>2]=c[w>>2];c[e+4>>2]=aQ;c[Q>>2]=2;c[R>>2]=1;aQ=f2(J,d)|0;aP=c[aQ+4>>2]|0;aR=(aO|0)==-2147483648;if(!((aP|0)>0&(aR^1))){break}aN=c[aQ>>2]|0;aQ=pq(0,0,aR&1^1,0)|0;aS=((aN|0)<0|0?-1:0)&K;aT=pz(aP,(aP|0)<0|0?-1:0,aR?-2147483647:aO,aR?-1:(aO|0)<0|0?-1:0)|0;aO=K;if(!((aS|0)<(aO|0)|(aS|0)==(aO|0)&(aN&aQ)>>>0<aT>>>0)){break}aT=av<<1;aQ=(aT|0)==-2147483648;aN=c[_>>2]|0;if(!((aN|0)>0&(aQ^1))){break}aO=c[Z>>2]|0;aS=pq(0,0,aQ&1^1,0)|0;aR=((aO|0)<0|0?-1:0)&K;aP=pz(aN,(aN|0)<0|0?-1:0,aQ?-2147483647:aT,aQ?-1:(aT|0)<0|0?-1:0)|0;aT=K;if(!((aR|0)<(aT|0)|(aR|0)==(aT|0)&(aO&aS)>>>0<aP>>>0)){break}aP=c[y+4>>2]|0;c[g>>2]=c[y>>2];c[g+4>>2]=aP;c[ab>>2]=8;c[ac>>2]=1;aP=f2(aa,f)|0;aS=c[aP+4>>2]|0;if(!((aS|0)>0&aL)){break}aO=c[aP>>2]|0;aP=pq(0,0,aH&1^1,0)|0;aT=((aO|0)<0|0?-1:0)&K;aR=pz(aS,(aS|0)<0|0?-1:0,aH?-2147483647:aM,aH?-1:(aM|0)<0|0?-1:0)|0;aS=K;if((aT|0)<(aS|0)|(aT|0)==(aS|0)&(aO&aP)>>>0<aR>>>0){T=6506;break L7815}}}while(0);aU=aD;aV=aC;aW=aB+1|0;aX=aA;aY=av+az|0;aZ=ay}else{T=6506}}while(0);if((T|0)==6506){T=0;au=fL(a,am,0)|0;aU=(au&1)+aD|0;aV=aC+1|0;aW=aB;aX=av+aA|0;aY=az;aZ=au?am:ay}au=aZ+1|0;if((au|0)<(aU|0)){ay=au;az=aY;aA=aX;aB=aW;aC=aV;aD=aU}else{break}}if((aV|0)==0|(aW|0)==0){ax=aU;break}c[ad>>2]=aX*3|0;c[ae>>2]=aV;f$(B);c[af>>2]=aY;c[ag>>2]=aW;f$(C);au=c[A+4>>2]|0;c[m>>2]=c[A>>2];c[m+4>>2]=au;au=f1(ah,C)|0;an=c[au+4>>2]|0;c[t>>2]=c[au>>2];c[t+4>>2]=an;c[aj>>2]=4;c[ak>>2]=1;f0(r,s);an=f2(ai,r)|0;au=c[an+4>>2]|0;if((al|0)>=(aU|0)){ax=aU;break}ao=c[an>>2]|0;an=ao;ap=(ao|0)<0|0?-1:0;ao=au;aM=(au|0)<0|0?-1:0;if((au|0)>0){a_=al;a$=aU}else{au=al;while(1){if((au|0)<0){T=6524}else{if(((c[F>>2]|0)-(c[G>>2]|0)>>2|0)<=(au|0)){T=6524}}if((T|0)==6524){T=0;gM(3192)}aH=au+1|0;if((aH|0)<0){T=6527}else{if(((c[F>>2]|0)-(c[G>>2]|0)>>2|0)<=(aH|0)){T=6527}}if((T|0)==6527){T=0;gM(3192)}if((aH|0)<(aU|0)){au=aH}else{ax=aU;break L7798}}}while(1){if((a_|0)<0){T=6514}else{au=c[G>>2]|0;if(((c[F>>2]|0)-au>>2|0)>(a_|0)){a0=au}else{T=6514}}if((T|0)==6514){T=0;gM(3192);a0=c[G>>2]|0}au=c[a0+(a_<<2)>>2]|0;aH=a_+1|0;if((aH|0)<0){T=6517}else{if(((c[F>>2]|0)-a0>>2|0)>(aH|0)){a1=a0}else{T=6517}}if((T|0)==6517){T=0;gM(3192);a1=c[G>>2]|0}aL=(c[c[a1+(aH<<2)>>2]>>2]|0)-(c[au+8>>2]|0)-1|0;do{if((aL|0)==-2147483648){a2=a$;a3=a_}else{au=pz(aL,(aL|0)<0|0?-1:0,ao,aM)|0;aI=K;if(!((ap|0)<(aI|0)|(ap|0)==(aI|0)&an>>>0<au>>>0)){a2=a$;a3=a_;break}au=fL(a,aH,0)|0;a2=(au&1)+a$|0;a3=au?aH:a_}}while(0);aH=a3+1|0;if((aH|0)<(a2|0)){a_=aH;a$=a2}else{ax=a2;break}}}else{ax=D}}while(0);D=ax+1|0;an=c[F>>2]|0;ap=c[G>>2]|0;if((D|0)<(an-ap>>2|0)){aM=fL(a,D,1)|0;a4=aM?ax+2|0:D;a5=c[F>>2]|0;a6=c[G>>2]|0}else{a4=D;a5=an;a6=ap}if((a4+1|0)<(a5-a6>>2|0)){al=a4;u=a6;v=a5}else{break}}i=b;return}function fN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;h=b+20|0;j=c[h>>2]|0;k=b+16|0;l=c[k>>2]|0;m=b+12|0;if((j-l|0)>0){b=a+20|0;n=a+16|0;o=a+16|0;p=o|0;q=f|0;r=a+12|0;a=0;s=l;while(1){t=(a|0)<(c[m>>2]|0);c[e>>2]=c[s+(a<<2)>>2];u=(c[b>>2]|0)-(c[n>>2]|0)>>2;while(1){if((u|0)<=0){break}v=u-1|0;if(dJ(c[e>>2]|0,c[(c[n>>2]|0)+(v<<2)>>2]|0)|0){u=v}else{break}}c[q>>2]=(c[p>>2]|0)+(u<<2);fK(g,o,f,e);v=c[r>>2]|0;do{if((u|0)<(v|0)){c[r>>2]=v+1}else{if(!t){break}c[r>>2]=u+1}}while(0);u=a+1|0;t=c[h>>2]|0;v=c[k>>2]|0;if((u|0)<(t-v>>2|0)){a=u;s=v}else{w=v;x=t;break}}}else{w=l;x=j}c[m>>2]=0;if((w|0)==(x|0)){i=d;return}c[h>>2]=x+(~((x-4+(-w|0)|0)>>>2)<<2);i=d;return}function fO(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=c[a+12>>2]|0;d=c[a+16>>2]|0;e=(c[a+20>>2]|0)-d>>2;if((b|0)>=(e|0)){f=0;return f|0}a=b+1|0;g=(e|0)>(a|0)?e:a;a=0;h=b;do{i=c[d+(h<<2)>>2]|0;a=(((c[i+12>>2]|0)+(c[i+4>>2]|0)|0)/2|0)+a|0;h=h+1|0;}while((h|0)<(e|0));if((g|0)==(b|0)){f=a;return f|0}f=(a|0)/(g-b|0)|0;return f|0}function fP(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+16|0;g=f|0;if(d|e){h=c[b+8>>2]|0;j=c[a+12>>2]|0;k=a+20|0;l=a+16|0;m=c[l>>2]|0;do{if((j|0)<((c[k>>2]|0)-m>>2|0)){n=0;o=0;p=j;q=m;while(1){if(ft(c[q+(p<<2)>>2]|0,32)|0){r=o;s=n;t=c[l>>2]|0}else{u=c[l>>2]|0;v=c[u+(p<<2)>>2]|0;r=o+1+(c[v+12>>2]|0)-(c[v+4>>2]|0)|0;s=n+1|0;t=u}u=p+1|0;if((u|0)<((c[k>>2]|0)-t>>2|0)){n=s;o=r;p=u;q=t}else{break}}if((s|0)==0){w=r;break}w=(r|0)/(s|0)|0}else{w=0}}while(0);s=((c[a+4>>2]|0)-(c[a>>2]|0)|0)/20|0;bT(h|0,1648,(h=i,i=i+16|0,c[h>>2]=w,c[h+8>>2]=s,h)|0)|0;i=h;x=k;y=l}else{x=a+20|0;y=a+16|0}l=c[y>>2]|0;if(((c[x>>2]|0)-l|0)<=0){z=b+8|0;A=c[z>>2]|0;B=aL(10,A|0)|0;i=f;return}k=a+12|0;h=a|0;a=0;s=l;do{l=c[s+(a<<2)>>2]|0;if((a|0)<(c[k>>2]|0)){fx(l,b,l|0,d,e)}else{w=l|0;r=c[w>>2]|0;t=l+8|0;m=fW(h,((c[t>>2]|0)+r|0)/2|0)|0;j=c[t>>2]|0;dm(g,r,m,j,fV(h,((c[w>>2]|0)+j|0)/2|0)|0);fx(l,b,g,d,e)}a=a+1|0;s=c[y>>2]|0;}while((a|0)<((c[x>>2]|0)-s>>2|0));z=b+8|0;A=c[z>>2]|0;B=aL(10,A|0)|0;i=f;return}function fQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a+20|0;e=a+16|0;a=c[e>>2]|0;if(((c[d>>2]|0)-a|0)>0){f=0;g=a}else{return}do{db(b,c[g+(f<<2)>>2]|0);f=f+1|0;g=c[e>>2]|0;}while((f|0)<((c[d>>2]|0)-g>>2|0));return}function fR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=a+20|0;h=a+16|0;j=c[h>>2]|0;if(((c[g>>2]|0)-j|0)<=0){i=d;return}k=a+12|0;l=e;m=e;n=l+4|0;o=a|0;a=0;p=j;do{j=c[p+(a<<2)>>2]|0;do{if((a|0)<(c[k>>2]|0)){eU(j,b,j|0);q=j+32|0;if((c[q>>2]|0)==(c[j+28>>2]|0)){break}r=c[(fs(j,0)|0)>>2]|0;if(!(e6(r)|0)){break}s=ff(r)|0;r=j+28|0;t=c[r>>2]|0;u=c[q>>2]|0;if((t|0)==(u|0)){v=t}else{w=u+(~((u-8+(-t|0)|0)>>>3)<<3)|0;c[q>>2]=w;v=w}c[m>>2]=s;c[n>>2]=0;if((v|0)==(c[j+36>>2]|0)){eZ(r,l);break}if((v|0)==0){x=0}else{r=v;s=c[e+4>>2]|0;c[r>>2]=c[e>>2];c[r+4>>2]=s;x=c[q>>2]|0}c[q>>2]=x+8}else{q=j|0;s=c[q>>2]|0;r=j+8|0;w=fW(o,((c[r>>2]|0)+s|0)/2|0)|0;t=c[r>>2]|0;dm(f,s,w,t,fV(o,((c[q>>2]|0)+t|0)/2|0)|0);eU(j,b,f)}}while(0);a=a+1|0;p=c[h>>2]|0;}while((a|0)<((c[g>>2]|0)-p>>2|0));i=d;return}function fS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=a+20|0;e=a+16|0;f=c[e>>2]|0;if(((c[d>>2]|0)-f|0)>0){g=0;h=0;i=f}else{return}L7960:while(1){j=h;f=i;while(1){k=c[f+(g<<2)>>2]|0;l=k+32|0;m=c[l>>2]|0;n=k+28|0;o=c[n>>2]|0;fy(k,b);if((m|0)==(o|0)){break}if((c[l>>2]|0)!=(c[n>>2]|0)){break}fI(a,g);n=c[e>>2]|0;l=(c[d>>2]|0)-n>>2;if((g|0)<(l|0)){j=1;f=n}else{p=l;break L7960}}f=g+1|0;l=c[e>>2]|0;q=(c[d>>2]|0)-l>>2;if((f|0)<(q|0)){g=f;h=j;i=l}else{r=6607;break}}do{if((r|0)==6607){if(j){p=q;break}return}}while(0);if((p|0)>0){s=p}else{return}L7973:while(1){p=s-1|0;if((p|0)<0){r=6611}else{q=c[e>>2]|0;if(((c[d>>2]|0)-q>>2|0)>(p|0)){t=q}else{r=6611}}if((r|0)==6611){r=0;gM(3192);t=c[e>>2]|0}do{if(ft(c[t+(p<<2)>>2]|0,32)|0){q=c[e>>2]|0;j=(c[d>>2]|0)-q>>2;if((p|0)<(j-1|0)){if((p|0)<=0){r=6621;break L7973}i=s-2|0;if((i|0)>-1&(j|0)>(i|0)){u=q}else{gM(3192);u=c[e>>2]|0}if(!(ft(c[u+(i<<2)>>2]|0,32)|0)){break}}fI(a,p)}}while(0);if((p|0)>0){s=p}else{r=6625;break}}if((r|0)==6625){return}else if((r|0)==6621){return}}
function pC(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(K=n,o)|0}else{if(!m){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(K=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(K=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(K=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((pv(l|0)|0)>>>0);return(K=n,o)|0}p=(pu(l|0)|0)-(pu(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}else{if(!m){r=(pu(l|0)|0)-(pu(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(K=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(K=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(pu(j|0)|0)+33-(pu(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(K=n,o)|0}else{p=pv(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(K=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;F=0;G=0}else{g=d|0|0;d=k|e&0;e=pp(g,d,-1,-1)|0;k=K;i=w;w=v;v=u;u=t;t=s;s=0;while(1){H=w>>>31|i<<1;I=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;pq(e,k,j,a)|0;b=K;h=b>>31|((b|0)<0?-1:0)<<1;J=h&1;L=pq(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=K;b=t-1|0;if((b|0)==0){break}else{i=H;w=I;v=M;u=L;t=b;s=J}}B=H;C=I;D=M;E=L;F=0;G=J}J=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(J|0)>>>31|(B|C)<<1|(C<<1|J>>>31)&0|F;o=(J<<1|0>>>31)&-2|G;return(K=n,o)|0}function pD(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return b7[a&15](b|0,c|0,d|0,e|0)|0}function pE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b8[a&31](b|0,c|0,d|0,e|0)}function pF(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;b9[a&15](b|0,c|0,d|0,e|0,f|0)}function pG(a,b){a=a|0;b=b|0;ca[a&511](b|0)}function pH(a,b,c){a=a|0;b=b|0;c=c|0;cb[a&127](b|0,c|0)}function pI(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return cc[a&31](b|0,c|0,d|0,e|0,f|0)|0}function pJ(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;cd[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function pK(a,b){a=a|0;b=b|0;return ce[a&127](b|0)|0}function pL(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return cf[a&63](b|0,c|0,d|0)|0}function pM(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;cg[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function pN(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ch[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function pO(a){a=a|0;ci[a&1]()}function pP(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return cj[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function pQ(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;ck[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function pR(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;cl[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function pS(a,b,c){a=a|0;b=b|0;c=c|0;return cm[a&31](b|0,c|0)|0}function pT(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;cn[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function pU(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;co[a&15](b|0,c|0,d|0)}function pV(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(0);return 0}function pW(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ah(1)}function pX(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(2)}function pY(a){a=a|0;ah(3)}function pZ(a,b){a=a|0;b=b|0;ah(4)}function p_(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ah(5);return 0}function p$(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ah(6)}function p0(a){a=a|0;ah(7);return 0}function p1(a,b,c){a=a|0;b=b|0;c=c|0;ah(8);return 0}function p2(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ah(9)}function p3(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ah(10)}function p4(){ah(11)}function p5(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(12);return 0}function p6(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ah(13)}function p7(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ah(14)}function p8(a,b){a=a|0;b=b|0;ah(15);return 0}function p9(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ah(16)}function qa(a,b,c){a=a|0;b=b|0;c=c|0;ah(17)}
// EMSCRIPTEN_END_FUNCS
var b7=[pV,pV,mT,pV,mU,pV,m9,pV,m$,pV,mV,pV,pV,pV,pV,pV];var b8=[pW,pW,eK,pW,oW,pW,oX,pW,oV,pW,iw,pW,jr,pW,iK,pW,jm,pW,pW,pW,pW,pW,pW,pW,pW,pW,pW,pW,pW,pW,pW,pW];var b9=[pX,pX,o_,pX,o$,pX,dN,pX,d1,pX,dm,pX,oZ,pX,pX,pX];var ca=[pY,pY,my,pY,jt,pY,kA,pY,hQ,pY,is,pY,mD,pY,mQ,pY,hw,pY,hj,pY,kk,pY,hI,pY,ns,pY,hO,pY,jS,pY,fB,pY,jj,pY,jf,pY,pf,pY,hJ,pY,mO,pY,m2,pY,k0,pY,jT,pY,oK,pY,i7,pY,mu,pY,mP,pY,iV,pY,ju,pY,lF,pY,mI,pY,nR,pY,oP,pY,nQ,pY,jd,pY,hO,pY,jp,pY,lk,pY,nT,pY,mR,pY,o4,pY,mn,pY,nP,pY,iZ,pY,hi,pY,jo,pY,lf,pY,hJ,pY,op,pY,kl,pY,nD,pY,lG,pY,iU,pY,i4,pY,lc,pY,k$,pY,jg,pY,lu,pY,pe,pY,ir,pY,os,pY,ot,pY,i8,pY,iG,pY,nc,pY,oM,pY,iW,pY,je,pY,l$,pY,ha,pY,lQ,pY,i9,pY,mM,pY,oS,pY,ov,pY,oQ,pY,hp,pY,mH,pY,ld,pY,ma,pY,oL,pY,nO,pY,l2,pY,mo,pY,ou,pY,lj,pY,kz,pY,ji,pY,hq,pY,jk,pY,i$,pY,hY,pY,dO,pY,nk,pY,mh,pY,l9,pY,nS,pY,ie,pY,oM,pY,oT,pY,i3,pY,hZ,pY,iT,pY,i6,pY,mt,pY,eM,pY,io,pY,i2,pY,hx,pY,mK,pY,jh,pY,lR,pY,kN,pY,lv,pY,hc,pY,i_,pY,iF,pY,i1,pY,or,pY,eu,pY,kO,pY,oR,pY,mz,pY,hb,pY,oO,pY,lg,pY,mi,pY,l0,pY,h3,pY,m3,pY,hN,pY,iY,pY,fi,pY,ow,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY,pY];var cb=[pZ,pZ,n0,pZ,lW,pZ,ly,pZ,nZ,pZ,lP,pZ,nY,pZ,lE,pZ,hd,pZ,mx,pZ,iH,pZ,lq,pZ,lZ,pZ,gC,pZ,lM,pZ,lp,pZ,lU,pZ,ln,pZ,lX,pZ,mL,pZ,hr,pZ,hk,pZ,l_,pZ,n$,pZ,lz,pZ,hM,pZ,n1,pZ,lO,pZ,lB,pZ,n_,pZ,lD,pZ,et,pZ,it,pZ,hy,pZ,fg,pZ,mC,pZ,lJ,pZ,lt,pZ,ls,pZ,lo,pZ,lK,pZ,lL,pZ,lV,pZ,lA,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ,pZ];var cc=[p_,p_,m1,p_,nx,p_,jq,p_,nL,p_,nA,p_,nb,p_,nn,p_,jl,p_,nf,p_,ni,p_,nI,p_,nq,p_,p_,p_,p_,p_,p_,p_];var cd=[p$,p$,mp,p$,mj,p$,p$,p$];var ce=[p0,p0,of,p0,lI,p0,iA,p0,nh,p0,n5,p0,iB,p0,od,p0,lw,p0,kP,p0,n3,p0,hA,p0,iP,p0,iO,p0,nJ,p0,n9,p0,n7,p0,oN,p0,hP,p0,nX,p0,nU,p0,n8,p0,nV,p0,ix,p0,ng,p0,lY,p0,oa,p0,he,p0,lx,p0,nz,p0,lS,p0,n2,p0,hl,p0,nK,p0,pg,p0,jb,p0,lr,p0,hm,p0,nW,p0,iy,p0,iL,p0,hs,p0,nj,p0,lC,p0,oe,p0,hz,p0,ny,p0,np,p0,iM,p0,ll,p0,n4,p0,lm,p0,hK,p0,lH,p0,nr,p0,lN,p0,n6,p0,lT,p0,no,p0,k1,p0,oc,p0,ob,p0,nC,p0,nN,p0];var cf=[p1,p1,jn,p1,m5,p1,mZ,p1,oU,p1,m0,p1,js,p1,hT,p1,iD,p1,iz,p1,mS,p1,iI,p1,mA,p1,na,p1,mX,p1,hf,p1,hU,p1,iN,p1,m7,p1,mv,p1,iu,p1,ht,p1,iR,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1,p1];var cg=[p2,p2,kU,p2,k2,p2,k4,p2,ms,p2,kH,p2,kF,p2,mm,p2,kQ,p2,kT,p2,k5,p2,kt,p2,kc,p2,kS,p2,j0,p2,k3,p2,kr,p2,j4,p2,jY,p2,j_,p2,jP,p2,j2,p2,jW,p2,jU,p2,ka,p2,j8,p2,j6,p2,k6,p2,jD,p2,kR,p2,jH,p2,jz,p2,jB,p2,jF,p2,jx,p2,jN,p2,jL,p2,jJ,p2,jv,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2,p2];var ch=[p3,p3,kK,p3,kI,p3,kx,p3,ku,p3,p3,p3,p3,p3,p3,p3];var ci=[p4,p4];var cj=[p5,p5,nl,p5,nv,p5,nt,p5,nG,p5,nm,p5,nE,p5,nd,p5,ne,p5,p5,p5,p5,p5,p5,p5,p5,p5,p5,p5,p5,p5,p5,p5];var ck=[p6,p6,k7,p6,kV,p6,p6,p6];var cl=[p7,p7,o0,p7,kG,p7,kC,p7,kB,p7,o1,p7,kL,p7,mw,p7,iJ,p7,o2,p7,ky,p7,km,p7,ks,p7,kn,p7,iv,p7,mB,p7];var cm=[p8,p8,hB,p8,m_,p8,iQ,p8,m8,p8,m4,p8,hn,p8,hu,p8,mW,p8,m6,p8,iE,p8,iS,p8,mY,p8,iC,p8,hg,p8,p8,p8];var cn=[p9,p9,lh,p9,le,p9,l1,p9,mb,p9,l5,p9,md,p9,p9,p9];var co=[qa,qa,f3,qa,c5,qa,hS,qa,jc,qa,d2,qa,c2,qa,qa,qa];return{_OCRAD_result_line:cV,_strlen:pk,_tolower:po,_OCRAD_result_first_character:cW,_OCRAD_scale:cO,_OCRAD_set_image_from_file:cL,_OCRAD_result_lines:cR,_OCRAD_result_blocks:cQ,_OCRAD_version:cG,_OCRAD_close:cI,_OCRAD_set_utf8_format:cM,_memset:pm,_OCRAD_set_threshold:cN,_memcpy:pl,_OCRAD_recognize:cP,_OCRAD_open:cH,_OCRAD_result_chars_line:cU,_OCRAD_result_chars_total:cS,_realloc:o5,_OCRAD_set_image:cK,_OCRAD_result_chars_block:cT,_OCRAD_get_errno:cJ,_free:o4,_memmove:pn,__GLOBAL__I_a:hD,_malloc:o3,runPostSets:cF,stackAlloc:cp,stackSave:cq,stackRestore:cr,setThrew:cs,setTempRet0:cv,setTempRet1:cw,setTempRet2:cx,setTempRet3:cy,setTempRet4:cz,setTempRet5:cA,setTempRet6:cB,setTempRet7:cC,setTempRet8:cD,setTempRet9:cE,dynCall_iiiii:pD,dynCall_viiii:pE,dynCall_viiiii:pF,dynCall_vi:pG,dynCall_vii:pH,dynCall_iiiiii:pI,dynCall_viiiiiid:pJ,dynCall_ii:pK,dynCall_iiii:pL,dynCall_viiiiiii:pM,dynCall_viiiiid:pN,dynCall_v:pO,dynCall_iiiiiiiii:pP,dynCall_viiiiiiiii:pQ,dynCall_viiiiii:pR,dynCall_iii:pS,dynCall_viiiiiiii:pT,dynCall_viii:pU}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_iiiii": invoke_iiiii, "invoke_viiii": invoke_viiii, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viii": invoke_viii, "_llvm_lifetime_end": _llvm_lifetime_end, "__scanString": __scanString, "_fclose": _fclose, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "_strtoull": _strtoull, "_fflush": _fflush, "_fputc": _fputc, "_fwrite": _fwrite, "_send": _send, "_isspace": _isspace, "_read": _read, "_fsync": _fsync, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "___resumeException": ___resumeException, "_strcmp": _strcmp, "_strncmp": _strncmp, "_vsscanf": _vsscanf, "_snprintf": _snprintf, "_fgetc": _fgetc, "__getFloat": __getFloat, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "_close": _close, "___setErrNo": ___setErrNo, "_isxdigit": _isxdigit, "_abs": _abs, "_exit": _exit, "_sprintf": _sprintf, "___ctype_b_loc": ___ctype_b_loc, "_freelocale": _freelocale, "_catgets": _catgets, "__isLeapYear": __isLeapYear, "_asprintf": _asprintf, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "___cxa_begin_catch": ___cxa_begin_catch, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_call_unexpected": ___cxa_call_unexpected, "___cxa_get_exception_ptr": ___cxa_get_exception_ptr, "_islower": _islower, "__exit": __exit, "_isupper": _isupper, "_strftime": _strftime, "_llvm_va_end": _llvm_va_end, "___cxa_throw": ___cxa_throw, "_llvm_eh_exception": _llvm_eh_exception, "_toupper": _toupper, "_pread": _pread, "_fopen": _fopen, "_open": _open, "__arraySum": __arraySum, "_isalpha": _isalpha, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_isascii": _isascii, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_strerror": _strerror, "_catclose": _catclose, "_llvm_lifetime_start": _llvm_lifetime_start, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_uselocale": _uselocale, "_vsnprintf": _vsnprintf, "_sscanf": _sscanf, "_sysconf": _sysconf, "_fread": _fread, "_abort": _abort, "_fprintf": _fprintf, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "__reallyNegative": __reallyNegative, "_write": _write, "___cxa_allocate_exception": ___cxa_allocate_exception, "_vasprintf": _vasprintf, "_catopen": _catopen, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_llvm_eh_typeid_for": _llvm_eh_typeid_for, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "___fsmu8": ___fsmu8, "_stdout": _stdout, "___dso_handle": ___dso_handle }, buffer);
var _OCRAD_result_line = Module["_OCRAD_result_line"] = asm["_OCRAD_result_line"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _tolower = Module["_tolower"] = asm["_tolower"];
var _OCRAD_result_first_character = Module["_OCRAD_result_first_character"] = asm["_OCRAD_result_first_character"];
var _OCRAD_scale = Module["_OCRAD_scale"] = asm["_OCRAD_scale"];
var _OCRAD_set_image_from_file = Module["_OCRAD_set_image_from_file"] = asm["_OCRAD_set_image_from_file"];
var _OCRAD_result_lines = Module["_OCRAD_result_lines"] = asm["_OCRAD_result_lines"];
var _OCRAD_result_blocks = Module["_OCRAD_result_blocks"] = asm["_OCRAD_result_blocks"];
var _OCRAD_version = Module["_OCRAD_version"] = asm["_OCRAD_version"];
var _OCRAD_close = Module["_OCRAD_close"] = asm["_OCRAD_close"];
var _OCRAD_set_utf8_format = Module["_OCRAD_set_utf8_format"] = asm["_OCRAD_set_utf8_format"];
var _memset = Module["_memset"] = asm["_memset"];
var _OCRAD_set_threshold = Module["_OCRAD_set_threshold"] = asm["_OCRAD_set_threshold"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _OCRAD_recognize = Module["_OCRAD_recognize"] = asm["_OCRAD_recognize"];
var _OCRAD_open = Module["_OCRAD_open"] = asm["_OCRAD_open"];
var _OCRAD_result_chars_line = Module["_OCRAD_result_chars_line"] = asm["_OCRAD_result_chars_line"];
var _OCRAD_result_chars_total = Module["_OCRAD_result_chars_total"] = asm["_OCRAD_result_chars_total"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _OCRAD_set_image = Module["_OCRAD_set_image"] = asm["_OCRAD_set_image"];
var _OCRAD_result_chars_block = Module["_OCRAD_result_chars_block"] = asm["_OCRAD_result_chars_block"];
var _OCRAD_get_errno = Module["_OCRAD_get_errno"] = asm["_OCRAD_get_errno"];
var _free = Module["_free"] = asm["_free"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
var api = { // low level api
	'version': Module.cwrap('OCRAD_version', 'string'),
	'open': Module.cwrap('OCRAD_open', 'number'),
	'close': Module.cwrap('OCRAD_close', 'number', ['number']),
	'get_errno': Module.cwrap('OCRAD_get_errno', 'number', ['number']),
	'set_image': Module.cwrap('OCRAD_set_image', 'number', ['number', 'number', 'number']),
	'set_image_from_file': Module.cwrap('OCRAD_set_image_from_file', 'number', ['number', 'string', 'number']),
	'set_utf8_format': Module.cwrap('OCRAD_set_utf8_format', 'number', ['number', 'number']),
	'set_threshold': Module.cwrap('OCRAD_set_threshold', 'number', ['number', 'number']),
	'scale': Module.cwrap('OCRAD_scale', 'number', ['number', 'number']),
	'recognize': Module.cwrap('OCRAD_recognize', 'number', ['number', 'number']),
	'result_blocks': Module.cwrap('OCRAD_result_blocks', 'number', ['number']),
	'result_lines': Module.cwrap('OCRAD_result_lines', 'number', ['number', 'number']),
	'result_chars_total': Module.cwrap('OCRAD_result_chars_total', 'number', ['number']),
	'result_chars_block': Module.cwrap('OCRAD_result_chars_block', 'number', ['number', 'number']),
	'result_chars_line': Module.cwrap('OCRAD_result_chars_line', 'number', ['number', 'number', 'number']),
	'result_line': Module.cwrap('OCRAD_result_line', 'string', ['number', 'number', 'number']),
	'result_first_character': Module.cwrap('OCRAD_result_first_character', 'number', ['number'])
}
var OCRAD = function(image){
	if(image.getContext) image = image.getContext('2d');
	if(image.getImageData) image = image.getImageData(0, 0, image.canvas.width, image.canvas.height);
	// if(image.data){
	var width = image.width, height = image.height;
	var header = "P5\n" + width + " " + height + "\n255\n";
	var dst = new Uint8Array(header.length + width * height);
	var src = image.data;
	var srcLength = src.length | 0, srcLength_16 = (srcLength - 16) | 0;
	var j = header.length;
	for(var i = 0; i < j; i++){
		dst[i] = header.charCodeAt(i) // write the header
	}
	var coeff_r = 4899, coeff_g = 9617, coeff_b = 1868;
	for (var i = 0; i <= srcLength_16; i += 16, j += 4) {
		dst[j]     = (src[i] * coeff_r + src[i+1] * coeff_g + src[i+2] * coeff_b + 8192) >> 14;
		dst[j + 1] = (src[i+4] * coeff_r + src[i+5] * coeff_g + src[i+6] * coeff_b + 8192) >> 14;
		dst[j + 2] = (src[i+8] * coeff_r + src[i+9] * coeff_g + src[i+10] * coeff_b + 8192) >> 14;
		dst[j + 3] = (src[i+12] * coeff_r + src[i+13] * coeff_g + src[i+14] * coeff_b + 8192) >> 14;
	}
	for (; i < srcLength; i += 4, ++j) {
		dst[j] = (src[i] * coeff_r + src[i+1] * coeff_g + src[i+2] * coeff_b + 8192) >> 14;
	}
	FS.writeFile('/in.pnm', dst, {encoding: 'binary'});
	var desc = api.open();
	api.set_image_from_file(desc, 'in.pnm', 0);
	
	api.set_utf8_format(desc, 1);
	api.recognize(desc, 0)
	var text = '';
	var block_count = api.result_blocks(desc);
	
	for(var i = 0; i < block_count; i++){
		var line_count = api.result_lines(desc, i);
		for(var j = 0; j < line_count; j++){
			var line = api.result_line(desc, i, j);
			// lines.push(line)
			text += line;
		}
	}
	api.close(desc)
	return text;
}
OCRAD.version = api.version;
return OCRAD;
})();