#!/usr/bin/env python3
"""
Fix for close_combat animation.
Imports authentic 1:1 Close Combat animations from Unbreakable Ties 4.1.2:
  - Anim 93: Player Close Combat -> ID 6790
  - Anim 94: Opponent Close Combat -> ID 6791
"""

import os
import sys
import json
import shutil
from PIL import Image

sys.path.append(r'e:\Pokemon\scripts\animation')
import import_source_animations
import_source_animations.patch_reader()
import rubymarshal.reader as r

def main():
    source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
    rxdata_path = os.path.join(source_root, 'Data', 'PkmnAnimations.rxdata')

    out_base = r'e:\Pokemon'
    game_data_dir = os.path.join(out_base, 'packages', 'game-data')
    anims_out_dir = os.path.join(game_data_dir, 'animations')
    last_chance_dir = os.path.join(anims_out_dir, 'last-chance')
    public_se_dir = os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE')
    source_se_dir = os.path.join(source_root, 'Audio', 'SE')

    # Copy SE
    for ext in ['', '.wav']:
        src_snd = os.path.join(source_se_dir, 'Anim', 'PRSFX- Close Combat' + ext)
        if os.path.exists(src_snd):
            shutil.copy2(src_snd, os.path.join(public_se_dir, 'Anim', 'PRSFX- Close Combat' + ext))
            shutil.copy2(src_snd, os.path.join(public_se_dir, 'PRSFX- Close Combat' + ext))

    with open(rxdata_path, 'rb') as f:
        raw_anims = r.load(f)

    anim_list = raw_anims.attributes.get('@array', [])

    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    def parse_anim(aid, is_opp=False):
        attrs = anim_list[aid].attributes
        name = attrs.get('@name', '')
        if isinstance(name, bytes): name = name.decode('utf-8')
        graphic = attrs.get('@graphic', '')
        if isinstance(graphic, bytes): graphic = graphic.decode('utf-8')

        raw_frames = attrs.get('@array', [])
        frames = []

        clean_g = graphic[:-4] if graphic.lower().endswith('.png') else graphic
        max_p = atlas.get(clean_g, {}).get('maxPattern', 999)

        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = import_source_animations.parse_cel(cel_data)
                    if cel is not None:
                        p = cel.get('pattern', -1)
                        if p == -1:
                            cel['focus'] = 'user'
                            if is_opp:
                                # In Opponent Close Combat (Anim 94), attacking enemy was stored in pat=-2 at (256, 160).
                                # Here pat=-1 is the attacker (enemy), so rush forward to (256, 160) during the punch barrage:
                                if 5 <= fi <= 30:
                                    cel['x'] = 256
                                    cel['y'] = 160
                                elif fi == 35:
                                    cel['x'] = 384
                                    cel['y'] = 96
                                else:
                                    cel['x'] = 384
                                    cel['y'] = 96
                        elif p == -2:
                            cel['focus'] = 'target'
                            if is_opp:
                                # In Opponent Close Combat, defender is player at (128, 224):
                                cel['x'] = 128
                                cel['y'] = 224
                        else:
                            # Clamp pattern
                            if p >= max_p:
                                cel['pattern'] = max_p - 1
                            
                            # In OppMove (94), effect punches were authored shifted by (-256, +128) near (128, 224).
                            # Normalize back to standard target anchor (384, 96):
                            if is_opp and cel.get('focus') == 'target':
                                cel['x'] += 256
                                cel['y'] -= 128

                        cels.append(cel)
            frames.append({'cels': cels})

        raw_timings = attrs.get('@timing', []) or []
        timings = []
        for t in raw_timings:
            if not hasattr(t, 'attributes'): continue
            t_attrs = t.attributes
            frame = t_attrs.get('@frame', 0)
            sound_name = t_attrs.get('@name', '')
            if isinstance(sound_name, bytes): sound_name = sound_name.decode('utf-8')
            
            payload = {}
            timing_type = 'flash'
            if sound_name and not sound_name.lower().endswith(('.png', '.jpg', '.bmp')):
                timing_type = 'sound'
                clean_snd = sound_name.replace('\\', '/').strip('/')
                payload['sound'] = clean_snd
                payload['volume'] = t_attrs.get('@volume', 80)
                payload['pitch'] = t_attrs.get('@pitch', 100)

            flash_scope = t_attrs.get('@flashScope', 0)
            if flash_scope and flash_scope > 0:
                timing_type = 'flash'
                payload['flashScope'] = flash_scope
                payload['flashDuration'] = t_attrs.get('@flashDuration', 5)
                fc = t_attrs.get('@flashColor')
                if fc:
                    if hasattr(fc, 'attributes'):
                        c_attrs = fc.attributes
                        payload['flashColor'] = [
                            c_attrs.get('@red', 255),
                            c_attrs.get('@green', 255),
                            c_attrs.get('@blue', 255),
                            c_attrs.get('@alpha', 255),
                        ]
                    elif isinstance(fc, (list, tuple)):
                        payload['flashColor'] = list(fc)

            timings.append({
                'frame': frame,
                'type': timing_type,
                'payload': payload,
            })

        return {
            'name': name,
            'graphic': graphic,
            'hue': attrs.get('@hue', 0),
            'position': attrs.get('@position', 4),
            'fps': 20,
            'frames': frames,
            'timings': timings,
        }

    p_data = parse_anim(93, is_opp=False)
    o_data = parse_anim(94, is_opp=True)

    # Write JSON files
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        lc_manifest = json.load(f)

    for target_id, data in [(6790, p_data), (6791, o_data)]:
        payload = dict(data)
        payload['id'] = str(target_id)
        
        main_path = os.path.join(anims_out_dir, f'{target_id}.json')
        lc_path = os.path.join(last_chance_dir, f'{target_id}.json')
        with open(main_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        with open(lc_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        manifest_entry = {
            'id': str(target_id),
            'name': data['name'],
            'graphic': data['graphic'],
            'position': data['position'],
            'frameCount': len(data['frames']),
            'timingCount': len(data['timings']),
        }
        manifest[str(target_id)] = manifest_entry
        lc_manifest[str(target_id)] = manifest_entry
        print(f"Wrote animation {target_id}: {data['name']} ({len(data['frames'])} frames)")

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(lc_manifest, f, indent=2, ensure_ascii=False)

    # Update move-animation-map.json
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)

    anim_map['moves']['close_combat'] = 6790
    if 'opponentMoves' not in anim_map:
        anim_map['opponentMoves'] = {}
    anim_map['opponentMoves']['close_combat'] = 6791

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2, ensure_ascii=False)

    # Update move-animation-extensions.json
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext = json.load(f)

    ext['moves']['close_combat'] = 6790
    if 'opponentMoves' not in ext:
        ext['opponentMoves'] = {}
    ext['opponentMoves']['close_combat'] = 6791

    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext, f, indent=2, ensure_ascii=False)

    # Update move-animations-db.json
    db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)

    db['close_combat'] = {
        'animId': 6790,
        'opponentAnimId': 6791,
        'source': 'Unbreakable Ties 4.1.2',
        'hasDedicatedAnimation': True,
    }

    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

    # Update reunion-moves.json
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion = json.load(f)

    opt_set = set(reunion.get('optimizedMoves', []))
    all_set = set(reunion.get('allReunionMoves', []))
    opt_set.add('close_combat')
    all_set.add('close_combat')
    reunion['optimizedMoves'] = sorted(list(opt_set))
    reunion['allReunionMoves'] = sorted(list(all_set))
    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion, f, indent=2, ensure_ascii=False)

    print("Successfully fixed close_combat animation!")

if __name__ == '__main__':
    main()
