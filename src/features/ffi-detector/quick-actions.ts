/**
 * Quick FFI Actions - Common FFI-related tasks for faster problem solving
 */
import type { Services } from "../../core/services";
import { Type } from "@sinclair/typebox";

export class QuickFfiActions {
  constructor(private readonly services: Services) {}

  register() {
    const { api, logger, ffiDetection, webDoc } = this.services;

    api.registerTool({
      name: "ffi_check_health",
      description: "Quick health check for FFI setup: verify libraries, compilers, and tools.",
      parameters: Type.Object({
        ffiType: Type.String({ description: "FFI type to check (e.g., ctypes, N-API, extern-c)" }),
        language: Type.String({ description: "Programming language" }),
      }),
      execute: async (_id, params, signal) => {
        const checks = await this.runHealthChecks(params.ffiType, params.language, signal);

        return {
          content: [{ type: "text", text: this.formatHealthReport(checks) }],
          details: { checks },
        };
      },
    });

    api.registerTool({
      name: "ffi_fix_common_issues",
      description: "Diagnose and suggest fixes for common FFI integration issues.",
      parameters: Type.Object({
        issue: Type.String({ description: "Describe the FFI issue you're facing" }),
        ffiType: Type.String({ description: "FFI type (ctypes, N-API, etc.)" }),
        language: Type.String({ description: "Programming language" }),
      }),
      execute: async (_id, params, signal) => {
        const docs = await webDoc.fetchFFIDocumentation(
          params.ffiType,
          this.getDocUrls(params.ffiType, params.language)
        );

        const fixes = this.suggestFixes(params.issue, params.ffiType, params.language, docs);

        return {
          content: [{ type: "text", text: fixes }],
          details: { docsFetched: docs.length },
        };
      },
    });

    api.registerTool({
      name: "ffi_generate_wrapper",
      description: "Generate FFI wrapper code template for a given library.",
      parameters: Type.Object({
        language: Type.String({ description: "Target language (Python, Node.js, Rust)" }),
        ffiType: Type.String({ description: "FFI type (ctypes, N-API, extern-c)" }),
        libraryName: Type.String({ description: "Name of the library to wrap" }),
        functions: Type.Optional(Type.Array(Type.String(), { description: "List of functions to expose" })),
      }),
      execute: async (_id, params) => {
        const template = this.generateWrapperTemplate(
          params.language,
          params.ffiType,
          params.libraryName,
          params.functions || []
        );

        return {
          content: [{ type: "text", text: template }],
          details: { language: params.language, ffiType: params.ffiType },
        };
      },
    });

    api.registerTool({
      name: "ffi_compare_backends",
      description: "Compare different FFI backends for a language to help choose the best one.",
      parameters: Type.Object({
        language: Type.String({ description: "Programming language" }),
      }),
      execute: async (_id, params) => {
        const comparison = this.compareBackends(params.language);
        return {
          content: [{ type: "text", text: comparison }],
          details: { language: params.language },
        };
      },
    });
  }

  private async runHealthChecks(ffiType: string, language: string, signal?: AbortSignal): Promise<Array<{ check: string; status: "pass" | "fail" | "warn"; message: string }>> {
    const checks: Array<{ check: string; status: "pass" | "fail" | "warn"; message: string }> = [];

    // Check shell availability
    try {
      const result = await this.services.shell.exec("echo", ["health_check"], { signal: signal as any });
      checks.push({
        check: "Shell Access",
        status: result.success ? "pass" : "fail",
        message: result.success ? "Shell is accessible" : result.stderr || "Shell check failed",
      });
    } catch {
      checks.push({ check: "Shell Access", status: "fail", message: "Cannot execute shell commands" });
    }

    // Language-specific checks
    if (language === "Python") {
      if (ffiType === "ctypes") {
        checks.push({ check: "ctypes Module", status: "pass", message: "ctypes is built into Python" });
      } else if (ffiType === "cffi") {
        try {
          const result = await this.services.shell.exec("python3", ["-c", "import cffi; print('OK')"], { signal: signal as any });
          checks.push({
            check: "CFFI Module",
            status: result.success ? "pass" : "fail",
            message: result.success ? "CFFI is installed" : "CFFI not found",
          });
        } catch {
          checks.push({ check: "CFFI Module", status: "fail", message: "CFFI check failed" });
        }
      }
    } else if (language === "Node.js") {
      if (ffiType === "N-API") {
        try {
          const result = await this.services.shell.exec("node", ["--version"], { signal: signal as any });
          const version = result.stdout.trim();
          const major = parseInt(version.replace("v", ""));
          checks.push({
            check: "Node.js Version",
            status: major >= 8 ? "pass" : "warn",
            message: `Node.js ${version} - N-API requires v8+`,
          });
        } catch {
          checks.push({ check: "Node.js Version", status: "fail", message: "Node.js not found" });
        }
      } else if (ffiType === "node-gyp") {
        try {
          const result = await this.services.shell.exec("node-gyp", ["--version"], { signal: signal as any });
          checks.push({
            check: "node-gyp",
            status: result.success ? "pass" : "warn",
            message: result.success ? `node-gyp ${result.stdout.trim()}` : "node-gyp not found",
          });
        } catch {
          checks.push({ check: "node-gyp", status: "warn", message: "node-gyp not installed (may not be needed)" });
        }
      }
    } else if (language === "Rust") {
      if (ffiType === "extern-c" || ffiType === "wasm-bindgen") {
        try {
          const result = await this.services.shell.exec("rustc", ["--version"], { signal: signal as any });
          checks.push({
            check: "Rust Compiler",
            status: result.success ? "pass" : "fail",
            message: result.success ? result.stdout.trim() : "Rust not found",
          });
        } catch {
          checks.push({ check: "Rust Compiler", status: "fail", message: "Rust/rustc not found" });
        }

        if (ffiType === "wasm-bindgen") {
          try {
            const result = await this.services.shell.exec("wasm-pack", ["--version"], { signal: signal as any });
            checks.push({
              check: "wasm-pack",
              status: result.success ? "pass" : "warn",
              message: result.success ? result.stdout.trim() : "wasm-pack not found",
            });
          } catch {
            checks.push({ check: "wasm-pack", status: "warn", message: "wasm-pack not installed" });
          }
        }
      }
    }

    return checks;
  }

  private formatHealthReport(checks: Array<{ check: string; status: "pass" | "fail" | "warn"; message: string }>): string {
    let report = "## FFI Health Check Report\n\n";
    const passed = checks.filter(c => c.status === "pass").length;
    const failed = checks.filter(c => c.status === "fail").length;
    const warned = checks.filter(c => c.status === "warn").length;

    report += `**Summary**: ${passed} passed, ${failed} failed, ${warned} warnings\n\n`;
    report += "### Checks\n\n";

    for (const check of checks) {
      const icon = check.status === "pass" ? "✓" : check.status === "fail" ? "✗" : "⚠";
      report += `- ${icon} **${check.check}**: ${check.message}\n`;
    }

    if (failed > 0) {
      report += "\n**Recommendation**: Fix failing checks before proceeding with FFI integration.\n";
    }

    return report;
  }

  private suggestFixes(issue: string, ffiType: string, language: string, docs: any[]): string {
    let fixes = `## FFI Fix Suggestions for ${ffiType} (${language})\n\n`;
    fixes += `**Issue**: ${issue}\n\n`;

    // Generic fixes based on FFI type
    if (ffiType === "ctypes") {
      fixes += "### Common ctypes Issues\n\n";
      fixes += "1. **Library not found**: Ensure .so/.dll/.dylib is in the correct path\n";
      fixes += "   ```python\n   import os\n   os.add_dll_directory(path)\n   ```\n\n";
      fixes += "2. **Type mismatch**: Verify ctypes types match C types\n";
      fixes += "3. **Loading error**: Use absolute paths: `ctypes.CDLL('/full/path/to/lib.so')`\n\n";
    } else if (ffiType === "N-API") {
      fixes += "### Common N-API Issues\n\n";
      fixes += "1. **Build tools missing**: Install node-gyp prerequisites\n";
      fixes += "   - Windows: `npm install --global windows-build-tools`\n";
      fixes += "   - Linux: `apt-get install build-essential`\n";
      fixes += "   - macOS: `xcode-select --install`\n\n";
      fixes += "2. **Node version**: N-API requires Node.js 8.0.0+\n";
      fixes += "3. **Rebuild**: Try `npm rebuild` or delete node_modules\n\n";
    } else if (ffiType === "extern-c") {
      fixes += "### Common Rust FFI Issues\n\n";
      fixes += "1. **Missing #[no_mangle]**: Ensure functions have #[no_mangle] attribute\n";
      fixes += "   ```rust\n   #[no_mangle]\n   pub extern \"C\" fn my_func() { }\n   ```\n\n";
      fixes += "2. **Build as cdylib**: Add to Cargo.toml: `crate-type = [\"cdylib\"]`\n";
      fixes += "3. **Type conversion**: Use std::ffi::CStr and std::os::raw::c_* types\n\n";
    }

    if (docs.length > 0) {
      fixes += "### Documentation References\n\n";
      for (const doc of docs.slice(0, 3)) {
        fixes += `- ${doc.title || doc.url}\n`;
        if (doc.snippets.length > 0) {
          fixes += `  > ${doc.snippets[0]}\n`;
        }
      }
    }

    return fixes;
  }

  private generateWrapperTemplate(language: string, ffiType: string, library: string, functions: string[]): string {
    if (language === "Python" && ffiType === "ctypes") {
      return `import ctypes
from ctypes import c_int, c_char_p, POINTER, Structure

# Load the library
lib = ctypes.CDLL('./lib${library}.so')  # Use .dll on Windows, .dylib on macOS

# Define types
${functions.length > 0 ? functions.map(f => `# Define ${f} signature\n# lib.${f}.argtypes = [...]\n# lib.${f}.restype = ...\n`).join('\n') : '# TODO: Define function signatures'}

# Example usage:
# result = lib.function_name(arg1, arg2)
print("Wrapper ready for ${library}")
`;
    } else if (language === "Node.js" && ffiType === "N-API") {
      return `//binding.gyp:
{
  "targets": [{
    "target_name": "${library}",
    "sources": ["${library}.c"],
    "libraries": []
  }]
}

// ${library}.js:
const addon = require('./build/Release/${library}.node');

// Usage:
// addon.functionName(arg1, arg2);

console.log('${library} addon loaded');
`;
    } else if (language === "Rust" && ffiType === "extern-c") {
      return `// src/lib.rs:
use std::os::raw::{c_int, c_char};
use std::ffi::CStr;

#[no_mangle]
pub extern "C" fn ${functions[0] || 'my_function'}() -> c_int {
    // Implementation here
    0
}

// Cargo.toml:
// [lib]
// crate-type = ["cdylib"]

// Build: cargo build --release
// Output: target/release/lib${library}.so
`;
    }

    return `# Wrapper template for ${language}/${ffiType}\n# Library: ${library}\n# TODO: Add specific wrapper code\n`;
  }

  private compareBackends(language: string): string {
    let comparison = `## FFI Backend Comparison for ${language}\n\n`;

    if (language === "Python") {
      comparison += "| Backend | Pros | Cons | Use Case |\n";
      comparison += "|---------|------|------|----------|\n";
      comparison += "| ctypes | Built-in, no deps | Limited type safety | Simple C interop |\n";
      comparison += "| CFFI | Better types, flexible | Extra dependency | Complex C libraries |\n";
      comparison += "| pybind11 | C++ support, modern | C++17 required | C++ class bindings |\n";
    } else if (language === "Node.js") {
      comparison += "| Backend | Pros | Cons | Use Case |\n";
      comparison += "|---------|------|------|----------|\n";
      comparison += "| N-API | Stable ABI, official | More boilerplate | Production addons |\n";
      comparison += "| ffi-napi | Easy to use | Deprecated, less stable | Quick prototypes |\n";
      comparison += "| node-gyp | Full control | Complex setup | Custom native modules |\n";
    } else if (language === "Rust") {
      comparison += "| Backend | Pros | Cons | Use Case |\n";
      comparison += "|---------|------|------|----------|\n";
      comparison += "| extern C | Simple, direct | Manual ABI care | C compatibility |\n";
      comparison += "| wasm-bindgen | WebAssembly, modern | WASM-only | Browser/Node WASM |\n";
      comparison += "| libc | Standard library | Linux/Unix only | System programming |\n";
    }

    return comparison;
  }

  private getDocUrls(ffiType: string, language: string): string[] {
    // Return relevant doc URLs - simplified for now
    return [`https://docs.python.org/3/library/ctypes.html`];
  }
}
