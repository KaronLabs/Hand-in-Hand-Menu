import {spawnSync} from 'node:child_process';
const scopes=[['src/core/**','100','tests/unit/*.test.mjs'],['src/render/**','90','tests/render/*.test.mjs'],['src/client/menu-ui.mjs','90','tests/dom/*.test.mjs']];
for(const [include,floor,tests] of scopes){
 const args=['--test','--experimental-test-coverage',`--test-coverage-include=${include}`,`--test-coverage-lines=${floor}`,`--test-coverage-functions=${floor}`];
 if(floor==='100')args.push('--test-coverage-branches=100');
 args.push(tests);
 const result=spawnSync(process.execPath,args,{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
