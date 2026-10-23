"""Source-faithful A3 adaptation of the user's 22 October poster crop.

Artwork is rebuilt from the actual fonts, PSD stamp and event vectors, not
upscaled from a screenshot. Coordinates below refer to the 584 x 748 crop.
The only addition is one quiet institutional signature row below the artwork.
"""
from poster_tools import *
from fontTools.pens.boundsPen import BoundsPen
import hashlib

REF=Path(r'C:/Users/Boran Birtanır/Desktop/Screenshots/Ekran görüntüsü 2026-10-22 135946.png')
ART_W=297
ART_H=375
K=ART_W/584
PT=K*MM
PREFIX='EMUCON-Oyuna-Gel-A3-v2'

def pxtext(pg,s,x,y,size,color=INK,name='big-shoulders-black.ttf',angle=-3,tracking=0):
    gs,cm,upm=font(name);cursor=0;sh=pg.new_shape();a=math.radians(angle)
    for ch in s:
        glyph=gs[cm[ord(ch)]]
        glyph.draw(Pen(gs,sh,5*MM+x*PT+cursor*math.cos(a),y*PT+cursor*math.sin(a),size*PT/upm,angle))
        cursor+=(glyph.width*size/upm+tracking)*PT
    sh.finish(fill=color,color=None,even_odd=False);sh.commit()
    return cursor/PT

def pxsvg(pg,path,x,y,w,h=None,angle=0,opacity=1):
    return svg(pg,path,5+x*K,y*K,w*K,h*K if h else None,angle,opacity)

def pxrect(pg,x,y,w,h,color):rect(pg,5+x*K,y*K,w*K,h*K,color)
def pxline(pg,x,y,xx,yy,width=1.5):line(pg,5+x*K,y*K,5+xx*K,yy*K,INK,width*K)

# The source stamp has its own hand-cut slant. Trace only its two original fills.
a=np.array(Image.open(ROOT/'public/event/year-stamp.png').convert('RGBA'));parts=[]
for mask,color in [(a[:,:,3]>128,'#f0ede6'),((a[:,:,0].astype(int)-a[:,:,1].astype(int)>35)&(a[:,:,3]>128),'#c85a53')]:
    contours,_=cv2.findContours(np.uint8(mask)*255,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE);paths=[]
    for contour in contours:
        if abs(cv2.contourArea(contour))<6:continue
        pts=cv2.approxPolyDP(contour,.4,True)[:,0,:]
        paths.append('M'+' L'.join(f'{p[0]},{p[1]}' for p in pts)+' Z')
    parts.append(f'<path fill="{color}" fill-rule="evenodd" d="'+ ' '.join(paths)+'"/>')
stamp=TMP/'year-stamp-v2-source.svg'
stamp.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 412 198">'+''.join(parts)+'</svg>')

# Texture at 300 dpi with the same visible dot scale as the web poster.
# Only background material is raster; typography and illustrations stay vectors.
W,H=round(307/25.4*300),round(385/25.4*300)
base=np.zeros((H,W,3),dtype=np.float32);base[:]=(222,158,54)
for name,amount,edge,tile_width in [('riso-grain.png',.27,False,190),('halftone-dots.png',.75,True,160)]:
    tile=Image.open(ROOT/'public/event'/name).convert('RGBA')
    target_w=round(tile_width*K/25.4*300)
    tile=tile.resize((target_w,round(target_w*tile.height/tile.width)),Image.Resampling.LANCZOS)
    flat=Image.new('RGBA',tile.size,'white');flat.alpha_composite(tile)
    arr=np.array(flat.convert('RGB'),dtype=np.float32)/255
    pattern=np.tile(arr,(math.ceil(H/tile.height),math.ceil(W/tile.width),1))[:H,:W]
    alpha=amount
    if edge:
        xx=np.linspace(0,1,W)
        alpha=(amount*np.clip((np.abs(xx-.5)-.28)/.22,0,1))[None,:,None]
    base*=1-(1-pattern)*alpha
bg=ImageCms.applyTransform(Image.fromarray(np.uint8(np.clip(base,0,255))),xf)

doc=fitz.open();page=doc.new_page(width=307*MM,height=430*MM)
rect(page,0,0,307,430,PAPER)
pix=fitz.Pixmap(fitz.csCMYK,bg.width,bg.height,bg.tobytes(),False)
page.insert_image(fitz.Rect(0,0,307*MM,385*MM),pixmap=pix)

art=fitz.open();pg=art.new_page(width=307*MM,height=748*PT)
# The motif's SVG has intentional transparent surrounding space, exactly as on web.
pxsvg(pg,ROOT/'public/brand/itclub-circuit-watermark.svg',198,157,520,520,opacity=.1)
pxtext(pg,'EMUCON',33+3,184+3,184,CORAL,tracking=-7.36)
pxtext(pg,'EMUCON',33,184,184,INK,tracking=-7.36)
pxsvg(pg,stamp,33,200,198,95.16,angle=-3)
pxtext(pg,'2026',49,284,90,PAPER,tracking=-1.8)
pxtext(pg,'IT CLUB',31,333,32,INK,'bricolage-extrabold.ttf',tracking=3.2)
pxline(pg,31,350,552,323,1.8)
pxtext(pg,'OYUNA GEL.',32+3,439+3,83,CORAL,tracking=-2.49)
pxtext(pg,'OYUNA GEL.',32,439,83,INK,tracking=-2.49)
pxtext(pg,'Bir oyun seç, bir tur dene.',31,484,25,INK,'bricolage-600.ttf')
# Crop the actual source planet in the same way as CSS object-fit:cover.
pxsvg(pg,ROOT/'public/event/planet-1.svg',-88,576,760,175)
pxsvg(pg,ROOT/'public/event/rocket-flame.svg',468,515,60,132.28,angle=23)
pxsvg(pg,ROOT/'public/event/star-1.svg',420,461,13,13)
pxsvg(pg,ROOT/'public/event/star-2.svg',536,508,11,11)
pxsvg(pg,ROOT/'public/event/star-1.svg',430,625,8,8)
pxrect(pg,27,694,531,39,CORAL)
pxline(pg,27,694,558,694,1.8);pxline(pg,27,733,558,733,1.8)
date='24 EKİM · DAÜ STADYUMU'
gs,cm,upm=font('bricolage-extrabold.ttf')
date_size=15;tracking=1.8
date_width=sum(gs[cm[ord(c)]].width for c in date)*date_size/upm+(len(date)-1)*tracking
pxtext(pg,date,(584-date_width)/2,720,date_size,INK,'bricolage-extrabold.ttf',angle=0,tracking=tracking)
page.show_pdf_page(fitz.Rect(0,5*MM,307*MM,380*MM),art,0,keep_proportion=False)

# One row, one occurrence of each identity; the official DAU lockup is unchanged.
rect(page,0,380,307,50,PAPER)
logo=fitz.open(ROOT/'assets/print/dau-primary-tr.pdf')
lw=33*logo[0].rect.width/logo[0].rect.height
club_width=27;rpg_width=27;ogesim_width=73;gap=8
total=club_width+lw+ogesim_width+rpg_width+gap*3
x=(307-total)/2;center_y=402.5
club_height=club_width*696/733
club_ppi=image(page,ROOT/'public/brand/itclub-original.png',x,center_y-club_height/2,club_width,club_height)
x+=club_width+gap
page.show_pdf_page(fitz.Rect(x*MM,(center_y-16.5)*MM,(x+lw)*MM,(center_y+16.5)*MM),logo,0)
x+=lw+gap
ogesim_height=ogesim_width*841/3000
ogesim_ppi=image(page,ROOT/'assets/print/ogesim-tr-original.png',x,center_y-ogesim_height/2,ogesim_width,ogesim_height)
x+=ogesim_width+gap
rpg_ppi=image(page,ROOT/'assets/print/emu-rpg-original.png',x,center_y-rpg_width/2,rpg_width,rpg_width)

page.set_trimbox(fitz.Rect(5*MM,5*MM,302*MM,425*MM));page.set_bleedbox(page.rect)
doc.set_metadata({'title':'EMUCON 2026 - OYUNA GEL - A3 v2','author':'EMU IT Club','subject':'Direct source-faithful artwork, A3 portrait, 5 mm bleed, CMYK FOGRA39, outlined type'})
raw=TMP/'poster-v2-cmyk.pdf';doc.save(raw,garbage=4,deflate=True)
reader=PdfReader(raw);writer=PdfWriter();writer.clone_document_from_reader(reader)
stream=DecodedStreamObject();stream.set_data(ICC.read_bytes())
stream.update({NameObject('/N'):__import__('pypdf').generic.NumberObject(4)})
intent=DictionaryObject({NameObject('/Type'):NameObject('/OutputIntent'),NameObject('/S'):NameObject('/GTS_PDFX'),NameObject('/OutputConditionIdentifier'):TextStringObject('FOGRA39'),NameObject('/RegistryName'):TextStringObject('http://www.color.org'),NameObject('/DestOutputProfile'):writer._add_object(stream)})
writer._root_object[NameObject('/OutputIntents')]=ArrayObject([writer._add_object(intent)])
final=OUT/f'{PREFIX}-baski.pdf'
with final.open('wb') as f:writer.write(f)
check=fitz.open(final);pg=check[0]
assert not pg.get_fonts(),'Unexpected font resource'
assert min(club_ppi,ogesim_ppi,rpg_ppi)>=300
rgb_streams=[]
for xref in range(1,check.xref_length()):
    if check.xref_is_stream(xref):
        data=check.xref_stream(xref)
        if re.search(rb'(?:^|\s)(?:[\d.]+\s+){3}(?:rg|RG)(?:\s|$)',data):rgb_streams.append(xref)
assert not rgb_streams,'RGB paint operators'
pg.get_pixmap(dpi=150,clip=pg.trimbox,colorspace=fitz.csRGB).save(OUT/f'{PREFIX}-onizleme.png')
# Crop main artwork separately for direct visual comparison, from delivered PDF.
pg.get_pixmap(dpi=150,clip=fitz.Rect(5*MM,5*MM,302*MM,380*MM),colorspace=fitz.csRGB).save(OUT/f'{PREFIX}-ana-gorsel.png')
report={'trim_mm':[297,420],'media_mm':[307,430],'bleed_mm':5,'artwork_trim_mm':[297,375],'quiet_signature_row_mm':45,'artwork_page_percent':round(375/420*100,1),'fonts':len(pg.get_fonts()),'raster_ppi':{'club':round(club_ppi,1),'directorate':round(ogesim_ppi,1),'EMU_RPG':round(rpg_ppi,1),'background':300},'DAU_emblem_mm':33,'DAU_occurrences':1,'RGB_paint_streams':rgb_streams,'colors':'DeviceCMYK, FOGRA39 output intent','source_reference':str(REF),'reference_sha256':hashlib.sha256(REF.read_bytes()).hexdigest(),'adaptation':'584x748 screenshot composition reconstructed in vectors; 1.42% vertical compression for A3 plus one institutional signature row; no top identity band.','source_color_spaces':[x[5] for x in pg.get_images(full=True)],'QR_codes':0}
(OUT/f'{PREFIX}-kontrol.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False));print(final)
