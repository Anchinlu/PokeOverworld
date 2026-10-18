#!/usr/bin/env python3
"""
Fixes Tearful Look (7263 PL & 7264 OPP):
1. Copies authentic sound files:
   - PRSFX- Tearful Look1.wav
   - PRSFX- Tearful Look2.wav
   - PRSFX- Tearful Look3.wav
   from source game to apps/web/public/Audio/SE/Anim/ and Audio/SE/.
2. Sets authentic timings from Rx 1068:
   - Frame 3: PRSFX- Tearful Look1.wav (vol 100, pitch 110)
   - Frame 15: PRSFX- Tearful Look2.wav (vol 60, pitch 140)
   - Frame 15: PRSFX- Tearful Look3.wav (vol 75, pitch 100)
   - Frame 21: PRSFX- Tearful Look2.wav (vol 60, pitch 140)
   - Frame 21: PRSFX- Tearful Look3.wav (vol 75, pitch 100)
3. Fixes focus tag on all eye/tear cels to focus='user':
   - Pattern -1: focus='user', x=128, y=224
   - Pattern -2: focus='target', x=384, y=96
   - Eye and tear cels: focus='user' centered at (128, 224), so CoordinateTransformer
     renders them right over the attacker's face (Player 130, 215 or Enemy 380, 115).
   - Pattern 5 (screen burst): focus='screen'
"""

import os, sys, json, shutil

source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
source_se_anim = os.path.join(source_root, 'Audio', 'SE', 'Anim')

web_public = r'e:\Pokemon\apps\web\public'
dest_se_anim = os.path.join(web_public, 'Audio', 'SE', 'Anim')
dest_se = os.path.join(web_public, 'Audio', 'SE')
os.makedirs(dest_se_anim, exist_ok=True)
os.makedirs(dest_se, exist_ok=True)

# 1. Copy audio files
se_files = ['PRSFX- Tearful Look1.wav', 'PRSFX- Tearful Look2.wav', 'PRSFX- Tearful Look3.wav']
for se in se_files:
    sp = os.path.join(source_se_anim, se)
    if os.path.exists(sp):
        shutil.copy2(sp, os.path.join(dest_se_anim, se))
        shutil.copy2(sp, os.path.join(dest_se, se))
        print(f"  [COPIED] {se} -> Audio/SE/Anim/ and Audio/SE/")

# 2. Authentic timings from Rx 1068
tearful_timings = [
    {
        'frame': 3,
        'type': 'sound',
        'payload': {
            'sound': 'PRSFX- Tearful Look1.wav',
            'volume': 100,
            'pitch': 110
        }
    },
    {
        'frame': 15,
        'type': 'sound',
        'payload': {
            'sound': 'PRSFX- Tearful Look2.wav',
            'volume': 60,
            'pitch': 140
        }
    },
    {
        'frame': 15,
        'type': 'sound',
        'payload': {
            'sound': 'PRSFX- Tearful Look3.wav',
            'volume': 75,
            'pitch': 100
        }
    },
    {
        'frame': 21,
        'type': 'sound',
        'payload': {
            'sound': 'PRSFX- Tearful Look2.wav',
            'volume': 60,
            'pitch': 140
        }
    },
    {
        'frame': 21,
        'type': 'sound',
        'payload': {
            'sound': 'PRSFX- Tearful Look3.wav',
            'volume': 75,
            'pitch': 100
        }
    }
]

# 3. Read 7263.json frames and standardize focus
p_7263 = r'e:\Pokemon\packages\game-data\animations\7263.json'
with open(p_7263, 'r', encoding='utf-8') as f:
    anim_7263 = json.load(f)

std_frames = []
for fr in anim_7263['frames']:
    new_cels = []
    for c in fr['cels']:
        cel = dict(c)
        pat = cel.get('pattern', 0)
        if pat == -1:
            cel['focus'] = 'user'
            cel['x'] = 128
            cel['y'] = 224
        elif pat == -2:
            cel['focus'] = 'target'
            cel['x'] = 384
            cel['y'] = 96
        elif pat == 5:
            cel['focus'] = 'screen'
            cel['x'] = 258
            cel['y'] = 164
        else:
            # All eye and tear particles surround the user
            cel['focus'] = 'user'
        new_cels.append(cel)
    std_frames.append({'cels': new_cels})

# Update 7263 (Player)
anim_7263['frames'] = std_frames
anim_7263['timings'] = tearful_timings
anim_7263['position'] = 1 # User-focused move

# Update 7264 (Opponent)
anim_7264 = {
    'id': '7264',
    'name': 'OppMove:TEARFULLOOK',
    'graphic': 'PRAS- Baby Doll Eyes.png',
    'hue': 0,
    'position': 1,
    'fps': 20,
    'frames': std_frames,
    'timings': tearful_timings
}

for base in [r'e:\Pokemon\packages\game-data\animations', r'e:\Pokemon\packages\game-data\animations\last-chance']:
    with open(os.path.join(base, '7263.json'), 'w', encoding='utf-8') as f:
        json.dump(anim_7263, f, indent=2)
    with open(os.path.join(base, '7264.json'), 'w', encoding='utf-8') as f:
        json.dump(anim_7264, f, indent=2)

print("Successfully updated 7263 and 7264 with focus='user' and authentic timings!")
