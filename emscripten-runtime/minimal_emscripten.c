#include <emscripten.h>
#include <stdlib.h>
#include <stdio.h>

// Core emscripten functions that we want to extract for AssemblyScript
// We'll focus on malloc/free first, then extract stack functions from the runtime

EMSCRIPTEN_KEEPALIVE
void* emsc_malloc(size_t size) {
    return malloc(size);
}

EMSCRIPTEN_KEEPALIVE  
void emsc_free(void* ptr) {
    free(ptr);
}

EMSCRIPTEN_KEEPALIVE
void emsc_abort() {
    abort();
}

// Simple test function to verify the build works
EMSCRIPTEN_KEEPALIVE
int emsc_test() {
    return 42;
}

// Main function to satisfy emscripten build requirements
int main() {
    return 0;
}
