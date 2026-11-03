"""Build KaraokeVerse's ORIGINAL low-poly GLB avatar and embedded node animation clips.
No downloaded/third-party model or textures; geometry created with trimesh.
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
    'Outfit':(.63,.34,.94), 'Skin':(1.,.78,.60),'Hair':(.16,.12,.24),'Pants':(.15,.16,.27),
    'Shoes':(.89,.87,1.),'Accent':(.94,.87,1.),'Eyes':(.10,.08,.15), 'Mic':(.60,.59,.72),
    'Accessory':(.91,.63,1.),
}
for name,rgb in materials.items():
    J['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[float(x) for x in rgb]+[1], 'metallicFactor':.05,'roughnessFactor':.8},'doubleSided':True})
mat_idx={n:i for i,n in enumerate(materials)}
base_geom={
    'box':trimesh.creation.box(extents=(1,1,1)),
    'sphere':trimesh.creation.icosphere(subdivisions=3,radius=.5),
    'cylinder':trimesh.creation.cylinder(radius=.5,height=1,sections=24),
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
part('Face',head,'sphere','Skin',(0,0,0),(.68,.70,.63))
part('Nose',head,'sphere','Skin',(0,-.065,-.316),(.10,.075,.09))
part('HairCap',head,'sphere','Hair',(0,.22,.018),(.72,.40,.67))
for suffix,x in [('L',-.14),('R',.14)]:
    part('Eye'+suffix,head,'sphere','Eyes',(x,.035,-.317),(.063,.077,.033))
    part('Brow'+suffix,head,'sphere','Hair',(x,.16,-.304),(.15,.025,.022))
    part('Cheek'+suffix,head,'sphere','Skin',(x*1.6,-.10,-.24),(.16,.09,.07))
part('Mouth',head,'sphere','Accent',(0,-.18,-.317),(.14,.035,.03))
# Styles can be toggled by name from JS.
part('HairBangs',head,'sphere','Hair',(0,.27,-.26),(.49,.20,.22))
part('HairLong',head,'sphere','Hair',(0,-.21,.23),(.56,.57,.32))
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
 'sing':{'ArmR':[(.55,0,-.19),(.59,0,-.16),(.55,0,-.19)],'ArmL':[(.3,0,.3),(.37,0,.4),(.3,0,.3)],'Head':[(0,-.07,.02),(0,.07,.02),(0,-.07,.02)]},
 'dance':{'ArmL':[(-1.7,0,.25),(-.5,0,-.3),(-1.7,0,.25)],'ArmR':[(-.6,0,-.25),(-1.7,0,.3),(-.6,0,-.25)],'LegL':[(.35,0,0),(-.32,0,0),(.35,0,0)],'LegR':[(-.35,0,0),(.32,0,0),(-.35,0,0)],'Torso':[(0,0,.17),(0,0,-.17),(0,0,.17)]},
 'wave':{'ArmR':[(-2.1,0,-.12),(-2.45,0,-.38),(-2.1,0,-.12)],'Head':[(0,.16,0),(0,-.13,0),(0,.16,0)]},
 'clap':{'ArmL':[(-1.05,0,-.75),(-.93,0,-.95),(-1.05,0,-.75)],'ArmR':[(-1.05,0,.75),(-.93,0,.95),(-1.05,0,.75)]},
 'cheer':{'ArmL':[(-2.65,0,.12),(-2.4,0,.3),(-2.65,0,.12)],'ArmR':[(-2.65,0,-.12),(-2.4,0,-.3),(-2.65,0,-.12)]},
 'bow':{'Torso':[(.43,0,0),(.75,0,0),(.43,0,0)],'Head':[(.23,0,0),(.31,0,0),(.23,0,0)]},
 'heart':{'ArmL':[(-.95,0,-.8)]*3,'ArmR':[(-.95,0,.8)]*3},
}
# Independent elbow articulation: bends naturally with the microphone near the lips.
for action,motion in anim.items():
    motion.setdefault('ForearmL',[(0,0,0)]*3)
    motion.setdefault('ForearmR',[(0,0,0)]*3)
anim['sing']['ForearmR']=[(2.18,0,0),(2.24,0,0),(2.18,0,0)]
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
print('Created',OUT,'bytes:',OUT.stat().st_size,'clips:',[a['name'] for a in J['animations']],'nodes:',len(J['nodes']))
