from pathlib import Path
import struct,zlib,hashlib,json
from PIL import Image,ImageCms
root=Path(__file__).resolve().parents[3]/'output/social/english-v6'
profile=ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
report=[]
for file in root.glob('EMUCON-Print-Motion-EN-*'):
 if file.suffix.lower() not in ('.png','.jpg'):continue
 raw=file.read_bytes();old=hashlib.sha256(Image.open(file).tobytes()).hexdigest()
 if file.suffix=='.png':
  chunks=[];offset=8
  while offset<len(raw):
   n=struct.unpack('>I',raw[offset:offset+4])[0];chunk=raw[offset:offset+n+12]
   if raw[offset+4:offset+8]!=b'iCCP':chunks.append(chunk)
   offset+=n+12
  payload=b'sRGB\0\0'+zlib.compress(profile);kind=b'iCCP'
  icc=struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload)&0xffffffff)
  raw=raw[:8]+chunks[0]+icc+b''.join(chunks[1:])
 else:
  if b'ICC_PROFILE\0' not in raw:
   payload=b'ICC_PROFILE\0\x01\x01'+profile
   raw=raw[:2]+b'\xff\xe2'+struct.pack('>H',len(payload)+2)+payload+raw[2:]
 file.write_bytes(raw);im=Image.open(file)
 assert hashlib.sha256(im.tobytes()).hexdigest()==old
 assert len(im.info.get('icc_profile',b''))>0
 report.append({'file':file.name,'size':list(im.size),'mode':im.mode,'icc_bytes':len(im.info['icc_profile']),'pixels_unchanged':True})
(root/'export-profile-check.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
