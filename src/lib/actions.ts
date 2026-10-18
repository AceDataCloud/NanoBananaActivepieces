import { createAction, Property } from '@activepieces/pieces-framework';
import { pieceAuth } from './auth';
import { invoke } from './client';
export const generate = createAction({
  name: 'nano_banana_generate_image', displayName: 'Create Nano Banana task', description: 'Create once; then query the same task ID until complete. Each creation may be billable.', auth: pieceAuth,
  props: {
    model: Property.StaticDropdown({ displayName: 'Model', description: 'Nano Banana model. Check current pricing before creation.', required:true, defaultValue:'nano-banana-2-lite', options:{options:[{label:'Nano Banana 2 Lite',value:'nano-banana-2-lite'},{label:'Nano Banana 2',value:'nano-banana-2'},{label:'Nano Banana 2.1',value:'nano-banana-2.1'},{label:'Nano Banana Pro',value:'nano-banana-pro'}]} }),
    prompt: Property.LongText({ displayName:'Image description', description:'Describe the image. Save the returned task ID for lookup.', required:true }),
    count: Property.Number({ displayName:'Image count', description:'1–4 images; each successful image can incur a charge.', required:true, defaultValue:1 }),
    resolution: Property.StaticDropdown({ displayName:'Resolution', description:'Resolution changes cost.', required:true, defaultValue:'1K', options:{options:[{label:'1K',value:'1K'},{label:'2K',value:'2K'},{label:'4K',value:'4K'}]} }),
    aspect_ratio: Property.StaticDropdown({ displayName:'Aspect ratio', description:'Output image shape.', required:true, defaultValue:'1:1', options:{options:[{label:'1:1',value:'1:1'},{label:'16:9',value:'16:9'},{label:'9:16',value:'9:16'}]} }),
  },
  async run(context) { return invoke('nano_banana_generate_image', context.propsValue, context.auth.secret_text); },
});
export const getTask = createAction({
  name: 'nano_banana_task_retrieve', displayName: 'Get Nano Banana task', description: 'Read one existing task ID. Pending previews are not final media.', auth: pieceAuth,
  props: { task_id: Property.ShortText({displayName:'Task ID',description:'Map the task_id from the creation action; do not rerun creation while polling.',required:true}), wait_seconds:Property.Number({displayName:'Wait up to seconds',description:'0 reads once; up to 240 waits for the same task.',required:false,defaultValue:0}) },
  async run(context) { return invoke('nano_banana_task_retrieve',context.propsValue,context.auth.secret_text); },
});
