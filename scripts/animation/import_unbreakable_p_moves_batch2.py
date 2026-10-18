#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 P-Group (Batch 2) Battle Animations.
22 moves handled:
  1. poison_fang (Target ID: 6959) - Poison Physical (PRAS- Elemental Fangs.png, 22 frames)
  2. poison_gas (Target ID: 6960) - Poison Status (PRAS- Poison.png, 23 frames)
  3. poison_jab (Target IDs: 6961 PL / 6962 OPP) - Poison Physical (PRAS- Poison Jab.png, 19 frames)
  4. poison_powder (Target ID: 6963) - Poison Status (PRAS- Powders.png, 30 frames)
  5. poison_sting (Target IDs: 6964 PL / 6965 OPP) - Poison Physical (PRAS- Poison Sting.png, 26 frames)
  6. poison_tail (Target IDs: 6966 PL / 6967 OPP) - Poison Physical (PRAS- Poison Tail.png, 30 frames)
  7. pollen_puff (Target IDs: 6968 PL / 6969 OPP) - Bug Special (PRAS- Powders.png, 40/30 frames)
  8. poltergeist (Target ID: 6970) - Ghost Physical (PRAS- Fire.png, 42 frames)
  9. pound (Target ID: 6971) - Normal Physical (PRAS- Strike.png, 9 frames)
  10. powder (Target ID: 6972) - Bug Status (PRAS- Powder.png, 29 frames)
  11. powder_snow (Target ID: 6973) - Ice Special (PRAS- Powder Snow.png, 20 frames)
  12. power_gem (Target ID: 6974) - Rock Special (PRAS- Rock.png, 20 frames)
  13. power_split (Target ID: 6975) - Psychic Status (14 frames)
  14. power_swap (Target IDs: 6976 PL / 6977 OPP) - Psychic Status (PRAS- Swap.png, 38 frames)
  15. power_trick (Target ID: 6978) - Psychic Status (12 frames)
  16. power_trip (Target ID: 6979) - Dark Physical (PRAS- Swagger.png, 59 frames)
  17. power_up_punch (Target ID: 6980) - Fighting Physical (PRAS- Strike.png, 16 frames)
  18. power_whip (Target ID: 6981) - Grass Physical (PRAS- Grass.png, 15 frames)
  19. precipice_blades (Target ID: 6982) - Ground Physical (GEN8- Precipice Blades.png, 30 frames)
  20. present (Target IDs: 6983 PL / 6984 OPP) - Normal Physical (PRAS- Present.png, 24 frames)
  21. prismatic_laser (Target ID: 6985) - Psychic Special (PRAS- Prismatic Laser.png, 92 frames)
  22. protect (Target IDs: 6986 PL / 6987 OPP) - Normal Status (PRAS- Protect.png, 21 frames)
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

    # Specification for P Group Batch 2 moves:
    p_specs = [
        {'rx_id': 263, 'tgt_id': 6959, 'name': 'Move:POISONFANG', 'default_name': 'Poison Fang', 'move_key': 'poison_fang', 'is_opp': False},
        {'rx_id': 163, 'tgt_id': 6960, 'name': 'Move:POISONGAS', 'default_name': 'Poison Gas', 'move_key': 'poison_gas', 'is_opp': False},
        {'rx_id': 913, 'tgt_id': 6961, 'name': 'Move:POISONJAB', 'default_name': 'Poison Jab', 'move_key': 'poison_jab', 'is_opp': False},
        {'rx_id': 914, 'tgt_id': 6962, 'name': 'OppMove:POISONJAB', 'default_name': 'Poison Jab (Opp)', 'move_key': 'poison_jab', 'is_opp': True},
        {'rx_id': 275, 'tgt_id': 6963, 'name': 'Move:POISONPOWDER', 'default_name': 'Poison Powder', 'move_key': 'poison_powder', 'is_opp': False},
        {'rx_id': 240, 'tgt_id': 6964, 'name': 'Move:POISONSTING', 'default_name': 'Poison Sting', 'move_key': 'poison_sting', 'is_opp': False},
        {'rx_id': 241, 'tgt_id': 6965, 'name': 'OppMove:POISONSTING', 'default_name': 'Poison Sting (Opp)', 'move_key': 'poison_sting', 'is_opp': True},
        {'rx_id': 165, 'tgt_id': 6966, 'name': 'Move:POISONTAIL', 'default_name': 'Poison Tail', 'move_key': 'poison_tail', 'is_opp': False},
        {'rx_id': 166, 'tgt_id': 6967, 'name': 'OppMove:POISONTAIL', 'default_name': 'Poison Tail (Opp)', 'move_key': 'poison_tail', 'is_opp': True},
        {'rx_id': 1101, 'tgt_id': 6968, 'name': 'Move:POLLENPUFF', 'default_name': 'Pollen Puff', 'move_key': 'pollen_puff', 'is_opp': False},
        {'rx_id': 1102, 'tgt_id': 6969, 'name': 'OppMove:POLLENPUFF', 'default_name': 'Pollen Puff (Opp)', 'move_key': 'pollen_puff', 'is_opp': True},
        {'rx_id': 1316, 'tgt_id': 6970, 'name': 'Move:POLTERGEIST', 'default_name': 'Poltergeist', 'move_key': 'poltergeist', 'is_opp': False},
        {'rx_id': 283, 'tgt_id': 6971, 'name': 'Move:POUND', 'default_name': 'Pound', 'move_key': 'pound', 'is_opp': False},
        {'rx_id': 972, 'tgt_id': 6972, 'name': 'Move:POWDER', 'default_name': 'Powder', 'move_key': 'powder', 'is_opp': False},
        {'rx_id': 624, 'tgt_id': 6973, 'name': 'Move:POWDERSNOW', 'default_name': 'Powder Snow', 'move_key': 'powder_snow', 'is_opp': False},
        {'rx_id': 503, 'tgt_id': 6974, 'name': 'Move:POWERGEM', 'default_name': 'Power Gem', 'move_key': 'power_gem', 'is_opp': False},
        {'rx_id': 818, 'tgt_id': 6975, 'name': 'Move:POWERSPLIT', 'default_name': 'Power Split', 'move_key': 'power_split', 'is_opp': False},
        {'rx_id': 826, 'tgt_id': 6976, 'name': 'Move:POWERSWAP', 'default_name': 'Power Swap', 'move_key': 'power_swap', 'is_opp': False},
        {'rx_id': 827, 'tgt_id': 6977, 'name': 'MoveOpp:POWERSWAP', 'default_name': 'Power Swap (Opp)', 'move_key': 'power_swap', 'is_opp': True},
        {'rx_id': 808, 'tgt_id': 6978, 'name': 'Move:POWERTRICK', 'default_name': 'Power Trick', 'move_key': 'power_trick', 'is_opp': False},
        {'rx_id': 1139, 'tgt_id': 6979, 'name': 'Move:POWERTRIP', 'default_name': 'Power Trip', 'move_key': 'power_trip', 'is_opp': False},
        {'rx_id': 625, 'tgt_id': 6980, 'name': 'Move:POWERUPPUNCH', 'default_name': 'Power-Up Punch', 'move_key': 'power_up_punch', 'is_opp': False},
        {'rx_id': 730, 'tgt_id': 6981, 'name': 'Move:POWERWHIP', 'default_name': 'Power Whip', 'move_key': 'power_whip', 'is_opp': False},
        {'rx_id': 1388, 'tgt_id': 6982, 'name': 'Move:PRECIPICEBLADES', 'default_name': 'Precipice Blades', 'move_key': 'precipice_blades', 'is_opp': False},
        {'rx_id': 908, 'tgt_id': 6983, 'name': 'Move:PRESENT', 'default_name': 'Present', 'move_key': 'present', 'is_opp': False},
        {'rx_id': 909, 'tgt_id': 6984, 'name': 'OppMove:PRESENT', 'default_name': 'Present (Opp)', 'move_key': 'present', 'is_opp': True},
        {'rx_id': 1119, 'tgt_id': 6985, 'name': 'Move:PRISMATICLASER', 'default_name': 'Prismatic Laser', 'move_key': 'prismatic_laser', 'is_opp': False},
        {'rx_id': 490, 'tgt_id': 6986, 'name': 'Move:PROTECT', 'default_name': 'Protect', 'move_key': 'protect', 'is_opp': False},
        {'rx_id': 491, 'tgt_id': 6987, 'name': 'OppMove:PROTECT', 'default_name': 'Protect (Opp)', 'move_key': 'protect', 'is_opp': True},
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
                    
                    # -------------------------------------------------------------
                    # MOVE-SPECIFIC FIXES
                    # -------------------------------------------------------------
                    
                    # 1. Poison Jab Opp (914 / 6962):
                    # In 914, author swapped roles erroneously:
                    # - Defender getting lifted up (F09-F16) was authored as pattern: -1 (Attacker)
                    #   with coordinates y=224->189 near Player anchor.
                    # - Swap pattern -1 and pattern -2 so Defender (Player) is lifted up.
                    # - Fisting/strike cels (pat 0, 1) were mislabeled with focus 'user'.
                    #   Change all attack cels (pat >= 0) to focus 'target' and keep them on Player!
                    if tgt_id == 6962:
                        if cel['pattern'] == -1:
                            cel['pattern'] = -2
                            cel['focus'] = 'target'
                        elif cel['pattern'] == -2:
                            cel['pattern'] = -1
                            cel['focus'] = 'user'
                            cel['x'] = 128
                            cel['y'] = 224
                        elif cel['pattern'] >= 0:
                            cel['focus'] = 'target'

                    # 2. Pollen Puff Opp (1102 / 6969):
                    # In 1102, recoil shaking battler was authored as pattern -2 at (380..400, 88..96)
                    # and opening flight petals/puffs were authored with focus 'target' along (336..136, 92..204).
                    # Fix:
                    # - Dancing/recoil battler (pattern -2): change to pattern -1 (Attacker/Enemy), focus 'user'
                    #   and re-anchor (x - 256, y + 128) so Enemy recoils.
                    # - Stationary battler (pattern -1): change to pattern -2 (Defender/Player), focus 'target', (384, 96).
                    # - Puffs & flight trail (pat >= 0): convert to focus 'both' along (SRC_USER -> SRC_TARGET):
                    #   new_x = 512 - x, new_y = x + y - 256 so puff launches from Enemy (380, 115) to Player (130, 215)!
                    if tgt_id == 6969:
                        if cel['pattern'] == -2:
                            cel['pattern'] = -1
                            cel['x'] = cel['x'] - 256
                            cel['y'] = cel['y'] + 128
                            cel['focus'] = 'user'
                        elif cel['pattern'] == -1:
                            cel['pattern'] = -2
                            cel['x'] = 384
                            cel['y'] = 96
                            cel['focus'] = 'target'
                        elif cel['pattern'] >= 0:
                            ox, oy = cel['x'], cel['y']
                            cel['focus'] = 'both'
                            cel['x'] = 512 - ox
                            cel['y'] = ox + oy - 256

                    # 3. Protect Opp (491 / 6987):
                    # In 491, protective hexagonal shield cels (pat 0..4) were authored at (350, 108) near Enemy
                    # but mislabeled with focus 'target'.
                    # Re-anchor them to focus 'user' relative to SRC_USER (128, 224) so shield shields the Enemy!
                    if tgt_id == 6987:
                        if cel['pattern'] >= 0:
                            cel['focus'] = 'user'
                            cel['x'] = cel['x'] - 256 # (350 - 384) + 128 = 94
                            cel['y'] = cel['y'] + 128 # (108 - 96) + 224 = 236

                    # 4. Prismatic Laser (1119 / 6985):
                    # In rx 1119, author placed stray pattern 10 and 11 in Frame 33, but PRAS- Prismatic Laser.png
                    # is 960x384 (only 10 cells: patterns 0..9). Clamp pattern to max valid index (9).
                    if tgt_id == 6985:
                        if cel['pattern'] > 9:
                            cel['pattern'] = 9

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
                else:
                    se_name = str(raw_sename)
                volume = se.attributes.get('@volume') or se.attributes.get(b'@volume', 80)
                pitch = se.attributes.get('@pitch') or se.attributes.get(b'@pitch', 100)

            # In Unbreakable Ties / Essentials, ttype == 0 stores SE name in tname
            if ttype == 0 and not se_name and tname:
                se_name = tname
                volume = t_attrs.get('@volume') or t_attrs.get(b'@volume', 80)
                pitch = t_attrs.get('@pitch') or t_attrs.get(b'@pitch', 100)

            if se_name:
                clean_se = os.path.basename(se_name).replace('\\', '/')
                if not clean_se.lower().endswith(('.wav', '.ogg', '.mp3')):
                    # Check if .ogg exists in public Audio directory
                    if os.path.exists(os.path.join(public_se_dir, clean_se + '.ogg')) or \
                       os.path.exists(os.path.join(public_se_anim_dir, clean_se + '.ogg')) or \
                       os.path.exists(os.path.join(source_se_dir, clean_se + '.ogg')) or \
                       os.path.exists(os.path.join(source_se_anim_dir, clean_se + '.ogg')):
                        clean_se += '.ogg'
                    else:
                        clean_se += '.wav'
                used_se_files.add(clean_se)
                timings.append({
                    'frame': frame,
                    'type': 'sound',
                    'payload': {
                        'sound': f'Anim/{clean_se}',
                        'volume': volume,
                        'pitch': pitch
                    }
                })

            # Check flash
            flash_scope = t_attrs.get('@flashScope') or t_attrs.get(b'@flashScope', 0)
            if flash_scope and flash_scope > 0:
                fc = t_attrs.get('@flashColor') or t_attrs.get(b'@flashColor')
                dur = t_attrs.get('@flashDuration') or t_attrs.get(b'@flashDuration', 5)
                color = [255, 255, 255, 180]
                if fc and hasattr(fc, '_red'):
                    color = [int(fc._red), int(fc._green), int(fc._blue), int(fc._alpha)]
                elif fc and hasattr(fc, 'attributes'):
                    color = [
                        int(fc.attributes.get(b'@red', 255)),
                        int(fc.attributes.get(b'@green', 255)),
                        int(fc.attributes.get(b'@blue', 255)),
                        int(fc.attributes.get(b'@alpha', 180))
                    ]
                timings.append({
                    'frame': frame,
                    'type': 'flash',
                    'payload': {
                        'scope': flash_scope,
                        'duration': dur,
                        'color': color
                    }
                })

        anim_def = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'hue': 0,
            'position': 3 if spec['is_opp'] else 2,
            'fps': 20,
            'frames': frames,
            'timings': timings
        }

        # Save to packages/game-data/animations/ and last-chance/
        out_file = os.path.join(anims_out_dir, f'{tgt_id}.json')
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        last_chance_file = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(last_chance_file, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

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
            print(f'  [WARN] Graphic {g} not found at {src_path}')
            continue

        # Copy to destination dirs
        shutil.copy2(src_path, os.path.join(dest_gfx_dir, g))
        shutil.copy2(src_path, os.path.join(local_gfx_dir, g))

        with Image.open(src_path) as img:
            w, h = img.size

        cell_size = 192
        cols = 5
        if w % cell_size == 0:
            cols = w // cell_size
        rows = (h + cell_size - 1) // cell_size
        total_cells = cols * rows

        clean_slug = g.lower().replace('.png', '').replace(' ', '-').replace('_', '-')

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
        # Try finding in Anim subfolder first, then direct
        found_path = None
        for cand in [
            os.path.join(source_se_anim_dir, se_file),
            os.path.join(source_se_dir, se_file),
            os.path.join(public_se_anim_dir, se_file),
            os.path.join(public_se_dir, se_file),
        ]:
            if os.path.exists(cand):
                found_path = cand
                break
        
        if found_path:
            # Copy to both public Anim and public direct SE
            dest_anim = os.path.join(public_se_anim_dir, se_file)
            dest_se = os.path.join(public_se_dir, se_file)
            shutil.copy2(found_path, dest_anim)
            shutil.copy2(found_path, dest_se)
            print(f'  Audio synced: {se_file}')
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

    batch2_mappings = {
        'poison_fang': {'pl': 6959, 'opp': None},
        'poison_gas': {'pl': 6960, 'opp': None},
        'poison_jab': {'pl': 6961, 'opp': 6962},
        'poison_powder': {'pl': 6963, 'opp': None},
        'poisonpowder': {'pl': 6963, 'opp': None},
        'poison_sting': {'pl': 6964, 'opp': 6965},
        'poison_tail': {'pl': 6966, 'opp': 6967},
        'pollen_puff': {'pl': 6968, 'opp': 6969},
        'poltergeist': {'pl': 6970, 'opp': None},
        'pound': {'pl': 6971, 'opp': None},
        'powder': {'pl': 6972, 'opp': None},
        'powder_snow': {'pl': 6973, 'opp': None},
        'power_gem': {'pl': 6974, 'opp': None},
        'power_split': {'pl': 6975, 'opp': None},
        'power_swap': {'pl': 6976, 'opp': 6977},
        'power_trick': {'pl': 6978, 'opp': None},
        'power_trip': {'pl': 6979, 'opp': None},
        'power_up_punch': {'pl': 6980, 'opp': None},
        'power_whip': {'pl': 6981, 'opp': None},
        'precipice_blades': {'pl': 6982, 'opp': None},
        'present': {'pl': 6983, 'opp': 6984},
        'prismatic_laser': {'pl': 6985, 'opp': None},
        'protect': {'pl': 6986, 'opp': 6987},
    }

    # Clean up any misplaced root keys on anim_map
    for k in batch2_mappings.keys():
        anim_map.pop(k, None)

    for m_key, m_val in batch2_mappings.items():
        anim_map['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            anim_map['opponentMoves'][m_key] = m_val['opp']

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2)

    # Update moves_db
    moves_dict = moves_db.get('moves', moves_db)
    for m_key, m_val in batch2_mappings.items():
        if m_key in moves_dict:
            moves_dict[m_key]['animationId'] = m_val['pl']
    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2)

    # Sync move-animations-db.json
    if 'moves' not in anim_db: anim_db['moves'] = {}
    if 'opponentMoves' not in anim_db: anim_db['opponentMoves'] = {}
    for m_key, m_val in batch2_mappings.items():
        anim_db['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            anim_db['opponentMoves'][m_key] = m_val['opp']
    with open(anim_db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2)

    # Sync move-animation-extensions.json
    if 'moves' not in ext_db: ext_db['moves'] = {}
    if 'opponentMoves' not in ext_db: ext_db['opponentMoves'] = {}
    for m_key, m_val in batch2_mappings.items():
        ext_db['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            ext_db['opponentMoves'][m_key] = m_val['opp']
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext_db, f, indent=2)

    print('[6/6] P Group Batch 2 moves imported successfully!')

if __name__ == '__main__':
    main()
