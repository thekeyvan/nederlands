"""Generate fixed Dutch clips. Optional offline authoring tool; never runs in the site."""
import argparse
import concurrent.futures
import hashlib
import json
import shutil
import subprocess
import tempfile
import time
import urllib.request
import wave
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
REVISION='6b9cfaacb4fb2e02a9621227e3c1a48bec9710c3'
MODEL_SHA={'ronnie':'c6b69203247c9ff9aaadf59ec51147fffb16bb2c2892eb92d5b75d2f9d096622','pim':'1e1ed370c3b60ca734e525bdcd1f05f71b42bfb0a15693f1e89c012d72052d2a'}
CONFIG_SHA={'ronnie':'65561cb497fde442608abad1f4eb6d7193e53edbc9ad374a5ae9ee4914fe2586','pim':'30e5689c492f27d9c6cb8e23de78087162d3205fa8e169c33fd80bd80cbb133b'}

def digest(path):
 return hashlib.sha256(path.read_bytes()).hexdigest()

def ensure_model(directory,name):
 directory.mkdir(parents=True,exist_ok=True)
 for suffix,checksum in [('',MODEL_SHA[name]),('.json',CONFIG_SHA[name])]:
  path=directory/f'{name}.onnx{suffix}'
  if not path.exists():
   url=f'https://huggingface.co/rhasspy/piper-voices/resolve/{REVISION}/nl/nl_NL/{name}/medium/nl_NL-{name}-medium.onnx{suffix}'
   with urllib.request.urlopen(url,timeout=120) as response:path.write_bytes(response.read())
  if digest(path)!=checksum:raise ValueError(f'Unexpected model checksum: {path}')
 config=json.loads((directory/f'{name}.onnx.json').read_text())
 if config['language']['code']!='nl_NL' or config['espeak']['voice']!='nl':raise ValueError('Only the pinned Dutch models are allowed')

def generate_voice(job):
 from piper import PiperVoice,SynthesisConfig
 name,models,entries,ffmpeg=job
 start=time.monotonic();voice=PiperVoice.load(Path(models)/f'{name}.onnx')
 output=ROOT/'public'/'assets'/'audio'/name;output.mkdir(parents=True,exist_ok=True)
 config=SynthesisConfig(length_scale=1.05,noise_scale=.5,noise_w_scale=.333)
 with tempfile.TemporaryDirectory() as temporary:
  wav=Path(temporary)/'clip.wav'
  for number,(text,key) in enumerate(entries,1):
   target=output/f'{key}.mp3'
   if not target.exists():
    with wave.open(str(wav),'wb') as file:voice.synthesize_wav(text,file,syn_config=config)
    with wave.open(str(wav),'rb') as file:
     if file.getnframes()<1000 or file.getframerate()!=22050:raise ValueError(f'Invalid audio: {text}')
    staged=output/f'{key}.tmp.mp3'
    subprocess.run([ffmpeg,'-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-q:a','4','-metadata','language=nld','-metadata',f'artist=Piper {name} (nl_NL)',str(staged)],check=True)
    staged.replace(target)
   if number%150==0:print(f'{name}: {number}/{len(entries)} clips',flush=True)
 print(f'{name}: complete ({len(entries)} clips, {time.monotonic()-start:.1f}s)',flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--models',type=Path,default=ROOT.parent/'audio-models');parser.add_argument('--node',default='node');args=parser.parse_args()
 ffmpeg=shutil.which('ffmpeg')
 if not ffmpeg:raise SystemExit('Install ffmpeg first.')
 data=json.loads(subprocess.check_output([args.node,str(ROOT/'scripts'/'audio-texts.mjs')],text=True))
 entries=[(text,hashlib.sha256(text.encode()).hexdigest()[:24]) for text in data['texts']]
 if len({key for _,key in entries})!=len(entries):raise ValueError('Audio key collision')
 for name in MODEL_SHA:ensure_model(args.models,name)
 with concurrent.futures.ProcessPoolExecutor(max_workers=2) as pool:list(pool.map(generate_voice,[(name,str(args.models),entries,ffmpeg) for name in MODEL_SHA]))
 catalog={'language':'nl-NL','defaultVoice':'ronnie','voices':[{'id':name,'name':name.title(),'language':'nl-NL'} for name in MODEL_SHA],'sampleText':data['sampleText'],'clips':dict(entries)}
 (ROOT/'src'/'core'/'audio-catalog.js').write_text('export const audioCatalog = '+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')
 print(f'Catalog complete: {len(entries)} texts, two fixed Dutch voices.',flush=True)
