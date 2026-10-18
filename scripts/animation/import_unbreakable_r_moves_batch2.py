#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 R Group (Batch 2) Battle Animations.
14 moves handled + 1 Gen 9 fallback:
  1. refresh (Target ID: 7032) - Normal Status (PRAS- Recovery.png, 15 frames)
  2. relic_song (Target ID: 7033) - Normal Special (PRAS- Sound.png, 38 frames)
  3. rest (Target ID: 7034) - Psychic Status (PRAS- Status.png, 1 frame + PRSFX- Sleep.wav)
  4. retaliate (Target IDs: 7035 PL / 7036 OPP) - Normal Physical (PRAS- Retaliate.png, 26 frames)
  5. return (Target ID: 7037) - Normal Physical (PRAS- Love.png, 16 frames)
  6. revelation_dance (Target ID: 7038) - Normal Special (PRAS- Swap.png, 38 frames)
  7. revenge (Target IDs: 7039 PL / 7040 OPP) - Fighting Physical (PRAS- Revenge.png, 60 frames)
  8. reversal (Target IDs: 7041 PL / 7042 OPP) - Fighting Physical (PRAS- Strike.png, 22 frames)
  9. rising_voltage (Target ID: 7043) - Electric Special (PRAS- Electric.png, 20 frames)
  10. roar (Target IDs: 7044 PL / 7045 OPP) - Normal Status (PRAS- Roar.png, 21 frames + PRSFX- Roar.wav)
  11. roar_of_time (Target ID: 7046) - Dragon Special (PRAS- Uproar.png, 60 frames)
  12. rock_blast (Target IDs: 7047 PL / 7048 OPP) - Rock Physical (PRAS- Rock.png, 10 frames)
  13. rock_climb (Target IDs: 7049 PL / 7050 OPP) - Normal Physical (PRAS- Rock.png, 34 frames)
  14. rock_polish (Target ID: 7051) - Rock Status (PRAS- Rock Polish.png, 22 frames)
  Fallback:
  - revival_blessing -> recover (7026)
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

    # Specification for R Group Batch 2 moves:
    r_specs = [
        {'rx_id': 812, 'tgt_id': 7032, 'name': 'Move:REFRESH', 'default_name': 'Refresh', 'move_key': 'refresh', 'is_opp': False},
        {'rx_id': 877, 'tgt_id': 7033, 'name': 'Move:RELICSONG', 'default_name': 'Relic Song', 'move_key': 'relic_song', 'is_opp': False},
        {'rx_id': 198, 'tgt_id': 7034, 'name': 'Move:REST', 'default_name': 'Rest', 'move_key': 'rest', 'is_opp': False, 'extra_se': 'PRSFX- Sleep.wav'},
        {'rx_id': 127, 'tgt_id': 7035, 'name': 'Move:RETALIATE', 'default_name': 'Retaliate', 'move_key': 'retaliate', 'is_opp': False},
        {'rx_id': 128, 'tgt_id': 7036, 'name': 'OppMove:RETALIATE', 'default_name': 'Retaliate (Opp)', 'move_key': 'retaliate', 'is_opp': True},
        {'rx_id': 472, 'tgt_id': 7037, 'name': 'Move:RETURN', 'default_name': 'Return', 'move_key': 'return', 'is_opp': False},
        {'rx_id': 1391, 'tgt_id': 7038, 'name': 'Move:REVELATIONDANCE', 'default_name': 'Revelation Dance', 'move_key': 'revelation_dance', 'is_opp': False},
        {'rx_id': 530, 'tgt_id': 7039, 'name': 'Move:REVENGE', 'default_name': 'Revenge', 'move_key': 'revenge', 'is_opp': False},
        {'rx_id': 531, 'tgt_id': 7040, 'name': 'OppMove:REVENGE', 'default_name': 'Revenge (Opp)', 'move_key': 'revenge', 'is_opp': True, 'fix_revenge_opp': True},
        {'rx_id': 674, 'tgt_id': 7041, 'name': 'Move:REVERSAL', 'default_name': 'Reversal', 'move_key': 'reversal', 'is_opp': False},
        {'rx_id': 675, 'tgt_id': 7042, 'name': 'OppMove:REVERSAL', 'default_name': 'Reversal (Opp)', 'move_key': 'reversal', 'is_opp': True},
        {'rx_id': 1317, 'tgt_id': 7043, 'name': 'Move:RISINGVOLTAGE', 'default_name': 'Rising Voltage', 'move_key': 'rising_voltage', 'is_opp': False},
        {'rx_id': 371, 'tgt_id': 7044, 'name': 'Move:ROAR', 'default_name': 'Roar', 'move_key': 'roar', 'is_opp': False, 'extra_se': 'PRSFX- Roar.wav'},
        {'rx_id': 372, 'tgt_id': 7045, 'name': 'OppMove:ROAR', 'default_name': 'Roar (Opp)', 'move_key': 'roar', 'is_opp': True, 'extra_se': 'PRSFX- Roar.wav'},
        {'rx_id': 1392, 'tgt_id': 7046, 'name': 'Move:ROAROFTIME', 'default_name': 'Roar of Time', 'move_key': 'roar_of_time', 'is_opp': False},
        {'rx_id': 445, 'tgt_id': 7047, 'name': 'Move:ROCKBLAST', 'default_name': 'Rock Blast', 'move_key': 'rock_blast', 'is_opp': False},
        {'rx_id': 450, 'tgt_id': 7048, 'name': 'OppMove:ROCKBLAST', 'default_name': 'Rock Blast (Opp)', 'move_key': 'rock_blast', 'is_opp': True},
        {'rx_id': 542, 'tgt_id': 7049, 'name': 'Move:ROCKCLIMB', 'default_name': 'Rock Climb', 'move_key': 'rock_climb', 'is_opp': False},
        {'rx_id': 543, 'tgt_id': 7050, 'name': 'OppMove:ROCKCLIMB', 'default_name': 'Rock Climb (Opp)', 'move_key': 'rock_climb', 'is_opp': True, 'swap_battlers': True},
        {'rx_id': 521, 'tgt_id': 7051, 'name': 'Move:ROCKPOLISH', 'default_name': 'Rock Polish', 'move_key': 'rock_polish', 'is_opp': False},
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
                    
                    # Fix 1: Revenge OppMove swapped focus labels:
                    # Aura charges around enemy (384, 96) authored as 'target' -> fix to 'user'
                    # Strike hits player (128, 224) authored as 'user' -> fix to 'target'
                    if spec.get('fix_revenge_opp'):
                        if cel.get('pattern', -1) >= 0:
                            if cel.get('focus') == 'target' and cel.get('x', 0) > 256:
                                cel['focus'] = 'user'
                            elif cel.get('focus') == 'user' and cel.get('x', 0) < 256:
                                cel['focus'] = 'target'

                    # Fix 2: Rock Climb OppMove battler shake swap:
                    # In rx 543, pattern -2 (top-right, 384, 96) is animated charging down the rock wall.
                    # In our battle engine, pattern -1 is userPos (Enemy attacker) and -2 is targetPos (Player recipient).
                    # Swap pattern -1 and -2 so the Enemy Pokémon is the one that charges down the mountain.
                    if spec.get('swap_battlers'):
                        if cel.get('pattern') == -1:
                            cel['pattern'] = -2
                            cel['focus'] = 'target'
                        elif cel.get('pattern') == -2:
                            cel['pattern'] = -1
                            cel['focus'] = 'user'

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

        # Inject extra sound for moves with empty timings (Rest, Roar)
        if spec.get('extra_se'):
            extra_se = spec['extra_se']
            used_se_files.add(extra_se)
            # Only add if not already present
            if not any(t.get('sound', {}).get('file') == extra_se for t in timings):
                timings.append({
                    'frame': 0,
                    'type': 'sound',
                    'payload': {
                        'sound': f'Anim/{extra_se}',
                        'volume': 85,
                        'pitch': 100
                    },
                    'sound': {
                        'file': extra_se,
                        'volume': 85,
                        'pitch': 100
                    }
                })

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
            if w == 512 and h == 384:
                # Stage-wide background / foreground overlay
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
        'revival_blessing': {'target': 'recover', 'id': 7026, 'opp_id': None},
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

    print('[6/6] R Group Batch 2 moves imported successfully!')

if __name__ == '__main__':
    main()
