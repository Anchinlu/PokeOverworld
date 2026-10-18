#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 E-Group Battle Animations - Batch 1 (14 moves).
Handles:
  1. earth_power (518)
  2. earthquake (662)
  3. echoed_voice (1001)
  4. eerie_impulse (1363 / 1364)
  5. eerie_spell (1345)
  6. egg_bomb (803 / 804)
  7. electric_terrain (441)
  8. electrify (775 / 776)
  9. electro_ball (647 / 648)
  10. electro_drift (Gen 9 - dynamic type fallback)
  11. electro_shot (Gen 9 - dynamic type fallback)
  12. electroweb (866)
  13. embargo (777)
  14. ember (118 -> 6820, avoiding flash 118 collision)
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
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id)
    batch1_specs = [
        ('earth_power', 518, None, 518, None),
        ('earthquake', 662, None, 662, None),
        ('echoed_voice', 1001, None, 1001, None),
        ('eerie_impulse', 1363, 1364, 1363, 1364),
        ('eerie_spell', 1345, None, 1345, None),
        ('egg_bomb', 803, 804, 803, 804),
        ('electric_terrain', 441, None, 441, None),
        ('electrify', 775, 776, 775, 776),
        ('electro_ball', 647, 648, 647, 648),
        ('electroweb', 866, None, 866, None),
        ('embargo', 777, None, 777, None),
        ('ember', 118, None, 6820, None), # Avoid flash 118 collision
    ]

    needed_rx_ids = {}
    for item in batch1_specs:
        m_key, rx_p, rx_o, tgt_p, tgt_o = item
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
                        # 1. Enforce battler focus constraints
                        if cel.get('pattern') == -1:
                            cel['focus'] = 'user'
                        elif cel.get('pattern') == -2:
                            cel['focus'] = 'target'
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
                
                flash_scope = t_attrs.get(b'@flashScope') or t_attrs.get('@flashScope', 0)
                if flash_scope and flash_scope > 0:
                    fc = [255, 255, 255, 255]
                    flash_color = t_attrs.get(b'@flashColor') or t_attrs.get('@flashColor')
                    if flash_color and hasattr(flash_color, 'data'):
                        c_data = import_source_animations.parse_color(flash_color.data)
                        if c_data:
                            fc = c_data
                    flash_dur = t_attrs.get(b'@flashDuration') or t_attrs.get('@flashDuration', 5)
                    timings.append({
                        'frame': frame_val,
                        'type': 'flash',
                        'payload': {
                            'flashScope': flash_scope,
                            'flashDuration': flash_dur,
                            'flashColor': fc
                        }
                    })

        anim_json = {
            'id': tgt_id,
            'name': name,
            'graphic': graphic,
            'hue': attrs.get(b'@hue') or attrs.get('@hue', 0),
            'position': attrs.get(b'@position') or attrs.get('@position', 2),
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

    with open(move_map_path, 'r', encoding='utf-8') as f:
        move_map = json.load(f)
    with open(move_ext_path, 'r', encoding='utf-8') as f:
        move_ext = json.load(f)
    with open(move_db_path, 'r', encoding='utf-8') as f:
        move_db = json.load(f)
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion = json.load(f)

    opt_set = set(reunion.get('optimizedMoves', []))
    all_set = set(reunion.get('allReunionMoves', []))

    for item in batch1_specs:
        m_key, _, _, p_id, o_id = item
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
        existing_info['source'] = 'Unbreakable Ties 4.1.2'
        existing_info['hasDedicatedAnimation'] = True
        move_db[m_key] = existing_info

        # 4. Reunion moves sets
        opt_set.add(m_key)
        all_set.add(m_key)
        print(f'  Updated mapping for {m_key}: Player={p_id}, Opponent={o_id}')

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

    print('[6/6] Batch 1 import completed successfully!')

if __name__ == '__main__':
    main()
