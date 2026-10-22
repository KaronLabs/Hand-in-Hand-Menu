import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,join,posix,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {renderMenuPage} from '../src/render/menu-page.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mappings=[
 ['assets/menu.css','src/styles/menu.css'],
 ['assets/core/menu.mjs','src/core/menu.mjs'],
 ['assets/client/boot.mjs','src/client/boot.mjs'],
 ['assets/client/menu-ui.mjs','src/client/menu-ui.mjs'],
 ...['favicon.svg','menu-illustration.webp','food-menu-redesign.webp',
     ...['112400','112413','112435','112440','112445','112449'].map(p=>`source-menu/${p}.png`)]
  .map(p=>[`assets/${p}`,`assets/${p}`]),
];
export function verifyReleaseArchive(archivePath){
 const tar=args=>execFileSync('tar',args,{maxBuffer:16*1024*1024});
 const menu=JSON.parse(readFileSync(join(root,'data/menu.json'),'utf8'));
 const expected=new Map([['dist/index.html',Buffer.from(renderMenuPage(menu))],
  ...mappings.map(([output,source])=>[`dist/${output}`,readFileSync(join(root,source))])]);
 const manifestPath='dist/.openai/hosting.json';
 const names=new Set([...expected.keys(),manifestPath]);
 const directories=new Set();
 for(const name of names){let parent=posix.dirname(name);while(parent!=='.'){directories.add(`${parent}/`);parent=posix.dirname(parent);}}
 const entries=tar(['-tzf',archivePath]).toString('utf8').split(/\r?\n/).filter(Boolean);
 const seen=new Set();
 for(const entry of entries){
  if(directories.has(entry))continue;
  if(!names.has(entry)||seen.has(entry))throw new Error(`unexpected_release_file: ${entry}`);
  seen.add(entry);
 }
 if(seen.size!==names.size)throw new Error('missing_release_file');
 for(const [name,bytes] of expected){
  if(!tar(['-xOf',archivePath,name]).equals(bytes))throw new Error(`release_source_mismatch: ${name}`);
 }
 const manifest=JSON.parse(tar(['-xOf',archivePath,manifestPath]).toString('utf8'));
 const sourceManifest=JSON.parse(readFileSync(join(root,'.openai/hosting.json'),'utf8'));
 if(!isDeepStrictEqual(manifest,sourceManifest))throw new Error('release_manifest_mismatch');
 return {fileCount:seen.size,sourceMatches:true};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(verifyReleaseArchive(process.argv[2]));
