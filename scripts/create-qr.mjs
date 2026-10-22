import QRCode from 'qrcode';import {mkdir,writeFile} from 'node:fs/promises';import {join} from 'node:path';import {fileURLToPath} from 'node:url';
import {validateMenuUrl} from '../src/core/menu-url.mjs';
export async function createQrFiles({url,canonicalUrl,outDir}){
  const target=validateMenuUrl(url,canonicalUrl);
  await mkdir(outDir,{recursive:true});
  const options={errorCorrectionLevel:'M',margin:4,color:{dark:'#000000',light:'#ffffff'}};
  const pngPath=join(outDir,'hand-in-hand-table-qr.png');
  const svgPath=join(outDir,'hand-in-hand-table-qr.svg');
  await QRCode.toFile(pngPath,target,{...options,width:1024,type:'png'});
  await writeFile(svgPath,await QRCode.toString(target,{...options,type:'svg'}));
  return {pngPath,svgPath};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(await createQrFiles({url:process.argv[2],canonicalUrl:process.argv[2],outDir:process.argv[3]}));
