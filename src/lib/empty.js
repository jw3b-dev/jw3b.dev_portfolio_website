// Empty stub for Node-only modules (onnxruntime-node, sharp) that @huggingface/transformers lists
// as deps but only uses under Node. In the browser build it runs on onnxruntime-web (WASM/WebGPU),
// so Vite aliases those native packages here to keep them out of the client bundle. Never imported
// at runtime in the browser — transformers.js gates them behind an environment check.
export default {}
