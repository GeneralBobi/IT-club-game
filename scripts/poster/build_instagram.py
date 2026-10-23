"""Native 4:5 Instagram adaptation of the approved EMUCON source artwork.

Composed from original event vectors, actual font outlines and original identity
files. No screenshot enlargement, regenerated identity, or fabricated event data.
The image exports use the standard sRGB profile for social sharing.
"""
from pathlib import Path
import io, json, math, hashlib
import numpy as np
import cv2
import fitz
from PIL import Image, ImageCms
import poster_tools as p

ROOT = p.ROOT
OUT = ROOT / 'output/social'
OUT.mkdir(parents=True, exist_ok=True)
W, H = 584, 730
INK = (18/255, 26/255, 44/255)
PAPER = (240/255, 237/255, 230/255)
CORAL = (200/255, 90/255, 83/255)
# Reuse the source-vector path interpreter while keeping native RGB colors.
p.cmyk = lambda rgb: tuple(rgb)
SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()

def box(pg, x, y, w, h, color):
    pg.draw_rect(fitz.Rect(x,y,x+w,y+h), color=None, fill=color)

def rule(pg, x, y, xx, yy, width=1.6):
    pg.draw_line((x,y),(xx,yy),color=INK,width=width)

def lettering(pg, s, x, y, size, color=INK, name='big-shoulders-black.ttf', angle=-3, tracking=0):
    gs, cm, upm = p.font(name)
    cursor = 0
    sh = pg.new_shape()
    a = math.radians(angle)
    for ch in s:
        glyph = gs[cm[ord(ch)]]
        glyph.draw(p.Pen(gs,sh,x+cursor*math.cos(a),y+cursor*math.sin(a),size/upm,angle))
        cursor += glyph.width*size/upm+tracking
    sh.finish(fill=color,color=None,even_odd=False)
    sh.commit()
    return cursor

def source_svg(pg, file, x,y,w,h=None,angle=0,opacity=1):
    # The shared helper accepts millimeters and writes native paths.
    return p.svg(pg,file,x/p.MM,y/p.MM,w/p.MM,h/p.MM if h else None,angle,opacity)

def source_image(pg,file,x,y,w,h):
    pg.insert_image(fitz.Rect(x,y,x+w,y+h),filename=str(file))

# Trace the source year paper shape once; no replacement badge geometry.
stamp_image = np.array(Image.open(ROOT/'public/event/year-stamp.png').convert('RGBA'))
stamp_parts=[]
for mask,color in [
    (stamp_image[:,:,3]>128,'#f0ede6'),
    ((stamp_image[:,:,0].astype(int)-stamp_image[:,:,1].astype(int)>35)&(stamp_image[:,:,3]>128),'#c85a53'),
]:
    contours,_=cv2.findContours(np.uint8(mask)*255,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE)
    paths=[]
    for contour in contours:
        if abs(cv2.contourArea(contour))<6: continue
        pts=cv2.approxPolyDP(contour,.4,True)[:,0,:]
        paths.append('M'+' L'.join(f'{q[0]},{q[1]}' for q in pts)+' Z')
    stamp_parts.append(f'<path fill="{color}" fill-rule="evenodd" d="'+ ' '.join(paths)+'"/>')
stamp = p.TMP/'instagram-year-source.svg'
stamp.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 412 198">'+''.join(stamp_parts)+'</svg>')

# Background material is sampled at final master resolution, with quiet grain
# and halftone concentrated at the outer edges, leaving type clean.
scale=2160/W
pw,ph=2160,round(660*scale)
base=np.zeros((ph,pw,3),dtype=np.float32)
base[:]=(222,158,54)
for name,amount,edge,tile_width in [
    ('riso-grain.png',.19,False,190),
    ('halftone-dots.png',.62,True,160),
]:
    tile=Image.open(ROOT/'public/event'/name).convert('RGBA')
    target_w=round(tile_width*scale)
    tile=tile.resize((target_w,round(target_w*tile.height/tile.width)),Image.Resampling.LANCZOS)
    flat=Image.new('RGBA',tile.size,'white');flat.alpha_composite(tile)
    arr=np.array(flat.convert('RGB'),dtype=np.float32)/255
    pattern=np.tile(arr,(math.ceil(ph/tile.height),math.ceil(pw/tile.width),1))[:ph,:pw]
    alpha=amount
    if edge:
        xx=np.linspace(0,1,pw)
        alpha=(amount*np.clip((np.abs(xx-.5)-.29)/.21,0,1))[None,:,None]
    base*=1-(1-pattern)*alpha
bg=Image.fromarray(np.uint8(np.clip(base,0,255)))
buffer=io.BytesIO();bg.save(buffer,format='PNG')

doc=fitz.open();pg=doc.new_page(width=W,height=H)
box(pg,0,0,W,H,PAPER)
pg.insert_image(fitz.Rect(0,0,W,660),stream=buffer.getvalue())
source_svg(pg,ROOT/'public/brand/itclub-circuit-watermark.svg',213,147,470,470,opacity=.095)

# A hierarchy authored for the phone feed, preserving the source poster voice.
lettering(pg,'EMUCON',34+3,175+3,178,CORAL,tracking=-6.5)
lettering(pg,'EMUCON',34,175,178,INK,tracking=-6.5)
source_svg(pg,stamp,35,188,190,91.31,angle=-3)
lettering(pg,'2026',50,268,86,PAPER,tracking=-1.6)
lettering(pg,'IT CLUB',34,316,30,INK,'bricolage-extrabold.ttf',tracking=3.1)
rule(pg,32,334,550,307,1.8)
lettering(pg,'OYUNA GEL.',34+2.6,414+2.6,86,CORAL,tracking=-2.5)
lettering(pg,'OYUNA GEL.',34,414,86,INK,tracking=-2.5)
lettering(pg,'Bir oyun seç, bir tur dene.',34,456,24,INK,'bricolage-600.ttf')

source_svg(pg,ROOT/'public/event/planet-1.svg',-88,520,760,155)
source_svg(pg,ROOT/'public/event/rocket-flame.svg',465,472,58,127.87,angle=23)
source_svg(pg,ROOT/'public/event/star-1.svg',421,447,12,12)
source_svg(pg,ROOT/'public/event/star-2.svg',542,497,9,9)
source_svg(pg,ROOT/'public/event/star-1.svg',430,562,7,7)

# A quiet opaque date band avoids crater lines interfering with the event data.
box(pg,29,608,526,38,CORAL)
rule(pg,29,608,555,608,1.5);rule(pg,29,646,555,646,1.5)
date='24 EKİM · DAÜ STADYUMU'
gs,cm,upm=p.font('bricolage-extrabold.ttf')
date_size=17;tracking=1.6
date_width=sum(gs[cm[ord(ch)]].width for ch in date)*date_size/upm+(len(date)-1)*tracking
lettering(pg,date,(W-date_width)/2,633,date_size,INK,'bricolage-extrabold.ttf',angle=0,tracking=tracking)

# The complete official Turkish identities are used once, without recoloring,
# redrawing or combining their independent clear spaces.
box(pg,0,660,W,70,PAPER)
center=695
club_w=45;dau_w=170;directorate_w=173;rpg_w=45;gap=17
dau=fitz.open(ROOT/'assets/print/dau-primary-tr.pdf')
dau_h=dau_w*dau[0].rect.height/dau[0].rect.width
directorate_h=directorate_w*841/3000
club_h=club_w*696/733
total=club_w+dau_w+directorate_w+rpg_w+3*gap
x=(W-total)/2
source_image(pg,ROOT/'public/brand/itclub-original.png',x,center-club_h/2,club_w,club_h)
x+=club_w+gap
pg.show_pdf_page(fitz.Rect(x,center-dau_h/2,x+dau_w,center+dau_h/2),dau,0)
x+=dau_w+gap
source_image(pg,ROOT/'assets/print/ogesim-tr-original.png',x,center-directorate_h/2,directorate_w,directorate_h)
x+=directorate_w+gap
source_image(pg,ROOT/'assets/print/emu-rpg-original.png',x,center-rpg_w/2,rpg_w,rpg_w)

prefix='EMUCON-Oyuna-Gel-Instagram'
doc.set_metadata({'title':'EMUCON 2026 — OYUNA GEL — Instagram','author':'EMU IT Club','subject':'Native source artwork; Turkish institutional signatures; sRGB social exports'})
native=OUT/f'{prefix}-kaynak.pdf'
doc.save(native,garbage=4,deflate=True)
# Render independently at both requested sizes, never enlarge the small export.
files=[]
for width,height in [(1080,1350),(2160,2700)]:
    pix=pg.get_pixmap(matrix=fitz.Matrix(width/W,height/H),colorspace=fitz.csRGB,alpha=False)
    im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    assert im.size==(width,height)
    path=OUT/f'{prefix}-{width}x{height}.png'
    im.save(path,icc_profile=SRGB,optimize=True)
    files.append(path)
    if width==1080:
        jpg=path.with_suffix('.jpg')
        im.save(jpg,quality=97,subsampling=0,icc_profile=SRGB,optimize=True)
        files.append(jpg)

sources=[ROOT/'public/fonts/big-shoulders-black.ttf',ROOT/'public/fonts/bricolage-extrabold.ttf',ROOT/'public/fonts/bricolage-600.ttf',ROOT/'public/event/year-stamp.png',ROOT/'public/event/rocket-flame.svg',ROOT/'public/event/planet-1.svg',ROOT/'public/brand/itclub-circuit-watermark.svg',ROOT/'public/brand/itclub-original.png',ROOT/'assets/print/dau-primary-tr.pdf',ROOT/'assets/print/ogesim-tr-original.png',ROOT/'assets/print/emu-rpg-original.png']
report={'format':'Instagram portrait 4:5','color_profile':'sRGB IEC61966-2.1','language':'tr','artboard':[W,H],'exports':[{'file':f.name,'dimensions':list(Image.open(f).size)} for f in files],'source_pdf':native.name,'font_resources':len(pg.get_fonts()),'identity':'Original full club, DAU Turkish lockup, new OGESIM Turkish signature, EMU RPG. One occurrence each; no modifications.','composition':'Direct amber poster adaptation with native typography, clear top/side margins, tighter event hierarchy, source rocket/planet, quiet source grain, prominent date band, one compact institutional footer.','sources':[{'path':str(f.relative_to(ROOT)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sources]}
(OUT/f'{prefix}-kaynaklar.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))
