import {readFile,mkdir,writeFile,cp,mkdtemp,rm,rename,lstat,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import {resolve,dirname,join,relative,isAbsolute,sep,basename} from 'node:path';
import {validateMenu} from '../src/core/menu.mjs';import {renderMenuPage} from '../src/render/menu-page.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const within=(child,parent)=>{const path=relative(parent,child);return path!=='..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);};
function checkOutput(target,project){
 if(within(project,target) || (within(target,project) && target!==join(project,'dist')))throw new Error('unsafe_output_directory');
}
export async function buildSite({menuPath,outDir}){
 const menu=JSON.parse(await readFile(menuPath,'utf8'));const issues=validateMenu(menu);
 if(issues.length)throw new Error(issues.map(i=>i.code).join(', '));
 const target=resolve(outDir);
 checkOutput(target,root);
 await mkdir(dirname(target),{recursive:true});
 const physicalTarget=join(await realpath(dirname(target)),basename(target));
 checkOutput(physicalTarget,await realpath(root));
 if(within(await realpath(menuPath),physicalTarget))throw new Error('unsafe_output_directory');
 const existing=await lstat(target).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
 if(existing && !existing.isDirectory())throw new Error('unsafe_output_directory');
 const staging=await mkdtemp(join(dirname(target),'.hih-build-'));
 try{
  await mkdir(join(staging,'assets'),{recursive:true});await writeFile(join(staging,'index.html'),renderMenuPage(menu));
  await cp(join(root,'assets'),join(staging,'assets'),{recursive:true});
  await cp(join(root,'src/styles/menu.css'),join(staging,'assets/menu.css'));
  await mkdir(join(staging,'assets/core'),{recursive:true});await cp(join(root,'src/core/menu.mjs'),join(staging,'assets/core/menu.mjs'));
  await cp(join(root,'src/client'),join(staging,'assets/client'),{recursive:true});
  const backup=existing?await mkdtemp(join(dirname(target),'.hih-previous-')):null;
  let previousMoved=false,published=false;
  try{
   if(backup){await rename(target,join(backup,'previous'));previousMoved=true;}
   try{await rename(staging,target);published=true;}
   catch(error){
    if(previousMoved){await rename(join(backup,'previous'),target);previousMoved=false;}
    throw error;
   }
  }finally{
   // Keep the backup recoverable if restoring it also fails.
   if(backup && (!previousMoved || published))await rm(backup,{recursive:true,force:true});
  }
 }finally{await rm(staging,{recursive:true,force:true});}
 return {itemCount:menu.items.length};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(await buildSite({menuPath:join(root,'data/menu.json'),outDir:join(root,'dist')}));
