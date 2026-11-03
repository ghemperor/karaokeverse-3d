"""Build KaraokeVerse ORIGINAL Avatar Atelier GLB (v1.4.2).
Self-contained, authored from procedural meshes and native glTF animation.
No downloaded third-party model or textures. Compatible with v1.4 rig names.
Run: python scripts/build-avatar-glb.py
"""
import json, struct, math, pathlib
import numpy as np
import trimesh

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'public/models/karaoke-avatar.glb'
J={'asset':{'version':'2.0','generator':'KaraokeVerse original GLB generator'},'scene':0,
   'scenes':[{'nodes':[0]}],'nodes':[],'meshes':[],'materials':[],'buffers':[{'byteLength':0}],
   'bufferViews':[],'accessors':[],'animations':[]}
BUF=bytearray()
def append_raw(raw,target=None):
    while len(BUF)%4: BUF.append(0)
    start=len(BUF); BUF.extend(raw); v={'buffer':0,'byteOffset':start,'byteLength':len(raw)}
    if target:v['target']=target
    J['bufferViews'].append(v);return len(J['bufferViews'])-1

def accessor(values,dtype,typ,target=None, minmax=False):
    arr=np.asarray(values,dtype=dtype)
    view=append_raw(arr.tobytes(),target)
    comps={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[typ]
    out={'bufferView':view,'componentType':5126 if np.issubdtype(arr.dtype,np.floating) else (5123 if arr.dtype==np.uint16 else 5125),'count':int(arr.size//comps),'type':typ}
    if minmax:
        shaped=arr.reshape(-1,comps);out['min']=shaped.min(0).astype(float).tolist();out['max']=shaped.max(0).astype(float).tolist()
    J['accessors'].append(out);return len(J['accessors'])-1

materials={
    'Outfit':(.51,.26,.86), 'Skin':(1.,.77,.59),'Hair':(.13,.10,.18),'Pants':(.13,.15,.25),
    'Shoes':(.94,.93,1.),'Accent':(.96,.88,1.),'Eyes':(.12,.09,.16), 'Mic':(.60,.59,.72),
    'Accessory':(.94,.76,1.), 'EyeWhite':(.99,.97,1.),'Iris':(.35,.23,.43),
    'Catchlight':(1.,1.,1.), 'Lip':(.59,.22,.30),'Metal':(.79,.76,.92),
    'Seam':(.74,.64,.98),'Sole':(.92,.88,1.),'Inner':(.99,.98,1.), 'Blush':(.94,.56,.59),
}
for name,rgb in materials.items():
    J['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[float(x) for x in rgb]+[1], 'metallicFactor':.05,'roughnessFactor':.8},'doubleSided':True})
mat_idx={n:i for i,n in enumerate(materials)}
base_geom={
    'box':trimesh.creation.box(extents=(1,1,1)),
    'sphere':trimesh.creation.uv_sphere(radius=.5,count=[20,24]),
    'cylinder':trimesh.creation.cylinder(radius=.5,height=1,sections=28),
}
geo_accessors={}
for kind,mesh in base_geom.items():
    mesh.fix_normals()
    vertices=mesh.vertices.astype(np.float32); normals=mesh.vertex_normals.astype(np.float32)
    faces=mesh.faces.flatten().astype(np.uint16)
    geo_accessors[kind]=(accessor(vertices,np.float32,'VEC3',34962,True), accessor(normals,np.float32,'VEC3',34962), accessor(faces,np.uint16,'SCALAR',34963))
mesh_cache={}
def mesh_ref(kind,material):
    key=(kind,material)
    if key not in mesh_cache:
        a,b,c=geo_accessors[kind]
        J['meshes'].append({'name':f'{kind}_{material}','primitives':[{'attributes':{'POSITION':a,'NORMAL':b},'indices':c,'material':mat_idx[material],'mode':4}]})
        mesh_cache[key]=len(J['meshes'])-1
    return mesh_cache[key]

def node(name,parent=None,translation=None,rotation=None,mesh=None,scale=None):
    obj={'name':name}
    if translation is not None:obj['translation']=list(translation)
    if rotation is not None:obj['rotation']=list(rotation)
    if mesh is not None:obj['mesh']=mesh
    if scale is not None:obj['scale']=list(scale)
    J['nodes'].append(obj);idx=len(J['nodes'])-1
    if parent is not None:J['nodes'][parent].setdefault('children',[]).append(idx)
    return idx

def part(name,parent,geo,material,position,scale):return node(name,parent,position,mesh=mesh_ref(geo,material),scale=scale)
root=node('AvatarRoot')
hips=node('Hips',root,(0,.94,0))
part('HipsCloth',hips,'sphere','Pants',(0,0,0),(.62,.43,.41))
torso=node('Torso',hips,(0,.12,0))
part('OutfitBody',torso,'sphere','Outfit',(0,.24,0),(.65,.77,.45))
part('OutfitCollar',torso,'cylinder','Accent',(0,.60,0),(.26,.14,.26))
part('OutfitStripe',torso,'sphere','Accent',(0,.22,-.228),(.32,.055,.035))
part('JacketHem',torso,'cylinder','Outfit',(0,-.04,0),(.55,.10,.36))
head=node('Head',hips,(0,.86,0))
part('Face',head,'sphere','Skin',(0,-.015,0),(.70,.76,.66))
part('Nose',head,'sphere','Skin',(0,-.045,-.339),(.11,.085,.105))
part('HairCap',head,'sphere','Hair',(0,.245,.065),(.75,.43,.70))
for suffix,x in [('L',-.14),('R',.14)]:
    part('EyeWhite'+suffix,head,'sphere','EyeWhite',(x,.075,-.315),(.134,.158,.058))
    part('Eye'+suffix,head,'sphere','Iris',(x,.078,-.365),(.086,.111,.032))
    part('Pupil'+suffix,head,'sphere','Eyes',(x,.08,-.393),(.047,.077,.015))
    part('EyeHighlight'+suffix,head,'sphere','Catchlight',(x-.031,.126,-.408),(.029,.036,.012))
    part('Brow'+suffix,head,'sphere','Hair',(x,.23,-.308),(.168,.033,.039))
    part('Blush'+suffix,head,'sphere','Blush',(x*1.67,-.115,-.267),(.15,.071,.024))
    part('Ear'+suffix,head,'sphere','Skin',((-.36 if suffix=='L' else .36),-.015,.006),(.13,.23,.14))
    part('EarInner'+suffix,head,'sphere','Blush',((-.397 if suffix=='L' else .397),-.01,-.092),(.04,.105,.028))
part('SmileMouth',head,'sphere','Lip',(0,-.222,-.323),(.17,.047,.023))
part('CoolMouth',head,'sphere','Lip',(0,-.222,-.323),(.125,.026,.021))
part('JoyMouth',head,'sphere','Lip',(0,-.232,-.324),(.125,.123,.027))
part('Teeth',head,'sphere','EyeWhite',(0,-.205,-.348),(.083,.044,.012))
# Styles can be toggled by name from JS.
part('HairBangs',head,'sphere','Hair',(0,.295,-.265),(.55,.23,.26))
part('HairBangsLeft',head,'sphere','Hair',(-.19,.215,-.31),(.25,.30,.16))
part('HairBangsRight',head,'sphere','Hair',(.19,.215,-.31),(.25,.30,.16))
part('HairLong',head,'sphere','Hair',(0,-.18,.24),(.64,.80,.39))
part('HairLongL',head,'sphere','Hair',(-.31,-.18,-.07),(.22,.73,.27))
part('HairLongR',head,'sphere','Hair',(.31,-.18,-.07),(.22,.73,.27))
part('HairQuiff',head,'sphere','Hair',(-.13,.44,-.11),(.50,.28,.40))
part('HairShortL',head,'sphere','Hair',(-.33,.12,.04),(.14,.34,.31))
part('HairShortR',head,'sphere','Hair',(.33,.12,.04),(.14,.34,.31))
part('HairPonytail',head,'sphere','Hair',(0,-.22,.46),(.36,.73,.28))
part('HairPonytie',head,'sphere','Accessory',(0,.08,.40),(.19,.17,.16))
for j,(xx,yy,zz) in enumerate([(-.30,.35,-.19),(-.13,.45,-.29),(.13,.46,-.26),(.30,.34,-.20),(-.28,.15,-.34),(.28,.15,-.34)]):
    part('HairCurly'+str(j),head,'sphere','Hair',(xx,yy,zz),(.26,.26,.25))
part('GlassesBridge',head,'box','Accessory',(0,.045,-.345),(.15,.03,.025))
for side,x in [('L',-.145),('R',.145)]:
    part('Glasses'+side,head,'box','Accessory',(x,.05,-.342),(.21,.13,.022))
arm_l=node('ArmL',torso,(-.415,.49,0));arm_r=node('ArmR',torso,(.415,.49,0))
for name,p in [('L',arm_l),('R',arm_r)]:
    part('SleeveUpper'+name,p,'sphere','Outfit',(0,-.15,0),(.23,.33,.27))
    elbow_node=node('Forearm'+name,p,(0,-.31,0))
    part('SleeveLower'+name,elbow_node,'sphere','Outfit',(0,-.15,0),(.21,.31,.245))
    part('Hand'+name,elbow_node,'sphere','Skin',(0,-.34,0),(.19,.20,.19))
    if name=='R':
        mic=node('Mic',elbow_node,(0,-.37,-.055),rotation=(1,0,0,0))
        part('MicHandle',mic,'cylinder','Mic',(0,.10,0),(.085,.29,.085))
        part('MicGrille',mic,'sphere','Accent',(0,.30,0),(.16,.18,.16))
leg_l=node('LegL',hips,(-.18,-.10,0));leg_r=node('LegR',hips,(.18,-.10,0))
for name,p in [('L',leg_l),('R',leg_r)]:
    part('Pants'+name,p,'sphere','Pants',(0,-.37,0),(.28,.70,.33))
    part('Shoe'+name,p,'sphere','Shoes',(0,-.72,-.12),(.32,.18,.51))


# Sculpted details: layered wardrobe, collar, cuffs, jacket and hoodie alternate silhouettes.
part('Neck',hips,'cylinder','Skin',(0,.72,0),(.22,.29,.22))
part('BaseTshirt',torso,'sphere','Inner',(0,.51,-.225),(.40,.22,.09))
part('StyleJacketL',torso,'sphere','Outfit',(-.245,.26,-.240),(.30,.67,.095))
part('StyleJacketR',torso,'sphere','Outfit',(.245,.26,-.240),(.30,.67,.095))
part('StyleJacketCollarL',torso,'sphere','Accent',(-.15,.56,-.271),(.16,.23,.08))
part('StyleJacketCollarR',torso,'sphere','Accent',(.15,.56,-.271),(.16,.23,.08))
part('StyleJacketZip',torso,'cylinder','Metal',(0,.23,-.306),(.020,.52,.025))
part('StyleJacketPocketL',torso,'sphere','Seam',(-.22,.08,-.292),(.17,.048,.022))
part('StyleJacketPocketR',torso,'sphere','Seam',(.22,.08,-.292),(.17,.048,.022))
part('StyleHoodieHood',torso,'sphere','Outfit',(0,.58,.20),(.59,.52,.38))
part('StyleHoodiePouch',torso,'sphere','Outfit',(0,.06,-.276),(.50,.25,.10))
for side in [-1,1]:
  part('StyleHoodieCord'+('L' if side<0 else 'R'),torso,'cylinder','Accent',(side*.10,.39,-.305),(.020,.28,.020))
part('StyleFormalLapL',torso,'sphere','Accent',(-.16,.43,-.267),(.17,.34,.055))
part('StyleFormalLapR',torso,'sphere','Accent',(.16,.43,-.267),(.17,.34,.055))
part('StyleFormalTie',torso,'cylinder','Seam',(0,.35,-.308),(.045,.43,.045))
part('StyleFormalButton',torso,'sphere','Metal',(0,.10,-.318),(.035,.035,.021))
# Textured-feeling fabric details are real 3D geometry, not an image overlay.
part('Waistband',hips,'cylinder','Seam',(0,-.125,0),(.60,.08,.42))
for suffix,arm in [('L',arm_l),('R',arm_r)]:
  part('SleeveCuff'+suffix,arm,'cylinder','Accent',(0,-.285,0),(.21,.065,.24))
for suffix,leg in [('L',leg_l),('R',leg_r)]:
  part('KneeFold'+suffix,leg,'sphere','Pants',(0,-.48,-.18),(.24,.08,.09))
  part('ShoeSole'+suffix,leg,'sphere','Sole',(0,-.80,-.13),(.34,.085,.53))
  part('ShoeTongue'+suffix,leg,'sphere','Accent',(0,-.665,-.31),(.16,.065,.20))
  for line in range(3):
    part('Shoelace'+suffix+str(line),leg,'sphere','Seam',(0,-.655-line*.032,-.345),(.21,.016,.015))
# Light-watch and bracelets enhance close-up details.
part('WristWatch',arm_l,'cylinder','Accessory',(0,-.62,0),(.22,.085,.22))
part('WatchFace',arm_l,'sphere','Metal',(0,-.62,-.11),(.115,.058,.035))
# Accessories: all optional, controlled by profile values.
part('CapBrim',head,'sphere','Outfit',(0,.34,-.39),(.61,.10,.36))
part('CapCrown',head,'sphere','Outfit',(0,.48,.0),(.69,.32,.64))
part('NecklaceChain',torso,'sphere','Metal',(0,.53,-.258),(.26,.035,.030))
part('NecklaceCharm',torso,'sphere','Accessory',(0,.43,-.296),(.10,.13,.05))
# Further micro grille details for singing close-ups.
part('MicGrilleRing',mic,'cylinder','Metal',(0,.21,0),(.105,.03,.105))
part('MicCore',mic,'cylinder','Eyes',(0,-.03,0),(.062,.04,.062))

ids={obj['name']:i for i,obj in enumerate(J['nodes'])}
def quat_euler(rx=0,ry=0,rz=0):
    cx,sx=math.cos(rx/2),math.sin(rx/2)
    cy,sy=math.cos(ry/2),math.sin(ry/2)
    cz,sz=math.cos(rz/2),math.sin(rz/2)
    return [sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz]

# named clips: joints rotate around anatomical pivots. Action-specific named tracks
# are compatible with THREE.AnimationMixer and crossFadeTo.
T=[0.,.42,.84]
anim={
 'idle':{'Torso':[(0,0,-.035),(0,0,.035),(0,0,-.035)],'Head':[(0,.055,0),(0,-.055,0),(0,.055,0)]},
 'walk':{'LegL':[(.6,0,0),(-.6,0,0),(.6,0,0)],'LegR':[(-.6,0,0),(.6,0,0),(-.6,0,0)],'ArmL':[(-.5,0,0),(.5,0,0),(-.5,0,0)],'ArmR':[(.5,0,0),(-.5,0,0),(.5,0,0)]},
 'sit':{'LegL':[(1.43,0,0)]*3,'LegR':[(1.43,0,0)]*3,'ArmL':[(-.18,0,.13)]*3,'ArmR':[(-.18,0,-.13)]*3},
 'sing':{'ArmR':[(.86,0,-.17),(.91,0,-.20),(.86,0,-.17)],'ArmL':[(.28,0,.28),(.38,0,.41),(.28,0,.28)],'Head':[(0,-.085,.02),(0,.09,.02),(0,-.085,.02)],'Torso':[(0,0,-.03),(0,0,.03),(0,0,-.03)]},
 'dance':{'ArmL':[(-1.7,0,.25),(-.5,0,-.3),(-1.7,0,.25)],'ArmR':[(-.6,0,-.25),(-1.7,0,.3),(-.6,0,-.25)],'LegL':[(.35,0,0),(-.32,0,0),(.35,0,0)],'LegR':[(-.35,0,0),(.32,0,0),(-.35,0,0)],'Torso':[(0,0,.17),(0,0,-.17),(0,0,.17)]},
 'wave':{'ArmR':[(-2.1,0,-.12),(-2.45,0,-.38),(-2.1,0,-.12)],'Head':[(0,.16,0),(0,-.13,0),(0,.16,0)]},
 'clap':{'ArmL':[(-1.05,0,-.75),(-.93,0,-.95),(-1.05,0,-.75)],'ArmR':[(-1.05,0,.75),(-.93,0,.95),(-1.05,0,.75)]},
 'cheer':{'ArmL':[(-2.65,0,.12),(-2.4,0,.3),(-2.65,0,.12)],'ArmR':[(-2.65,0,-.12),(-2.4,0,-.3),(-2.65,0,-.12)]},
 'bow':{'Torso':[(.43,0,0),(.75,0,0),(.43,0,0)],'Head':[(.23,0,0),(.31,0,0),(.23,0,0)]},
 'heart':{'ArmL':[(-.95,0,-.8)]*3,'ArmR':[(-.95,0,.8)]*3},
 'pose':{'ArmL':[(.05,0,.26)]*3,'ArmR':[(.05,0,-.26)]*3,'Torso':[(0,.06,-.04)]*3},
 'salute':{'ArmR':[(-1.6,0,-.3),(-1.7,0,-.4),(-1.6,0,-.3)],'ForearmR':[(.2,0,-.3)]*3},
}
# Independent elbow articulation: bends naturally with the microphone near the lips.
for action,motion in anim.items():
    motion.setdefault('ForearmL',[(0,0,0)]*3)
    motion.setdefault('ForearmR',[(0,0,0)]*3)
anim['sing']['ForearmR']=[(1.48,0,-.54),(1.52,0,-.57),(1.48,0,-.54)]
for name,motion in anim.items():
    animation={'name':name,'samplers':[],'channels':[]}
    time_access=accessor(T,np.float32,'SCALAR',minmax=True)
    for target,angles in motion.items():
        q=[quat_euler(*a) for a in angles]
        a=accessor(q,np.float32,'VEC4')
        si=len(animation['samplers']);animation['samplers'].append({'input':time_access,'output':a,'interpolation':'LINEAR'})
        animation['channels'].append({'sampler':si,'target':{'node':ids[target],'path':'rotation'}})
    # Every clip tracks hip height, so getting up never leaves a stale seated offset.
    if True:
        a=accessor([[0,.66 if name=='sit' else .94,0]]*3,np.float32,'VEC3')
        si=len(animation['samplers']);animation['samplers'].append({'input':time_access,'output':a,'interpolation':'LINEAR'})
        animation['channels'].append({'sampler':si,'target':{'node':ids['Hips'],'path':'translation'}})
    J['animations'].append(animation)

while len(BUF)%4:BUF.append(0)
J['buffers'][0]['byteLength']=len(BUF)
json_bytes=json.dumps(J,separators=(',',':'),ensure_ascii=False).encode('utf-8')
while len(json_bytes)%4:json_bytes+=b' '
chunk1=struct.pack('<I4s',len(json_bytes),b'JSON')+json_bytes
chunk2=struct.pack('<I4s',len(BUF),b'BIN\0')+BUF
with open(OUT,'wb') as f:
    f.write(struct.pack('<4sII',b'glTF',2,12+len(chunk1)+len(chunk2)))
    f.write(chunk1);f.write(chunk2)
print('Avatar Atelier created',OUT,'bytes:',OUT.stat().st_size,'clips:',[a['name'] for a in J['animations']],'nodes:',len(J['nodes']))
