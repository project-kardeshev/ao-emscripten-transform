.PHONY: wasm test clean realclean

# Default target
wasm: src/process.wasm

# Build the Go WASM binary with TinyGo for AO compatibility  
src/process.wasm: main_simple_tinygo.go | src
	export PATH="/usr/local/tinygo/bin:$$PATH" && \
	tinygo build -o src/process.wasm \
		-target wasm-unknown \
		-opt 2 \
		-no-debug \
		-ldflags="-extldflags '--export-table'" \
		main_simple_tinygo.go

src:
	mkdir -p src

# Test target that matches the parent project structure
test: wasm
	cd ../test && node --experimental-wasm-memory64 fixtures/test.ts ../ao-go-process/src/process.wasm wasm32-unknown-emscripten3 hello

# Alternative test that uses the Go binary directly
test-go: wasm
	@echo "Testing Go WASM binary..."
	@echo "Note: This requires adapting the test for Go WASM specifics"

clean:
	rm -f src/process.wasm

realclean: clean
	rm -rf src

# Development helpers
build-debug: main_tinygo.go | src
	export PATH="/usr/local/tinygo/bin:$$PATH" && \
	tinygo build -o src/process.wasm \
		-target wasi \
		-opt 0 \
		main_tinygo.go

# Show WASM info
info: src/process.wasm
	wasm-objdump -h src/process.wasm
	@echo "Size: $$(wc -c < src/process.wasm) bytes"

# Validate WASM
validate: src/process.wasm
	wasm-validate src/process.wasm
