import { build } from 'esbuild';
const root=new URL('../',import.meta.url).pathname;
await build({absWorkingDir:root,entryPoints:['shared/report-schema.ts'],outfile:'reporting/public/schema.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
