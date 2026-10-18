#!/usr/bin/env python3
"""
Importer & Optimizer for the 6 A-group Moves from Pokémon Unbreakable Ties 4.1.2:
- amnesia (ID 33, rxdata 49)
- arm_thrust (ID 6314 Player, 6320 Opp, rxdata 549 & 554)
- aromatherapy (ID 36, rxdata 53)
- aromatic_mist (ID 6698, rxdata 949)
- assist (ID 6326, rxdata 544)
- assurance (ID 6327, rxdata 644)
Also aliases ancient_power -> 34.
"""

import os
import sys
import json
import shutil
from PIL import Image

sys.path.append(os.path.dirname(__file__))
import import_source_animations
import_source_animations.patch_reader()
import rubymarshal.reader as r

def main():
    source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
    data_dir = os.path.join(source_root, 'Data')
    anims_rxdata_path = os.path.join(data_dir, 'PkmnAnimations.rxdata')

    out_base = r'e:\Pokemon'
    game_data_dir = os.path.join(out_base, 'packages', 'game-data')
    anims_out_dir = os.path.join(game_data_dir, 'animations')
    last_chance_dir = os.path.join(anims_out_dir, 'last-chance')
    os.makedirs(anims_out_dir, exist_ok=True)
    os.makedirs(last_chance_dir, exist_ok=True)

    print('[1/6] Copying Audio SE files from Unbreakable Ties...')
    audio_src_dir = os.path.join(source_root, 'Audio', 'SE', 'Anim')
    audio_dst_dirs = [
        os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE', 'Anim'),
        os.path.join(out_base, 'Audio', 'SE', 'Anim'),
        os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE'),
    ]
    for d in audio_dst_dirs:
        os.makedirs(d, exist_ok=True)

    se_files = [
        'PRSFX- Amnesia.wav',
        'PRSFX- Arm Thrust.wav',
        'PRSFX- Aromatherapy.wav',
        'PRSFX- Aromatic Mist.wav',
        'PRSFX- Assist.wav',
        'PRSFX- Assurance.wav',
    ]

    for se in se_files:
        src_path = os.path.join(audio_src_dir, se)
        if os.path.exists(src_path):
            for d in audio_dst_dirs:
                dst_path = os.path.join(d, se)
                shutil.copy2(src_path, dst_path)
            print(f'  Copied audio: {se}')
        else:
            print(f'  WARNING: Audio missing in source: {src_path}')

    print('[2/6] Loading PkmnAnimations.rxdata from Unbreakable Ties...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)
    anim_list = raw_anims.attributes.get('@array', [])
    print(f'  Total animation entries in rxdata: {len(anim_list)}')

    # Move specs: (move_key, rxdata_player_id, rxdata_opp_id, target_player_ids, target_opp_ids)
    move_specs = [
        ('amnesia', 49, None, [33, 6031], []),
        ('arm_thrust', 549, 554, [6314], [6320]),
        ('aromatherapy', 53, None, [36, 6034], []),
        ('aromatic_mist', 949, None, [6698], []),
        ('assist', 544, None, [6326], []),
        ('assurance', 644, None, [6327], []),
    ]

    needed_raw_ids = set()
    for _, p_raw, o_raw, _, _ in move_specs:
        if p_raw is not None:
            needed_raw_ids.add(p_raw)
        if o_raw is not None:
            needed_raw_ids.add(o_raw)

    print(f'[3/6] Parsing animations: {sorted(list(needed_raw_ids))}...')
    parsed_by_raw_id = {}

    for aid in sorted(needed_raw_ids):
        attrs = anim_list[aid].attributes
        name = attrs.get('@name', '')
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='ignore')
        graphic = attrs.get('@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')
        if graphic.lower().endswith('.png'):
            graphic = graphic[:-4]

        raw_frames = attrs.get('@array', [])
        frames = []
        for f in raw_frames:
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = import_source_animations.parse_cel(cel_data)
                    if cel is not None:
                        cels.append(cel)
            frames.append({'cels': cels})

        import_source_animations.normalize_both_focus_coordinates(frames)

        raw_timings = attrs.get('@timing', []) or []
        timings = []
        for t in raw_timings:
            if not hasattr(t, 'attributes'):
                continue
            t_attrs = t.attributes
            frame = t_attrs.get('@frame', 0)
            sound_name = t_attrs.get('@name', '')
            if isinstance(sound_name, bytes):
                sound_name = sound_name.decode('utf-8', errors='ignore')

            timing_type = 'flash'
            payload = {}

            is_image = sound_name.lower().endswith(('.png', '.jpg', '.bmp'))
            if sound_name and not is_image:
                timing_type = 'sound'
                clean_snd = sound_name.replace('\\', '/').strip('/')
                if not clean_snd.lower().startswith('anim/'):
                    clean_snd = f'Anim/{clean_snd}'
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

        # Special enhancement for aromatic_mist (aid 949):
        # Author screen foreground cels for PRAS- Mist FG and PRAS- Aromatherapy FG
        if aid == 949:
            graphic = 'PRAS- Mist FG'
            total_f = len(frames)
            for f_idx in range(total_f):
                cels = frames[f_idx]['cels']
                # Add mist layer (frames 0..65)
                if f_idx <= 65:
                    if f_idx < 10:
                        opacity = int((f_idx / 10.0) * 180)
                    elif f_idx <= 50:
                        opacity = 180
                    else:
                        opacity = int(((65 - f_idx) / 15.0) * 180)
                    cels.append({
                        'pattern': 0,
                        'graphic': 'PRAS- Mist FG',
                        'x': 256,
                        'y': 192,
                        'zoomX': 100,
                        'zoomY': 100,
                        'angle': 0,
                        'mirror': False,
                        'opacity': opacity,
                        'blendMode': 'additive',
                        'visible': True,
                        'priority': 0,
                        'focus': 'screen',
                    })
                # Add aromatherapy petal/aroma layer (frames 4..65)
                if 4 <= f_idx <= 65:
                    prog = f_idx - 4
                    if prog < 10:
                        a_opacity = int((prog / 10.0) * 160)
                    elif prog <= 45:
                        a_opacity = 160
                    else:
                        a_opacity = int(((65 - f_idx) / 16.0) * 160)
                    pat = 1 if f_idx >= 25 else 0
                    cels.append({
                        'pattern': pat,
                        'graphic': 'PRAS- Aromatherapy FG',
                        'x': 256,
                        'y': 192,
                        'zoomX': 100,
                        'zoomY': 100,
                        'angle': 0,
                        'mirror': False,
                        'opacity': a_opacity,
                        'blendMode': 'additive',
                        'visible': True,
                        'priority': 2,
                        'focus': 'screen',
                    })

        parsed_by_raw_id[aid] = {
            'name': name,
            'graphic': graphic,
            'hue': attrs.get('@hue', 0),
            'position': attrs.get('@position', 4),
            'fps': 20,
            'frames': frames,
            'timings': timings,
        }
        print(f'  Parsed Anim {aid:4}: {name} ({len(frames)} frames, {len(timings)} timings, graphic: {graphic})')

    print('[4/6] Updating Animation Atlas Metadata...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    last_chance_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(last_chance_atlas_path, 'r', encoding='utf-8') as f:
        last_atlas = json.load(f)

    new_atlas_entries = {
        'PRAS- Amnesia': {
            'assetKey': 'animation.pras--amnesia',
            'file': 'PRAS- Amnesia.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10,
        },
        'PRAS- Aromatherapy': {
            'assetKey': 'animation.pras--aromatherapy',
            'file': 'PRAS- Aromatherapy.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10,
        },
        'PRAS- Aromatherapy FG': {
            'assetKey': 'animation.pras--aromatherapyfg',
            'file': 'PRAS- Aromatherapy FG.png',
            'width': 1024,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 2,
            'rows': 1,
            'maxPattern': 2,
        },
    }

    for k, v in new_atlas_entries.items():
        atlas[k] = v
        last_atlas[k] = v
        print(f'  Added atlas entry: {k} -> {v}')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)
    with open(last_chance_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(last_atlas, f, indent=2, ensure_ascii=False)

    print('[5/6] Writing Animation JSON definitions & Manifests...')
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_manifest_path, 'r', encoding='utf-8') as f:
        last_manifest = json.load(f)

    for move_key, p_raw, o_raw, p_target_ids, o_target_ids in move_specs:
        p_data = parsed_by_raw_id[p_raw]
        o_data = parsed_by_raw_id[o_raw] if o_raw is not None else None

        for tid in p_target_ids:
            t_obj = dict(p_data)
            t_obj['id'] = str(tid)
            # Write to base and last-chance
            for out_dir in [anims_out_dir, last_chance_dir]:
                target_file = os.path.join(out_dir, f'{tid}.json')
                with open(target_file, 'w', encoding='utf-8') as f:
                    json.dump(t_obj, f, ensure_ascii=False)

            manifest_entry = {
                'id': str(tid),
                'name': t_obj['name'],
                'graphic': t_obj['graphic'],
                'position': t_obj['position'],
                'frameCount': len(t_obj['frames']),
                'timingCount': len(t_obj['timings']),
            }
            manifest[str(tid)] = manifest_entry
            last_manifest[str(tid)] = manifest_entry
            print(f'  Saved animation {tid} ({move_key} player): {len(t_obj["frames"])} frames')

        for tid in o_target_ids:
            if o_data is None:
                continue
            t_obj = dict(o_data)
            t_obj['id'] = str(tid)
            for out_dir in [anims_out_dir, last_chance_dir]:
                target_file = os.path.join(out_dir, f'{tid}.json')
                with open(target_file, 'w', encoding='utf-8') as f:
                    json.dump(t_obj, f, ensure_ascii=False)

            manifest_entry = {
                'id': str(tid),
                'name': t_obj['name'],
                'graphic': t_obj['graphic'],
                'position': t_obj['position'],
                'frameCount': len(t_obj['frames']),
                'timingCount': len(t_obj['timings']),
            }
            manifest[str(tid)] = manifest_entry
            last_manifest[str(tid)] = manifest_entry
            print(f'  Saved animation {tid} ({move_key} opponent): {len(t_obj["frames"])} frames')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_manifest, f, indent=2, ensure_ascii=False)

    print('[6/6] Updating Move Mappings & Databases...')
    # 1. Update move-animation-map.json & move-animation-extensions.json
    move_map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    move_ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(move_map_path, 'r', encoding='utf-8') as f:
        move_map = json.load(f)
    with open(move_ext_path, 'r', encoding='utf-8') as f:
        move_ext = json.load(f)

    # Ensure mappings
    move_map['moves']['amnesia'] = 33
    move_map['moves']['aromatherapy'] = 36
    move_map['moves']['ancient_power'] = 34
    move_map['moves']['ancientpower'] = 34

    move_ext['moves']['arm_thrust'] = 6314
    move_ext['opponentMoves']['arm_thrust'] = 6320
    move_ext['moves']['assist'] = 6326
    move_ext['moves']['assurance'] = 6327
    move_ext['moves']['aromatic_mist'] = 6698

    with open(move_map_path, 'w', encoding='utf-8') as f:
        json.dump(move_map, f, indent=2, ensure_ascii=False)
    with open(move_ext_path, 'w', encoding='utf-8') as f:
        json.dump(move_ext, f, indent=2, ensure_ascii=False)

    # 2. Update reunion-moves.json
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion = json.load(f)

    opt_set = set(reunion.get('optimizedMoves', []))
    for m in ['amnesia', 'arm_thrust', 'aromatherapy', 'aromatic_mist', 'assist', 'assurance', 'ancient_power']:
        opt_set.add(m)
    reunion['optimizedMoves'] = sorted(list(opt_set))

    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion, f, indent=2, ensure_ascii=False)

    # 3. Update move-animations-db.json
    moves_anim_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(moves_anim_db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)

    updates = {
        'amnesia': {'animId': 33, 'frameCount': len(parsed_by_raw_id[49]['frames'])},
        'arm_thrust': {'animId': 6314, 'oppAnimId': 6320, 'frameCount': len(parsed_by_raw_id[549]['frames'])},
        'aromatherapy': {'animId': 36, 'frameCount': len(parsed_by_raw_id[53]['frames'])},
        'aromatic_mist': {'animId': 6698, 'frameCount': len(parsed_by_raw_id[949]['frames'])},
        'assist': {'animId': 6326, 'frameCount': len(parsed_by_raw_id[544]['frames'])},
        'assurance': {'animId': 6327, 'frameCount': len(parsed_by_raw_id[644]['frames'])},
        'ancient_power': {'animId': 34, 'frameCount': 34},
    }
    for m, d in updates.items():
        if m in anim_db:
            anim_db[m].update(d)
        else:
            anim_db[m] = d

    with open(moves_anim_db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2, ensure_ascii=False)

    print('\n[OK] Successfully completed optimization for the 6 A-group moves!')

if __name__ == '__main__':
    main()
