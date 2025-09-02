// Bridge between AO loader and Go WASM module
// This file provides the interface the AO loader expects

class GoWasmBridge {
    constructor(wasmModule, goInstance) {
        this.wasmModule = wasmModule;
        this.goInstance = goInstance;
        this.memory = wasmModule.exports.memory;
        this.textEncoder = new TextEncoder();
        this.textDecoder = new TextDecoder();
    }

    // Allocate memory in WASM
    malloc(size) {
        // Go WASM manages its own memory, so we'll use a simple approach
        // In a real implementation, we'd coordinate with Go's memory manager
        return this.goInstance.exports.malloc ? this.goInstance.exports.malloc(size) : 0;
    }

    // Write string to WASM memory
    writeString(str) {
        const bytes = this.textEncoder.encode(str);
        const ptr = this.malloc(bytes.length);
        if (ptr) {
            const memory = new Uint8Array(this.memory.buffer);
            memory.set(bytes, ptr);
        }
        return { ptr, len: bytes.length };
    }

    // Read string from WASM memory  
    readString(ptr, len) {
        const memory = new Uint8Array(this.memory.buffer);
        const bytes = memory.slice(ptr, ptr + len);
        return this.textDecoder.decode(bytes);
    }

    // The handle function that AO loader expects
    handle(msgJson, envJson) {
        // Call the Go function through the global handle function
        if (globalThis.handle) {
            return globalThis.handle(msgJson, envJson);
        }
        
        // Fallback error response
        const errorResponse = JSON.stringify({
            ok: false,
            response: { Error: "Go handle function not available" }
        });
        
        const bytes = this.textEncoder.encode(errorResponse);
        const buffer = new ArrayBuffer(bytes.length);
        new Uint8Array(buffer).set(bytes);
        return buffer;
    }
}

// Export for use with AO loader
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GoWasmBridge };
} else if (typeof globalThis !== 'undefined') {
    globalThis.GoWasmBridge = GoWasmBridge;
}
