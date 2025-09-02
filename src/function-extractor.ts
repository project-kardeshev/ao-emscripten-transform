import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import binaryen from 'assemblyscript/lib/binaryen.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface ExtractedFunction {
  name: string
  type: any
  body: any
  locals: any[]
  params: any[]
  returnType: any
}

export class EmscriptenFunctionExtractor {
  private emscriptenModule: any = null
  private extractedFunctions: Map<string, ExtractedFunction> = new Map()

  constructor() {
    this.loadEmscriptenModule()
  }

  private loadEmscriptenModule(): void {
    try {
      const wasmPath = path.join(__dirname, '../emscripten-runtime/emscripten_functions.wasm')
      const wasmBytes = fs.readFileSync(wasmPath)
      
      // Parse the WASM module using binaryen
      this.emscriptenModule = binaryen.readBinary(wasmBytes)
      
      console.log('Loaded emscripten module, extracting functions...')
      this.extractFunctions()
    } catch (error) {
      console.warn('Could not load emscripten functions, falling back to stubs:', error instanceof Error ? error.message : String(error))
    }
  }

  private extractFunctions(): void {
    if (!this.emscriptenModule) return

    console.log('Available functions in emscripten module:')
    
    // Debug: List all available functions
    try {
      const numFunctions = this.emscriptenModule.getNumFunctions()
      console.log(`Total functions: ${numFunctions}`)
      
      for (let i = 0; i < numFunctions; i++) {
        const funcName = this.emscriptenModule.getFunctionName(i)
        console.log(`  Function ${i}: ${funcName}`)
      }
    } catch (e) {
      console.log('Could not enumerate functions, trying direct access')
    }

    // Try to extract functions by name
    const functionsToExtract = [
      { wasmName: 'emsc_malloc', targetName: 'malloc' },
      { wasmName: 'emsc_free', targetName: 'free' },
      { wasmName: 'emsc_abort', targetName: 'abort' },
      { wasmName: '_emscripten_stack_alloc', targetName: 'stackAlloc' },
      { wasmName: '_emscripten_stack_restore', targetName: 'stackRestore' },
      { wasmName: 'emscripten_stack_get_current', targetName: 'stackSave' }
    ]

    for (const { wasmName, targetName } of functionsToExtract) {
      try {
        const func = this.emscriptenModule.getFunction(wasmName)
        if (func) {
          this.extractedFunctions.set(targetName, {
            name: targetName,
            type: func.type,
            body: func.body,
            locals: func.vars || [],
            params: func.params || [],
            returnType: func.returnType
          })
          console.log(`Extracted real ${targetName} function from ${wasmName}`)
        } else {
          console.log(`Function ${wasmName} not found for ${targetName}`)
        }
      } catch (e) {
        console.log(`Error extracting ${wasmName}:`, e instanceof Error ? e.message : String(e))
      }
    }

    console.log(`Successfully extracted ${this.extractedFunctions.size} real emscripten functions`)
  }

  public hasFunction(name: string): boolean {
    return this.extractedFunctions.has(name)
  }

  public getFunction(name: string): ExtractedFunction | null {
    return this.extractedFunctions.get(name) || null
  }

  public getAllFunctions(): Map<string, ExtractedFunction> {
    return this.extractedFunctions
  }

  public cleanup(): void {
    if (this.emscriptenModule) {
      this.emscriptenModule.dispose()
      this.emscriptenModule = null
    }
  }
}
