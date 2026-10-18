#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 H-Group Battle Animations - Batch 2 (21 moves).
Moves handled:
  1. high_jump_kick / highjumpkick (1371 / 1372)
  2. hold_back (1373 / 1374)
  3. hold_hands (1375) [target: 'user']
  4. hone_claws (494) [target: 'user']
  5. horn_attack (315 / 316)
  6. horn_drill (1002 / 1003)
  7. horn_leech (926 / 927)
  8. howl (585) [target: 'user']
  9. hurricane (1004 / 1005)
  10. hydro_cannon (1062 / 1063)
  11. hydro_pump (159 benchmark preserved)
  12. hydro_steam (Gen 9 Walking Wake - Dynamic Type Fallback)
  13. hydro_vortex (1190 / 1191)
  14. hyper_beam (6476 benchmark preserved)
  15. hyper_drill (Gen 9 Dudunsparce - Dynamic Type Fallback)
  16. hyper_fang (Safe IDs: 6862 / 6863, preserving 140/141 multi-hit variants)
  17. hyper_voice (678 / 679)
  18. hyperspace_fury (1131)
  19. hyperspace_hole (920)
  20. hypnosis (575 / 576)
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
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_export, direct_custom_id)
    batch2_specs = [
        ('high_jump_kick', 1371, 1372, 1371, 1372, False, None),
        ('highjumpkick', 1371, 1372, 1371, 1372, False, None),
        ('hold_back', 1373, 1374, 1373, 1374, False, None),
        ('hold_hands', 1375, None, 1375, None, False, None),
        ('hone_claws', 494, None, 494, None, False, None),
        ('horn_attack', 315, 316, 315, 316, False, None),
        ('horn_drill', 1002, 1003, 1002, 1003, False, None),
        ('horn_leech', 926, 927, 926, 927, False, None),
        ('howl', 585, None, 585, None, False, None),
        ('hurricane', 1004, 1005, 1004, 1005, False, None),
        ('hydro_cannon', 1062, 1063, 1062, 1063, False, None),
        ('hydro_pump', None, None, 159, None, True, None), # Preserved benchmark 159
        ('hydro_steam', None, None, None, None, True, None), # Gen 9 dynamic type fallback
        ('hydro_vortex', 1190, 1191, 1190, 1191, False, None),
        ('hyper_beam', None, None, 6476, None, True, None), # Preserved benchmark 6476
        ('hyper_drill', None, None, None, None, True, None), # Gen 9 dynamic type fallback
        ('hyper_fang', 140, 141, 6862, 6863, False, None), # Safe IDs 6862/6863 (avoiding 140/141 multi-hit conflict)
        ('hyper_voice', 678, 679, 678, 679, False, None),
        ('hyperspace_fury', 1131, None, 1131, None, False, None),
        ('hyperspace_hole', 920, None, 920, None, False, None),
        ('hypnosis', 575, 576, 575, 576, False, None),
    ]

    needed_rx_ids = {}
    for item in batch2_specs:
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
                        elif cel.get('pattern', -99) >= 0:
                            # Graphic cels
                            cel['graphic'] = graphic
                            cel['focus'] = 'target' # Standard target focus
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

    # Copy SE audio files
    for se in sorted(used_se_files):
        found = False
        for search_d in [source_se_anim_dir, source_se_dir]:
            sp = os.path.join(search_d, se)
            if os.path.exists(sp):
                dp1 = os.path.join(public_se_dir, se)
                dp2 = os.path.join(public_se_dir, 'Anim', se)
                shutil.copy2(sp, dp1)
                shutil.copy2(sp, dp2)
                found = True
                break
        if found:
            print(f'  [SE OK] {se}')
        else:
            local_p1 = os.path.join(public_se_dir, se)
            local_p2 = os.path.join(public_se_dir, 'Anim', se)
            if os.path.exists(local_p1) or os.path.exists(local_p2):
                print(f'  [SE LOCAL] {se}')
            else:
                print(f'  [SE MISSING] {se}')

    # Copy Graphics and register in animation-atlas.json
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    for g in sorted(used_graphics):
        g_png = g if g.lower().endswith('.png') else f'{g}.png'
        sp = os.path.join(source_gfx_dir, g_png)
        dp = os.path.join(dest_gfx_dir, g_png)
        lp = os.path.join(local_gfx_dir, g_png)

        if os.path.exists(sp):
            try:
                im = Image.open(sp)
                if im.mode != 'RGBA':
                    im = im.convert('RGBA')
                im.save(dp)
                im.save(lp)
                print(f'  [GFX OK] {g_png} ({im.size})')
            except Exception as e:
                shutil.copy2(sp, dp)
                shutil.copy2(sp, lp)
                print(f'  [GFX COPIED] {g_png}')
        else:
            if os.path.exists(dp):
                print(f'  [GFX LOCAL] {g_png}')
            else:
                print(f'  [GFX MISSING] {g_png}')

        # Check atlas
        base_name = g[:-4] if g.lower().endswith('.png') else g
        if g_png not in atlas and base_name not in atlas:
            if os.path.exists(dp):
                with Image.open(dp) as im:
                    w, h = im.size
                cols = max(1, w // 192)
                rows = max(1, h // 192)
                atlas[g_png] = {
                    'assetKey': f'animation.{base_name.lower().replace(" ", "-")}',
                    'file': g_png,
                    'width': w,
                    'height': h,
                    'cellWidth': 192,
                    'cellHeight': 192,
                    'columns': cols,
                    'rows': rows,
                    'maxPattern': cols * rows
                }
                atlas[base_name] = atlas[g_png]
                print(f'  [ATLAS ADDED] {g_png}')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)

    print('[4/6] Updating move-animation-map.json, move-animation-extensions.json, and move-animations-db.json...')
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)

    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        anim_ext = json.load(f)

    db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)

    for item in batch2_specs:
        m_key, rx_p, rx_o, tgt_p, tgt_o, skip_export, direct_id = item
        if tgt_p is not None:
            anim_map['moves'][m_key] = tgt_p
            if 'newMoves' in anim_ext:
                anim_ext['newMoves'][m_key] = tgt_p
            anim_ext[m_key] = tgt_p
            if m_key.replace('_', '-') != m_key:
                anim_ext[m_key.replace('_', '-')] = tgt_p
            if m_key in anim_db:
                anim_db[m_key]['animationId'] = tgt_p

        if tgt_o is not None:
            anim_map['opponentMoves'][m_key] = tgt_o
            if 'opponentMoves' in anim_ext:
                anim_ext['opponentMoves'][m_key] = tgt_o

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2, ensure_ascii=False)
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(anim_ext, f, indent=2, ensure_ascii=False)
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2, ensure_ascii=False)

    print('[5/6] Updating target="user" for self-targeting moves in moves-db.json...')
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    self_target_moves = ['hold_hands', 'hone_claws', 'howl']
    for stm in self_target_moves:
        if stm in moves_db['moves']:
            moves_db['moves'][stm]['target'] = 'user'
            print(f'  [TARGET USER] {stm} -> user')

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 2 of H-moves completed successfully!')

if __name__ == '__main__':
    main()
