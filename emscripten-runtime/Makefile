.PHONY: build clean install-emscripten

# Build the emscripten runtime functions
build: emscripten_functions.wasm

emscripten_functions.wasm: minimal_emscripten.c
	emcc minimal_emscripten.c -o emscripten_functions.wasm \
		-s STANDALONE_WASM=1 \
		-s EXPORTED_FUNCTIONS='["_emsc_malloc","_emsc_free","_emsc_abort","_emsc_test","_main"]' \
		-s EXPORTED_RUNTIME_METHODS='["stackSave","stackRestore","stackAlloc"]' \
		-s TOTAL_STACK=65536 \
		-s INITIAL_MEMORY=1048576 \
		-s ALLOW_MEMORY_GROWTH=0 \
		-O2

# Alternative build for debugging
build-debug: minimal_emscripten.c
	emcc minimal_emscripten.c -o emscripten_functions_debug.wasm \
		-s STANDALONE_WASM=1 \
		-s NO_EXIT_RUNTIME=1 \
		-s EXPORTED_FUNCTIONS='["_emsc_malloc","_emsc_free","_emsc_abort","_emsc_stack_save","_emsc_stack_restore","_emsc_stack_alloc","_emsc_stack_init","_emsc_stack_get_end","_emsc_wasm_call_ctors","_main"]' \
		-s EXPORTED_RUNTIME_METHODS='["stackSave","stackRestore","stackAlloc"]' \
		-g4 \
		--no-entry

# Check if emscripten is installed
check-emscripten:
	@which emcc > /dev/null || (echo "Emscripten not found. Install with: brew install emscripten" && exit 1)
	@echo "Emscripten found: $$(which emcc)"
	@emcc --version

# Install emscripten on macOS
install-emscripten:
	brew install emscripten

# Show WASM info
info: emscripten_functions.wasm
	wasm-objdump -h emscripten_functions.wasm
	@echo "Size: $$(wc -c < emscripten_functions.wasm) bytes"

# Validate WASM
validate: emscripten_functions.wasm
	wasm-validate emscripten_functions.wasm

clean:
	rm -f *.wasm *.js *.html

.DEFAULT_GOAL := build
