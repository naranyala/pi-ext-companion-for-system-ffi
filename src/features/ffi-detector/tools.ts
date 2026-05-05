/**
 * FFI Detector Tools - Tools for detecting and resolving FFI issues
 */
import type { Services } from "../../core/services";
import type { FFIDetectionResult, FFIPattern, FFIDocResult } from "../../core/ffi-detection-service";
import { Type } from "@sinclair/typebox";

export const DetectFFIParams = Type.Object({
  projectPath: Type.Optional(Type.String({
    description: "Path to the project root. Defaults to current working directory."
  })),
  deepScan: Type.Optional(Type.Boolean({
    description: "Perform a deep scan including build artifacts and dependencies."
  }))
});

export const AnalyzeFFIParams = Type.Object({
  detectionResult: Type.Optional(Type.String({
    description: "JSON string of previous detection result to analyze"
  }))
});

export const ResolveFFIParams = Type.Object({
  ffiType: Type.String({
    description: "The FFI type to resolve (e.g., 'ctypes', 'N-API', 'extern-c')"
  }),
  language: Type.String({
    description: "The programming language (e.g., 'Python', 'Node.js', 'Rust')"
  }),
  issue: Type.Optional(Type.String({
    description: "Description of the issue to resolve"
  }))
});

export const FetchFFIDocsParams = Type.Object({
  ffiType: Type.String({
    description: "The FFI type to fetch docs for"
  }),
  language: Type.String({
    description: "The programming language"
  }),
  urls: Type.Optional(Type.Array(Type.String(), {
    description: "Specific URLs to fetch (optional)"
  }))
});

export class FFIDetectorTools {
  constructor(private readonly services: Services) {}

  register() {
    const { api, shell, logger } = this.services;

    api.registerTool({
      name: "ffi_detect",
      description: "Detect FFI (Foreign Function Interface) usage in the current project. Scans for common FFI patterns across multiple languages (Python, Node.js, Rust, Go, Java, C#).",
      parameters: DetectFFIParams,
      execute: async (_id, params) => {
        const { FFIDetectionService } = await import("../../core/ffi-detection-service");
        const detectionService = new FFIDetectionService(shell, logger);

        const projectPath = params.projectPath || process.cwd();
        const result = await detectionService.detectFFI(projectPath);

        return {
          content: [{
            type: "text",
            text: this.formatDetectionResult(result)
          }],
          details: result
        };
      }
    });

    api.registerTool({
      name: "ffi_analyze",
      description: "Analyze detected FFI patterns and provide detailed insights about compatibility, risks, and best practices.",
      parameters: AnalyzeFFIParams,
      execute: async (_id, params) => {
        let result: FFIDetectionResult;

        if (params.detectionResult) {
          try {
            result = JSON.parse(params.detectionResult);
          } catch {
            return {
              content: [{
                type: "text",
                text: "Invalid detection result JSON. Please run ffi_detect first."
              }]
            };
          }
        } else {
          const { FFIDetectionService } = await import("../../core/ffi-detection-service");
          const detectionService = new FFIDetectionService(shell, logger);
          result = await detectionService.detectFFI(process.cwd());
        }

        const analysis = this.analyzeFFI(result);

        return {
          content: [{
            type: "text",
            text: analysis
          }]
        };
      }
    });

    api.registerTool({
      name: "ffi_resolve",
      description: "Get LLM-assisted resolution suggestions for FFI integration issues. Fetches documentation and provides fix recommendations.",
      parameters: ResolveFFIParams,
      execute: async (_id, params, signal) => {
        const { ffiType, language, issue } = params;

        const pattern = this.findPattern(ffiType, language);
        if (!pattern) {
          return {
            content: [{
              type: "text",
              text: `Unknown FFI type: ${ffiType} for language: ${language}`
            }]
          };
        }

        const webDocService = new (await import("../../core/web-doc-service")).WebDocService(api, logger);

        const docs = await webDocService.fetchFFIDocumentation(ffiType, pattern.documentationUrls);

        const searchResults = await webDocService.searchFFIResources(ffiType, language);

        const resolution = this.generateResolution(pattern, docs, searchResults, issue);

        return {
          content: [{
            type: "text",
            text: resolution
          }],
          details: {
            pattern,
            docsFetched: docs.length,
            searchResults
          }
        };
      }
    });

    api.registerTool({
      name: "ffi_fetch_docs",
      description: "Fetch FFI documentation from the web. Retrieves relevant docs, examples, and best practices for a specific FFI type.",
      parameters: FetchFFIDocsParams,
      execute: async (_id, params) => {
        const { ffiType, language, urls } = params;

        const pattern = this.findPattern(ffiType, language);
        const urlsToFetch = urls || (pattern?.documentationUrls || []);

        if (urlsToFetch.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No documentation URLs found for ${ffiType}. Try providing specific URLs.`
            }]
          };
        }

        const webDocService = new (await import("../../core/web-doc-service")).WebDocService(api, logger);
        const docs = await webDocService.fetchFFIDocumentation(ffiType, urlsToFetch);

        const formattedDocs = docs.map(d =>
          `## ${d.title || d.url}\n${d.error ? `Error: ${d.error}` : d.content.substring(0, 2000)}\n\nSnippets:\n${d.snippets.map(s => `- ${s}`).join('\n')}`
        ).join('\n\n---\n\n');

        return {
          content: [{
            type: "text",
            text: `# FFI Documentation: ${ffiType} (${language})\n\n${formattedDocs}`
          }],
          details: docs
        };
      }
    });
  }

  private formatDetectionResult(result: FFIDetectionResult): string {
    if (!result.detected) {
      return `## FFI Detection Results\n\nNo FFI patterns detected in ${result.projectRoot}.\n\nThis appears to be a pure-language project without foreign function interface usage.`;
    }

    let output = `# FFI Detection Results\n\n`;
    output += `**Summary**: ${result.summary}\n\n`;
    output += `## Detected FFI Instances\n\n`;

    const groupedByType = new Map<string, typeof result.ffiInstances>();
    for (const instance of result.ffiInstances) {
      const key = `${instance.pattern.language}/${instance.pattern.ffiType}`;
      if (!groupedByType.has(key)) {
        groupedByType.set(key, []);
      }
      groupedByType.get(key)!.push(instance);
    }

    for (const [type, instances] of groupedByType) {
      output += `### ${type}\n`;
      output += `${instances[0].pattern.description}\n\n`;
      output += `**Files:**\n`;
      for (const inst of instances.slice(0, 5)) {
        output += `- \`${inst.filePath}\``;
        if (inst.lineNumber) output += `:${inst.lineNumber}`;
        if (inst.snippet) output += `\n  > ${inst.snippet}`;
        output += `\n`;
      }
      if (instances.length > 5) output += `... and ${instances.length - 5} more files\n`;
      output += `\n`;
    }

    output += `## Recommendations\n\n`;
    for (const rec of result.recommendations) {
      output += `- ${rec}\n`;
    }

    return output;
  }

  private analyzeFFI(result: FFIDetectionResult): string {
    if (!result.detected) {
      return "No FFI detected. Analysis not needed.";
    }

    let analysis = `# FFI Analysis\n\n`;
    analysis += `${result.summary}\n\n`;

    const patterns = new Set(result.ffiInstances.map(i => i.pattern));

    analysis += `## Compatibility Assessment\n\n`;
    for (const pattern of patterns) {
      analysis += `### ${pattern.language} - ${pattern.ffiType}\n`;

      if (pattern.ffiType === "ctypes") {
        analysis += `- **Risk**: Low to Medium - ctypes is stable but error-prone with type mismatches\n`;
        analysis += `- **Portability**: Good - works on all platforms with Python\n`;
        analysis += `- **Performance**: Medium - slower than direct C extensions\n`;
      } else if (pattern.ffiType === "N-API") {
        analysis += `- **Risk**: Low - N-API is ABI-stable across Node versions\n`;
        analysis += `- **Portability**: Good - official Node.js API\n`;
        analysis += `- **Performance**: High - near-native performance\n`;
      } else if (pattern.ffiType === "extern-c") {
        analysis += `- **Risk**: Medium - requires careful ABI management\n`;
        analysis += `- **Portability**: Depends on target platform\n`;
        analysis += `- **Performance**: High - direct FFI with no overhead\n`;
      } else {
        analysis += `- **Risk**: Medium - depends on implementation\n`;
        analysis += `- **Portability**: Varies by platform and library\n`;
      }
      analysis += `\n`;
    }

    analysis += `## Best Practices Checklist\n\n`;
    analysis += `- [ ] Ensure all FFI functions have proper type signatures\n`;
    analysis += `- [ ] Add error handling for missing libraries (try/except, ifdef)\n`;
    analysis += `- [ ] Document platform-specific requirements\n`;
    analysis += `- [ ] Create fallback paths for when FFI is unavailable\n`;
    analysis += `- [ ] Test on all target platforms (Linux, Windows, macOS)\n`;
    analysis += `- [ ] Consider adding unit tests with mocked FFI calls\n`;

    return analysis;
  }

  private findPattern(ffiType: string, language: string): FFIPattern | undefined {
    const { FFI_PATTERNS } = require("../../core/ffi-detection-service");
    return FFI_PATTERNS.find((p: FFIPattern) =>
      p.ffiType.toLowerCase() === ffiType.toLowerCase() &&
      p.language.toLowerCase() === language.toLowerCase()
    );
  }

  private generateResolution(
    pattern: FFIPattern,
    docs: FFIDocResult[],
    searchResults: string[],
    issue?: string
  ): string {
    let resolution = `# FFI Resolution: ${pattern.language} - ${pattern.ffiType}\n\n`;

    if (issue) {
      resolution += `**Issue**: ${issue}\n\n`;
    }

    resolution += `## Documentation\n\n`;
    for (const doc of docs.filter(d => !d.error)) {
      resolution += `### ${doc.title || doc.url}\n`;
      resolution += `${doc.content.substring(0, 1000)}\n\n`;
      if (doc.snippets.length > 0) {
        resolution += `**Key snippets**:\n`;
        for (const snippet of doc.snippets.slice(0, 3)) {
          resolution += `- ${snippet}\n`;
        }
        resolution += `\n`;
      }
    }

    if (searchResults.length > 0) {
      resolution += `## Additional Resources\n\n`;
      for (const url of searchResults.slice(0, 5)) {
        resolution += `- ${url}\n`;
      }
      resolution += `\n`;
    }

    resolution += `## Suggested Fixes\n\n`;
    resolution += this.getSuggestedFixes(pattern, issue);

    return resolution;
  }

  private getSuggestedFixes(pattern: FFIPattern, issue?: string): string {
    let fixes = "";

    if (pattern.ffiType === "ctypes") {
      fixes += `1. **Verify library loading**: Ensure the .so/.dll/.dylib is in the correct path\n`;
      fixes += `   \`\`\`python\n   import os\n   os.add_dll_directory(path)  # Windows\n   \`\`\`\n\n`;
      fixes += `2. **Check type mappings**: Verify ctypes types match C types correctly\n`;
      fixes += `3. **Handle errors**: Wrap FFI calls in try/except to catch OSError\n`;
    } else if (pattern.ffiType === "N-API") {
      fixes += `1. **Install build tools**: Ensure node-gyp prerequisites are installed\n`;
      fixes += `   - Windows: \`npm install --global windows-build-tools\`\n`;
      fixes += `   - Linux: \`apt-get install build-essential\`\n`;
      fixes += `   - macOS: \`xcode-select --install\`\n\n`;
      fixes += `2. **Check Node version**: N-API requires Node.js 8.0.0+\n`;
      fixes += `3. **Rebuild native modules**: \`npm rebuild\` or delete node_modules and reinstall\n`;
    } else if (pattern.ffiType === "extern-c") {
      fixes += `1. **Add #[no_mangle]**: Ensure Rust functions can be called from C\n`;
      fixes += `   \`\`\`rust\n   #[no_mangle]\n   pub extern "C" fn my_function() { }\n   \`\`\`\n\n`;
      fixes += `2. **Use proper types**: Use \`std::ffi::CStr\` and \`std::os::raw::c_*\` types\n`;
      fixes += `3. **Build as cdylib**: Add to Cargo.toml: \`crate-type = ["cdylib"]\`\n`;
    } else if (pattern.ffiType === "cgo") {
      fixes += `1. **Set CGO_ENABLED**: Ensure CGO is enabled: \`CGO_ENABLED=1 go build\`\n`;
      fixes += `2. **Install C compiler**: CGO requires gcc or clang\n`;
      fixes += `3. **Handle CFLAGS**: Set proper CFLAGS for your platform\n`;
    }

    if (issue) {
      fixes += `\n## Specific Issue Resolution\n\n`;
      fixes += `Based on the issue: "${issue}"\n\n`;
      fixes += `Use the ffi_fetch_docs tool to get more specific documentation, or search for similar issues on Stack Overflow using the provided search results.\n`;
    }

    return fixes;
  }
}
