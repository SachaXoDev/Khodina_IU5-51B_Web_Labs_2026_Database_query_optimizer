import {
  AutoProcessor, AutoTokenizer, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, env,
} from '@huggingface/transformers';
import { l2normalize } from './clip-ranking.js';

export const MODEL_ID = 'Xenova/clip-vit-base-patch32';
export const MODEL_REVISION = '6b7c523703ae26e39be4b03774966f8571c7f523';
const BATCH_SIZE = 8;
const DIMENSIONS = 512;

export async function loadClip(device, progress_callback) {
  const bundled = device === 'wasm' && import.meta.env?.VITE_BUNDLE_CLIP === '1';
  env.allowLocalModels = bundled;
  env.allowRemoteModels = !bundled;
  if (bundled) env.localModelPath = '/models/';
  const options = { revision: MODEL_REVISION, progress_callback, local_files_only: bundled };
  const modelOptions = { ...options, device, dtype: 'q8' };
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, options);
  const processor = await AutoProcessor.from_pretrained(MODEL_ID, options);
  const text = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, modelOptions);
  let vision;
  try {
    vision = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, modelOptions);
  } catch (error) {
    await text.dispose();
    throw error;
  }

  return {
    async embedText(captions, onBatch) {
      const result = [];
      for (let offset = 0; offset < captions.length; offset += BATCH_SIZE) {
        const batch = captions.slice(offset, offset + BATCH_SIZE);
        const inputs = tokenizer(batch, { padding: true, truncation: true, max_length: 77 });
        const { text_embeds } = await text(inputs);
        try {
          for (let row = 0; row < batch.length; row++) result.push(projectedRow(text_embeds, row));
        } finally {
          text_embeds.dispose();
        }
        onBatch?.(result.length);
      }
      return result;
    },
    async embedImage(blobOrImage) {
      const image = await RawImage.read(blobOrImage);
      const { image_embeds } = await vision(await processor(image));
      try {
        return projectedRow(image_embeds, 0);
      } finally {
        image_embeds.dispose();
      }
    },
    async dispose() {
      await Promise.all([text.dispose(), vision.dispose()]);
    },
  };
}

function projectedRow(tensor, row) {
  if (tensor.dims.length !== 2 || tensor.dims[1] !== DIMENSIONS || tensor.dims[0] <= row) {
    throw new Error(`Unexpected CLIP projection dimensions: ${tensor.dims}.`);
  }
  return l2normalize(tensor.data.subarray(row * DIMENSIONS, (row + 1) * DIMENSIONS));
}
