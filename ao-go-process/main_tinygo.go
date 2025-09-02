//go:build tinygo

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

// Global variables for memory management
var (
	heapPtr uint32 = 65536 // Start heap after initial pages
	resultBuffer []byte
)

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
	
	// Create response based on action - exactly matching AssemblyScript
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

// WASM export functions for AO loader compatibility
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

// Note: TinyGo provides its own malloc/free, so we don't need to export our own

//export abort
func abort() {
	// Abort handler
	panic("abort called")
}

// Stack management exports (simplified implementations)
//export stackSave
func stackSave() uint32 {
	return heapPtr
}

//export stackRestore
func stackRestore(ptr uint32) {
	// In a real implementation, this would restore the stack
	// For now, we'll keep it simple
}

//export stackAlloc
func stackAlloc(size uint32) uint32 {
	aligned := (size + 15) &^ 15 // 16-byte align for stack
	ptr := heapPtr
	heapPtr += aligned
	return ptr
}

// Note: TinyGo provides emscripten compatibility functions automatically

//export main
func main() {
	// TinyGo main function - no-op for WASM module
}

// Required for TinyGo WASM compilation
func init() {
	// Initialization code
}
