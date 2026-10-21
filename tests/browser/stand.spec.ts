import { test,expect } from "@playwright/test";
test.use({channel:"chrome"});
for(const design of ["lobby","festival","classic"]){
 test(`${design}: seven games, original complete identities, selectable persistent language and deep links`,async({page})=>{
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
test("Zero Point accepts the first running keypress and saves three rounds once",async({page})=>{
 await page.goto("/lobby/zero-point");await page.clock.install();await page.getByRole("button",{name:"Başla",exact:true}).click();
 for(let round=0;round<3;round++){await page.clock.runFor(1050);await expect(page.locator(".big-stop")).toBeEnabled();await page.keyboard.press("Space");if(round<2)await page.getByRole("button",{name:"Sonraki tur",exact:true}).click();}
 await expect(page.getByRole("heading",{name:"GÜZEL TURDU.",exact:true})).toBeVisible();await expect(page.getByRole("status")).toContainText("Skorun kaydedildi");
});
test("Perfect Align responds to keyboard when the stop button itself has focus",async({page})=>{
 await page.goto("/festival/perfect-align");await page.clock.install();await page.getByRole("button",{name:"Başla",exact:true}).click();
 for(let attempt=0;attempt<3;attempt++){await page.clock.runFor(1600);await page.locator(".big-stop").focus();await page.keyboard.down("Space");await expect(page.locator(".big-stop")).toHaveCount(0);await page.keyboard.up("Space");if(attempt<2)await page.getByRole("button",{name:"Sonraki deneme",exact:true}).click();}
 await expect(page.getByRole("heading",{name:"GÜZEL TURDU.",exact:true})).toBeVisible();
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
