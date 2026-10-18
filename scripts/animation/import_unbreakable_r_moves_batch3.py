#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 R Group (Batch 3 - Final) Battle Animations.
11 moves handled + 1 Gen 9 fallback (completing 100% of letter R!):
  1. rock_slide (Target ID: 7052) - Rock Physical (PRAS- Rock.png, 33 frames)
  2. rock_smash (Target IDs: 7053 PL / 7054 OPP) - Fighting Physical (PRAS- Rock Smash.png, 18 frames)
  3. rock_throw (Target IDs: 7055 PL / 7056 OPP) - Rock Physical (PRAS- Rock.png, 25 frames)
  4. rock_tomb (Target ID: 7057) - Rock Physical (PRAS- Rock.png, 41 frames)
  5. rock_wrecker (Target IDs: 7058 PL / 7059 OPP) - Rock Physical (PRAS- Rock.png, 24 frames)
  6. role_play (Target IDs: 7060 PL / 7061 OPP) - Psychic Status (PRAS- Curse.png, 36 frames)
  7. rolling_kick (Target IDs: 7062 PL / 7063 OPP) - Fighting Physical (PRAS- Strike.png, 12 frames)
  8. rollout (Target IDs: 7064 PL / 7065 OPP) - Rock Physical (PRAS- Rollout.png, 44 frames)
  9. roost (Target ID: 7066) - Flying Status (PRAS- Roost.png, 25 frames)
  10. rototiller (Target ID: 7067) - Ground Status (PRAS- Rototiller .png, 30 frames)
  11. round (Target IDs: 7068 PL / 7069 OPP) - Normal Special (PRAS- Heal Bell.png, 30 frames)
  Fallback:
  - ruination -> super_fang (6642 PL / 295 OPP)
"""

import os
import sys
import json
import shutil
from PIL import Image

sys.path.append(os.path.dirname(__file__))
import import_source_animations as isa
isa.patch_reader()
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
    public_se_anim_dir = os.path.join(public_se_dir, 'Anim')
    source_se_dir = os.path.join(source_root, 'Audio', 'SE')
    source_se_anim_dir = os.path.join(source_se_dir, 'Anim')
    source_gfx_dir = os.path.join(source_root, 'Graphics', 'Animations')
    dest_gfx_dir = os.path.join(out_base, 'apps', 'web', 'public', 'Graphics', 'Animations')
    local_gfx_dir = os.path.join(out_base, 'Graphics', 'Animations')

    os.makedirs(anims_out_dir, exist_ok=True)
    os.makedirs(last_chance_dir, exist_ok=True)
    os.makedirs(public_se_dir, exist_ok=True)
    os.makedirs(public_se_anim_dir, exist_ok=True)
    os.makedirs(dest_gfx_dir, exist_ok=True)
    os.makedirs(local_gfx_dir, exist_ok=True)

    print('[1/6] Loading PkmnAnimations.rxdata from Unbreakable Ties...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)

    anim_list = raw_anims.attributes.get(b'@array') or raw_anims.attributes.get('@array', [])
    print(f'  Total animation entries in rxdata: {len(anim_list)}')

    # Specification for R Group Batch 3 moves:
    r_specs = [
        {'rx_id': 508, 'tgt_id': 7052, 'name': 'Move:ROCKSLIDE', 'default_name': 'Rock Slide', 'move_key': 'rock_slide', 'is_opp': False},
        {'rx_id': 304, 'tgt_id': 7053, 'name': 'Move:ROCKSMASH', 'default_name': 'Rock Smash', 'move_key': 'rock_smash', 'is_opp': False},
        {'rx_id': 305, 'tgt_id': 7054, 'name': 'OppMove:ROCKSMASH', 'default_name': 'Rock Smash (Opp)', 'move_key': 'rock_smash', 'is_opp': True},
        {'rx_id': 205, 'tgt_id': 7055, 'name': 'Move:ROCKTHROW', 'default_name': 'Rock Throw', 'move_key': 'rock_throw', 'is_opp': False},
        {'rx_id': 206, 'tgt_id': 7056, 'name': 'OppMove:ROCKTHROW', 'default_name': 'Rock Throw (Opp)', 'move_key': 'rock_throw', 'is_opp': True},
        {'rx_id': 532, 'tgt_id': 7057, 'name': 'Move:ROCKTOMB', 'default_name': 'Rock Tomb', 'move_key': 'rock_tomb', 'is_opp': False},
        {'rx_id': 752, 'tgt_id': 7058, 'name': 'Move:ROCKWRECKER', 'default_name': 'Rock Wrecker', 'move_key': 'rock_wrecker', 'is_opp': False},
        {'rx_id': 753, 'tgt_id': 7059, 'name': 'OppMove:ROCKWRECKER', 'default_name': 'Rock Wrecker (Opp)', 'move_key': 'rock_wrecker', 'is_opp': True},
        {'rx_id': 849, 'tgt_id': 7060, 'name': 'Move:ROLEPLAY', 'default_name': 'Role Play', 'move_key': 'role_play', 'is_opp': False},
        {'rx_id': 850, 'tgt_id': 7061, 'name': 'OppMove:ROLEPLAY', 'default_name': 'Role Play (Opp)', 'move_key': 'role_play', 'is_opp': True},
        {'rx_id': 301, 'tgt_id': 7062, 'name': 'Move:ROLLINGKICK', 'default_name': 'Rolling Kick', 'move_key': 'rolling_kick', 'is_opp': False},
        {'rx_id': 302, 'tgt_id': 7063, 'name': 'OppMove:ROLLINGKICK', 'default_name': 'Rolling Kick (Opp)', 'move_key': 'rolling_kick', 'is_opp': True},
        {'rx_id': 569, 'tgt_id': 7064, 'name': 'Move:ROLLOUT', 'default_name': 'Rollout', 'move_key': 'rollout', 'is_opp': False},
        {'rx_id': 570, 'tgt_id': 7065, 'name': 'OppMove:ROLLOUT', 'default_name': 'Rollout (Opp)', 'move_key': 'rollout', 'is_opp': True},
        {'rx_id': 431, 'tgt_id': 7066, 'name': 'Move:ROOST', 'default_name': 'Roost', 'move_key': 'roost', 'is_opp': False},
        {'rx_id': 1010, 'tgt_id': 7067, 'name': 'Move:ROTOTILLER', 'default_name': 'Rototiller', 'move_key': 'rototiller', 'is_opp': False},
        {'rx_id': 533, 'tgt_id': 7068, 'name': 'Move:ROUND', 'default_name': 'Round', 'move_key': 'round', 'is_opp': False},
        {'rx_id': 534, 'tgt_id': 7069, 'name': 'OppMove:ROUND', 'default_name': 'Round (Opp)', 'move_key': 'round', 'is_opp': True},
    ]

    used_graphics = set()
    used_se_files = set()
    exported_anim_defs = {}

    print(f'[2/6] Parsing and exporting {len(r_specs)} animation definitions...')
    for spec in r_specs:
        rx_id = spec['rx_id']
        tgt_id = spec['tgt_id']
        default_name = spec['default_name']

        if rx_id >= len(anim_list) or not anim_list[rx_id]:
            print(f'  [ERR] rx_id {rx_id} not found in rxdata!')
            continue

        anim = anim_list[rx_id]
        attrs = anim.attributes

        name = attrs.get('@name') or attrs.get(b'@name', '')
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='ignore')
        if not name:
            name = default_name

        graphic = attrs.get('@graphic') or attrs.get(b'@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')
        
        if graphic:
            # Handle source space in Rototiller
            clean_gfx = graphic
            if not clean_gfx.lower().endswith(('.png', '.jpg', '.bmp')):
                clean_gfx += '.png'
            used_graphics.add(clean_gfx)
            graphic = clean_gfx

        raw_frames = attrs.get('@array') or attrs.get(b'@array', [])
        raw_timings = attrs.get('@timing') or attrs.get(b'@timing', [])

        frames = []
        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = isa.parse_cel(cel_data)
                    if cel is None:
                        continue
                    cels.append(cel)
            frames.append({'cels': cels})

        timings = []
        for t in raw_timings:
            t_attrs = t.attributes if hasattr(t, 'attributes') else {}
            frame = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
            ttype = t_attrs.get('@timingType') if '@timingType' in t_attrs else t_attrs.get(b'@timingType', 0)
            tname = t_attrs.get('@name') if '@name' in t_attrs else t_attrs.get(b'@name', b'')
            if isinstance(tname, bytes):
                tname = tname.decode('utf-8', errors='ignore')

            se = t_attrs.get('@se') or t_attrs.get(b'@se')
            se_name = ''
            volume = 80
            pitch = 100

            if se and hasattr(se, 'attributes'):
                raw_sename = se.attributes.get('@name') or se.attributes.get(b'@name', b'')
                if isinstance(raw_sename, bytes):
                    se_name = raw_sename.decode('utf-8', errors='ignore')
                volume = se.attributes.get('@volume') or se.attributes.get(b'@volume', 80)
                pitch = se.attributes.get('@pitch') or se.attributes.get(b'@pitch', 100)

            if ttype == 0 and not se_name and tname:
                se_name = tname

            if se_name:
                clean_se = os.path.basename(se_name).replace('\\', '/')
                base_no_ext, ext = os.path.splitext(clean_se)
                if not ext:
                    if os.path.exists(os.path.join(source_se_anim_dir, base_no_ext + '.ogg')) or \
                       os.path.exists(os.path.join(source_se_dir, base_no_ext + '.ogg')):
                        clean_se = base_no_ext + '.ogg'
                    else:
                        clean_se = base_no_ext + '.wav'
                used_se_files.add(clean_se)

                timings.append({
                    'frame': frame,
                    'type': 'sound',
                    'payload': {
                        'sound': f'Anim/{clean_se}',
                        'volume': volume,
                        'pitch': pitch
                    },
                    'sound': {
                        'file': clean_se,
                        'volume': volume,
                        'pitch': pitch
                    }
                })

            # Check BG graphic in timingType 1
            if ttype == 1 and tname:
                bg_name = tname
                if not bg_name.lower().endswith(('.png', '.jpg', '.bmp')):
                    bg_name += '.png'
                used_graphics.add(bg_name)

        anim_def = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'hue': attrs.get('@hue', 0) or 0,
            'position': attrs.get('@position', 1) or 1,
            'fps': 20,
            'frames': frames,
            'timings': timings
        }

        # Save to both animations/ and last-chance/
        json_out = os.path.join(anims_out_dir, f'{tgt_id}.json')
        last_chance_out = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(json_out, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)
        with open(last_chance_out, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        exported_anim_defs[tgt_id] = anim_def
        print(f'  Exported [{tgt_id}] {name} ({len(frames)} frames, {len(timings)} timings)')

    # [3/6] Registering atlas graphics into animation-atlas.json
    print('[3/6] Registering atlas graphics into animation-atlas.json...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    for gfx in used_graphics:
        src_file = os.path.join(source_gfx_dir, gfx)
        if not os.path.exists(src_file):
            print(f'  [WARN] Graphic {gfx} not found in source Graphics/Animations!')
            continue

        shutil.copy2(src_file, os.path.join(dest_gfx_dir, gfx))
        shutil.copy2(src_file, os.path.join(local_gfx_dir, gfx))

        if gfx not in atlas:
            with Image.open(src_file) as img:
                w, h = img.size
            if w == 512 and h == 384:
                cell_w, cell_h = 512, 384
                cols, rows = 1, 1
            else:
                cell_w, cell_h = 192, 192
                cols = w // 192
                rows = h // 192
            total = cols * rows
            asset_key = 'animation.' + gfx.lower().replace('.png', '').replace(' ', '-').replace('_', '-')
            atlas[gfx] = {
                'assetKey': asset_key,
                'file': gfx,
                'width': w,
                'height': h,
                'cellWidth': cell_w,
                'cellHeight': cell_h,
                'cellSize': cell_w,
                'columns': cols,
                'rows': rows,
                'maxPattern': total,
                'totalCells': total
            }
            print(f'  Registered new atlas entry for {gfx} ({w}x{h}, {cols}x{rows} cells)')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2)

    # [4/6] Synchronizing audio SE files
    print('[4/6] Synchronizing audio SE files...')
    for se_file in sorted(used_se_files):
        src_path = os.path.join(source_se_anim_dir, se_file)
        if not os.path.exists(src_path):
            src_path = os.path.join(source_se_dir, se_file)
        
        if not os.path.exists(src_path):
            found = False
            for cand_dir in [source_se_anim_dir, source_se_dir]:
                if not os.path.exists(cand_dir): continue
                for f in os.listdir(cand_dir):
                    if f.lower() == se_file.lower():
                        src_path = os.path.join(cand_dir, f)
                        found = True
                        break
                if found: break
            if not found:
                print(f'  [WARN] SE file {se_file} not found in source!')
                continue

        dest_top = os.path.join(public_se_dir, se_file)
        dest_anim = os.path.join(public_se_anim_dir, se_file)
        shutil.copy2(src_path, dest_top)
        shutil.copy2(src_path, dest_anim)
        print(f'  Audio synced: {se_file} (from {os.path.basename(src_path)})')

    # [5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...
    print('[5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...')
    
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext_data = json.load(f)

    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(map_path, 'r', encoding='utf-8') as f:
        map_data = json.load(f)

    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    anim_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(anim_db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)

    lc_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(lc_manifest_path, 'r', encoding='utf-8') as f:
        lc_manifest = json.load(f)

    for spec in r_specs:
        mkey = spec['move_key']
        tgt_id = spec['tgt_id']
        is_opp = spec['is_opp']

        lc_manifest[str(tgt_id)] = {
            'id': str(tgt_id),
            'name': spec['name'],
            'frames': len(exported_anim_defs[tgt_id]['frames']),
            'hasSound': len(exported_anim_defs[tgt_id]['timings']) > 0
        }

        if is_opp:
            ext_data.setdefault('opponentMoves', {})[mkey] = tgt_id
            map_data.setdefault('opponentMoves', {})[mkey] = tgt_id
            if mkey in anim_db:
                anim_db[mkey]['opponentAnimId'] = tgt_id
        else:
            ext_data.setdefault('moves', {})[mkey] = tgt_id
            map_data.setdefault('moves', {})[mkey] = tgt_id
            if mkey in anim_db:
                anim_db[mkey]['animId'] = tgt_id
                anim_db[mkey]['hasDedicatedAnimation'] = True
                anim_db[mkey]['source'] = 'Unbreakable Ties 4.1.2'
                anim_def = exported_anim_defs[tgt_id]
                if anim_def['graphic']:
                    anim_db[mkey]['graphic'] = anim_def['graphic']
                    anim_db[mkey]['hasGraphicFile'] = True
                sounds = [t['sound']['file'] for t in anim_def['timings'] if 'sound' in t and 'file' in t['sound']]
                if sounds:
                    anim_db[mkey]['soundEffects'] = list(dict.fromkeys(sounds))

    # Gen 9 Fallback:
    fallbacks = {
        'ruination': {'target': 'super_fang', 'id': 6642, 'opp_id': 295},
    }

    for fb_key, fb_info in fallbacks.items():
        ext_data.setdefault('moves', {})[fb_key] = fb_info['id']
        map_data.setdefault('moves', {})[fb_key] = fb_info['id']
        if fb_info['opp_id']:
            ext_data.setdefault('opponentMoves', {})[fb_key] = fb_info['opp_id']
            map_data.setdefault('opponentMoves', {})[fb_key] = fb_info['opp_id']
        if fb_key in anim_db:
            anim_db[fb_key]['animId'] = fb_info['id']
            if fb_info['opp_id']:
                anim_db[fb_key]['opponentAnimId'] = fb_info['opp_id']
            anim_db[fb_key]['hasDedicatedAnimation'] = True
            anim_db[fb_key]['source'] = f'Fallback to {fb_info["target"]} (Unbreakable Ties)'

    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext_data, f, indent=2)

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(map_data, f, indent=2)

    with open(anim_db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2)

    with open(lc_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(lc_manifest, f, indent=2)

    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    if os.path.exists(reunion_path):
        with open(reunion_path, 'r', encoding='utf-8') as f:
            reunion_data = json.load(f)
        for spec in r_specs:
            if not spec['is_opp']:
                reunion_data[spec['move_key']] = spec['tgt_id']
        with open(reunion_path, 'w', encoding='utf-8') as f:
            json.dump(reunion_data, f, indent=2)

    print('[6/6] R Group Batch 3 (Final) moves imported successfully!')

if __name__ == '__main__':
    main()
