#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 H-Group Battle Animations - Batch 1 (23 moves).
Moves handled:
  1. hail (290 -> 6858 safe ID) [target: 'user']
  2. hammer_arm (488)
  3. happy_hour (Dynamic Type Fallback)
  4. hard_press (Gen 9 - Dynamic Type Fallback)
  5. harden (126 -> 6859 safe ID) [target: 'user']
  6. haze (529) [target: 'user']
  7. head_charge (805)
  8. head_smash (792)
  9. headbutt (395 / 396)
  10. headlong_rush (Gen 8/9 - Dynamic Type Fallback)
  11. heal_bell (434 / 435) [target: 'user']
  12. heal_block (744)
  13. heal_order (757) [target: 'user']
  14. heal_pulse (963)
  15. healing_wish (868) [target: 'user']
  16. heart_stamp (465 / 466)
  17. heart_swap (824)
  18. heat_crash (778)
  19. heat_wave (6154 dedicated EBDX Heat wave animation)
  20. heavy_slam (584)
  21. helping_hand (643) [target: 'user']
  22. hex (500)
  23. hidden_power (688)
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
    source_se_anim_dir = os.path.join(source_se_dir, 'Anim')
    source_gfx_dir = os.path.join(source_root, 'Graphics', 'Animations')
    dest_gfx_dir = os.path.join(out_base, 'apps', 'web', 'public', 'Graphics', 'Animations')
    local_gfx_dir = os.path.join(out_base, 'Graphics', 'Animations')

    os.makedirs(anims_out_dir, exist_ok=True)
    os.makedirs(last_chance_dir, exist_ok=True)
    os.makedirs(public_se_dir, exist_ok=True)
    os.makedirs(os.path.join(public_se_dir, 'Anim'), exist_ok=True)
    os.makedirs(dest_gfx_dir, exist_ok=True)
    os.makedirs(local_gfx_dir, exist_ok=True)

    print('[1/6] Loading PkmnAnimations.rxdata from Unbreakable Ties...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)

    anim_list = raw_anims.attributes.get(b'@array') or raw_anims.attributes.get('@array', [])
    print(f'  Total animation entries in rxdata: {len(anim_list)}')

    # Specification for Batch 1:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_export, direct_custom_id)
    batch1_specs = [
        ('hail', 290, None, 6858, None, False, None),
        ('hammer_arm', 488, None, 488, None, False, None),
        ('happy_hour', None, None, None, None, True, None), # Dynamic type fallback
        ('hard_press', None, None, None, None, True, None), # Gen 9 dynamic type fallback
        ('harden', 126, None, 6859, None, False, None),
        ('haze', 529, None, 529, None, False, None),
        ('head_charge', 805, None, 805, None, False, None),
        ('head_smash', 792, None, 792, None, False, None),
        ('headbutt', 395, 396, 395, 396, False, None),
        ('headlong_rush', None, None, None, None, True, None), # Gen 8/9 dynamic type fallback
        ('heal_bell', 434, 435, 434, 435, False, None),
        ('heal_block', 744, None, 744, None, False, None),
        ('heal_order', 757, None, 757, None, False, None),
        ('heal_pulse', 963, None, 963, None, False, None),
        ('healing_wish', 868, None, 868, None, False, None),
        ('heart_stamp', 465, 466, 465, 466, False, None),
        ('heart_swap', 824, None, 824, None, False, None),
        ('heat_crash', 778, None, 778, None, False, None),
        ('heat_wave', None, None, 6860, 6861, True, None), # Cinematic PRAS Fire wave 6860/6861
        ('heavy_slam', 584, None, 584, None, False, None),
        ('helping_hand', 643, None, 643, None, False, None),
        ('hex', 500, None, 500, None, False, None),
        ('hidden_power', 688, None, 688, None, False, None),
    ]

    needed_rx_ids = {}
    for item in batch1_specs:
        m_key, rx_p, rx_o, tgt_p, tgt_o, skip_export, direct_id = item
        if skip_export or direct_id is not None:
            continue
        if rx_p and tgt_p:
            needed_rx_ids[rx_p] = tgt_p
        if rx_o and tgt_o:
            needed_rx_ids[rx_o] = tgt_o

    print(f'[2/6] Processing and converting {len(needed_rx_ids)} animations...')
    used_graphics = set()
    used_se_files = set()

    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)

    for rx_id, tgt_id in sorted(needed_rx_ids.items()):
        if rx_id >= len(anim_list) or anim_list[rx_id] is None or not hasattr(anim_list[rx_id], 'attributes'):
            print(f'  WARNING: Animation ID {rx_id} missing in rxdata!')
            continue
        attrs = anim_list[rx_id].attributes
        name = attrs.get(b'@name') or attrs.get('@name', '')
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='ignore')
        graphic = attrs.get(b'@graphic') or attrs.get('@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')
        if graphic:
            clean_g = graphic[:-4] if graphic.lower().endswith('.png') else graphic
            used_graphics.add(clean_g)

        raw_frames = attrs.get(b'@array') or attrs.get('@array', [])
        frames = []

        for fi, f in enumerate(raw_frames):
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
                        elif tgt_id == 500 and cel.get('pattern') == 4:
                            # PRAS- Grudge has 4 patterns (0..3); cycle wraps 4 -> 0
                            cel['pattern'] = 0
                        cels.append(cel)
            frames.append({'cels': cels})

        # Process timings / audio SE
        raw_timings = attrs.get(b'@timing') or attrs.get('@timing', [])
        timings = []
        for t in raw_timings:
            if hasattr(t, 'attributes'):
                t_attrs = t.attributes
                frame_val = t_attrs.get(b'@frame') or t_attrs.get('@frame', 0)
                se_name = t_attrs.get(b'@name') or t_attrs.get('@name', '')
                if isinstance(se_name, bytes):
                    se_name = se_name.decode('utf-8', errors='ignore')
                se_name = se_name.strip()
                if se_name and not se_name.lower().endswith(('.png', '.jpg', '.bmp', '.gif')):
                    if se_name.startswith('PRSFX-') and not se_name.endswith(('.wav', '.ogg')):
                        se_name += '.wav'
                    elif not any(se_name.endswith(e) for e in ['.wav', '.ogg', '.mp3']):
                        se_name += '.ogg'
                    used_se_files.add(se_name)
                    timings.append({
                        'frame': frame_val,
                        'type': 'sound',
                        'payload': {
                            'sound': se_name,
                            'volume': t_attrs.get(b'@volume') or t_attrs.get('@volume', 80),
                            'pitch': t_attrs.get(b'@pitch') or t_attrs.get('@pitch', 100)
                        }
                    })

        anim_json = {
            'id': tgt_id,
            'name': name,
            'graphic': graphic,
            'frameWidth': 192,
            'frameHeight': 192,
            'fps': 20,
            'frames': frames,
            'timings': timings,
            'sourcePack': 'Pokemon Unbreakable Ties 4.1.2'
        }

        # Save to animations/ and animations/last-chance/
        tgt_file = os.path.join(anims_out_dir, f'{tgt_id}.json')
        lc_file = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(tgt_file, 'w', encoding='utf-8') as f:
            json.dump(anim_json, f, indent=2, ensure_ascii=False)
        with open(lc_file, 'w', encoding='utf-8') as f:
            json.dump(anim_json, f, indent=2, ensure_ascii=False)

        manifest_entry = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'position': attrs.get(b'@position') or attrs.get('@position', 2),
            'frameCount': len(frames),
            'timingCount': len(timings),
        }
        manifest[str(tgt_id)] = manifest_entry
        last_chance_manifest[str(tgt_id)] = manifest_entry

        print(f'  [OK] Exported ID {rx_id} -> {tgt_id} ({name}, {len(frames)} frames)')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2, ensure_ascii=False)

    print(f'[3/6] Syncing audio SE ({len(used_se_files)} files) and graphics ({len(used_graphics)} files)...')
    for se in used_se_files:
        found_src = None
        for ext in ['', '.wav', '.ogg', '.mp3']:
            s1 = os.path.join(source_se_dir, se + ext)
            s2 = os.path.join(source_se_anim_dir, se + ext)
            if os.path.exists(s1):
                found_src = s1; break
            elif os.path.exists(s2):
                found_src = s2; break

        dst1 = os.path.join(public_se_dir, se)
        dst2 = os.path.join(public_se_dir, 'Anim', se)

        if found_src:
            dest_name = os.path.basename(found_src)
            d1 = os.path.join(public_se_dir, dest_name)
            d2 = os.path.join(public_se_dir, 'Anim', dest_name)
            if not os.path.exists(d1): shutil.copy2(found_src, d1)
            if not os.path.exists(d2): shutil.copy2(found_src, d2)
        else:
            if not os.path.exists(dst1) and not os.path.exists(dst2):
                print(f'  Note: SE file {se} not found in source dirs, keeping fallback if any.')

    for g in used_graphics:
        g_name = g if g.lower().endswith('.png') else g + '.png'
        s_file = os.path.join(source_gfx_dir, g_name)
        d_file = os.path.join(dest_gfx_dir, g_name)
        l_file = os.path.join(local_gfx_dir, g_name)
        if os.path.exists(s_file):
            if not os.path.exists(d_file): shutil.copy2(s_file, d_file)
            if not os.path.exists(l_file): shutil.copy2(s_file, l_file)

    print('[4/6] Updating animation atlas...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    last_chance_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(last_chance_atlas_path, 'r', encoding='utf-8') as f:
        last_chance_atlas = json.load(f)

    for g in used_graphics:
        g_name = g if g.lower().endswith('.png') else g + '.png'
        sheet_path = os.path.join(dest_gfx_dir, g_name)
        if not os.path.exists(sheet_path):
            sheet_path = os.path.join(source_gfx_dir, g_name)
        if os.path.exists(sheet_path):
            try:
                with Image.open(sheet_path) as im:
                    w, h = im.size
                cols = max(1, w // 192)
                rows = max(1, h // 192)
                tot = cols * rows
                clean_k = g[:-4] if g.lower().endswith('.png') else g
                entry = {
                    'assetKey': f'animation.{clean_k.lower().replace(" ", "-")}',
                    'file': g_name,
                    'width': w,
                    'height': h,
                    'cellWidth': 192,
                    'cellHeight': 192,
                    'columns': cols,
                    'rows': rows,
                    'maxPattern': tot
                }
                for k in [clean_k, g_name, clean_k.lower(), g_name.lower(), clean_k.lower().replace(" ", "-")]:
                    atlas[k] = entry
                    last_chance_atlas[k] = entry
                print(f'  [Atlas] Registered: {clean_k} ({w}x{h}, {tot} patterns)')
            except Exception as e:
                print(f'  Could not read image {g_name}: {e}')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)
    with open(last_chance_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_atlas, f, indent=2, ensure_ascii=False)

    print('[5/6] Updating move mappings in game-data...')
    move_map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    move_ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    move_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')

    with open(move_map_path, 'r', encoding='utf-8') as f:
        move_map = json.load(f)
    with open(move_ext_path, 'r', encoding='utf-8') as f:
        move_ext = json.load(f)
    with open(move_db_path, 'r', encoding='utf-8') as f:
        move_db = json.load(f)
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion = json.load(f)
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    opt_set = set(reunion.get('optimizedMoves', []))
    all_set = set(reunion.get('allReunionMoves', []))

    for item in batch1_specs:
        m_key, _, _, p_id, o_id, skip_export, direct_id = item
        if skip_export and p_id is None:
            # If dynamic type fallback, remove from moves / opponentMoves so fallback activates cleanly
            if m_key in move_map.get('moves', {}):
                del move_map['moves'][m_key]
            if m_key in move_map.get('opponentMoves', {}):
                del move_map['opponentMoves'][m_key]
            if m_key in move_ext.get('moves', {}):
                del move_ext['moves'][m_key]
            if m_key in move_ext.get('opponentMoves', {}):
                del move_ext['opponentMoves'][m_key]
            if m_key in move_db:
                del move_db[m_key]
            print(f'  [Fallback] {m_key} set to Dynamic Type Fallback')
            continue

        if direct_id is not None:
            p_id = direct_id
            o_id = None

        # 1. Update move_map
        if 'moves' not in move_map: move_map['moves'] = {}
        if 'opponentMoves' not in move_map: move_map['opponentMoves'] = {}
        move_map['moves'][m_key] = p_id
        if o_id is not None:
            move_map['opponentMoves'][m_key] = o_id
        elif m_key in move_map['opponentMoves']:
            del move_map['opponentMoves'][m_key]

        # 2. Update move_ext
        if 'moves' not in move_ext: move_ext['moves'] = {}
        if 'opponentMoves' not in move_ext: move_ext['opponentMoves'] = {}
        move_ext['moves'][m_key] = p_id
        if o_id is not None:
            move_ext['opponentMoves'][m_key] = o_id
        elif m_key in move_ext['opponentMoves']:
            del move_ext['opponentMoves'][m_key]

        # 3. Update move_db
        existing_info = move_db.get(m_key, {})
        existing_info['animId'] = p_id
        existing_info['opponentAnimId'] = o_id
        existing_info['source'] = 'Pokemon Unbreakable Ties 4.1.2'
        existing_info['hasDedicatedAnimation'] = True
        move_db[m_key] = existing_info

        # 4. Reunion moves sets
        opt_set.add(m_key)
        all_set.add(m_key)
        print(f'  Updated mapping for {m_key}: Player={p_id}, Opponent={o_id}')

    # Update moves_db targets for self-affecting moves in Batch 1
    self_target_moves = [
        'hail', 'happy_hour', 'harden', 'haze',
        'heal_bell', 'heal_order', 'healing_wish', 'helping_hand'
    ]
    if 'moves' in moves_db:
        for stm in self_target_moves:
            if stm in moves_db['moves']:
                moves_db['moves'][stm]['target'] = 'user'
                print(f'  Set {stm} target to user')

    reunion['optimizedMoves'] = sorted(list(opt_set))
    reunion['allReunionMoves'] = sorted(list(all_set))

    with open(move_map_path, 'w', encoding='utf-8') as f:
        json.dump(move_map, f, indent=2, ensure_ascii=False)
    with open(move_ext_path, 'w', encoding='utf-8') as f:
        json.dump(move_ext, f, indent=2, ensure_ascii=False)
    with open(move_db_path, 'w', encoding='utf-8') as f:
        json.dump(move_db, f, indent=2, ensure_ascii=False)
    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion, f, indent=2, ensure_ascii=False)
    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 1 import completed successfully!')

if __name__ == '__main__':
    main()
