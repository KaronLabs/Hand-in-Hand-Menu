import {readFile,mkdir,writeFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import {resolve,dirname,join} from 'node:path';
import {validateMenu} from '../src/core/menu.mjs';import {renderMenuPage} from '../src/render/menu-page.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export async function buildSite({menuPath,outDir}){
 const menu=JSON.parse(await readFile(menuPath,'utf8'));const issues=validateMenu(menu);
 if(issues.length)throw new Error(issues.map(i=>i.code).join(', '));
 await mkdir(join(outDir,'assets'),{recursive:true});await writeFile(join(outDir,'index.html'),renderMenuPage(menu));
 await cp(join(root,'assets'),join(outDir,'assets'),{recursive:true});
 await cp(join(root,'src/styles/menu.css'),join(outDir,'assets/menu.css'));
 await mkdir(join(outDir,'assets/core'),{recursive:true});await cp(join(root,'src/core/menu.mjs'),join(outDir,'assets/core/menu.mjs'));
 return {itemCount:menu.items.length};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(await buildSite({menuPath:join(root,'data/menu.json'),outDir:join(root,'dist')}));
