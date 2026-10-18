#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 P-Group (Batch 3) Battle Animations.
17 moves handled + 3 Gen 8/9 fallbacks:
  1. psybeam (Target IDs: 6988 PL / 6989 OPP) - Psychic Special (PRAS- Psybeam.png, 25 frames)
  2. psych_up (Target ID: 6990) - Normal Status (PRAS- Quiver Dance.png, 25 frames)
  3. psychic (Target ID: 6991) - Psychic Special (PRAS- Psychic BG.png, 25 frames)
  4. psychic_fangs (Target ID: 6992) - Psychic Physical (PRAS- Bite.png, 15 frames)
  5. psychic_terrain (Target ID: 6993) - Psychic Status (PRAS- Mirror Coat.png, 43 frames)
  6. psycho_boost (Target IDs: 6994 PL / 6995 OPP) - Psychic Special (PRAS- Psycho Boost.png, 68 frames)
  7. psycho_cut (Target IDs: 6996 PL / 6997 OPP) - Psychic Physical (PRAS- Psycho Cut.png, 20 frames)
  8. psycho_shift (Target ID: 6998) - Psychic Status (PRAS- Psycho Shift.png, 18 frames)
  9. psyshock (Target ID: 6999) - Psychic Special (PRAS- Swords Dance + Signal Beam.png, 25 frames)
  10. psystrike (Target ID: 7000) - Psychic Special (PRAS- Psystrike.png, 51 frames)
  11. psywave (Target IDs: 7001 PL / 7002 OPP) - Psychic Special (PRAS- Psybeam.png, 20 frames)
  12. pulverizing_pancake (Target ID: 7003) - Normal Physical (PRAS- Pulverizing Pancake.png, 89 frames)
  13. punishment (Target ID: 7004) - Dark Physical (PRAS- Psycho Cut.png, 20 frames)
  14. purify (Target IDs: 7005 PL / 7006 OPP) - Poison Status (PRAS- Clear Smog.png, 50 frames)
  15. pursuit (Target IDs: 7007 PL / 7008 OPP) - Dark Physical (PRAS- Shadow Sneak.png, 45 frames)
  16. pyro_ball (Target IDs: 7009 PL / 7010 OPP) - Fire Physical (GEN8- PyroBall.png, 55 frames)
  17. shattered_psyche (Target ID: 7011) - Psychic Special (PRAS- Shattered Psyche.png, 60 frames)
  Fallbacks:
  - psyblade -> psycho_cut (6996 PL / 6997 OPP)
  - psychic_noise -> psywave (7001 PL / 7002 OPP)
  - psyshield_bash -> psyshock (6999 PL)
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

    # Specification for P Group Batch 3 moves:
    p_specs = [
        {'rx_id': 627, 'tgt_id': 6988, 'name': 'Move:PSYBEAM', 'default_name': 'Psybeam', 'move_key': 'psybeam', 'is_opp': False},
        {'rx_id': 628, 'tgt_id': 6989, 'name': 'OppMove:PSYBEAM', 'default_name': 'Psybeam (Opp)', 'move_key': 'psybeam', 'is_opp': True},
        {'rx_id': 657, 'tgt_id': 6990, 'name': 'Move:PSYCHUP', 'default_name': 'Psych Up', 'move_key': 'psych_up', 'is_opp': False},
        {'rx_id': 175, 'tgt_id': 6991, 'name': 'Move:PSYCHIC', 'default_name': 'Psychic', 'move_key': 'psychic', 'is_opp': False},
        {'rx_id': 1387, 'tgt_id': 6992, 'name': 'Move:PSYCHICFANGS', 'default_name': 'Psychic Fangs', 'move_key': 'psychic_fangs', 'is_opp': False},
        {'rx_id': 1135, 'tgt_id': 6993, 'name': 'Move:PSYCHICTERRAIN', 'default_name': 'Psychic Terrain', 'move_key': 'psychic_terrain', 'is_opp': False},
        {'rx_id': 1075, 'tgt_id': 6994, 'name': 'Move:PSYCHOBOOST', 'default_name': 'Psycho Boost', 'move_key': 'psycho_boost', 'is_opp': False},
        {'rx_id': 1076, 'tgt_id': 6995, 'name': 'OppMove:PSYCHOBOOST', 'default_name': 'Psycho Boost (Opp)', 'move_key': 'psycho_boost', 'is_opp': True},
        {'rx_id': 323, 'tgt_id': 6996, 'name': 'Move:PSYCHOCUT', 'default_name': 'Psycho Cut', 'move_key': 'psycho_cut', 'is_opp': False},
        {'rx_id': 324, 'tgt_id': 6997, 'name': 'OppMove:PSYCHOCUT', 'default_name': 'Psycho Cut (Opp)', 'move_key': 'psycho_cut', 'is_opp': True},
        {'rx_id': 1058, 'tgt_id': 6998, 'name': 'Move:PSYCHOSHIFT', 'default_name': 'Psycho Shift', 'move_key': 'psycho_shift', 'is_opp': False},
        {'rx_id': 706, 'tgt_id': 6999, 'name': 'Move:PSYSHOCK', 'default_name': 'Psyshock', 'move_key': 'psyshock', 'is_opp': False},
        {'rx_id': 1130, 'tgt_id': 7000, 'name': 'Move:PSYSTRIKE', 'default_name': 'Psystrike', 'move_key': 'psystrike', 'is_opp': False},
        {'rx_id': 716, 'tgt_id': 7001, 'name': 'Move:PSYWAVE', 'default_name': 'Psywave', 'move_key': 'psywave', 'is_opp': False},
        {'rx_id': 717, 'tgt_id': 7002, 'name': 'OppMove:PSYWAVE', 'default_name': 'Psywave (Opp)', 'move_key': 'psywave', 'is_opp': True},
        {'rx_id': 1212, 'tgt_id': 7003, 'name': 'Move:PULVERIZINGPANCAKE', 'default_name': 'Pulverizing Pancake', 'move_key': 'pulverizing_pancake', 'is_opp': False},
        {'rx_id': 910, 'tgt_id': 7004, 'name': 'Move:PUNISHMENT', 'default_name': 'Punishment', 'move_key': 'punishment', 'is_opp': False},
        {'rx_id': 983, 'tgt_id': 7005, 'name': 'Move:PURIFY', 'default_name': 'Purify', 'move_key': 'purify', 'is_opp': False},
        {'rx_id': 984, 'tgt_id': 7006, 'name': 'OppMove:PURIFY', 'default_name': 'Purify (Opp)', 'move_key': 'purify', 'is_opp': True},
        {'rx_id': 577, 'tgt_id': 7007, 'name': 'Move:PURSUIT', 'default_name': 'Pursuit', 'move_key': 'pursuit', 'is_opp': False},
        {'rx_id': 578, 'tgt_id': 7008, 'name': 'OppMove:PURSUIT', 'default_name': 'Pursuit (Opp)', 'move_key': 'pursuit', 'is_opp': True},
        {'rx_id': 1287, 'tgt_id': 7009, 'name': 'Move:PYROBALL', 'default_name': 'Pyro Ball', 'move_key': 'pyro_ball', 'is_opp': False},
        {'rx_id': 1288, 'tgt_id': 7010, 'name': 'OppMove:PYROBALL', 'default_name': 'Pyro Ball (Opp)', 'move_key': 'pyro_ball', 'is_opp': True},
        {'rx_id': 1196, 'tgt_id': 7011, 'name': 'Move:SHATTEREDPSYCHE', 'default_name': 'Shattered Psyche', 'move_key': 'shattered_psyche', 'is_opp': False},
    ]

    print(f'[2/6] Parsing and exporting {len(p_specs)} animation definitions...')
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)

    used_graphics = set()
    used_se_files = set()

    for spec in p_specs:
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
        
        # Normalize graphic name (fix space in Psychic BG)
        if graphic:
            if not graphic.lower().endswith(('.png', '.jpg', '.bmp')):
                graphic += '.png'
            if graphic == 'PRAS- PsychicBG.png':
                graphic = 'PRAS- Psychic BG.png'
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
                    
                    # Ensure cel graphic matches normalized if present
                    if cel.get('graphic') == 'PRAS- PsychicBG.png':
                        cel['graphic'] = 'PRAS- Psychic BG.png'

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
            'hue': 0,
            'position': 1 if spec['is_opp'] else 2,
            'fps': 20,
            'frames': frames,
            'timings': timings
        }

        # Save to main animations and last-chance
        out_file = os.path.join(anims_out_dir, f'{tgt_id}.json')
        last_chance_file = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)
        with open(last_chance_file, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        # Update manifests
        manifest[str(tgt_id)] = {
            'id': str(tgt_id),
            'name': name,
            'file': f'{tgt_id}.json'
        }
        last_chance_manifest[str(tgt_id)] = {
            'id': str(tgt_id),
            'name': name,
            'file': f'{tgt_id}.json'
        }
        print(f"  Exported [{tgt_id}] {name} ({len(frames)} frames, {len(timings)} timings)")

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2)

    print('[3/6] Registering atlas graphics into animation-atlas.json...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    last_chance_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')

    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(last_chance_atlas_path, 'r', encoding='utf-8') as f:
        last_chance_atlas = json.load(f)

    atlas_updates = 0
    for g in sorted(used_graphics):
        src_path = os.path.join(source_gfx_dir, g)
        if not os.path.exists(src_path):
            # Check without space or with space
            alt_g = g.replace(' ', '') if ' ' in g else g
            alt_path = os.path.join(source_gfx_dir, alt_g)
            if os.path.exists(alt_path):
                src_path = alt_path
            else:
                print(f'  [WARN] Graphic {g} not found at {src_path}')
                continue

        # Copy to destination dirs
        shutil.copy2(src_path, os.path.join(dest_gfx_dir, g))
        shutil.copy2(src_path, os.path.join(local_gfx_dir, g))

        with Image.open(src_path) as img:
            w, h = img.size

        clean_slug = g.lower().replace('.png', '').replace(' ', '-').replace('_', '-')

        # Special handling for Shattered Psyche (960x695): only rows 0..2 (15 cells) are full 192px
        if 'shattered psyche' in g.lower():
            cell_size = 192
            cols = 5
            rows = 3
            total_cells = 15
        elif 'psychic bg' in g.lower():
            # Background full-field image
            cell_size = 512
            cols = 1
            rows = 1
            total_cells = 1
            atlas_entry = {
                'assetKey': f'animation.{clean_slug}',
                'file': g,
                'width': w,
                'height': h,
                'cellWidth': w,
                'cellHeight': h,
                'cellSize': w,
                'columns': 1,
                'rows': 1,
                'maxPattern': 1,
                'totalCells': 1
            }
            atlas[g] = atlas_entry
            last_chance_atlas[g] = atlas_entry
            # Also register alias without space
            atlas['PRAS- PsychicBG.png'] = atlas_entry
            last_chance_atlas['PRAS- PsychicBG.png'] = atlas_entry
            atlas_updates += 1
            continue
        else:
            cell_size = 192
            cols = 5
            if w % cell_size == 0:
                cols = w // cell_size
            rows = h // cell_size
            if rows == 0:
                rows = 1
            total_cells = cols * rows

        atlas_entry = {
            'assetKey': f'animation.{clean_slug}',
            'file': g,
            'width': w,
            'height': h,
            'cellWidth': cell_size,
            'cellHeight': cell_size,
            'cellSize': cell_size,
            'columns': cols,
            'rows': rows,
            'maxPattern': total_cells,
            'totalCells': total_cells
        }

        atlas[g] = atlas_entry
        last_chance_atlas[g] = atlas_entry
        atlas_updates += 1

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2)
    with open(last_chance_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_atlas, f, indent=2)
    print(f'  Updated atlas with {atlas_updates} entries')

    print('[4/6] Synchronizing audio SE files...')
    for se_file in sorted(used_se_files):
        found_path = None
        base_name, _ = os.path.splitext(se_file)
        # Search candidate paths & extensions
        candidates = []
        for ext in ['.ogg', '.wav', '.mp3']:
            fn = base_name + ext
            candidates.extend([
                os.path.join(source_se_anim_dir, fn),
                os.path.join(source_se_dir, fn),
                os.path.join(public_se_anim_dir, fn),
                os.path.join(public_se_dir, fn),
            ])

        for cand in candidates:
            if os.path.exists(cand):
                found_path = cand
                break
        
        if found_path:
            actual_fn = os.path.basename(found_path)
            dest_anim = os.path.join(public_se_anim_dir, actual_fn)
            dest_se = os.path.join(public_se_dir, actual_fn)
            shutil.copy2(found_path, dest_anim)
            shutil.copy2(found_path, dest_se)
            # If actual_fn != se_file, also copy as se_file
            if actual_fn != se_file:
                shutil.copy2(found_path, os.path.join(public_se_anim_dir, se_file))
                shutil.copy2(found_path, os.path.join(public_se_dir, se_file))
            print(f'  Audio synced: {se_file} (from {os.path.basename(found_path)})')
        else:
            print(f'  [WARN] Missing sound file: {se_file}')

    print('[5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...')
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    anim_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')

    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)
    with open(anim_db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext_db = json.load(f)

    if 'moves' not in anim_map:
        anim_map['moves'] = {}
    if 'opponentMoves' not in anim_map:
        anim_map['opponentMoves'] = {}

    batch3_mappings = {
        'psybeam': {'pl': 6988, 'opp': 6989},
        'psyblade': {'pl': 6996, 'opp': 6997}, # Fallback to psycho_cut
        'psych_up': {'pl': 6990, 'opp': None},
        'psychic': {'pl': 6991, 'opp': None},
        'psychic_fangs': {'pl': 6992, 'opp': None},
        'psychic_noise': {'pl': 7001, 'opp': 7002}, # Fallback to psywave
        'psychic_terrain': {'pl': 6993, 'opp': None},
        'psycho_boost': {'pl': 6994, 'opp': 6995},
        'psycho_cut': {'pl': 6996, 'opp': 6997},
        'psycho_shift': {'pl': 6998, 'opp': None},
        'psyshield_bash': {'pl': 6999, 'opp': None}, # Fallback to psyshock
        'psyshock': {'pl': 6999, 'opp': None},
        'psystrike': {'pl': 7000, 'opp': None},
        'psywave': {'pl': 7001, 'opp': 7002},
        'pulverizing_pancake': {'pl': 7003, 'opp': None},
        'punishment': {'pl': 7004, 'opp': None},
        'purify': {'pl': 7005, 'opp': 7006},
        'pursuit': {'pl': 7007, 'opp': 7008},
        'pyro_ball': {'pl': 7009, 'opp': 7010},
        'shattered_psyche': {'pl': 7011, 'opp': None},
    }

    # Clean up any misplaced root keys on anim_map
    for k in batch3_mappings.keys():
        anim_map.pop(k, None)

    for m_key, m_val in batch3_mappings.items():
        anim_map['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            anim_map['opponentMoves'][m_key] = m_val['opp']

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2)

    # Update moves_db
    moves_dict = moves_db.get('moves', moves_db)
    for m_key, m_val in batch3_mappings.items():
        if m_key in moves_dict:
            moves_dict[m_key]['animationId'] = m_val['pl']
    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2)

    # Sync move-animations-db.json
    if 'moves' not in anim_db: anim_db['moves'] = {}
    if 'opponentMoves' not in anim_db: anim_db['opponentMoves'] = {}
    for m_key, m_val in batch3_mappings.items():
        anim_db['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            anim_db['opponentMoves'][m_key] = m_val['opp']
    with open(anim_db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2)

    # Sync move-animation-extensions.json
    if 'moves' not in ext_db: ext_db['moves'] = {}
    if 'opponentMoves' not in ext_db: ext_db['opponentMoves'] = {}
    for m_key, m_val in batch3_mappings.items():
        ext_db['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            ext_db['opponentMoves'][m_key] = m_val['opp']
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext_db, f, indent=2)

    print('[6/6] P Group Batch 3 moves imported successfully!')

if __name__ == '__main__':
    main()
