/**
 * FFI Detection Service - Scans projects for FFI (Foreign Function Interface) usage
 */
import { ShellService } from "./shell-service";
import { Logger } from "./logger";
import { FileSearchService } from "./file-search-service";
import { FFIDetectionError } from "./errors";

export interface FFIPattern {
  language: string;
  ffiType: string;
  description: string;
  indicators: string[];
  documentationUrls: string[];
}

export interface FFIDetectionResult {
  detected: boolean;
  projectRoot: string;
  ffiInstances: Array<{
    filePath: string;
    lineNumber?: number;
    pattern: FFIPattern;
    snippet?: string;
    confidence: "high" | "medium" | "low";
  }>;
  summary: string;
  recommendations: string[];
}

export const FFI_PATTERNS: FFIPattern[] = [
  {
    language: "Python",
    ffiType: "ctypes",
    description: "Python ctypes for calling C functions",
    indicators: ["import ctypes", "ctypes.CDLL", "ctypes.WinDLL", "ctypes.Structure"],
    documentationUrls: ["https://docs.python.org/3/library/ctypes.html"]
  },
  {
    language: "Python",
    ffiType: "cffi",
    description: "Python CFFI for calling C functions",
    indicators: ["import cffi", "ffi.cdef", "ffi.dlopen", "from cffi import FFI"],
    documentationUrls: ["https://cffi.readthedocs.io/"]
  },
  {
    language: "Python",
    ffiType: "pybind11",
    description: "Python pybind11 for C++ bindings",
    indicators: ["pybind11", "#include <pybind11", "PYBIND11_MODULE"],
    documentationUrls: ["https://pybind11.readthedocs.io/"]
  },
  {
    language: "Node.js",
    ffiType: "node-gyp",
    description: "Node.js native addon with node-gyp",
    indicators: ["require('node-gyp')", "binding.gyp", "node-gyp", "NAN_", "v8::"],
    documentationUrls: ["https://github.com/nodejs/node-gyp"]
  },
  {
    language: "Node.js",
    ffiType: "ffi-napi",
    description: "Node.js FFI with ffi-napi",
    indicators: ["require('ffi-napi')", "require('ffi')", "Library(", "ForeignFunction("],
    documentationUrls: ["https://github.com/node-ffi-napi/node-ffi-napi"]
  },
  {
    language: "Node.js",
    ffiType: "N-API",
    description: "Node.js N-API for native addons",
    indicators: ["napi_", "NAPI", "#include <node_api.h>", "NODE_API"],
    documentationUrls: ["https://nodejs.org/api/n-api.html"]
  },
  {
    language: "Rust",
    ffiType: "extern-c",
    description: "Rust FFI with extern \"C\" blocks",
    indicators: ["extern \"C\"", "#[no_mangle]", "pub extern fn", "std::ffi::"],
    documentationUrls: ["https://doc.rust-lang.org/nomicon/ffi.html"]
  },
  {
    language: "Rust",
    ffiType: "wasm-bindgen",
    description: "Rust wasm-bindgen for WebAssembly",
    indicators: ["use wasm_bindgen", "#[wasm_bindgen]", "wasm-bindgen"],
    documentationUrls: ["https://rustwasm.github.io/wasm-bindgen/"]
  },
  {
    language: "Rust",
    ffiType: "libc",
    description: "Rust libc bindings",
    indicators: ["use libc::", "extern crate libc", "libc::{"],
    documentationUrls: ["https://docs.rs/libc/"]
  },
  {
    language: "Go",
    ffiType: "cgo",
    description: "Go CGO for C interoperability",
    indicators: ["import \"C\"", "package C", "CGO_", "/* #include"],
    documentationUrls: ["https://pkg.go.dev/cmd/cgo"]
  },
  {
    language: "Java",
    ffiType: "JNI",
    description: "Java Native Interface",
    indicators: ["native ", "System.loadLibrary", "JNIEXPORT", "JNICALL", "#include <jni.h>"],
    documentationUrls: ["https://docs.oracle.com/javase/8/docs/technotes/guides/jni/"]
  },
  {
    language: "C#",
    ffiType: "P/Invoke",
    description: "C# Platform Invocation Services",
    indicators: ["DllImport", "[DllImport(", "Marshal.", "P/Invoke"],
    documentationUrls: ["https://learn.microsoft.com/en-us/dotnet/standard/native-interop/pinvoke"]
  },
  {
    language: "C/C++",
    ffiType: "dlopen",
    description: "Dynamic library loading with dlopen",
    indicators: ["dlopen(", "dlsym(", "#include <dlfcn.h>", "LoadLibrary(", "GetProcAddress("],
    documentationUrls: ["https://man7.org/linux/man-pages/man3/dlopen.3.html"]
  },
  {
    language: "System",
    ffiType: "libffi",
    description: "Portable foreign function interface library",
    indicators: ["#include <ffi.h>", "libffi", "ffi_call", "ffi_prep_cif"],
    documentationUrls: ["https://sourceware.org/libffi/"]
  }
];

export class FFIDetectionService {
  private readonly fileSearch: FileSearchService;
  private readonly languageToFileTypes: Record<string, string[]> = {
    "Python": ["*.py"],
    "Node.js": ["*.js", "*.ts", "*.cjs", "*.mjs"],
    "Rust": ["*.rs"],
    "Go": ["*.go"],
    "Java": ["*.java"],
    "C#": ["*.cs"],
    "C/C++": ["*.c", "*.cpp", "*.h", "*.hpp"],
    "System": ["*.c", "*.cpp", "*.h"]
  };

  constructor(
    private readonly shell: ShellService,
    private readonly logger: Logger,
    fileSearch?: FileSearchService
  ) {
    this.fileSearch = fileSearch || FileSearchService.createDefault(shell, logger);
  }

  async detectFFI(projectRoot: string): Promise<FFIDetectionResult> {
    this.logger.info(`Scanning for FFI patterns in: ${projectRoot}`);

    const result: FFIDetectionResult = {
      detected: false,
      projectRoot,
      ffiInstances: [],
      summary: "",
      recommendations: []
    };

    for (const pattern of FFI_PATTERNS) {
      const fileTypes = this.languageToFileTypes[pattern.language] || [];
      for (const indicator of pattern.indicators) {
        try {
          const matches = await this.fileSearch.search(projectRoot, indicator, fileTypes);
          for (const match of matches) {
            result.detected = true;
            result.ffiInstances.push({
              filePath: match.file,
              lineNumber: match.line,
              pattern,
              snippet: match.snippet,
              confidence: match.confidence
            });
          }
        } catch (e: any) {
          this.logger.warn(`Error searching for pattern ${indicator}: ${e.message}`);
        }
      }
    }

    result.summary = this.generateSummary(result);
    result.recommendations = this.generateRecommendations(result);

    return result;
  }

  private generateSummary(result: FFIDetectionResult): string {
    if (!result.detected) {
      return "No FFI patterns detected in this project.";
    }

    const patterns = new Set(result.ffiInstances.map(i => `${i.pattern.language}/${i.pattern.ffiType}`));
    const files = new Set(result.ffiInstances.map(i => i.filePath));

    return `Detected ${result.ffiInstances.length} FFI instance(s) across ${patterns.size} FFI type(s) in ${files.size} file(s). Types: ${Array.from(patterns).join(", ")}`;
  }

  private generateRecommendations(result: FFIDetectionResult): string[] {
    const recommendations: string[] = [];

    if (!result.detected) {
      recommendations.push("No FFI detected - this appears to be a pure-language project.");
      return recommendations;
    }

    const patterns = result.ffiInstances.map(i => i.pattern);
    const hasPython = patterns.some(p => p.language === "Python");
    const hasNode = patterns.some(p => p.language === "Node.js");
    const hasRust = patterns.some(p => p.language === "Rust");
    const hasSystem = patterns.some(p => p.ffiType === "dlopen" || p.ffiType === "libffi");

    if (hasPython) {
      recommendations.push("Python FFI detected - ensure proper .so/.dll/.dylib files are available for target platforms.");
      recommendations.push("Consider using cffi over ctypes for better type safety and performance.");
    }

    if (hasNode) {
      recommendations.push("Node.js native addon detected - verify node-gyp build tools are installed (python, make, C compiler).");
      recommendations.push("Consider migrating from ffi-napi to N-API for better Node.js version compatibility.");
    }

    if (hasRust) {
      recommendations.push("Rust FFI detected - ensure extern \"C\" functions use #[no_mangle] and proper ABI conventions.");
      recommendations.push("For wasm-bindgen projects, verify wasm-pack is installed for building.");
    }

    if (hasSystem) {
      recommendations.push("System-level FFI detected - verify target platform libraries are available (libc, libffi, etc.).");
      recommendations.push("Consider adding platform-specific build flags or using cross-compilation tools.");
    }

    recommendations.push("Use 'ffi_resolve' tool to get LLM-assisted fix suggestions for any FFI issues.");

    return recommendations;
  }
}
