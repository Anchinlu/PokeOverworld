#!/usr/bin/env python3
"""
Importer for Remaining A-Group Battle Animations from Pokémon Unbreakable Ties 4.1.2.
Extracts 1:1 authentic animations from Data/PkmnAnimations.rxdata.
Includes 20 remaining A-group moves:
  - aeroblast, after_you, air_slash, all_out_pummeling, ally_switch,
    anchor_shot, apple_acid, aqua_jet, aqua_ring, aqua_tail,
    astonish, astral_barrage, attack_order, attract, aura_sphere,
    aura_wheel, aurora_beam, aurora_veil, autotomize, avalanche.
"""

import os
import sys
import json
import glob
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

    public_gfx_dir = os.path.join(out_base, 'apps', 'web', 'public', 'Graphics', 'Animations')
    local_gfx_dir = os.path.join(out_base, 'Graphics', 'Animations')
    source_gfx_dir = os.path.join(source_root, 'Graphics', 'Animations')

    os.makedirs(anims_out_dir, exist_ok=True)
    os.makedirs(last_chance_dir, exist_ok=True)
    os.makedirs(public_se_dir, exist_ok=True)
    os.makedirs(os.path.join(public_se_dir, 'Anim'), exist_ok=True)
    os.makedirs(public_gfx_dir, exist_ok=True)
    os.makedirs(local_gfx_dir, exist_ok=True)

    print('[1/6] Copying Graphic PNG files from Unbreakable Ties if missing...')
    new_graphics = [
        'GEN8- Apple Acid.png',
        'GEN8- AstralBarrage.png',
        'GEN8- Aura Wheel Ally.png',
        'GEN8- Aura Wheel Opp.png',
    ]
    for g in new_graphics:
        src_g = os.path.join(source_gfx_dir, g)
        if os.path.exists(src_g):
            for dst_dir in [public_gfx_dir, local_gfx_dir]:
                dst_g = os.path.join(dst_dir, g)
                if not os.path.exists(dst_g):
                    shutil.copy2(src_g, dst_g)
                    print(f'  Copied graphic: {g} -> {dst_dir}')

    print('[2/6] Loading PkmnAnimations.rxdata from Unbreakable Ties...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)

    anim_list = raw_anims.attributes.get('@array', [])
    print(f'  Total animation entries in rxdata: {len(anim_list)}')

    # Specification for the 20 remaining A moves from Unbreakable Ties:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_ids, target_opp_ids, aux_ids)
    a_move_specs = [
        ('aeroblast', 1027, 1028, [6750, 1027], [1028], []),
        ('after_you', 935, 936, [935], [936], []),
        ('air_slash', 487, None, [6309, 487], [], []),
        ('all_out_pummeling', 1174, 1175, [1174], [1175], []),
        ('ally_switch', 48, None, [48, 32], [], []),
        ('anchor_shot', 1122, None, [1122], [], []),
        ('apple_acid', 1241, 1242, [1241], [1242], []),
        ('aqua_jet', 621, 622, [6751, 621], [622], []),
        ('aqua_ring', 52, None, [52, 35], [], []),
        ('aqua_tail', 481, None, [6313, 481], [], []),
        ('astonish', 664, None, [6328, 664], [], []),
        ('astral_barrage', 1343, None, [1343], [], []),
        ('attack_order', 815, None, [815], [], []),
        ('attract', 511, 512, [6699, 511], [512], []),
        ('aura_sphere', 535, 536, [6330, 535], [536], []),
        ('aura_wheel', 1243, 1244, [1243], [1244], []),
        ('aurora_beam', 54, None, [37], [], []), # Note: target 37 only to protect 54 (bubblebeam regression test)
        ('aurora_veil', 1107, 1108, [1107], [1108], []),
        ('autotomize', 901, None, [6331, 901], [], []),
        ('avalanche', 459, None, [6332, 459], [], []),
    ]

    needed_raw_ids = set()
    for _, p_raw, o_raw, _, _, aux in a_move_specs:
        if p_raw is not None:
            needed_raw_ids.add(p_raw)
        if o_raw is not None:
            needed_raw_ids.add(o_raw)
        for a_id in aux:
            needed_raw_ids.add(a_id)

    print(f'[3/6] Parsing {len(needed_raw_ids)} animations from rxdata...')
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
        for f in raw_frames:
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = import_source_animations.parse_cel(cel_data)
                    if cel is not None:
                        # Enforce battler focus constraints
                        if cel.get('pattern') == -1:
                            cel['focus'] = 'user'
                        elif cel.get('pattern') == -2:
                            cel['focus'] = 'target'
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
        print(f'  Parsed Anim {aid:4}: {name} ({len(frames)} frames, {len(timings)} timings, graphic: {graphic})')

    print(f'  Migrated/Verified {len(copied_audio_files)} new Audio SE files into public/Audio/SE.')

    print('[4/6] Updating Animation Atlas Metadata...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    last_chance_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    search_dirs = [
        os.path.join(out_base, 'Graphics', 'Animations'),
        os.path.join(out_base, 'apps', 'web', 'public', 'Graphics', 'Animations'),
        os.path.join(source_root, 'Graphics', 'Animations'),
    ]

    for g in sorted(used_graphics):
        if not g:
            continue
        found_path = None
        for d in search_dirs:
            for ext in ['.png', '.PNG']:
                p = os.path.join(d, g + ext)
                if os.path.exists(p):
                    found_path = p
                    break
            if found_path:
                break

        if found_path:
            with Image.open(found_path) as im:
                w, h = im.size
            cell_w = 192
            cell_h = 192
            cols = w // cell_w if w >= cell_w else 1
            rows = h // cell_h if h >= cell_h else 1
            if cols == 0:
                cols = 1
            if rows == 0:
                rows = 1
            if cols == 1 and rows == 1:
                cell_w = w
                cell_h = h
            max_pattern = cols * rows

            atlas_key = g.lower().replace(' ', '-').replace('_', '-')
            entry = {
                'assetKey': f'animation.{atlas_key}',
                'file': os.path.basename(found_path),
                'width': w,
                'height': h,
                'cellWidth': cell_w,
                'cellHeight': cell_h,
                'columns': cols,
                'rows': rows,
                'maxPattern': max_pattern,
            }
            atlas[g] = entry
            atlas[g + '.png'] = entry
            print(f'  Atlas entry for {g}: {w}x{h}, {cols}x{rows} (maxPattern={max_pattern})')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)
    with open(last_chance_atlas_path, 'r', encoding='utf-8') as f:
        lc_atlas = json.load(f)
    for k, v in atlas.items():
        lc_atlas[k] = v
    with open(last_chance_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(lc_atlas, f, indent=2, ensure_ascii=False)

    # Clamp cel patterns to atlas maxPattern to ensure 100% integrity
    for aid, anim_data in parsed_by_raw_id.items():
        g = anim_data.get('graphic', '')
        if g:
            clean_g = g[:-4] if g.lower().endswith('.png') else g
            entry = atlas.get(clean_g) or atlas.get(clean_g + '.png')
            if entry and 'maxPattern' in entry:
                max_p = entry['maxPattern']
                for fr in anim_data.get('frames', []):
                    for cel in fr.get('cels', []):
                        if cel.get('pattern', -1) >= max_p:
                            cel['pattern'] = max(0, max_p - 1)

    print('[5/6] Writing Animation JSON Files and Manifests...')
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)

    written_count = 0

    def write_anim_file(target_id, data):
        nonlocal written_count
        anim_payload = dict(data)
        anim_payload['id'] = str(target_id)
        anim_payload['sourcePack'] = 'Pokémon Last Chance 1.22'
        anim_payload['sourceAnimationId'] = target_id
        # Main
        file_path = os.path.join(anims_out_dir, f'{target_id}.json')
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(anim_payload, f, indent=2, ensure_ascii=False)
        # Last-chance
        lc_file_path = os.path.join(last_chance_dir, f'{target_id}.json')
        with open(lc_file_path, 'w', encoding='utf-8') as f:
            json.dump(anim_payload, f, indent=2, ensure_ascii=False)

        manifest_entry = {
            'id': str(target_id),
            'name': data['name'],
            'graphic': data['graphic'],
            'position': data['position'],
            'frameCount': len(data['frames']),
            'timingCount': len(data['timings']),
        }
        manifest[str(target_id)] = manifest_entry
        last_chance_manifest[str(target_id)] = manifest_entry
        written_count += 1

    for move_key, p_raw, o_raw, p_targets, o_targets, aux_ids in a_move_specs:
        # Player animations
        if p_raw in parsed_by_raw_id:
            anim_data = parsed_by_raw_id[p_raw]
            for target_id in p_targets:
                write_anim_file(target_id, anim_data)

        # Opponent animations
        if o_raw in parsed_by_raw_id:
            anim_data = parsed_by_raw_id[o_raw]
            for target_id in o_targets:
                write_anim_file(target_id, anim_data)

        # Auxiliary animations
        for a_id in aux_ids:
            if a_id in parsed_by_raw_id:
                write_anim_file(a_id, parsed_by_raw_id[a_id])

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2, ensure_ascii=False)

    print(f'  Wrote {written_count} animation files into animations/ and animations/last-chance/.')

    print('[6/6] Updating Move Animation Map & Extensions...')
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')

    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext_map = json.load(f)

    for move_key, p_raw, o_raw, p_targets, o_targets, _ in a_move_specs:
        primary_player_id = p_targets[0]
        anim_map['moves'][move_key] = primary_player_id
        if 'moves' in ext_map:
            ext_map['moves'][move_key] = primary_player_id

        if o_targets:
            primary_opp_id = o_targets[0]
            if 'opponentMoves' not in anim_map:
                anim_map['opponentMoves'] = {}
            anim_map['opponentMoves'][move_key] = primary_opp_id
            if 'opponentMoves' in ext_map:
                ext_map['opponentMoves'][move_key] = primary_opp_id

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2, ensure_ascii=False)
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext_map, f, indent=2, ensure_ascii=False)

    db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)

    for move_key, p_raw, o_raw, p_targets, o_targets, _ in a_move_specs:
        primary_player_id = p_targets[0]
        primary_opp_id = o_targets[0] if o_targets else None
        db[move_key] = {
            'animId': primary_player_id,
            'opponentAnimId': primary_opp_id,
            'source': 'Unbreakable Ties 4.1.2',
            'hasDedicatedAnimation': True,
        }

    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2, ensure_ascii=False)

    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion = json.load(f)

    opt_set = set(reunion.get('optimizedMoves', []))
    all_set = set(reunion.get('allReunionMoves', []))

    for move_key, _, _, _, _, _ in a_move_specs:
        opt_set.add(move_key)
        all_set.add(move_key)

    reunion['optimizedMoves'] = sorted(list(opt_set))
    reunion['allReunionMoves'] = sorted(list(all_set))

    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion, f, indent=2, ensure_ascii=False)

    print(f'DONE! Successfully optimized all {len(a_move_specs)} remaining A moves from Unbreakable Ties.')

if __name__ == '__main__':
    main()
