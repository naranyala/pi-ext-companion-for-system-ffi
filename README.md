# 🚀 Pi-Mono FFI Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pi-Mono Compatible](https://img.shields.io/badge/pi--mono-Compatible-blue)](https://github.com/badlogic/pi-mono)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

**Transform your `pi` coding agent into a professional Foreign Function Interface (FFI) expert.**

The **Pi-Mono FFI Companion** is a high-performance extension for the `pi` ecosystem. It bridges the gap between high-level AI coding and low-level system programming by giving the agent "environmental consciousness"—the ability to detect, analyze, and optimize native interoperability layers across multiple languages.

---

## 🌟 Why FFI Companion?

FFI (Foreign Function Interface) is notoriously difficult. Between header mismatches, memory layout errors, and toolchain inconsistencies, AI agents often struggle with the "last mile" of native integration.

This extension solves that by providing:
- **Automatic Domain Awareness**: The agent doesn't just "guess" your stack; it scans for specific FFI patterns (ctypes, N-API, JNI, Rust `extern "C"`, etc.) and activates a specialized toolset.
- **System-Level Observability**: Real-time TUI dashboards for session health and token efficiency.
- **Guarded Execution**: Integrated quality checks (via Biome) and Git-aware diffing for sensitive native glue code.

---

## ✨ Key Features

### 🔍 Intelligent Detection & Analysis
- **FFI Pattern Scanner**: Automatically identifies the FFI backend in use across Python, Node.js, Rust, Go, Java, and C#.
- **Auto-Documentation**: Links the agent directly to the most relevant native documentation based on detected patterns.

### 🛠️ Developer Power Tools
- **`ffi_check_health`**: A diagnostic suite that verifies if the required compilers, headers, and libraries are present on the host system.
- **`ffi_generate_wrapper`**: Generates production-ready FFI boilerplate and wrapper templates.
- **`ffi_compare_backends`**: Provides architectural advice on choosing the right FFI library for your specific constraints.

### 📊 Session Intelligence
- **Live TUI Dashboard**: An interactive terminal overlay showing real-time token usage, tool efficiency, and "Session Health."
- **Smart Model Selector**: Recommends or switches LLM models based on the complexity of the FFI task and the current error rate.

### 🌿 Rigorous Workflow
- **FFI Git Integration**: Specialized tools to track changes in `.h` and `.cpp` files relative to their high-level wrappers.
- **Integrated Quality Guard**: Native Biome integration for linting and formatting FFI glue code to prevent common syntax errors.

---

## 🏗️ Architecture

The extension follows a **TypeScript Orchestrator** pattern, ensuring it remains lightweight and portable while maintaining deep system access.

- **Orchestration**: Built on the `pi-mono` API using a Dependency Injection (DI) Service Container.
- **Primitives**: Exposes a set of `pi-mono-primitives` that can be reused by other extension developers to build consistent UI/UX.
- **Extensibility**: Designed for a future **Rust-Native Toolchain**, allowing critical paths (like project scanning) to be offloaded to high-performance binaries.

---

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (Runtime & Package Manager)
- A `pi` coding agent environment compatible with `pi-mono` extensions.

### Installation

```bash
pi install git:github.com/naranyala/pi-ext-companion-for-system-ffi
```

### Usage
Once loaded, the extension remains silent until it detects FFI patterns in your project. You can also manually trigger tools via the agent:
- `/ffi-detect` $\rightarrow$ Scan project for FFI patterns.
- `/show_dashboard` $\rightarrow$ Open the session analytics TUI.
- `/run_check` $\rightarrow$ Perform a project-wide quality audit.

---

## 🤝 Contributing

We welcome contributions! Whether you're adding a new FFI pattern, improving the TUI, or helping us build the Rust-native toolchain:

1. **Check the `TODOS.md`**: See the current roadmap and high-priority tasks.
2. **Run Tests**: Ensure your changes don't break the core services:
   ```bash
   bun test
   ```
3. **Submit a PR**: We value clean code and thorough documentation.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
