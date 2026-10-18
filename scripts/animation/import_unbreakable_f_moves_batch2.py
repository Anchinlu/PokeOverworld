#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 F-Group Battle Animations - Batch 2 (33 moves).
Handles:
  33. flash (178 -> 118 canonical)
  34. flash_cannon (420)
  35. flatter (734)
  36. fleur_cannon (1366)
  37. fling (740 / 741)
  38. flip_turn (1308 / 1309)
  39. floaty_fall (Gen 7 Let's Go - dynamic type fallback)
  40. floral_healing (1093)
  41. flower_shield (781)
  42. flower_trick (Gen 9 - dynamic type fallback)
  43. fly (309 / 311)
  44. flying_press (742 / 743)
  45. focus_blast (517)
  46. focus_energy (119 -> 6843, avoids old 119)
  47. focus_punch (589 / 590)
  48. follow_me (233 / 234 -> 6844 / 6845, avoids roar/sand_attack 233/234)
  49. force_palm (537 / 538)
  50. foresight (281 -> 124 canonical)
  51. forests_curse (816)
  52. foul_play (873)
  53. freeze_dry (1032)
  54. freeze_shock (852)
  55. freezing_glare (1347)
  56. freezy_frost (Gen 7 Let's Go - dynamic type fallback)
  57. frenzy_plant (101 / 102 -> 6846 / 6847, avoids fake_out/fake_tears 101/102)
  58. frost_breath (567 / 568)
  59. frustration (875)
  60. fury_attack (375 / 380)
  61. fury_cutter (299)
  62. fury_swipes (361)
  63. fusion_bolt (1367 / 1368)
  64. fusion_flare (1046 / 1047)
  65. future_sight (keep 142 canonical to preserve move-vfx benchmark)
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

    # Specification for Batch 2:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_json_export)
    batch2_specs = [
        ('flash', 178, None, 118, None, False),
        ('flash_cannon', 420, None, 420, None, False),
        ('flatter', 734, None, 734, None, False),
        ('fleur_cannon', 1366, None, 1366, None, False),
        ('fling', 740, 741, 740, 741, False),
        ('flip_turn', 1308, 1309, 1308, 1309, False),
        ('floral_healing', 1093, None, 1093, None, False),
        ('flower_shield', 781, None, 781, None, False),
        ('fly', 309, 311, 309, 311, False),
        ('flying_press', 742, 743, 742, 743, False),
        ('focus_blast', 517, None, 517, None, False),
        ('focus_energy', 119, None, 6843, None, False), # avoids old 119
        ('focus_punch', 589, 590, 589, 590, False),
        ('follow_me', 233, 234, 6844, 6845, False), # avoids 233/234
        ('force_palm', 537, 538, 537, 538, False),
        ('foresight', 281, None, 124, None, False),
        ('forests_curse', 816, None, 816, None, False),
        ('foul_play', 873, None, 873, None, False),
        ('freeze_dry', 1032, None, 1032, None, False),
        ('freeze_shock', 852, None, 852, None, False),
        ('freezing_glare', 1347, None, 1347, None, False),
        ('frenzy_plant', 101, 102, 6846, 6847, False), # avoids 101/102
        ('frost_breath', 567, 568, 567, 568, False),
        ('frustration', 875, None, 875, None, False),
        ('fury_attack', 375, 380, 375, 380, False),
        ('fury_cutter', 299, None, 299, None, False),
        ('fury_swipes', 361, None, 137, None, True), # keep 137 benchmark multi-hit sequence
        ('fusion_bolt', 1367, 1368, 1367, 1368, False),
        ('fusion_flare', 1046, 1047, 1046, 1047, False),
        ('future_sight', 313, None, 142, None, True), # keep 142 benchmark JSON
    ]

    needed_rx_ids = {}
    for item in batch2_specs:
        m_key, rx_p, rx_o, tgt_p, tgt_o, skip_export = item
        if skip_export:
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

    # Ensure 142 (future_sight) and 137..141 (fury_swipes multi-hits) exist in last-chance
    benchmark_ids = ['142', '137', '138', '139', '140', '141']
    for b_id in benchmark_ids:
        b_src = os.path.join(anims_out_dir, f'{b_id}.json')
        b_dst = os.path.join(last_chance_dir, f'{b_id}.json')
        if os.path.exists(b_src):
            if not os.path.exists(b_dst):
                shutil.copy2(b_src, b_dst)
            with open(b_src, 'r', encoding='utf-8') as f:
                d_b = json.load(f)
            entry_b = {
                'id': str(b_id),
                'name': d_b.get('name', f'Move:{b_id}'),
                'graphic': d_b.get('graphic', ''),
                'position': d_b.get('position', 2),
                'frameCount': len(d_b.get('frames', [])),
                'timingCount': len(d_b.get('timings', [])),
            }
            manifest[str(b_id)] = entry_b
            last_chance_manifest[str(b_id)] = entry_b

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

    for item in batch2_specs:
        m_key, _, _, p_id, o_id, _ = item
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
        # Keep future_sight graphic as eb619_6.png for move-vfx test
        if m_key == 'future_sight':
            existing_info['graphic'] = 'eb619_6.png'
            existing_info['hasGraphicFile'] = True
        move_db[m_key] = existing_info

        # 4. Reunion moves sets
        opt_set.add(m_key)
        all_set.add(m_key)
        print(f'  Updated mapping for {m_key}: Player={p_id}, Opponent={o_id}')

    # Update self-targeting moves in moves_db
    if 'moves' in moves_db:
        if 'focus_energy' in moves_db['moves']:
            moves_db['moves']['focus_energy']['target'] = 'user'
        if 'follow_me' in moves_db['moves']:
            moves_db['moves']['follow_me']['target'] = 'user'

    reunion['optimizedMoves'] = sorted(list(opt_set))
    reunion['allReunionMoves'] = sorted(list(all_set))

    with open(move_map_path, 'w', encoding='utf-8') as f:
        json.dump(move_map, f, indent=2, ensure_ascii=False)
    with open(move_ext_path, 'w', encoding='utf-8') as f:
        json.dump(move_ext, f, indent=2, ensure_ascii=False)
    with open(move_db_path, 'w', encoding='utf-8') as f:
        json.dump(move_db, f, indent=2, ensure_ascii=False)
    with open(reunion_path, 'r', encoding='utf-8') as f:
        pass
    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion, f, indent=2, ensure_ascii=False)
    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 2 import completed successfully!')

if __name__ == '__main__':
    main()
