import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {buildSite} from '../../scripts/build.mjs';
test('build emits readable menu and every referenced local image',async()=>{const outDir=await mkdtemp(join(tmpdir(),'hih-build-'));try{const result=await buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir});assert.equal(result.itemCount,70);const html=await readFile(join(outDir,'index.html'),'utf8');assert.match(html,/카쵸 에 페페/);for(const src of ['112400','112413','112435','112440','112445','112449'])await access(join(outDir,'assets/source-menu',`${src}.png`));await access(join(outDir,'assets/menu-illustration.webp'));}finally{await rm(outDir,{recursive:true,force:true});}});
test('invalid data cannot produce a deployable menu',async()=>{const outDir=await mkdtemp(join(tmpdir(),'hih-invalid-'));try{const input=join(outDir,'invalid.json');await writeFile(input,'{}');await assert.rejects(buildSite({menuPath:input,outDir:join(outDir,'dist')}),/invalid_menu/);}finally{await rm(outDir,{recursive:true,force:true});}});
test('rebuilding replaces stale files absent from reviewed source',async()=>{const outDir=await mkdtemp(join(tmpdir(),'hih-stale-'));try{await writeFile(join(outDir,'responsive-qa.html'),'internal QA');await buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir});await assert.rejects(access(join(outDir,'responsive-qa.html')),{code:'ENOENT'});}finally{await rm(outDir,{recursive:true,force:true});}});
test('invalid rebuild leaves last valid output intact',async()=>{const outDir=await mkdtemp(join(tmpdir(),'hih-last-good-'));try{await writeFile(join(outDir,'index.html'),'last valid menu');const input=join(outDir,'invalid.json');await writeFile(input,'{}');await assert.rejects(buildSite({menuPath:input,outDir}),/invalid_menu/);assert.equal(await readFile(join(outDir,'index.html'),'utf8'),'last valid menu');}finally{await rm(outDir,{recursive:true,force:true});}});

// The build may replace deployable output, never the source tree or an existing file.
import {mkdir,symlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
const projectRoot=fileURLToPath(new URL('../../',import.meta.url));
for(const parent of ['src','data','assets'])test(`output beneath ${parent} cannot delete source files`,async()=>{
 const outDir=await mkdtemp(join(projectRoot,parent,'.review-probe-'));
 try{await writeFile(join(outDir,'sentinel'),'keep source');await assert.rejects(buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir}),/unsafe_output_directory/);assert.equal(await readFile(join(outDir,'sentinel'),'utf8'),'keep source');}finally{await rm(outDir,{recursive:true,force:true});}
});
test('existing output file cannot be silently deleted',async()=>{const temp=await mkdtemp(join(tmpdir(),'hih-file-'));try{const outDir=join(temp,'important.txt');await writeFile(outDir,'keep file');await assert.rejects(buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir}),/unsafe_output_directory/);assert.equal(await readFile(outDir,'utf8'),'keep file');}finally{await rm(temp,{recursive:true,force:true});}});
test('symlinked parent cannot bypass source-directory protection',async()=>{const temp=await mkdtemp(join(tmpdir(),'hih-alias-'));const probe=await mkdtemp(join(projectRoot,'src','.review-alias-'));try{await symlink(projectRoot,join(temp,'project'),'dir');const outDir=join(temp,'project','src',probe.split('/').at(-1));await writeFile(join(probe,'sentinel'),'keep source');await assert.rejects(buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir}),/unsafe_output_directory/);assert.equal(await readFile(join(probe,'sentinel'),'utf8'),'keep source');}finally{await rm(temp,{recursive:true,force:true});await rm(probe,{recursive:true,force:true});}});
test('publish rename failure restores the last valid output',async(t)=>{const outDir=await mkdtemp(join(tmpdir(),'hih-rollback-'));const realRename=fs.rename;try{await writeFile(join(outDir,'index.html'),'last valid menu');t.mock.method(fs,'rename',async(from,to)=>{if(from.split('/').at(-1).startsWith('.hih-build-'))throw Object.assign(new Error('simulated publish rename failure'),{code:'EIO'});return realRename(from,to);});syncBuiltinESMExports();await assert.rejects(buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir}),/simulated publish rename failure/);assert.equal(await readFile(join(outDir,'index.html'),'utf8').catch(()=>null),'last valid menu');}finally{t.mock.restoreAll();syncBuiltinESMExports();await rm(outDir,{recursive:true,force:true});}});
test('output cannot erase the input menu stored inside it',async()=>{const outDir=await mkdtemp(join(tmpdir(),'hih-input-'));try{const menuPath=join(outDir,'menu.json');await writeFile(menuPath,await readFile(new URL('../../data/menu.json',import.meta.url)));await assert.rejects(buildSite({menuPath,outDir}),/unsafe_output_directory/);assert.equal(JSON.parse(await readFile(menuPath,'utf8')).items.length,70);}finally{await rm(outDir,{recursive:true,force:true});}});

// Keep archive builds sequential with source-path probes in this file.
import {cp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {verifyReleaseArchive} from '../../scripts/verify-release.mjs';
async function releaseFixture(change){
 const temp=await mkdtemp(join(tmpdir(),'hih-archive-'));
 try{
  const dist=join(temp,'dist');
  await buildSite({menuPath:new URL('../../data/menu.json',import.meta.url),outDir:dist});
  await mkdir(join(dist,'.openai'));
  await cp(new URL('../../.openai/hosting.json',import.meta.url),join(dist,'.openai/hosting.json'));
  await change?.(dist);
  const archivePath=join(temp,'release.tar.gz');
  execFileSync('tar',['-C',temp,'-czf',archivePath,'dist']);
  return {archivePath,cleanup:()=>rm(temp,{recursive:true,force:true})};
 }catch(error){await rm(temp,{recursive:true,force:true});throw error;}
}
test('clean archive matches reviewed source and hosting identity',async()=>{const f=await releaseFixture();try{assert.deepEqual(verifyReleaseArchive(f.archivePath),{fileCount:15,sourceMatches:true});}finally{await f.cleanup();}});
test('internal QA HTML blocks publication even when a local build passed',async()=>{const f=await releaseFixture(dist=>writeFile(join(dist,'responsive-qa.html'),'internal checks'));try{assert.throws(()=>verifyReleaseArchive(f.archivePath),/unexpected_release_file/);}finally{await f.cleanup();}});
test('stale compiled client bytes cannot pass release verification',async()=>{const f=await releaseFixture(async dist=>{const p=join(dist,'assets/client/menu-ui.mjs');await writeFile(p,(await readFile(p,'utf8'))+'\n// stale build\n');});try{assert.throws(()=>verifyReleaseArchive(f.archivePath),/release_source_mismatch/);}finally{await f.cleanup();}});
test('a different site identity cannot pass release verification',async()=>{const f=await releaseFixture(async dist=>{const p=join(dist,'.openai/hosting.json');const c=JSON.parse(await readFile(p,'utf8'));c.project_id='another-site';await writeFile(p,JSON.stringify(c));});try{assert.throws(()=>verifyReleaseArchive(f.archivePath),/release_manifest_mismatch/);}finally{await f.cleanup();}});
test('missing client module blocks an otherwise readable menu release',async()=>{const f=await releaseFixture(dist=>rm(join(dist,'assets/client/menu-ui.mjs')));try{assert.throws(()=>verifyReleaseArchive(f.archivePath),/missing_release_file/);}finally{await f.cleanup();}});
