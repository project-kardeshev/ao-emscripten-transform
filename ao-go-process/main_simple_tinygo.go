package main

import (
	"encoding/json"
	"unsafe"
)

// AOResponse represents the expected AO response format
type AOResponse struct {
	Ok       bool        `json:"ok"`
	Response interface{} `json:"response"`
}

// ProcessResponse represents the inner response structure  
type ProcessResponse struct {
	Output      string        `json:"Output"`
	Error       string        `json:"Error"`
	Messages    []interface{} `json:"Messages"`
	Spawns      []interface{} `json:"Spawns"`
	Assignments []interface{} `json:"Assignments"`
	GasUsed     int           `json:"GasUsed"`
}

// Global buffer for result storage
var resultBuffer []byte

// Global heap pointer for our simple allocator
var heapPtr uint32 = 65536 // Start after initial memory

// handleAO processes an AO message and returns the response
func handleAO(msgJson, envJson string) string {
	// Parse the message JSON to extract action
	var msg map[string]interface{}
	if err := json.Unmarshal([]byte(msgJson), &msg); err != nil {
		return createErrorResponse("Invalid message JSON")
	}
	
	// Extract action from tags
	action := "Default"
	if tags, ok := msg["Tags"].([]interface{}); ok {
		for _, tag := range tags {
			if tagMap, ok := tag.(map[string]interface{}); ok {
				if name, ok := tagMap["name"].(string); ok && name == "Action" {
					if value, ok := tagMap["value"].(string); ok {
						action = value
						break
					}
				}
			}
		}
	}
	
	// Create response based on action
	var output string
	switch action {
	case "Hello":
		output = "Hello, world!"
	default:
		output = "Unknown action"  
	}
	
	// Create the response structure matching AssemblyScript exactly
	response := ProcessResponse{
		Output:      output,
		Error:       "",
		Messages:    []interface{}{},
		Spawns:      []interface{}{},
		Assignments: []interface{}{},
		GasUsed:     0,
	}
	
	// Wrap in AO format exactly like AssemblyScript
	wrapper := AOResponse{
		Ok:       true,
		Response: response,
	}
	
	jsonBytes, err := json.Marshal(wrapper)
	if err != nil {
		return createErrorResponse("Failed to marshal response")
	}
	
	return string(jsonBytes)
}

func createErrorResponse(errMsg string) string {
	response := AOResponse{
		Ok: false,
		Response: map[string]interface{}{
			"Error": errMsg,
		},
	}
	
	jsonBytes, _ := json.Marshal(response)
	return string(jsonBytes)
}

// handle is the main export function that AO loader calls
//export handle
func handle(msgJsonPtr, msgJsonLen, envJsonPtr, envJsonLen uint32) uint32 {
	// Read input strings from WASM memory
	msgJson := readStringFromMemory(msgJsonPtr, msgJsonLen)
	envJson := readStringFromMemory(envJsonPtr, envJsonLen)
	
	// Process the AO message
	result := handleAO(msgJson, envJson)
	
	// Convert result to bytes and store in global buffer
	resultBuffer = []byte(result)
	
	// Return pointer to the result buffer
	return uint32(uintptr(unsafe.Pointer(&resultBuffer[0])))
}

// getResultLength returns the length of the last result
//export getResultLength
func getResultLength() uint32 {
	return uint32(len(resultBuffer))
}

// Memory management functions
func readStringFromMemory(ptr, length uint32) string {
	if ptr == 0 || length == 0 {
		return ""
	}
	
	// Convert WASM pointer to Go slice  
	bytes := (*[1 << 20]byte)(unsafe.Pointer(uintptr(ptr)))[:length:length]
	return string(bytes)
}

//export _emscripten_stack_init
func _emscripten_stack_init() {
	// Stack initialization - no-op for our simple implementation
}

//export emscripten_stack_init
func emscripten_stack_init() {
	// Alternative name - no-op
}

//export stackSave
func stackSave() uint32 {
	// Return current "stack pointer" (simplified)
	return 65536
}

//export stackRestore
func stackRestore(ptr uint32) {
	// Stack restore - no-op in simplified implementation
}

//export stackAlloc
func stackAlloc(size uint32) uint32 {
	// Simple stack allocation - return a dummy pointer
	return 65536 + size
}

//export _emscripten_stack_get_end
func _emscripten_stack_get_end() uint32 {
	// Return the end of the stack
	return 131072 // 128KB from start
}

//export emscripten_stack_get_end
func emscripten_stack_get_end() uint32 {
	return _emscripten_stack_get_end()
}

//export malloc
func malloc(size uint32) uint32 {
	// Simple bump allocator
	if size == 0 {
		return 0
	}
	// Align to 8 bytes
	aligned := (size + 7) &^ 7
	ptr := heapPtr
	heapPtr += aligned
	return ptr
}

//export free
func free(ptr uint32) {
	// No-op for our simple allocator (matches AssemblyScript approach)
}

// Note: __wasm_call_ctors is provided by TinyGo automatically

//export abort
func abort() {
	// Abort function
	panic("abort called")
}

//export main
func main() {
	// TinyGo requires a main function - exported for AO compatibility
}
