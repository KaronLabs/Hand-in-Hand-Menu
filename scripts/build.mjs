import {readFile,mkdir,writeFile,cp,mkdtemp,rm,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import {resolve,dirname,join} from 'node:path';
import {validateMenu} from '../src/core/menu.mjs';import {renderMenuPage} from '../src/render/menu-page.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function buildSite({menuPath,outDir}){
 const menu=JSON.parse(await readFile(menuPath,'utf8'));const issues=validateMenu(menu);
 if(issues.length)throw new Error(issues.map(i=>i.code).join(', '));
 const target=resolve(outDir);
 if(target===root || root.startsWith(target+'/'))throw new Error('unsafe_output_directory');
 await mkdir(dirname(target),{recursive:true});
 const staging=await mkdtemp(join(dirname(target),'.hih-build-'));
 try{
  await mkdir(join(staging,'assets'),{recursive:true});await writeFile(join(staging,'index.html'),renderMenuPage(menu));
  await cp(join(root,'assets'),join(staging,'assets'),{recursive:true});
  await cp(join(root,'src/styles/menu.css'),join(staging,'assets/menu.css'));
  await mkdir(join(staging,'assets/core'),{recursive:true});await cp(join(root,'src/core/menu.mjs'),join(staging,'assets/core/menu.mjs'));
  await cp(join(root,'src/client'),join(staging,'assets/client'),{recursive:true});
  await rm(target,{recursive:true,force:true});
  await rename(staging,target);
 }finally{await rm(staging,{recursive:true,force:true});}
 return {itemCount:menu.items.length};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(await buildSite({menuPath:join(root,'data/menu.json'),outDir:join(root,'dist')}));
