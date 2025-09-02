import binaryen from 'assemblyscript/lib/binaryen.js'
const { createType, i32, none } = binaryen

import { Transform } from 'assemblyscript/transform'
import { EmscriptenFunctionExtractor } from './function-extractor.js'

export default class EmscriptenImportResolver extends Transform {
  private functionExtractor: EmscriptenFunctionExtractor

  constructor() {
    super()
    this.functionExtractor = new EmscriptenFunctionExtractor()
  }

  afterCompile(module: any): void {
    // Remove problematic imports and replace with real emscripten implementations
    this.resolveImports(module)
    
    // Add emscripten-compatible exports
    this.addEmscriptenExports(module)
    
    // Clean up resources
    this.functionExtractor.cleanup()
  }
  
  resolveImports(module: any): void {
    // Try to remove the env.abort import that's causing issues
    try {
      module.removeImport('env', 'abort')
    } catch (e) {
      // Import might not exist, that's ok
    }
    
    // Add real emscripten functions or fallback to stubs
    this.addRealOrStubFunction(module, 'abort', none, none, [])
    this.addRealOrStubFunction(module, 'malloc', createType([i32]), i32, [i32])
    this.addRealOrStubFunction(module, 'free', createType([i32]), none, [])
    
    // Add globals that emscripten functions might need
    if (!this.functionExtractor.hasFunction('malloc')) {
      // Only add stub malloc pointer if we don't have real malloc
      module.addGlobal('__malloc_ptr', i32, true, module.i32.const(65536))
    }
  }

  private addRealOrStubFunction(module: any, name: string, paramTypes: any, returnType: any, locals: any[]): void {
    const realFunc = this.functionExtractor.getFunction(name)
    
    if (realFunc && realFunc.body) {
      console.log(`Using real emscripten ${name} function`)
      
      // Add the real emscripten function implementation
      module.addFunction(
        name,
        paramTypes,
        returnType,
        locals,
        realFunc.body
      )
    } else {
      console.log(`Falling back to stub ${name} function`)
      
      // Fallback to stub implementations
      if (name === 'abort') {
        module.addFunction(name, paramTypes, returnType, locals, module.unreachable())
      } else if (name === 'malloc') {
        // Simple malloc: just increment a global pointer
        module.addFunction(name, paramTypes, returnType, locals,
          module.block(null, [
            module.local.set(0,
              module.i32.add(
                module.global.get('__malloc_ptr', i32),
                module.local.get(0, i32)
              )
            ),
            module.global.set('__malloc_ptr', module.local.get(0, i32)),
            module.local.get(0, i32)
          ], i32)
        )
      } else if (name === 'free') {
        module.addFunction(name, paramTypes, returnType, locals, module.nop())
      }
    }
  }

  private addStackFunction(module: any, name: string, paramTypes: any, returnType: any, locals: any[]): void {
    const realFunc = this.functionExtractor.getFunction(name)
    
    if (realFunc && realFunc.body) {
      console.log(`Using real emscripten ${name} function`)
      
      // Add the real emscripten stack function implementation
      module.addFunction(name, paramTypes, returnType, locals, realFunc.body)
    } else {
      console.log(`Falling back to stub ${name} function`)
      
      // Fallback to AssemblyScript-compatible stub implementations
      if (name === 'stackSave') {
        module.addFunction(name, paramTypes, returnType, locals,
          module.global.get('~lib/memory/__stack_pointer', i32)
        )
      } else if (name === 'stackRestore') {
        module.addFunction(name, paramTypes, returnType, locals,
          module.global.set('~lib/memory/__stack_pointer', module.local.get(0, i32))
        )
      } else if (name === 'stackAlloc') {
        module.addFunction(name, paramTypes, returnType, locals,
          module.block(null, [
            module.local.set(1,
              module.i32.and(
                module.i32.sub(
                  module.global.get('~lib/memory/__stack_pointer', i32),
                  module.local.get(0, i32)
                ),
                module.i32.const(-16) // 16-byte align
              )
            ),
            module.global.set('~lib/memory/__stack_pointer', module.local.get(1, i32)),
            module.local.get(1, i32)
          ], i32)
        )
      }
    }
    
    // Export the function
    module.addFunctionExport(name, name)
  }
  
  addEmscriptenExports(module: any): void {
    // Export memory
    module.addMemoryExport('0', 'memory')
    
    // Export main function
    module.addFunction(
      'main',
      none,
      i32,
      [],
      module.i32.const(0)
    )
    module.addFunctionExport('main', 'main')
    
    // Export table
    module.addTableExport('0', '__indirect_function_table')
    
    // Export runtime functions
    module.addFunctionExport('abort', 'abort')
    module.addFunctionExport('malloc', 'malloc')
    module.addFunctionExport('free', 'free')
    
    // Stack management functions - use real emscripten implementations if available
    this.addStackFunction(module, 'stackSave', none, i32, [])
    this.addStackFunction(module, 'stackRestore', createType([i32]), none, [])
    this.addStackFunction(module, 'stackAlloc', createType([i32]), i32, [i32])
    
    // Other emscripten exports
    module.addFunction(
      '__wasm_call_ctors',
      none,
      none,
      [],
      module.nop()
    )
    module.addFunctionExport('__wasm_call_ctors', '__wasm_call_ctors')
    
    module.addFunction(
      'emscripten_stack_init',
      none,
      none,
      [],
      module.nop()
    )
    module.addFunctionExport('emscripten_stack_init', 'emscripten_stack_init')
    
    module.addFunction(
      'emscripten_stack_get_end',
      none,
      i32,
      [],
      module.global.get('~lib/memory/__heap_base', i32)
    )
    module.addFunctionExport('emscripten_stack_get_end', 'emscripten_stack_get_end')
  }
}
