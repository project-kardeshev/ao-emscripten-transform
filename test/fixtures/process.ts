
import { JSON } from "assemblyscript-json/assembly"

export function handle (msgJson: string, envJson: string) : ArrayBuffer {
  // Create the minimal AO result object
  const result = new JSON.Obj()
  result.set("Output", "Hello, world!")
  result.set("Error", "")
  
  // Create empty arrays as simple objects to reduce complexity  
  const emptyMessages = new JSON.Arr()
  const emptySpawns = new JSON.Arr()
  const emptyAssignments = new JSON.Arr()
  
  result.set("Messages", emptyMessages)
  result.set("Spawns", emptySpawns)
  result.set("Assignments", emptyAssignments)
  result.set("GasUsed", 0)
  
  // Create the wrapper format like the Lua example: {ok: true, response: {...}}
  const wrapper = new JSON.Obj()
  wrapper.set("ok", true)
  wrapper.set("response", result)
  
  const jsonStr = wrapper.stringify()
  
  // Convert to ArrayBuffer using AssemblyScript's String.UTF8.encode
  return String.UTF8.encode(jsonStr)
}
