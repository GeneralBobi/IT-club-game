import { chromium } from '@playwright/test';
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const source=resolve(root,'scripts/poster/english-v5');
const output=resolve(root,'output/social/english-v5');
await mkdir(output,{recursive:true});
const rocket=await readFile(join(output,'art/rocket-flame.svg'),'utf8');
const defs=rocket.match(/<defs>[\s\S]*?<\/defs>/)[0];
const group=rocket.match(/<g id="Layer_25">([\s\S]*?)<\/g>/)[1];
const parts=group.match(/<(?:path|circle|ellipse)\b[^>]*\/>/g);
for(const [file,shapes] of [['rocket-flame-layer.svg',parts.slice(0,4)],['rocket-body-layer.svg',parts.slice(4)]]){
 await writeFile(join(output,'art',file),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.68 263.86">${defs}<g>${shapes.join('')}</g></svg>`);
}
for(const file of ['poster.html','styles.css','CLAUDE_CODE_PROMPT.md','README_MOTION.md']) await copyFile(join(source,file),join(output,file));
const browser=await chromium.launch({headless:true});
const report={};
for(const scale of [1,2]){
 const page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:scale});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(join(output,'poster.html')).href);
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 const images=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),loaded:i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight})));
 if(images.some(i=>!i.loaded)) throw new Error('Missing image '+JSON.stringify(images.filter(i=>!i.loaded)));
 const suffix=scale===1?'1080x1350':'2160x2700';
 await page.screenshot({path:join(output,`EMUCON-Game-Banner-EN-${suffix}.png`)});
 if(scale===1) await page.screenshot({path:join(output,`EMUCON-Game-Banner-EN-${suffix}.jpg`),type:'jpeg',quality:96});
 const layers=await page.locator('#poster [id]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();const c=getComputedStyle(el);return{id:el.id,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},transform:c.transform,transformOrigin:c.transformOrigin,position:{left:c.left,top:c.top},zIndex:c.zIndex};}));
 report[suffix]={errors,images,text:await page.locator('#poster').innerText(),layers};
 if(scale===1) await writeFile(join(output,'animation-layers.json'),JSON.stringify({canvas:{width:1080,height:1350},staticByDefault:true,notes:['Bounds use browser visual axis-aligned rectangles. CSS preserves original transforms and intended overlap.','Institutional note paper is rotated 4 degrees; nested official marks counter-rotate -4 degrees, so signatures remain horizontal.','Rocket body and flame contain untouched paths split from Drive rocket-flame.svg: first four paths are the flame; remaining source paths are body.','Institutional marks must stay stationary and unchanged during animation.','Game banner contains authentic static website preview renders; preserve banner, captions and screenshots together.','Club watermark stays at opacity 0.055. Booth hours and whale are intentionally omitted in this revision.'],layers},null,2));
 await page.close();
}
await browser.close();
await writeFile(join(output,'render-report.json'),JSON.stringify(report,null,2));
console.log('Rendered English poster at native 1x and 2x.');
