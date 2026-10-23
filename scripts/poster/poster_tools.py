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
