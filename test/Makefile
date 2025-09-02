
.PHONY: wasm test clean realclean

wasm: src/process.wasm
src/process.wasm: asconfig.json fixtures/process.ts ../dist/index.js | npm-deps
	npx asc --config asconfig.json

.PHONY: npm-deps
npm-deps: node_modules/assemblyscript
node_modules/assemblyscript:
	pnpm install

../dist/index.js:
	cd .. && pnpm run build

test: wasm fixtures/test.js
	node --experimental-wasm-memory64 fixtures/test.js src/process.wasm wasm32-unknown-emscripten3 hello

fixtures/test.js: fixtures/test.ts
	npx tsc fixtures/test.ts --target ES2020 --module Node16 --moduleResolution node16 --allowImportingTsExtensions false --skipLibCheck

clean:
	rm -f src/process.wasm fixtures/test.js

realclean: clean
	rm -fr node_modules
