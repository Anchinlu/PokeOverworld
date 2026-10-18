#!/usr/bin/env python3
"""
Comprehensive Fixer for Tackle (Anchoring & Trajectory) and Sound Timings for all T-Group Moves.
1. Fixes Tackle (7247 PL & 7248 OPP):
   - Sets impact star focus='target' so it renders on the defender (Enemy for PL, Player for OPP).
   - Animates battler lunge properly for both sides.
   - Adds PRSFX- Tackle.wav sound timing at frame 0.
2. Extracts and restores authentic sound timings from PkmnAnimations.rxdata for all Batch 1 moves (7247..7296).
3. Copies all referenced audio SE files from source game to apps/web/public/Audio/SE/Anim/ and Audio/SE/.
"""

import os, sys, json, copy, shutil

out_base = r'e:\Pokemon'
game_data_dir = os.path.join(out_base, 'packages', 'game-data')
anims_out_dir = os.path.join(game_data_dir, 'animations')
last_chance_dir = os.path.join(anims_out_dir, 'last-chance')

web_public_dir = os.path.join(out_base, 'apps', 'web', 'public')
dest_se_anim = os.path.join(web_public_dir, 'Audio', 'SE', 'Anim')
dest_se = os.path.join(web_public_dir, 'Audio', 'SE')
os.makedirs(dest_se_anim, exist_ok=True)
os.makedirs(dest_se, exist_ok=True)

sys.path.append(os.path.join(out_base, 'scripts', 'animation'))
import import_source_animations as isa
isa.patch_reader()
import rubymarshal.reader as r

source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
anims_rxdata_path = os.path.join(source_root, 'Data', 'PkmnAnimations.rxdata')

with open(anims_rxdata_path, 'rb') as f:
    raw_anims = r.load(f)
anim_list = raw_anims.attributes.get('@array', [])

source_se_anim = os.path.join(source_root, 'Audio', 'SE', 'Anim')
source_se = os.path.join(source_root, 'Audio', 'SE')

def copy_sound_file(se_name):
    if not se_name:
        return None
    # Possible candidate filenames
    cand_names = [se_name]
    if not any(se_name.lower().endswith(ext) for ext in ['.wav', '.ogg', '.mp3']):
        cand_names.extend([se_name + '.wav', se_name + '.ogg', se_name + '.mp3'])

    for c in cand_names:
        # Check source anim SE
        src_path = os.path.join(source_se_anim, c)
        if os.path.exists(src_path):
            dst = os.path.join(dest_se_anim, c)
            if not os.path.exists(dst):
                shutil.copy2(src_path, dst)
                print(f"  [COPIED] {c} -> Audio/SE/Anim/")
            return c
        # Check source regular SE
        src_path = os.path.join(source_se, c)
        if os.path.exists(src_path):
            dst = os.path.join(dest_se, c)
            if not os.path.exists(dst):
                shutil.copy2(src_path, dst)
                print(f"  [COPIED] {c} -> Audio/SE/")
            # Also copy to Audio/SE/Anim for consistent relative lookup
            dst2 = os.path.join(dest_se_anim, c)
            if not os.path.exists(dst2):
                shutil.copy2(src_path, dst2)
            return c
    return cand_names[0]

def save_anim(tgt_id, anim_def):
    p1 = os.path.join(anims_out_dir, f"{tgt_id}.json")
    p2 = os.path.join(last_chance_dir, f"{tgt_id}.json")
    with open(p1, 'w', encoding='utf-8') as f:
        json.dump(anim_def, f, indent=2)
    with open(p2, 'w', encoding='utf-8') as f:
        json.dump(anim_def, f, indent=2)

print("Step 1: Fixing Tackle (7247 PL & 7248 OPP)...")
# Copy PRSFX- Tackle.wav
tackle_se = copy_sound_file('PRSFX- Tackle.wav')

# Build 7247 (Player Tackle)
# User lunges from 128, 224 -> 180, 199 -> 128, 224
# Star impacts target (371, 99) with focus='target'
pl_tackle_frames = [
    # Frame 0
    {'cels': [
        {'pattern': -1, 'x': 128, 'y': 224, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 96, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 1
    {'cels': [
        {'pattern': -1, 'x': 154, 'y': 211, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 102, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'},
        {'pattern': 0, 'x': 371, 'y': 99, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 100, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 2
    {'cels': [
        {'pattern': -1, 'x': 180, 'y': 199, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 102, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'},
        {'pattern': 0, 'x': 371, 'y': 99, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 200, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 3
    {'cels': [
        {'pattern': -1, 'x': 162, 'y': 207, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 93, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'},
        {'pattern': 0, 'x': 371, 'y': 99, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 150, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 4
    {'cels': [
        {'pattern': -1, 'x': 145, 'y': 215, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 100, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 5
    {'cels': [
        {'pattern': -1, 'x': 128, 'y': 224, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 96, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 6
    {'cels': [
        {'pattern': -1, 'x': 128, 'y': 224, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 384, 'y': 96, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]}
]

tackle_timings = [
    {
        'frame': 0,
        'type': 'sound',
        'payload': {
            'sound': tackle_se or 'PRSFX- Tackle.wav',
            'volume': 100,
            'pitch': 100
        }
    }
]

anim_7247 = {
    'id': '7247',
    'name': 'Move:TACKLE',
    'graphic': 'PRAS- Strike.png',
    'hue': 0,
    'position': 2, # Target
    'fps': 20,
    'frames': pl_tackle_frames,
    'timings': tackle_timings
}
save_anim(7247, anim_7247)

# Build 7248 (Opponent Tackle)
# Enemy user lunges from 384, 96 -> 332, 121 -> 384, 96
# Target (Player) is at 128, 224
# Star impacts target (397, 99) with focus='target' (so CoordinateTransformer resolves to Player 130, 215)
opp_tackle_frames = [
    # Frame 0
    {'cels': [
        {'pattern': -1, 'x': 384, 'y': 96, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 224, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 1
    {'cels': [
        {'pattern': -1, 'x': 358, 'y': 109, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 230, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'},
        {'pattern': 0, 'x': 397, 'y': 99, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 100, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 2
    {'cels': [
        {'pattern': -1, 'x': 332, 'y': 121, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 230, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'},
        {'pattern': 0, 'x': 397, 'y': 99, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 200, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 3
    {'cels': [
        {'pattern': -1, 'x': 350, 'y': 113, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 221, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'},
        {'pattern': 0, 'x': 397, 'y': 99, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 150, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 4
    {'cels': [
        {'pattern': -1, 'x': 367, 'y': 105, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 228, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 5
    {'cels': [
        {'pattern': -1, 'x': 384, 'y': 96, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 224, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]},
    # Frame 6
    {'cels': [
        {'pattern': -1, 'x': 384, 'y': 96, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': True, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'user'},
        {'pattern': -2, 'x': 128, 'y': 224, 'zoomX': 100, 'zoomY': 100, 'angle': 0, 'mirror': False, 'opacity': 255, 'blendMode': 'normal', 'visible': True, 'priority': 1, 'focus': 'target'}
    ]}
]

anim_7248 = {
    'id': '7248',
    'name': 'OppMove:TACKLE',
    'graphic': 'PRAS- Strike.png',
    'hue': 0,
    'position': 2,
    'fps': 20,
    'frames': opp_tackle_frames,
    'timings': tackle_timings
}
save_anim(7248, anim_7248)
print("  Fixed Tackle 7247 and 7248 with authentic sound and target impact!")

print("\nStep 2: Restoring Sound Timings for all Rx-based Batch 1 Moves...")
# Mapping of (pl_id, opp_id, rx_id, move_name)
batch1_rx_moves = [
    (7249, 7250, 486, 'tail_glow'),
    (7251, 7252, 783, 'tail_slap'),
    (7253, 7254, 255, 'tail_whip'),
    (7255, 7256, 812, 'tailwind'),
    (7257, 7258, 184, 'take_down'),
    (7259, 7260, 1331, 'tar_shot'),
    (7261, 7262, 215, 'taunt'),
    (7263, 7264, 966, 'tearful_look'),
    (7265, 7266, 1298, 'teatime'),
    (7267, 7268, 907, 'techno_blast'),
    (7273, 7274, 152, 'teleport'),
    (7275, 7276, 1332, 'terrain_pulse'),
    (7279, 7280, 987, 'thousand_arrows'),
    (7281, 7282, 988, 'thousand_waves'),
    (7283, 7284, 604, 'thrash'),
    (7285, 7286, 1106, 'throat_chop'),
    (7287, 7288, 125, 'thunder'),
    (7289, 7290, 1350, 'thunder_cage'),
    (7291, 7292, 237, 'thunder_fang'),
    (7293, 7294, 99, 'thunder_punch'),
    (7295, 7296, 238, 'thunder_shock'),
    (7301, 7302, 1352, 'thunderous_kick'),
]

for pl_id, opp_id, rx_id, m_name in batch1_rx_moves:
    if rx_id >= len(anim_list) or not anim_list[rx_id]:
        continue
    rx = anim_list[rx_id]
    raw_timings = rx.attributes.get('@timing', rx.attributes.get('@timings', []))
    
    extracted_timings = []
    for t in raw_timings:
        t_attrs = t.attributes if hasattr(t, 'attributes') else {}
        tname = t_attrs.get('@name') if '@name' in t_attrs else t_attrs.get(b'@name', b'')
        if isinstance(tname, bytes):
            tname = tname.decode('utf-8', errors='ignore')
        
        # Check inner @se if any
        se = t_attrs.get('@se') or t_attrs.get(b'@se')
        se_name = ''
        vol = t_attrs.get('@volume') or t_attrs.get(b'@volume', 100)
        pitch = t_attrs.get('@pitch') or t_attrs.get(b'@pitch', 100)
        if se and hasattr(se, 'attributes'):
            se_attrs = se.attributes
            se_name = se_attrs.get('@name') or se_attrs.get(b'@name', '')
            if isinstance(se_name, bytes):
                se_name = se_name.decode('utf-8', errors='ignore')
            vol = se_attrs.get('@volume') or se_attrs.get(b'@volume', vol)
            pitch = se_attrs.get('@pitch') or se_attrs.get(b'@pitch', pitch)
            
        chosen_se = ''
        for cand in [tname, se_name]:
            if cand and not any(cand.lower().endswith(ext) for ext in ['.png', '.jpg', '.bmp']):
                chosen_se = cand
                break
                
        if chosen_se:
            # Copy file if needed
            copied_file = copy_sound_file(chosen_se)
            frame = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
            extracted_timings.append({
                'frame': frame,
                'type': 'sound',
                'payload': {
                    'sound': copied_file or chosen_se,
                    'volume': vol,
                    'pitch': pitch
                }
            })
            
    # Also check if any flash timings
    for t in raw_timings:
        t_attrs = t.attributes if hasattr(t, 'attributes') else {}
        flash_scope = t_attrs.get('@flashScope') or t_attrs.get(b'@flashScope', 0)
        flash_dur = t_attrs.get('@flashDuration') or t_attrs.get(b'@flashDuration', 0)
        if flash_scope and flash_dur:
            frame = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
            fc = t_attrs.get('@flashColor')
            fc_attrs = fc.attributes if hasattr(fc, 'attributes') else {}
            r_c = fc_attrs.get('@red', 255)
            g_c = fc_attrs.get('@green', 255)
            b_c = fc_attrs.get('@blue', 255)
            a_c = fc_attrs.get('@alpha', 255)
            extracted_timings.append({
                'frame': frame,
                'type': 'flash',
                'payload': {
                    'duration': flash_dur,
                    'scope': flash_scope,
                    'color': [r_c, g_c, b_c, a_c]
                }
            })

    # Sort timings by frame
    extracted_timings.sort(key=lambda x: x['frame'])

    # Apply to PL and OPP
    for aid in [pl_id, opp_id]:
        p = os.path.join(anims_out_dir, f"{aid}.json")
        if os.path.exists(p):
            with open(p, 'r', encoding='utf-8') as f:
                anim = json.load(f)
            anim['timings'] = extracted_timings
            save_anim(aid, anim)
    
    sound_names = [t['payload']['sound'] for t in extracted_timings if t['type'] == 'sound']
    print(f"  Restored timings for {m_name} (IDs {pl_id}/{opp_id}): {sound_names}")

print("\nStep 3: Restoring Sound Timings for Custom Batch 1 Moves...")
# Teeter dance (7269 / 7270)
copy_sound_file('PRSFX- Teeter Dance.wav')
teeter_timings = [
    {'frame': 0, 'type': 'sound', 'payload': {'sound': 'PRSFX- Teeter Dance.wav', 'volume': 80, 'pitch': 100}},
    {'frame': 14, 'type': 'sound', 'payload': {'sound': 'PRSFX- Teeter Dance.wav', 'volume': 80, 'pitch': 110}}
]
for aid in [7269, 7270]:
    p = os.path.join(anims_out_dir, f"{aid}.json")
    with open(p, 'r', encoding='utf-8') as f:
        a = json.load(f)
    a['timings'] = teeter_timings
    save_anim(aid, a)
print("  Restored timings for Teeter Dance (7269/7270)")

# Telekinesis (7271 / 7272)
copy_sound_file('PRSFX- Telekinesis.wav')
tele_timings = [
    {'frame': 0, 'type': 'sound', 'payload': {'sound': 'PRSFX- Telekinesis.wav', 'volume': 85, 'pitch': 100}},
    {'frame': 15, 'type': 'sound', 'payload': {'sound': 'PRSFX- Telekinesis.wav', 'volume': 80, 'pitch': 110}}
]
for aid in [7271, 7272]:
    p = os.path.join(anims_out_dir, f"{aid}.json")
    with open(p, 'r', encoding='utf-8') as f:
        a = json.load(f)
    a['timings'] = tele_timings
    save_anim(aid, a)
print("  Restored timings for Telekinesis (7271/7272)")

# Thief (7277 / 7278)
copy_sound_file('Blow6.ogg')
copy_sound_file('Darkness6.ogg')
copy_sound_file('PRSFX- Switcheroo.wav')
thief_timings = [
    {'frame': 0, 'type': 'sound', 'payload': {'sound': 'Darkness6.ogg', 'volume': 75, 'pitch': 100}},
    {'frame': 8, 'type': 'sound', 'payload': {'sound': 'Blow6.ogg', 'volume': 80, 'pitch': 100}},
    {'frame': 12, 'type': 'sound', 'payload': {'sound': 'PRSFX- Switcheroo.wav', 'volume': 80, 'pitch': 100}}
]
for aid in [7277, 7278]:
    p = os.path.join(anims_out_dir, f"{aid}.json")
    with open(p, 'r', encoding='utf-8') as f:
        a = json.load(f)
    a['timings'] = thief_timings
    save_anim(aid, a)
print("  Restored timings for Thief (7277/7278)")

print("\nAll Tackle & Sound Timing fixes successfully applied!")
