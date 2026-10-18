#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 C-Group Battle Animations - Batch 3.
Replaces 12 old EBDX / collided animations with 1:1 PRAS animations:
  - charge (90 -> 6792)
  - charm (91 -> 6793)
  - clear_smog (92 -> 6794)
  - comet_punch (366..370 -> 6795..6799)
  - confuse_ray (224 -> 6800)
  - cotton_guard (303 -> 6801)
  - cotton_spore (340 -> 6802)
  - counter (137 -> 6803)
  - crunch (298 -> 6804)
  - crush_claw (153 -> 6805, 154 -> 6806)
  - curse (248 -> 6807, 249 -> 6808)
  - cut (74 -> 6809)
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
    public_se_dir = os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE')
    source_se_dir = os.path.join(source_root, 'Audio', 'SE')

    os.makedirs(anims_out_dir, exist_ok=True)
    os.makedirs(last_chance_dir, exist_ok=True)
    os.makedirs(public_se_dir, exist_ok=True)
    os.makedirs(os.path.join(public_se_dir, 'Anim'), exist_ok=True)

    print('[1/6] Loading PkmnAnimations.rxdata from Unbreakable Ties...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)

    anim_list = raw_anims.attributes.get('@array', [])
    print(f'  Total animation entries in rxdata: {len(anim_list)}')

    # Specification for Batch 3 (12 moves):
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_ids, target_opp_ids, aux_ids)
    batch3_specs = [
        ('charge', 90, None, [6792], [], []),
        ('charm', 91, None, [6793], [], []),
        ('clear_smog', 92, None, [6794], [], []),
        ('comet_punch', 366, None, [6795, 6796, 6797, 6798, 6799], [], []), # 366..370
        ('confuse_ray', 224, None, [6800], [], []),
        ('cotton_guard', 303, None, [6801], [], []),
        ('cotton_spore', 340, None, [6802], [], []),
        ('counter', 137, None, [6803], [], []),
        ('crunch', 298, None, [6804], [], []),
        ('crush_claw', 153, 154, [6805], [6806], []),
        ('curse', 248, None, [6807], [], [6808]), # 249 is aux
        ('cut', 74, None, [6809], [], []),
    ]

    needed_raw_ids = {
        90, 91, 92,
        366, 367, 368, 369, 370,
        224, 303, 340, 137, 298,
        153, 154,
        248, 249,
        74
    }

    print(f'[2/6] Parsing {len(needed_raw_ids)} animations from rxdata...')
    parsed_by_raw_id = {}
    used_graphics = set()
    copied_audio_files = set()

    for aid in sorted(needed_raw_ids):
        if aid >= len(anim_list) or anim_list[aid] is None or not hasattr(anim_list[aid], 'attributes'):
            print(f'  WARNING: Animation ID {aid} missing in rxdata!')
            continue
        attrs = anim_list[aid].attributes
        name = attrs.get('@name', '')
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='ignore')
        graphic = attrs.get('@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')
        if graphic:
            clean_g = graphic[:-4] if graphic.lower().endswith('.png') else graphic
            used_graphics.add(clean_g)

        raw_frames = attrs.get('@array', [])
        frames = []
        is_opp_anim = name.lower().startswith('oppmove:') or aid == 154

        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = import_source_animations.parse_cel(cel_data)
                    if cel is not None:
                        # 1. Enforce battler focus constraints
                        if cel.get('pattern') == -1:
                            cel['focus'] = 'user'
                        elif cel.get('pattern') == -2:
                            cel['focus'] = 'target'
                        else:
                            # 2. OppMove coordinate normalization & synchronization
                            if is_opp_anim:
                                # Crush Claw (154):
                                # Authored with cels hitting player around (128, 224). Shift to (384, 96):
                                if aid == 154 and cel.get('focus') == 'target':
                                    cel['x'] += 256
                                    cel['y'] -= 128

                        cels.append(cel)
            frames.append({'cels': cels})

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
                payload['sound'] = clean_snd
                payload['volume'] = t_attrs.get('@volume', 80)
                payload['pitch'] = t_attrs.get('@pitch', 100)

                # Copy sound file if not in destination
                for ext in ['', '.wav', '.ogg', '.mp3']:
                    src_candidates = [
                        os.path.join(source_se_dir, clean_snd + ext),
                        os.path.join(source_se_dir, 'Anim', clean_snd + ext),
                        os.path.join(source_se_dir, clean_snd.replace('Anim/', '') + ext),
                    ]
                    for s_candidate in src_candidates:
                        if os.path.exists(s_candidate):
                            dest_candidate = os.path.join(public_se_dir, clean_snd + ext)
                            dest_sub = os.path.dirname(dest_candidate)
                            os.makedirs(dest_sub, exist_ok=True)
                            if not os.path.exists(dest_candidate):
                                shutil.copy2(s_candidate, dest_candidate)
                                copied_audio_files.add(os.path.basename(dest_candidate))
                            break

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

        parsed_by_raw_id[aid] = {
            'name': name,
            'graphic': graphic,
            'hue': attrs.get('@hue', 0),
            'position': attrs.get('@position', 4),
            'fps': 20,
            'frames': frames,
            'timings': timings,
        }

    print(f'  Parsed {len(parsed_by_raw_id)} raw animation definitions.')
    print(f'  Migrated {len(copied_audio_files)} new SE audio files.')

    print('[3/6] Writing JSON animation files to packages/game-data/animations/...')
    # Load manifest
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        lc_manifest = json.load(f)

    written_count = 0
    exported_target_map = {} # target_id -> anim_def

    # Map raw animations to their designated target IDs
    id_mapping = {
        6792: 90,  # charge
        6793: 91,  # charm
        6794: 92,  # clear_smog
        6795: 366, # comet_punch 1
        6796: 367, # comet_punch 2
        6797: 368, # comet_punch 3
        6798: 369, # comet_punch 4
        6799: 370, # comet_punch 5
        6800: 224, # confuse_ray
        6801: 303, # cotton_guard
        6802: 340, # cotton_spore
        6803: 137, # counter
        6804: 298, # crunch
        6805: 153, # crush_claw player
        6806: 154, # crush_claw opp
        6807: 248, # curse player
        6808: 249, # curse aux
        6809: 74,  # cut
    }

    for target_id, raw_id in id_mapping.items():
        if raw_id not in parsed_by_raw_id:
            print(f'  ERROR: Raw ID {raw_id} missing for target {target_id}!')
            continue

        raw_def = parsed_by_raw_id[raw_id]
        anim_data = {
            'id': target_id,
            'name': raw_def['name'],
            'graphic': raw_def['graphic'],
            'hue': raw_def['hue'],
            'position': raw_def['position'],
            'fps': raw_def['fps'],
            'frames': raw_def['frames'],
            'timings': raw_def['timings'],
        }

        # Save to both animations/ and last-chance/
        p1 = os.path.join(anims_out_dir, f'{target_id}.json')
        p2 = os.path.join(last_chance_dir, f'{target_id}.json')

        with open(p1, 'w', encoding='utf-8') as f:
            json.dump(anim_data, f, indent=2, ensure_ascii=False)
        with open(p2, 'w', encoding='utf-8') as f:
            json.dump(anim_data, f, indent=2, ensure_ascii=False)

        manifest_entry = {
            'id': str(target_id),
            'name': raw_def['name'],
            'graphic': raw_def['graphic'],
            'position': raw_def['position'],
            'frameCount': len(raw_def['frames']),
            'timingCount': len(raw_def['timings']),
        }
        manifest[str(target_id)] = manifest_entry
        lc_manifest[str(target_id)] = manifest_entry

        written_count += 1
        exported_target_map[target_id] = anim_data

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(lc_manifest, f, indent=2, ensure_ascii=False)

    print(f'  Successfully wrote {written_count} animation files and manifests.')

    print('[4/6] Updating animation-atlas.json...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    # Register missing Batch 3 graphics
    batch3_atlas_entries = {
        'PRAS- Clear Smog': {
            'graphic': 'PRAS- Clear Smog.png',
            'width': 960,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'cols': 5,
            'rows': 3,
            'frameCount': 15,
        },
        'PRAS- Confuse Ray': {
            'graphic': 'PRAS- Confuse Ray.png',
            'width': 192,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'cols': 1,
            'rows': 1,
            'frameCount': 1,
        },
        'PRAS- Cotton Guard': {
            'graphic': 'PRAS- Cotton Guard.png',
            'width': 192,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'cols': 1,
            'rows': 1,
            'frameCount': 1,
        },
        'PRAS- Cotton Spore': {
            'graphic': 'PRAS- Cotton Spore.png',
            'width': 192,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'cols': 1,
            'rows': 1,
            'frameCount': 1,
        },
        'PRAS- CURSE2': {
            'graphic': 'PRAS- CURSE2.png',
            'width': 384,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'cols': 2,
            'rows': 1,
            'frameCount': 2,
        },
    }

    for k, v in batch3_atlas_entries.items():
        if k not in atlas:
            atlas[k] = v
            print(f'  Added atlas entry: {k}')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)

    print('[5/6] Updating move mappings in game-data...')
    move_map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    move_ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    move_db_path = os.path.join(game_data_dir, 'move-animations-db.json')

    with open(move_map_path, 'r', encoding='utf-8') as f:
        move_map = json.load(f)
    with open(move_ext_path, 'r', encoding='utf-8') as f:
        move_ext = json.load(f)
    with open(move_db_path, 'r', encoding='utf-8') as f:
        move_db = json.load(f)

    # Mapping specifications
    # move_key -> (player_id, opp_id)
    batch3_move_map = {
        'charge': (6792, None),
        'charm': (6793, None),
        'clear_smog': (6794, None),
        'comet_punch': (6795, None),
        'confuse_ray': (6800, None),
        'cotton_guard': (6801, None),
        'cotton_spore': (6802, None),
        'counter': (6803, None),
        'crunch': (6804, None),
        'crush_claw': (6805, 6806),
        'curse': (6807, None),
        'cut': (6809, None),
    }

    for m_key, (p_id, o_id) in batch3_move_map.items():
        # Update move_map (standard)
        if 'moves' not in move_map: move_map['moves'] = {}
        if 'opponentMoves' not in move_map: move_map['opponentMoves'] = {}
        move_map['moves'][m_key] = p_id
        if o_id is not None:
            move_map['opponentMoves'][m_key] = o_id
        elif m_key in move_map['opponentMoves']:
            # Remove old collided opponent mapping if any
            del move_map['opponentMoves'][m_key]

        # Update move_ext (extensions)
        if 'moves' not in move_ext: move_ext['moves'] = {}
        if 'opponentMoves' not in move_ext: move_ext['opponentMoves'] = {}
        move_ext['moves'][m_key] = p_id
        if o_id is not None:
            move_ext['opponentMoves'][m_key] = o_id
        elif m_key in move_ext['opponentMoves']:
            del move_ext['opponentMoves'][m_key]

        # Update move_db
        if 'moves' not in move_db: move_db['moves'] = {}
        if 'opponentMoves' not in move_db: move_db['opponentMoves'] = {}
        move_db['moves'][m_key] = p_id
        if o_id is not None:
            move_db['opponentMoves'][m_key] = o_id
        elif m_key in move_db['opponentMoves']:
            del move_db['opponentMoves'][m_key]

        print(f'  Updated mapping for {m_key}: Player={p_id}, Opponent={o_id}')

    with open(move_map_path, 'w', encoding='utf-8') as f:
        json.dump(move_map, f, indent=2, ensure_ascii=False)
    with open(move_ext_path, 'w', encoding='utf-8') as f:
        json.dump(move_ext, f, indent=2, ensure_ascii=False)
    with open(move_db_path, 'w', encoding='utf-8') as f:
        json.dump(move_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 3 import completed successfully!')

if __name__ == '__main__':
    main()
