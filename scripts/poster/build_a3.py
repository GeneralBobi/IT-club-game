from pathlib import Path
import math,io,json,re,xml.etree.ElementTree as ET
import fitz,numpy as np,cv2
from PIL import Image,ImageCms
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from pypdf import PdfReader,PdfWriter
from pypdf.generic import DictionaryObject,NameObject,ArrayObject,TextStringObject,DecodedStreamObject
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/pdf';TMP=ROOT/'tmp/pdfs';OUT.mkdir(parents=True,exist_ok=True);TMP.mkdir(parents=True,exist_ok=True)
MM=72/25.4;DPI=300
ICC=Path(r'C:/Program Files (x86)/Common Files/Adobe/Color/Profiles/Recommended/CoatedFOGRA39.icc')
profile=ImageCms.getOpenProfile(str(ICC));xf=ImageCms.buildTransform(ImageCms.createProfile('sRGB'),profile,'RGB','CMYK')
cache={}
def cmyk(rgb):
 rgb=tuple(round(v*255) if isinstance(v,float) else v for v in rgb)
 if rgb not in cache:cache[rgb]=tuple(v/255 for v in ImageCms.applyTransform(Image.new('RGB',(1,1),rgb),xf).getpixel((0,0)))
 return cache[rgb]
INK=cmyk((18,26,44));PAPER=cmyk((240,237,230));CORAL=cmyk((200,90,83));AMBER=cmyk((222,158,54))
fontcache={}
def font(name):
 if name not in fontcache:
  f=TTFont(ROOT/'public/fonts'/name);fontcache[name]=(f.getGlyphSet(),f.getBestCmap(),f['head'].unitsPerEm)
 return fontcache[name]
class Pen(BasePen):
 def __init__(self,gs,shape,x,y,k,angle):super().__init__(gs);self.sh=shape;self.x=x;self.y=y;self.k=k;self.a=math.radians(angle)
 def p(self,q):
  x=q[0]*self.k;y=-q[1]*self.k
  return fitz.Point(self.x+x*math.cos(self.a)-y*math.sin(self.a),self.y+x*math.sin(self.a)+y*math.cos(self.a))
 def _moveTo(self,p):self.cur=self.p(p);self.start=self.cur
 def _lineTo(self,p):q=self.p(p);self.sh.draw_line(self.cur,q);self.cur=q
 def _curveToOne(self,a,b,c):q=self.p(c);self.sh.draw_bezier(self.cur,self.p(a),self.p(b),q);self.cur=q
 def _closePath(self):self.sh.draw_line(self.cur,self.start)
 def _endPath(self):pass
def text(pg,s,x,y,size,color=INK,name='big-shoulders-black.ttf',angle=0):
 gs,cm,upm=font(name);cursor=0;sh=pg.new_shape();a=math.radians(angle)
 for ch in s:
  glyph=gs[cm[ord(ch)]];glyph.draw(Pen(gs,sh,x*MM+cursor*math.cos(a),y*MM+cursor*math.sin(a),size/upm,angle));cursor+=glyph.width*size/upm
 sh.finish(fill=color,color=None,even_odd=False);sh.commit()
 return cursor/MM
def rect(pg,x,y,w,h,color):pg.draw_rect(fitz.Rect(x*MM,y*MM,(x+w)*MM,(y+h)*MM),color=None,fill=color)
def line(pg,x0,y0,x1,y1,color=INK,width=.5):pg.draw_line((x0*MM,y0*MM),(x1*MM,y1*MM),color=color,width=width*MM)
def svg(pg,file,x,y,w,h=None,angle=0,opacity=1):
 raw=Path(file).read_text(encoding='utf8');root=ET.fromstring(raw);styles={}
 for st in root.iter('{http://www.w3.org/2000/svg}style'):
  for sel,body in re.findall(r'([^{}]+)\{([^{}]+)\}',st.text or ''):
   for cls in sel.split(','):
    styles.setdefault(cls.strip().lstrip('.'),{}).update(dict(pair.strip().split(':',1) for pair in body.split(';') if ':' in pair))
 for element in root.iter():
  for cls in element.get('class','').split():
   for key,value in styles.get(cls,{}).items():element.set(key.strip(),value.strip())
 source=fitz.open(stream=ET.tostring(root),filetype='svg');pdf=fitz.open(stream=source.convert_to_pdf(),filetype='pdf');sp=pdf[0];h=h or w*sp.rect.height/sp.rect.width;sx=w*MM/sp.rect.width;sy=h*MM/sp.rect.height;a=math.radians(angle)
 def p(q):
  xx=(q.x-sp.rect.width/2)*sx;yy=(q.y-sp.rect.height/2)*sy
  return fitz.Point((x+w/2)*MM+xx*math.cos(a)-yy*math.sin(a),(y+h/2)*MM+xx*math.sin(a)+yy*math.cos(a))
 for d in sp.get_drawings():
  sh=pg.new_shape()
  for it in d['items']:
   if it[0]=='l':sh.draw_line(p(it[1]),p(it[2]))
   elif it[0]=='c':sh.draw_bezier(*[p(v) for v in it[1:]])
   elif it[0]=='re':
    r=it[1];pts=[p(r.tl),p(r.tr),p(r.br),p(r.bl),p(r.tl)];sh.draw_polyline(pts)
   elif it[0]=='qu':sh.draw_polyline([p(v) for v in [it[1].ul,it[1].ur,it[1].lr,it[1].ll,it[1].ul]])
  sh.finish(color=cmyk(d['color']) if d.get('color') is not None else None,fill=cmyk(d['fill']) if d.get('fill') is not None else None,width=(d.get('width') or 0)*(sx+sy)/2,closePath=d.get('closePath',False),even_odd=d.get('even_odd',False),fill_opacity=(d.get('fill_opacity') if d.get('fill_opacity') is not None else 1)*opacity,stroke_opacity=(d.get('stroke_opacity') if d.get('stroke_opacity') is not None else 1)*opacity,lineCap=max(d.get('lineCap') or (0,0,0)),lineJoin=d.get('lineJoin') or 0);sh.commit()
 return h
def image(pg,path,x,y,w,h):
 im=Image.open(path).convert('RGBA');bg=Image.new('RGBA',im.size,(240,237,230,255));bg.alpha_composite(im);c=ImageCms.applyTransform(bg.convert('RGB'),xf)
 pix=fitz.Pixmap(fitz.csCMYK,c.width,c.height,c.tobytes(),False);pg.insert_image(fitz.Rect(x*MM,y*MM,(x+w)*MM,(y+h)*MM),pixmap=pix)
 return min(c.width/(w/25.4),c.height/(h/25.4))
# The stamp outline is traced from the supplied PSD layer, never a replacement illustration.
a=np.array(Image.open(ROOT/'public/event/year-stamp.png').convert('RGBA'));parts=[]
for mask,color in [(a[:,:,3]>128,'#f0ede6'),((a[:,:,0].astype(int)-a[:,:,1].astype(int)>35)&(a[:,:,3]>128),'#c85a53')]:
 contours,_=cv2.findContours(np.uint8(mask)*255,cv2.RETR_TREE,cv2.CHAIN_APPROX_SIMPLE);paths=[]
 for contour in contours:
  if abs(cv2.contourArea(contour))<6:continue
  pts=cv2.approxPolyDP(contour,.4,True)[:,0,:];paths.append('M'+' L'.join(f'{p[0]},{p[1]}' for p in pts)+' Z')
 parts.append(f'<path fill="{color}" fill-rule="evenodd" d="'+ ' '.join(paths)+'"/>')
stamp=TMP/'year-stamp-source.svg';stamp.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 412 198">'+''.join(parts)+'</svg>')
# Fine native texture tiles remain above 300 effective ppi.
w,h=round(307/25.4*DPI),round(285/25.4*DPI);base=np.zeros((h,w,3),dtype=np.float32);base[:]=(222,158,54)
for name,amount,edge in [('riso-grain.png',.22,False),('halftone-dots.png',.48,True)]:
 tile=Image.open(ROOT/'public/event'/name).convert('RGBA');flat=Image.new('RGBA',tile.size,'white');flat.alpha_composite(tile);arr=np.array(flat.convert('RGB'),dtype=np.float32)/255;pattern=np.tile(arr,(math.ceil(h/tile.height),math.ceil(w/tile.width),1))[:h,:w];alpha=amount
 if edge:
  x=np.linspace(0,1,w);alpha=(amount*np.clip((np.abs(x-.5)-.24)/.23,0,1))[None,:,None]
 base*=1-(1-pattern)*alpha
bg=Image.fromarray(np.uint8(np.clip(base,0,255)));bg=ImageCms.applyTransform(bg,xf)
doc=fitz.open();pg=doc.new_page(width=307*MM,height=430*MM);rect(pg,0,0,307,430,PAPER)
# Header uses the exact original club image and original outlined CMYK DAU lockup.
club_ppi=image(pg,ROOT/'public/brand/itclub-original.png',22,17,40,40*696/733)
logo=fitz.open(ROOT/'assets/print/dau-primary-tr.pdf')
lw=33*logo[0].rect.width/logo[0].rect.height;pg.show_pdf_page(fitz.Rect(155*MM,20*MM,(155+lw)*MM,53*MM),logo,0)
body=fitz.open();bp=body.new_page(width=307*MM,height=285*MM)
pix=fitz.Pixmap(fitz.csCMYK,bg.width,bg.height,bg.tobytes(),False);bp.insert_image(bp.rect,pixmap=pix)
svg(bp,ROOT/'public/brand/itclub-circuit-watermark.svg',146,65,230,230,opacity=.1)
text(bp,'EMUCON',20,85,237,CORAL,angle=-3);text(bp,'EMUCON',18.8,83.8,237,INK,angle=-3)
svg(bp,stamp,21,95,105,50.46,angle=-3)
text(bp,'2026',28,137,114,PAPER,angle=-3)
text(bp,'IT CLUB',20,159,48,INK,name='bricolage-extrabold.ttf',angle=-3);line(bp,20,169,286,155,INK,.5)
text(bp,'OYUNA GEL.',20.9,222.1,162,CORAL,angle=-3);text(bp,'OYUNA GEL.',20,221,162,INK,angle=-3)
text(bp,'Bir oyun seç, bir tur dene.',20,238,22,INK,name='bricolage-600.ttf',angle=-3)
svg(bp,ROOT/'public/event/planet-1.svg',-36,254,380)
svg(bp,ROOT/'public/event/rocket-flame.svg',235,223,19.5,43,angle=23)
rect(bp,20,267,267,13,CORAL);line(bp,20,267,287,267,INK,.6);line(bp,20,280,287,280,INK,.6)
# Centered date uses actual font advance, no separate university wordmark is typeset.
gs,cm,upm=font('bricolage-extrabold.ttf');date='24 EKİM · DAÜ STADYUMU';datept=17;datew=sum(gs[cm[ord(c)]].width for c in date)*datept/upm/MM;text(bp,date,(307-datew)/2,275.6,datept,INK,name='bricolage-extrabold.ttf')
pg.show_pdf_page(fitz.Rect(0,65*MM,307*MM,350*MM),body,0)
footer_ppi=image(pg,ROOT/'public/brand/footer-tr-light.png',28.5,358,250,250*680/3059)
pg.set_trimbox(fitz.Rect(5*MM,5*MM,302*MM,425*MM));pg.set_bleedbox(pg.rect)
doc.set_metadata({'title':'EMUCON 2026 - IT CLUB - OYUNA GEL - A3','author':'EMU IT Club','subject':'A3 portrait, 5 mm bleed, CMYK FOGRA39, outlined type'})
raw=TMP/'poster-cmyk.pdf';doc.save(raw,garbage=4,deflate=True)
reader=PdfReader(raw);writer=PdfWriter();writer.clone_document_from_reader(reader)
stream=DecodedStreamObject();stream.set_data(ICC.read_bytes());stream.update({NameObject('/N'):__import__('pypdf').generic.NumberObject(4)})
intent=DictionaryObject({NameObject('/Type'):NameObject('/OutputIntent'),NameObject('/S'):NameObject('/GTS_PDFX'),NameObject('/OutputConditionIdentifier'):TextStringObject('FOGRA39'),NameObject('/RegistryName'):TextStringObject('http://www.color.org'),NameObject('/DestOutputProfile'):writer._add_object(stream)})
writer._root_object[NameObject('/OutputIntents')]=ArrayObject([writer._add_object(intent)])
final=OUT/'EMUCON-IT-Club-Oyuna-Gel-A3-baski.pdf'
with final.open('wb') as f:writer.write(f)
check=fitz.open(final);page=check[0];fonts=page.get_fonts();images=page.get_images(full=True)
assert not fonts,'All independently composed type must be outlined.'
assert min(club_ppi,footer_ppi)>=300
# Final preview is rendered from the delivered PDF and cropped to its A3 TrimBox.
preview=page.get_pixmap(dpi=150,clip=page.trimbox,colorspace=fitz.csRGB);preview.save(OUT/'EMUCON-IT-Club-Oyuna-Gel-A3-onizleme.png')
report={'trim_mm':[297,420],'media_mm':[307,430],'bleed_mm':5,'fonts':len(fonts),'club_effective_ppi':round(club_ppi,1),'footer_effective_ppi':round(footer_ppi,1),'texture_ppi':300,'DAU_emblem_mm':33,'colors':'DeviceCMYK with FOGRA39 output intent','source_image_color_spaces':[x[5] for x in images],'source':'Current website poster with requested faint original circuit motif; source illustrations retained.'}
(OUT/'EMUCON-A3-baski-kontrol.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False));print(final)
