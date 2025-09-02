# AO Go Process

This directory contains a Go implementation of an AO (Arweave) process that produces a WebAssembly binary compatible with the AO loader.

## Overview

This Go WASM binary provides the same functionality as the AssemblyScript version but written in Go. It demonstrates that AO processes can be built with different languages while maintaining compatibility with the AO ecosystem.

## Key Features

- **AO Compatible**: Exports a `handle` function that matches the expected AO interface
- **Identical Output**: Produces the same JSON response format as the AssemblyScript version
- **Test Compatible**: Passes the same test suite as the AssemblyScript implementation

## Interface

The module exports a `handle` function with the signature:
```javascript
handle(msgJson: string, envJson: string): ArrayBuffer
```

This matches the AssemblyScript interface exactly.

## Response Format

The module returns JSON responses in the AO format:
```json
{
  "ok": true,
  "response": {
    "Output": "Hello, world!",
    "Error": "",
    "Messages": [],
    "Spawns": [],
    "Assignments": [],
    "GasUsed": 0
  }
}
```

## Building

Build the WASM binary:
```bash
make wasm
```

This creates `src/process.wasm` using Go's WebAssembly compilation.

## Testing

Test with the AO loader infrastructure:
```bash
make test
```

This runs the same test suite that validates the AssemblyScript version.

## Implementation Details

### Go WASM Compilation
- Uses `GOOS=js GOARCH=wasm` for WebAssembly target
- Utilizes `syscall/js` for JavaScript interoperability
- Exports the `handle` function globally for AO loader access

### Memory Management
- Go manages its own memory automatically
- Returns ArrayBuffer objects for compatibility with AO loader expectations
- Handles string encoding/decoding between Go and JavaScript

### Message Processing
- Parses incoming JSON messages to extract action tags
- Routes based on the "Action" tag value
- Currently supports "Hello" action, extensible for more actions

## Size Comparison

- **Go WASM**: ~3MB (includes Go runtime)
- **AssemblyScript WASM**: Much smaller (KB range)

The Go version is larger due to the Go runtime being included, but provides access to Go's extensive standard library and ecosystem.

## Future Enhancements

- Add more message handlers beyond "Hello"
- Implement workflow routing and state management
- Add integration with other Go libraries
- Optimize binary size if needed

## Compatibility

This implementation demonstrates that AO processes can be written in Go while maintaining full compatibility with:
- AO loader interface
- Expected response formats
- Existing test infrastructure
- WebAssembly runtime requirements
