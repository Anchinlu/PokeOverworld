#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 Q & R Group (Batch 1) Battle Animations.
15 moves handled + 3 Gen 8/9 fallbacks:
  1. quash (Target ID: 7017) - Dark Status (Sound: PRSFX- Quash.wav, 18 frames)
  2. quick_attack (Target IDs: 7012 PL / 7013 OPP) - Normal Physical (PRAS- Strike.png, 14 frames)
  3. quick_guard (Target IDs: 7014 PL / 7015 OPP) - Fighting Status (PRAS- Lucky Chant.png, 23 frames)
  4. quiver_dance (Target ID: 7016) - Bug Status (PRAS- Quiver Dance.png, 21 frames)
  5. rage (Target ID: 7018) - Normal Physical (PRAS- Strike.png, 14 frames)
  6. rage_powder (Target ID: 7019) - Bug Status (PRAS- Rage Powder.png, 30 frames)
  7. rain_dance (Target ID: 7020) - Water Status (PRAS- Water.png, 26 frames)
  8. rapid_spin (Target ID: 7021) - Normal Physical (PRAS- Dragon Dance.png, 22 frames)
  9. razor_leaf (Target IDs: 7022 PL / 7023 OPP) - Grass Physical (PRAS- Grass.png, 30 frames)
  10. razor_shell (Target ID: 7024) - Water Physical (PRAS- Razor Shell.png, 21 frames)
  11. razor_wind (Target ID: 7025) - Normal Special (PRAS- Air Cutter.png, 34 frames)
  12. recover (Target ID: 7026) - Normal Status (PRAS- Recovery.png, 20 frames)
  13. recycle (Target ID: 7027) - Normal Status (PRAS- Recycle.png, 20 frames)
  14. reflect (Target IDs: 7028 PL / 7029 OPP) - Psychic Status (PRAS- Reflect.png, 21 frames)
  15. reflect_type (Target IDs: 7030 PL / 7031 OPP) - Normal Status (PRAS- Strike.png, 35 frames)
  Fallbacks:
  - rage_fist -> rage (7018)
  - raging_bull -> take_down (6651 PL / 6651 OPP)
  - raging_fury -> fire_lash (6838)
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

    # Specification for Q & R Group Batch 1 moves:
    qr_specs = [
        {'rx_id': 922, 'tgt_id': 7017, 'name': 'Move:QUASH', 'default_name': 'Quash', 'move_key': 'quash', 'is_opp': False},
        {'rx_id': 219, 'tgt_id': 7012, 'name': 'Move:QUICKATTACK', 'default_name': 'Quick Attack', 'move_key': 'quick_attack', 'is_opp': False},
        {'rx_id': 220, 'tgt_id': 7013, 'name': 'OppMove:QUICKATTACK', 'default_name': 'Quick Attack (Opp)', 'move_key': 'quick_attack', 'is_opp': True},
        {'rx_id': 809, 'tgt_id': 7014, 'name': 'Move:QUICKGUARD', 'default_name': 'Quick Guard', 'move_key': 'quick_guard', 'is_opp': False},
        {'rx_id': 810, 'tgt_id': 7015, 'name': 'OppMove:QUICKGUARD', 'default_name': 'Quick Guard (Opp)', 'move_key': 'quick_guard', 'is_opp': True},
        {'rx_id': 579, 'tgt_id': 7016, 'name': 'Move:QUIVERDANCE', 'default_name': 'Quiver Dance', 'move_key': 'quiver_dance', 'is_opp': False},
        {'rx_id': 658, 'tgt_id': 7018, 'name': 'Move:RAGE', 'default_name': 'Rage', 'move_key': 'rage', 'is_opp': False},
        {'rx_id': 848, 'tgt_id': 7019, 'name': 'Move:RAGEPOWDER', 'default_name': 'Rage Powder', 'move_key': 'rage_powder', 'is_opp': False},
        {'rx_id': 337, 'tgt_id': 7020, 'name': 'Move:RAINDANCE', 'default_name': 'Rain Dance', 'move_key': 'rain_dance', 'is_opp': False},
        {'rx_id': 493, 'tgt_id': 7021, 'name': 'Move:RAPIDSPIN', 'default_name': 'Rapid Spin', 'move_key': 'rapid_spin', 'is_opp': False},
        {'rx_id': 389, 'tgt_id': 7022, 'name': 'Move:RAZORLEAF', 'default_name': 'Razor Leaf', 'move_key': 'razor_leaf', 'is_opp': False},
        {'rx_id': 390, 'tgt_id': 7023, 'name': 'OppMove:RAZORLEAF', 'default_name': 'Razor Leaf (Opp)', 'move_key': 'razor_leaf', 'is_opp': True},
        {'rx_id': 663, 'tgt_id': 7024, 'name': 'Move:RAZORSHELL', 'default_name': 'Razor Shell', 'move_key': 'razor_shell', 'is_opp': False},
        {'rx_id': 1389, 'tgt_id': 7025, 'name': 'Move:RAZORWIND', 'default_name': 'Razor Wind', 'move_key': 'razor_wind', 'is_opp': False},
        {'rx_id': 541, 'tgt_id': 7026, 'name': 'Move:RECOVER', 'default_name': 'Recover', 'move_key': 'recover', 'is_opp': False},
        {'rx_id': 754, 'tgt_id': 7027, 'name': 'Move:RECYCLE', 'default_name': 'Recycle', 'move_key': 'recycle', 'is_opp': False},
        {'rx_id': 108, 'tgt_id': 7028, 'name': 'Move:REFLECT', 'default_name': 'Reflect', 'move_key': 'reflect', 'is_opp': False},
        {'rx_id': 109, 'tgt_id': 7029, 'name': 'OppMove:REFLECT', 'default_name': 'Reflect (Opp)', 'move_key': 'reflect', 'is_opp': True},
        {'rx_id': 1040, 'tgt_id': 7030, 'name': 'Move:REFLECTTYPE', 'default_name': 'Reflect Type', 'move_key': 'reflect_type', 'is_opp': False},
        {'rx_id': 1041, 'tgt_id': 7031, 'name': 'OppMove:REFLECTTYPE', 'default_name': 'Reflect Type (Opp)', 'move_key': 'reflect_type', 'is_opp': True},
    ]

    used_graphics = set()
    used_se_files = set()
    exported_anim_defs = {}

    print(f'[2/6] Parsing and exporting {len(qr_specs)} animation definitions...')
    for spec in qr_specs:
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
            if not graphic.lower().endswith(('.png', '.jpg', '.bmp')):
                graphic += '.png'
            used_graphics.add(graphic)

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
                    # Check if .ogg exists first, then .wav
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

        # Copy to destination dirs
        shutil.copy2(src_file, os.path.join(dest_gfx_dir, gfx))
        shutil.copy2(src_file, os.path.join(local_gfx_dir, gfx))

        if gfx not in atlas:
            with Image.open(src_file) as img:
                w, h = img.size
            cell_size = 192
            cols = w // cell_size
            rows = h // cell_size
            total = cols * rows
            asset_key = 'animation.' + gfx.lower().replace('.png', '').replace(' ', '-').replace('_', '-')
            atlas[gfx] = {
                'assetKey': asset_key,
                'file': gfx,
                'width': w,
                'height': h,
                'cellWidth': cell_size,
                'cellHeight': cell_size,
                'cellSize': cell_size,
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
        # Look in source SE/Anim or source SE
        src_path = os.path.join(source_se_anim_dir, se_file)
        if not os.path.exists(src_path):
            src_path = os.path.join(source_se_dir, se_file)
        
        if not os.path.exists(src_path):
            # Check without extension or case-insensitive
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

        # Copy to both public/Audio/SE and public/Audio/SE/Anim
        dest_top = os.path.join(public_se_dir, se_file)
        dest_anim = os.path.join(public_se_anim_dir, se_file)
        shutil.copy2(src_path, dest_top)
        shutil.copy2(src_path, dest_anim)
        print(f'  Audio synced: {se_file} (from {os.path.basename(src_path)})')

    # [5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...
    print('[5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...')
    
    # 5a. move-animation-extensions.json
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext_data = json.load(f)

    # 5b. move-animation-map.json
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(map_path, 'r', encoding='utf-8') as f:
        map_data = json.load(f)

    # 5c. moves-db.json
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    # 5d. move-animations-db.json
    anim_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(anim_db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)

    # 5e. last-chance-animation-manifest.json
    lc_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(lc_manifest_path, 'r', encoding='utf-8') as f:
        lc_manifest = json.load(f)

    for spec in qr_specs:
        mkey = spec['move_key']
        tgt_id = spec['tgt_id']
        is_opp = spec['is_opp']

        # Add to manifest
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

    # Gen 8/9 Fallbacks:
    fallbacks = {
        'rage_fist': {'target': 'rage', 'id': 7018, 'opp_id': None},
        'raging_bull': {'target': 'take_down', 'id': 6651, 'opp_id': 6651},
        'raging_fury': {'target': 'fire_lash', 'id': 6838, 'opp_id': None},
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

    # 5f. Update reunion-moves.json if present
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    if os.path.exists(reunion_path):
        with open(reunion_path, 'r', encoding='utf-8') as f:
            reunion_data = json.load(f)
        for spec in qr_specs:
            if not spec['is_opp']:
                reunion_data[spec['move_key']] = spec['tgt_id']
        with open(reunion_path, 'w', encoding='utf-8') as f:
            json.dump(reunion_data, f, indent=2)

    print('[6/6] Q & R Group Batch 1 moves imported successfully!')

if __name__ == '__main__':
    main()
