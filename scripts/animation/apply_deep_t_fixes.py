#!/usr/bin/env python3
"""
Applies deep, comprehensive fixes to Group T move sounds and timings:
1. Extracts exact timings from PkmnAnimations.rxdata for the 10 moves.
2. Copies all authentic sound files to apps/web/public/Audio/SE/Anim/ and Audio/SE/.
3. Updates packages/game-data/animations/{id}.json and last-chance/{id}.json.
"""

import os, sys, json, shutil

sys.path.append('scripts/animation')
import import_source_animations as isa
isa.patch_reader()
import rubymarshal.reader as r

source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
source_se_anim = os.path.join(source_root, 'Audio', 'SE', 'Anim')
source_se = os.path.join(source_root, 'Audio', 'SE')

web_public = r'e:\Pokemon\apps\web\public'
dest_se_anim = os.path.join(web_public, 'Audio', 'SE', 'Anim')
dest_se = os.path.join(web_public, 'Audio', 'SE')
os.makedirs(dest_se_anim, exist_ok=True)
os.makedirs(dest_se, exist_ok=True)

rx_data_path = os.path.join(source_root, 'Data', 'PkmnAnimations.rxdata')
anims = r.load(open(rx_data_path, 'rb')).attributes['@array']

moves_to_fix = [
    ('tail_glow', 7249, 7250, 201),
    ('tailwind', 7255, 7256, 724),
    ('take_down', 7257, 7258, 602),
    ('tar_shot', 7259, 7260, 1298),
    ('taunt', 7261, 7262, 513),
    ('teatime', 7265, 7266, 1297),
    ('techno_blast', 7267, 7268, 976),
    ('thousand_arrows', 7279, 7280, 1120),
    ('thousand_waves', 7281, 7282, 1132),
    ('throat_chop', 7285, 7286, 916),
]

all_anims_dirs = [
    r'e:\Pokemon\packages\game-data\animations',
    r'e:\Pokemon\packages\game-data\animations\last-chance'
]

for name, pl_id, opp_id, rx_id in moves_to_fix:
    rx = anims[rx_id]
    rname = rx.attributes.get('@name')
    if isinstance(rname, bytes): rname = rname.decode('utf-8', errors='ignore')
    
    rx_timings = rx.attributes.get('@timing', [])
    timings = []
    
    for t in rx_timings:
        ta = t.attributes if hasattr(t, 'attributes') else {}
        snd = ta.get('@name') or ta.get(b'@name', b'')
        if isinstance(snd, bytes): snd = snd.decode('utf-8', errors='ignore')
        snd = snd.strip()
        
        # Skip image backgrounds or blank names
        if not snd or any(snd.lower().endswith(ext) for ext in ['.png', '.jpg', '.bmp']):
            continue
            
        # Ensure extension
        clean_snd = snd
        if not clean_snd.lower().endswith(('.wav', '.ogg', '.mp3')):
            clean_snd += '.wav'
            
        frame = ta.get('@frame', 0)
        vol = ta.get('@volume', 80)
        pitch = ta.get('@pitch', 100)
        
        timings.append({
            'frame': frame,
            'type': 'sound',
            'payload': {
                'sound': clean_snd,
                'volume': vol,
                'pitch': pitch
            }
        })
        
        # Copy file
        # Search for file in source_se_anim and source_se
        found = False
        for sdir in [source_se_anim, source_se]:
            for cand in [clean_snd, snd, os.path.splitext(clean_snd)[0] + '.wav', os.path.splitext(clean_snd)[0] + '.ogg']:
                sp = os.path.join(sdir, cand)
                if os.path.exists(sp):
                    shutil.copy2(sp, os.path.join(dest_se_anim, clean_snd))
                    shutil.copy2(sp, os.path.join(dest_se, clean_snd))
                    print(f"  [COPIED] {cand} -> {clean_snd}")
                    found = True
                    break
            if found: break
        if not found:
            print(f"  [WARN] Could not find source audio for: '{snd}' (clean: '{clean_snd}')")

    print(f"Updating {name} (PL {pl_id}, OPP {opp_id}) with {len(timings)} timings from Rx {rx_id} ({rname}):")
    for t in timings:
        print(f"   F{t['frame']}: {t['payload']['sound']} (vol: {t['payload']['volume']}, pitch: {t['payload']['pitch']})")

    # Update JSON files
    for aid in [pl_id, opp_id]:
        for base in all_anims_dirs:
            p = os.path.join(base, f"{aid}.json")
            if os.path.exists(p):
                with open(p, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                data['timings'] = timings
                with open(p, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2)

print("\nAll 10 moves successfully updated with authentic sounds and timings!")
