# FFI Detector Extension

A pi-coding-agent extension for detecting and resolving FFI (Foreign Function Interface) integration issues in system-related projects.

## Features

### Tools (callable by LLM)

| Tool | Description |
|------|-------------|
| `ffi_detect` | Scans the current project for FFI patterns across multiple languages |
| `ffi_analyze` | Analyzes detected FFI patterns and provides compatibility insights |
| `ffi_resolve` | LLM-assisted resolution suggestions with web documentation fetch |
| `ffi_fetch_docs` | Fetches FFI documentation from the web |

### Commands (user-invokable)

| Command | Usage | Description |
|---------|-------|-------------|
| `/ffi-detect` | `/ffi-detect [path]` | Detect FFI patterns in project |
| `/ffi-resolve` | `/ffi-resolve <type>\|<lang> [\| issue]` | Get FFI fix suggestions |
| `/ffi-docs` | `/ffi-docs <type>\|<lang>` | Fetch FFI documentation |

### Keyboard Shortcut

- `Ctrl+Alt+F`: Quick FFI scan

## Supported FFI Types

### Python
- **ctypes**: `import ctypes`, `ctypes.CDLL`
- **cffi**: `import cffi`, `ffi.cdef`
- **pybind11**: `#include <pybind11>`, `PYBIND11_MODULE`

### Node.js
- **node-gyp**: `binding.gyp`, `require('node-gyp')`
- **ffi-napi**: `require('ffi-napi')`, `Library()`
- **N-API**: `napi_`, `#include <node_api.h>`

### Rust
- **extern-c**: `extern "C"`, `#[no_mangle]`
- **wasm-bindgen**: `#[wasm_bindgen]`, `use wasm_bindgen`
- **libc**: `use libc::`, `extern crate libc`

### Other Languages
- **Go cgo**: `import "C"`, `/* #include`
- **Java JNI**: `native `, `System.loadLibrary`
- **C# P/Invoke**: `DllImport`, `[DllImport(`
- **System dlopen**: `dlopen(`, `LoadLibrary(`

## Usage Examples

### Detect FFI in Current Project
```
/ffi-detect
```

### Detect FFI in Specific Path
```
/ffi-detect /path/to/project
```

### Get Help Resolving N-API Issues
```
/ffi-resolve N-API|Node.js|build fails with node-gyp error
```

### Fetch ctypes Documentation
```
/ffi-docs ctypes|Python
```

## How It Works

1. **Detection**: Scans project files using grep patterns to find FFI indicators
2. **Analysis**: Groups findings by FFI type and provides compatibility assessment
3. **Web Fetch**: Uses `fetch()` API to retrieve documentation from official sources
4. **LLM Resolution**: Provides intelligent suggestions based on detected patterns and fetched docs

## Configuration

The extension uses web fetch to retrieve documentation. Ensure your pi agent has network access.

## Files Created/Modified

- `src/core/ffi-detection-service.ts` - FFI pattern detection logic
- `src/core/web-doc-service.ts` - Web documentation fetching
- `src/features/ffi-detector/tools.ts` - LLM-callable tools
- `src/features/ffi-detector/commands.ts` - User commands
- `src/features/ffi-detector/events.ts` - Event handlers
- `src/core/services.ts` - Updated with new services
- `src/index.ts` - Updated to register FFI features
- `tests/ffi-detection.test.ts` - Unit tests

## Running Tests

```bash
bun test tests/ffi-detection.test.ts
```
