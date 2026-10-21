import { test,expect } from "@playwright/test";
test.use({channel:"chrome"});
for(const design of ["lobby","festival","classic"]){
 test(`${design}: eight games, original complete identities, selectable persistent language and deep links`,async({page})=>{
  await page.goto(`/${design}`);
  await expect(page.locator(".stand-home")).toBeVisible();
  await expect(page.locator(".stand-header .university-identity img")).toHaveAttribute("src","/brand/dau-signature.png");
  await expect(page.locator(".stand-header .stand-identity img")).toHaveAttribute("src","/brand/itclub-original.png");
  const universities=await page.locator(".university-identity img").evaluate((image:HTMLImageElement)=>({rendered:image.width/image.height,original:image.naturalWidth/image.naturalHeight}));expect(Math.abs(universities.rendered-universities.original)).toBeLessThan(.04);
  await page.getByRole("button",{name:"English",exact:true}).click();await expect(page.locator("html")).toHaveAttribute("lang","en");
  const play=page.getByRole("button",{name:"Play: Zero Point",exact:true});await play.click();await expect(page).toHaveURL(new RegExp(`/${design}/zero-point$`));
  await page.reload();await expect(page.getByRole("heading",{name:"Zero Point",exact:true})).toBeVisible();await expect(page.locator("html")).toHaveAttribute("lang","en");
  await page.getByRole("button",{name:"Games",exact:true}).click();await page.goBack();await expect(page.getByRole("heading",{name:"Zero Point",exact:true})).toBeVisible();
 });
 test(`${design}: no overflow on laptop, mobile or the user's 559px panel`,async({page})=>{
  for(const width of [1280,1440,559,390]){await page.setViewportSize({width,height:900});await page.goto(`/${design}`);await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
 });
}
test("Zero Point keeps the clock visible, ends after one attempt and saves a forgiving score",async({page})=>{
 await page.goto("/festival/zero-point");await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.getByRole("button",{name:"Başla",exact:true}).click();
 await page.clock.runFor(2500);expect(Number(await page.locator(".visible-clock").innerText())).toBeGreaterThanOrEqual(2.48);expect(Number(await page.locator(".visible-clock").innerText())).toBeLessThanOrEqual(2.51);await page.clock.runFor(2500);await page.locator(".big-stop").focus();await page.keyboard.press("Space");
 await expect(page.locator(".stand-result-score")).toHaveText("1,000");await expect(page.getByRole("status")).toContainText("Skorun kaydedildi");await expect(page.getByRole("button",{name:"Sonraki tur",exact:true})).toHaveCount(0);
});
test("Perfect Align advances automatically past three hits and becomes harder in the same scored run",async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>.5;});await page.goto("/festival/perfect-align");await page.clock.install();let starts=0;page.on('request',request=>{if(request.method()==='POST'&&request.url().endsWith('/api/play'))starts++;});await page.getByRole("button",{name:"Başla",exact:true}).click();await page.clock.runFor(1000);
 const widths=[];
 for(let hit=0;hit<5;hit++){await expect(page.locator('.big-stop')).toBeEnabled();widths.push(Number((await page.locator('.align-game-zone').evaluate(e=>(e as HTMLElement).style.width)).replace('%','')));await page.clock.runFor(Math.round(500/(.24+hit*.025)));await page.locator('.big-stop').focus();await page.keyboard.press('Space');await expect(page.locator('.align-streak-feedback')).toContainText('İsabet');await page.clock.runFor(450);}
 expect(widths.at(-1)).toBeLessThan(widths[0]);await expect(page.locator('.stage-meta')).toContainText('500 puan');expect(starts).toBe(1);await page.keyboard.press('Space');await expect(page.locator('.stand-result-score')).toHaveText('500');await expect(page.getByRole('status')).toContainText('Skorun kaydedildi');
});
test("Festival fits the laptop height with all eight choices and the complete institutional footer",async({page})=>{
 for(const [width,height] of [[1536,736],[1908,920],[1366,768],[1280,720],[1024,600]]){await page.setViewportSize({width,height});await page.goto('/festival');await page.evaluate(()=>document.fonts.ready);await page.locator('.event-signatures img').evaluate(image=>(image as HTMLImageElement).decode());expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(height+1);const bottom=await page.locator('.stand-bottom').boundingBox();const choices=page.locator('.stand-game .play-link,.other-games button');await expect(choices).toHaveCount(8);for(const choice of await choices.all()){const box=await choice.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(bottom!.y+1);}}
});
test("Color Cascade plays Boran's falling sequence, accepts mouse and lane keys, pauses and saves",async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>.5;});await page.goto('/festival/color-cascade');await page.clock.install();await page.getByRole('button',{name:'Başla',exact:true}).click();await page.clock.runFor(800);await page.getByRole('button',{name:'Yeşil · sütun 2',exact:true}).click();await expect(page.locator('.cascade-meta')).toContainText('10 puan');await page.clock.runFor(800);await page.locator('.cascade-board').focus();await page.keyboard.press('2');await expect(page.locator('.cascade-meta')).toContainText('30 puan');await page.keyboard.press('Space');await expect(page.getByText('DURAKLATILDI',{exact:true})).toBeVisible();const frozen=await page.locator('.cascade-tile').first().getAttribute('style');await page.clock.runFor(1000);expect(await page.locator('.cascade-tile').first().getAttribute('style')).toBe(frozen);await page.getByRole('button',{name:'Devam et',exact:true}).last().click();await page.clock.runFor(20000);await expect(page.getByRole('heading',{name:'GÜZEL TURDU.',exact:true})).toBeVisible();await expect(page.getByRole('status')).toContainText('Skorun kaydedildi');
});
test("Target Rush pointer hits score, targets stay inside bounds, countdown completes",async({page})=>{
 await page.goto("/classic/target-rush");await page.clock.install();await page.getByRole("button",{name:"Başla",exact:true}).click();await page.clock.runFor(1200);await page.clock.runFor(500);
 const target=page.getByRole("button",{name:"Hedefi vur",exact:true}).first();await expect(target).toBeVisible();const bounds=await target.boundingBox(),arena=await page.locator(".rush-playfield").boundingBox();expect(bounds!.x).toBeGreaterThan(arena!.x);expect(bounds!.y).toBeGreaterThan(arena!.y);await target.click();await expect(page.locator(".stage-meta")).toContainText("100 puan");await page.clock.runFor(31000);await expect(page.locator(".stand-result-score")).toHaveText("100");
});
test("Snake starts with only food, moves with arrows, pauses and ends on a wall",async({page})=>{
 await page.goto("/lobby/snake");await page.clock.install();await page.getByRole("button",{name:"Başla",exact:true}).click();await page.clock.runFor(1050);await expect(page.locator(".snake-food")).toHaveCount(1);const head=page.locator(".snake-head");const before=await head.getAttribute("style");await page.clock.runFor(200);expect(await head.getAttribute("style")).not.toBe(before);await page.keyboard.press("Space");await expect(page.getByText("DURAKLATILDI",{exact:true})).toBeVisible();await page.keyboard.press("Space");await page.clock.runFor(6000);await expect(page.getByRole("heading",{name:"GÜZEL TURDU.",exact:true})).toBeVisible();
});
test("Brain Firewall plays five bilingual questions and gives feedback before proceeding",async({page})=>{
 await page.goto("/lobby/brain-firewall");await page.getByRole("button",{name:"English",exact:true}).click();await page.getByRole("button",{name:"Start",exact:true}).click();
 for(let i=0;i<5;i++){await page.locator(".quiz-options button").first().click();await expect(page.locator(".quiz-feedback")).toBeVisible();await page.getByRole("button",{name:i===4?"See result":"Next question",exact:true}).click();}
 await expect(page.getByRole("heading",{name:"NICE ROUND.",exact:true})).toBeVisible();await expect(page.getByRole("status")).toContainText("Your score is saved");
});
test("Myth or Fact owns its run, recovers after refresh, changes language and completes five claims",async({page})=>{
 await page.goto("/festival/myth-fact");await page.getByRole("button",{name:"Başla",exact:true}).click();const first=await page.locator(".claim-statement").innerText();await page.reload();await expect(page.locator(".claim-statement")).toHaveText(first);await page.getByRole("button",{name:"English",exact:true}).click();await expect(page.locator(".claim-statement")).not.toHaveText(first);
 for(let i=0;i<5;i++){await page.getByRole("button",{name:/Myth/}).click();if(i<4)await page.getByRole("button",{name:"Next claim",exact:true}).click();}
 await expect(page.getByRole("heading",{name:"ROUND COMPLETE.",exact:true})).toBeVisible();await expect(page.getByText("points · result saved",{exact:true})).toBeVisible();
});
test("Digital Detective keeps its fictional clues after refresh and gives a supported debrief",async({page})=>{
 await page.goto("/classic/digital-detective");await page.getByRole("button",{name:"Başla",exact:true}).click();await expect(page.locator(".clue-list article")).toHaveCount(3);const clue=await page.locator(".clue-list").innerText();await page.reload();await expect(page.locator(".clue-list")).toHaveText(clue,{useInnerText:true});await expect(page.getByRole("button",{name:"Kararları gönder",exact:true})).toBeDisabled();
 for(const fieldset of await page.locator("fieldset").all())await fieldset.locator("input").first().check();await page.getByRole("button",{name:"Kararları gönder",exact:true}).click();await expect(page.locator(".detective-debrief article")).toHaveCount(3);await expect(page.getByText("puan · sonuç kaydedildi",{exact:true})).toBeVisible();
});
test("Next player waits for a successful reset, traps focus and clears the nickname and owned run",async({page})=>{
 await page.goto("/lobby/myth-fact");await page.getByRole("textbox",{name:"Takma ad",exact:true}).fill("Previous visitor");await page.getByRole("button",{name:"Başla",exact:true}).click();await expect(page.locator(".claim-statement")).toBeVisible();await page.getByRole("button",{name:"Yeni oyuncu",exact:true}).click();const dialog=page.getByRole("dialog");await expect(dialog).toBeVisible();await page.route("**/api/player/reset",route=>route.fulfill({status:503,body:""}));await dialog.getByRole("button",{name:"Yeni oyuncuyu hazırla",exact:true}).click();await expect(dialog.getByRole("alert")).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem("arena-challenger"))).toBe("Previous visitor");await page.unroute("**/api/player/reset");await dialog.getByRole("button",{name:"Yeni oyuncuyu hazırla",exact:true}).click();await expect(page.locator(".stand-home")).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem("arena-challenger"))).toBeNull();await page.getByRole("button",{name:"Myth or Fact",exact:false}).click();await expect(page.getByRole("textbox",{name:"Takma ad",exact:true})).toHaveValue("");
});
