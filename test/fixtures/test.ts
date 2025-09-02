#!/usr/bin/env node --experimental-wasm-memory64

import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { before, describe, it, skip } from 'node:test'
import type { TestContext } from 'node:test'

import { default as AoLoader } from '@permaweb/ao-loader'

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STUB_PROCESS_ID = 'process-id-'.padEnd(43, '1');
export const STUB_ADDRESS = 'arweave-address-'.padEnd(43, '1');
export const STUB_ETH_ADDRESS = '0xFCAd0B19bB29D4674531d6f115237E16AfCE377c';
export const STUB_ANT_REGISTRY_ID = 'ant-registry-'.padEnd(43, '1');
/* ao READ-ONLY Env Variables */
export const AO_LOADER_HANDLER_ENV = {
  Process: {
    Id: STUB_ADDRESS,
    Owner: STUB_ADDRESS,
    Tags: [
      { name: 'Authority', value: 'XXXXXX' },
      { name: 'ANT-Registry-Id', value: STUB_ANT_REGISTRY_ID },
    ],
  },
  Module: {
    Id: ''.padEnd(43, '1'),
    Tags: [{ name: 'Authority', value: 'YYYYYY' }],
  },
};

export const AO_LOADER_OPTIONS = {
  format: 'wasm32-unknown-emscripten3',
  inputEncoding: 'JSON-1',
  outputEncoding: 'JSON-1',
  memoryLimit: '1073741824', // 1 GiB in bytes
  computeLimit: (9e12).toString(),
  extensions: [],
};

// Removed unused BUNDLED_AOS_ANT_LUA export

export const DEFAULT_ANT_STATE = JSON.stringify({
  balances: { [STUB_ADDRESS]: 1 },
  controllers: [STUB_ADDRESS],
  name: 'ANT-ARDRIVE',
  owner: STUB_ADDRESS,
  records: {
    '@': {
      transactionId: 'UyC5P5qKPZaltMmmZAWdakhlDXsBF6qmyrbWYFchRTk',
      ttlSeconds: 900,
    },
  },
  ticker: 'ANT',
  description: "ANT's description",
  keywords: ['KEYWORD-1', 'KEYWORD-2', 'KEYWORD-3'],
});

export const DEFAULT_HANDLE_OPTIONS = {
  Id: ''.padEnd(43, '1'),
  ['Block-Height']: '1',
  // important to set the address so that that `Authority` check passes. Else the `isTrusted` with throw an error.
  Owner: STUB_ADDRESS,
  Module: 'ANT',
  Target: STUB_ADDRESS,
  From: STUB_ADDRESS,
  Timestamp: Date.now(),
  // for msg.reply
  Reference: '1',
};

// Get WASM file from command line argument or default to AssemblyScript version
const wasmFilePath = process.argv[2] ? 
  path.resolve(process.argv[2]) : 
  path.join(__dirname, '../src/process.wasm');

export const WASM_MODULE = fs.readFileSync(wasmFilePath);


export async function createHandleFunction(wasmModule = WASM_MODULE) {
  const handle = await AoLoader(wasmModule, AO_LOADER_OPTIONS);

  return {
    handle,
    memory: null,
  };
}

export function createHandleWrapper(
  ogHandle,
  startMem,
  defaultHandleOptions = DEFAULT_HANDLE_OPTIONS,
  aoLoaderHandlerEnv = AO_LOADER_HANDLER_ENV,
) {
  return async function (options = {}, mem = startMem) {
    return ogHandle(
      mem,
      {
        ...defaultHandleOptions,
        ...options,
      },
      aoLoaderHandlerEnv,
    );
  };
}



describe('process', async () => {

    const { handle: ogHandle, memory: startMem } = await createHandleFunction();
    const handle = createHandleWrapper(ogHandle, null);
  
  it('should output hello world', async () => {

    const result = await handle({
      Tags: [{ name: 'Action', value: 'Hello' }],
    }, startMem);

    console.dir(result, {depth: null});
    
    assert(result.Output === 'Hello, world!');
  });
});