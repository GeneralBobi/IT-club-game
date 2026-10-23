import { chromium } from '@playwright/test';
import { mkdir, writeFile, access, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = dirname(fileURLToPath(import.meta.url));
const root = resolve(source, '../../..');
// A distributed export contains its poster and both local resource directories.
// The repository source also has poster.html, but its art/assets live in output.
const standalone = (await Promise.all(['poster.html', 'art', 'assets'].map(async name => {
  try { await access(join(source, name)); return true; } catch { return false; }
}))).every(Boolean);
const output = standalone ? source : resolve(root, 'output/social/english-v6');
const proofDir = join(output, 'motion-proof');
const args = new Set(process.argv.slice(2));
if (!args.has('--proof') && !args.has('--render')) {
  console.log(`Usage: node ${standalone ? 'render-motion.mjs' : 'scripts/poster/english-v6/render-motion.mjs'} --proof | --render [--sharing-copy]`);
  process.exit(0);
}
const ffmpeg = process.env.FFMPEG_PATH || join(process.env.LOCALAPPDATA, 'Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe');
const ffprobe = join(dirname(ffmpeg), 'ffprobe.exe');
const poster = join(output, 'poster.html');
for (const path of [poster, join(output, 'styles.css'), join(source, 'motion.js')]) {
  try { await access(path); } catch { throw new Error(`Source not ready: ${path}. Run the static v6 render first.`); }
}
await mkdir(proofDir, { recursive: true });
if (source !== output) await copyFile(join(source, 'motion.js'), join(output, 'motion.js'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(pathToFileURL(poster).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Array.from(document.images).every(img => img.complete));
  const missing = await page.locator('img').evaluateAll(images => images.filter(img => !img.naturalWidth).map(img => img.getAttribute('src')));
  if (missing.length) throw new Error(`Missing poster images: ${missing.join(', ')}`);
  const required = ['poster','rocket','rocket-body','rocket-flame','whale','headline-come','headline-play','paper','institutional-lockup'];
  const absent = await page.evaluate(ids => ids.filter(id => !document.getElementById(id)), required);
  if (absent.length) throw new Error(`Missing motion layer IDs: ${absent.join(', ')}`);
  await page.addScriptTag({ path: join(source, 'motion.js') });
  const staticBefore = await page.screenshot();
  const immutable = ['paper','institutional-lockup','halftone','print-grain','stamp'];
  const inspect = () => page.evaluate(ids => Object.fromEntries(ids.map(id => {
    const el = document.getElementById(id);
    if (!el) return [id, null];
    const css = getComputedStyle(el), r = el.getBoundingClientRect();
    return [id, { transform: css.transform, opacity: css.opacity, x:r.x, y:r.y, width:r.width, height:r.height }];
  })), immutable);
  const protectedBaseline = JSON.stringify(await inspect());
  const checks = {};
  let first;
  for (const seconds of [0, 2.5, 5, 7.5, 10]) {
    await page.evaluate(t => window.renderFrame(t), seconds);
    const frame = await page.screenshot({ path: join(proofDir, `frame-${String(seconds).replace('.', '_').padStart(4,'0')}.png`) });
    checks[seconds] = { sha256: createHash('sha256').update(frame).digest('hex'), protectedLayersUnchanged: JSON.stringify(await inspect()) === protectedBaseline };
    if (seconds === 0) { first = frame; checks[seconds].matchesStaticMaster = staticBefore.equals(frame); }
    if (seconds === 10) checks[seconds].matchesFrameZero = first.equals(frame);
  }
  if (!checks[0].matchesStaticMaster || !checks[10].matchesFrameZero || Object.values(checks).some(c => !c.protectedLayersUnchanged)) throw new Error('Motion proof failed: static master, loop boundary, or protected layers changed.');
  const report = { canvas:{width:2160,height:2700}, fps:30, duration:10, frames:300, audio:false, checks, pageErrors:errors };
  await writeFile(join(proofDir, 'loop-validation.json'), JSON.stringify(report, null, 2));
  console.log(`Keyframe proofs passed: static master preserved; frame 0 = frame 10; protected layers unchanged. ${proofDir}`);
  if (args.has('--render')) {
    await access(ffmpeg);
    const video = join(output, 'EMUCON-Come-Play-EN-2160x2700-10s.mp4');
    const ffargs = ['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-frames:v','300','-movflags','+faststart',video];
    const encoder = spawn(ffmpeg, ffargs, { stdio:['pipe','ignore','pipe'], windowsHide:true });
    let encoderLog = '';
    encoder.stderr.on('data', chunk => { encoderLog += chunk.toString(); });
    const finished = new Promise((resolveDone, rejectDone) => {
      encoder.once('error', rejectDone);
      encoder.once('close', code => code === 0 ? resolveDone() : rejectDone(new Error(`ffmpeg exit ${code}: ${encoderLog}`)));
    });
    // The rejection is also checked after stdin closes; attach immediately to avoid unhandled failures.
    finished.catch(() => {});
    for (let frame = 0; frame < 300; frame++) {
      await page.evaluate(t => window.renderFrame(t), frame / 30);
      const png = await page.screenshot({ type:'png' });
      if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain');
      if (frame % 30 === 0) console.log(`Rendered ${frame}/300 frames`);
    }
    encoder.stdin.end();
    await finished;
    if (args.has('--sharing-copy')) {
      await run(ffmpeg, ['-hide_banner','-loglevel','warning','-y','-i',video,'-vf','scale=1080:1350:flags=lanczos','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',join(output,'EMUCON-Come-Play-EN-1080x1350-10s.mp4')]);
    }
    const metadata = JSON.parse(await run(ffprobe, ['-v','error','-show_streams','-show_format','-of','json',video]));
    const stream = metadata.streams.find(s => s.codec_type === 'video');
    if (stream.codec_name !== 'h264' || stream.width !== 2160 || stream.height !== 2700 || stream.pix_fmt !== 'yuv420p' || stream.r_frame_rate !== '30/1' || Number(stream.nb_frames) !== 300 || Number(metadata.format.duration) !== 10 || metadata.streams.some(s => s.codec_type === 'audio')) throw new Error('Encoded video metadata does not match the requested delivery.');
    await writeFile(join(output,'motion-render-report.json'),JSON.stringify({...report,video,metadata,encoderLog},null,2));
    console.log(`Verified video: ${video}`);
  }
  if (errors.length) throw new Error(`Poster script errors: ${errors.join('; ')}`);
} finally {
  await browser.close();
}

function run(executable, argv) {
  return new Promise((resolveDone,rejectDone) => {
    const child = spawn(executable,argv,{windowsHide:true});
    let stdout='',stderr='';
    child.stdout.on('data',data => stdout+=data.toString());
    child.stderr.on('data',data => stderr+=data.toString());
    child.once('error',rejectDone);
    child.once('close',code => code===0?resolveDone(stdout):rejectDone(new Error(`${executable} exited ${code}: ${stderr}`)));
  });
}
