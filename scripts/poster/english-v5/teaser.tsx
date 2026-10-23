import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GamePreview } from '../../../src/ui/StandHome';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// Render the actual website preview components and styles, without loading the
// application, authenticating, or touching player data. This is a static teaser.
const out=resolve('output/social/english-v5');
const art=join(out,'art');
await mkdir(join(art,'event'),{recursive:true});
for(const name of ['star-1.svg','star-2.svg','planet-1.svg'])
 await copyFile(resolve('public/event',name),join(art,'event',name));
const css=(await Promise.all(['stand.css','festival.css','poster-motion.css'].map(f=>readFile(resolve('src/ui',f),'utf8')))).join('\n');
const browser=await chromium.launch({headless:true});
const records=[];
for(const id of ['zero-point','target-rush','perfect-align'] as const){
 const markup=renderToStaticMarkup(<GamePreview id={id}/>).replaceAll('/event/','event/');
 const html=`<!doctype html><meta charset="utf-8"><style>${css}
 @font-face{font-family:BigShoulders;src:url('big-shoulders-black.ttf');font-weight:900}
 *{box-sizing:border-box}html,body{margin:0!important;padding:0!important;width:400px;height:210px;overflow:hidden}
 .game-preview{width:400px!important;height:210px!important;min-height:210px!important;border-radius:0!important;margin:0!important}
 .game-preview>strong:not(.preview-question){font-family:BigShoulders!important;font-size:70px!important}
 *,*::before,*::after{animation:none!important;transition:none!important}
 </style><main class="stand-root layout-festival">${markup}</main>`;
 await writeFile(join(art,`teaser-${id}-source.html`),html);
 const page=await browser.newPage({viewport:{width:400,height:210},deviceScaleFactor:2});
 await page.goto(pathToFileURL(join(art,`teaser-${id}-source.html`)).href);
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:join(art,`teaser-${id}.png`)});
 records.push({game:id,component:'src/ui/StandHome.tsx#GamePreview',styles:['src/ui/stand.css','src/ui/festival.css','src/ui/poster-motion.css'],render:'400x210 at 2x',file:`teaser-${id}.png`,staticPreview:true});
 await page.close();
}
await browser.close();
await writeFile(join(art,'WEBSITE-TEASER-SOURCE.json'),JSON.stringify(records,null,2));
console.log('Rendered three authentic website GamePreview components.');
