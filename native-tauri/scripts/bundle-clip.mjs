import { copyFile, mkdir } from 'node:fs/promises';
import { loadClip, MODEL_ID, MODEL_REVISION } from '../src/clip-model.js';

// Ensure all files come from the same revision used by the CPU calibration.
const clip = await loadClip('cpu');
await clip.dispose();
const cache = new URL(`../node_modules/@huggingface/transformers/.cache/${MODEL_ID}/${MODEL_REVISION}/`, import.meta.url);
const bundle = new URL(`../public/models/${MODEL_ID}/`, import.meta.url);
await mkdir(new URL('onnx/', bundle), { recursive: true });
for (const file of ['config.json', 'preprocessor_config.json', 'tokenizer.json', 'tokenizer_config.json',
  'onnx/text_model_quantized.onnx', 'onnx/vision_model_quantized.onnx']) {
  await copyFile(new URL(file, cache), new URL(file, bundle));
}
console.log(`Prepared local CLIP assets for ${MODEL_ID}@${MODEL_REVISION}`);
