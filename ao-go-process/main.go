//go:build js && wasm

package main

import (
	"encoding/json"
	"syscall/js"
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

// handle is the main export function that AO loader calls
// We export this to match the AssemblyScript signature: handle(msgJson: string, envJson: string): ArrayBuffer
func handle(this js.Value, args []js.Value) interface{} {
	if len(args) < 2 {
		errorResp := createErrorResponse("Invalid number of arguments")
		return stringToArrayBuffer(errorResp)
	}
	
	msgJson := args[0].String()
	envJson := args[1].String()
	
	result := handleAO(msgJson, envJson)
	
	// Convert to ArrayBuffer exactly like AssemblyScript String.UTF8.encode
	return stringToArrayBuffer(result)
}

// Convert string to ArrayBuffer for AO compatibility
func stringToArrayBuffer(s string) js.Value {
	bytes := []byte(s)
	uint8Array := js.Global().Get("Uint8Array").New(len(bytes))
	js.CopyBytesToJS(uint8Array, bytes)
	return uint8Array.Get("buffer")
}

func main() {
	// Export the handle function globally so AO loader can find it
	js.Global().Set("handle", js.FuncOf(handle))
	
	// Export memory object for compatibility
	// Note: Go WASM manages its own memory differently than AssemblyScript
	js.Global().Set("memory", js.Global().Get("WebAssembly").Get("Memory"))
	
	// Keep the program running
	select {}
}
