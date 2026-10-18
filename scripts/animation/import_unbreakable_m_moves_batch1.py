#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 M Group Battle Animations - Batch 1 (35 entries).
Moves handled:
  1. mach_punch (Safe ID: 6888) - Fighting Physical (PRAS- Strike.png, 11 frames)
  2. magic_coat (Safe IDs: 6889 PL / 6890 OPP) - Psychic Status (PRAS- Magic Coat.png, 21 frames, target: 'user')
  3. magic_powder (1277) - Psychic Status (PRAS- Powder Snow.png, 20 frames)
  4. magic_room (129) - Psychic Status (PRAS- Magic Room BG.png, 40 frames, target: 'user')
  5. magical_leaf (437 PL / 438 OPP) - Grass Special (PRAS- Magical Leaf.png, 29 frames)
  6. magical_torque - Gen 9 Starmobile Fairy Physical (Dynamic Fallback to play_rough 214)
  7. magma_storm (1006) - Fire Special (PRAS- Magma Storm.png, 24 frames)
  8. magnet_bomb (611) - Steel Physical (PRAS- Magnet bomb.png, 22 frames)
  9. magnet_rise (779) - Electric Status (PRAS- Electric.png, 18 frames, target: 'user')
  10. magnetic_flux (954 PL / 955 OPP) - Electric Status (PRAS- Electric.png, 65 frames, target: 'user')
  11. magnitude (671) - Ground Physical (PRAS- Magnitude BG.png, 64 frames)
  12. make_it_rain - Gen 9 Gholdengo signature Steel Special (Dynamic Fallback to flash_cannon 118 / pay_day 207)
  13. malicious_moonsault - Gen 7 Incineroar Dark Physical Z-Move (Dynamic Fallback to dark_pulse 83)
  14. malignant_chain - Gen 9 Pecharunt Poison Special (Dynamic Fallback to sludge_bomb 249)
  15. mat_block (854 PL / 855 OPP) - Fighting Status (PRAS- Mat Block.png, 20 frames, target: 'user')
  16. matcha_gotcha - Gen 9 Sinistcha Grass Special (Dynamic Fallback to giga_drain 124)
  17..35. The 19 Max Moves (Gen 8 Dynamax):
      - max_airstream (Flying -> air_slash 27)
      - max_darkness (Dark -> dark_pulse 83)
      - max_flare (Fire -> flamethrower 116)
      - max_flutterby (Bug -> bug_buzz 57)
      - max_geyser (Water -> hydro_pump 159)
      - max_guard (Normal -> protect 218, target: 'user')
      - max_hailstorm (Ice -> blizzard 46)
      - max_knuckle (Fighting -> close_combat 70)
      - max_lightning (Electric -> thunderbolt 280)
      - max_mindstorm (Psychic -> psychic 220)
      - max_ooze (Poison -> sludge_bomb 249)
      - max_overgrowth (Grass -> energy_ball 106)
      - max_phantasm (Ghost -> shadow_ball 241)
      - max_quake (Ground -> earthquake 97)
      - max_rockfall (Rock -> stone_edge 266)
      - max_starfall (Fairy -> moonblast 425)
      - max_steelspike (Steel -> flash_cannon 118)
      - max_strike (Normal -> hyper_beam 160)
      - max_wyrmwind (Dragon -> dragon_pulse 89)
"""

import os
import sys
import json
import shutil
from PIL import Image

sys.path.append(os.path.dirname(__file__))
import import_source_animations
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
        ('mach_punch', 243, None, 6888, None, False, None), # Safe ID 6888 (preserving SILVERWIND 243)
        ('magic_coat', 199, 200, 6889, 6890, False, None),  # Safe IDs 6889/6890 (preserving METRONOME/MIST 199/200)
        ('magic_powder', 1277, None, 1277, None, False, None),
        ('magic_room', 129, None, 129, None, False, None),
        ('magical_leaf', 437, 438, 437, 438, False, None),
        ('magical_torque', None, None, None, None, True, None), # Fallback to fairy_wind 667
        ('magma_storm', 1006, None, 1006, None, False, None),
        ('magnet_bomb', 611, None, 611, None, False, None),
        ('magnet_rise', 779, None, 779, None, False, None),
        ('magnetic_flux', 954, 955, 954, 955, False, None),
        ('magnitude', 671, None, 671, None, False, None),
        ('make_it_rain', None, None, None, None, True, None), # Fallback to flash_cannon 118
        ('malicious_moonsault', None, None, None, None, True, None), # Fallback to dark_pulse 83
        ('malignant_chain', None, None, None, None, True, None), # Fallback to sludge_bomb 249
        ('mat_block', 854, 855, 854, 855, False, None),
        ('matcha_gotcha', None, None, None, None, True, None), # Fallback to giga_drain 124
        ('moonblast', 425, 426, 425, 426, False, None), # Fairy Special (PRAS- Moonblast.png, 60 frames, used by max_starfall)
    ]

    export_queue = []
    for spec in batch1_specs:
        mkey, rx_pl, rx_opp, tgt_pl, tgt_opp, skip_exp, direct_id = spec
        if skip_exp:
            continue
        if rx_pl is not None and tgt_pl is not None:
            export_queue.append((rx_pl, tgt_pl, f'Move:{mkey.upper()}'))
        if rx_opp is not None and tgt_opp is not None:
            export_queue.append((rx_opp, tgt_opp, f'OppMove:{mkey.upper()}'))

    print(f'[2/6] Exporting {len(export_queue)} animation JSON files...')

    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)

    used_graphics = set()
    used_se_files = set()

    for rx_id, tgt_id, default_name in export_queue:
        if rx_id >= len(anim_list) or not anim_list[rx_id]:
            print(f'  [WARN] Missing rxdata anim {rx_id}!')
            continue

        raw_anim = anim_list[rx_id]
        attrs = raw_anim.attributes

        name = attrs.get(b'@name') or attrs.get('@name', '')
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='ignore')
        if not name:
            name = default_name

        graphic = attrs.get(b'@graphic') or attrs.get('@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')
        if graphic:
            if not graphic.lower().endswith(('.png', '.jpg', '.bmp')):
                graphic += '.png'
            used_graphics.add(graphic)

        raw_frames = attrs.get(b'@array') or attrs.get('@array', [])
        frames = []

        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = isa.parse_cel(cel_data)
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
        for sdir in [source_se_dir, source_se_anim_dir]:
            sp = os.path.join(sdir, se)
            if os.path.exists(sp):
                shutil.copy2(sp, os.path.join(public_se_dir, se))
                shutil.copy2(sp, os.path.join(public_se_dir, 'Anim', se))
                found = True
                break
        if not found:
            print(f'  [WARN] Audio SE not found: {se}')

    # Copy graphics files if not present
    for g in sorted(used_graphics):
        sp = os.path.join(source_gfx_dir, g)
        if os.path.exists(sp):
            for d in [dest_gfx_dir, local_gfx_dir]:
                dp = os.path.join(d, g)
                if not os.path.exists(dp):
                    shutil.copy2(sp, dp)

    print('[4/6] Registering missing spritesheets in animation-atlas.json...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    lc_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')

    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(lc_atlas_path, 'r', encoding='utf-8') as f:
        lc_atlas = json.load(f)

    new_atlas_entries = {
        'PRAS- Powder Snow.png': {
            'assetKey': 'animation.pras--powder-snow',
            'file': 'PRAS- Powder Snow.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Mat Block.png': {
            'assetKey': 'animation.pras--mat-block',
            'file': 'PRAS- Mat Block.png',
            'width': 192,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Magic Room BG.png': {
            'assetKey': 'animation.pras--magic-room-bg',
            'file': 'PRAS- Magic Room BG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Electric Terrain BG.png': {
            'assetKey': 'animation.pras--electric-terrain-bg',
            'file': 'PRAS- Electric Terrain BG.png',
            'width': 512,
            'height': 288,
            'cellWidth': 512,
            'cellHeight': 288,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Magnitude BG.png': {
            'assetKey': 'animation.pras--magnitude-bg',
            'file': 'PRAS- Magnitude BG.png',
            'width': 812,
            'height': 390,
            'cellWidth': 812,
            'cellHeight': 390,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
    }

    for k, v in new_atlas_entries.items():
        base_k = k.replace('.png', '')
        for name in [k, base_k]:
            atlas[name] = v
            lc_atlas[name] = v

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)
    with open(lc_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(lc_atlas, f, indent=2, ensure_ascii=False)

    print('[5/6] Updating move-animation-map.json and moves-db.json...')
    mam_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(mam_path, 'r', encoding='utf-8') as f:
        mam = json.load(f)

    moves_map = mam.setdefault('moves', {})
    opp_moves_map = mam.setdefault('opponentMoves', {})

    # Map imported moves
    moves_map['mach_punch'] = 6888
    moves_map['magic_coat'] = 6889
    opp_moves_map['magic_coat'] = 6890
    moves_map['magic_powder'] = 1277
    moves_map['magic_room'] = 129
    moves_map['magical_leaf'] = 437
    opp_moves_map['magical_leaf'] = 438
    moves_map['magical_torque'] = 667 # fairy_wind
    moves_map['magma_storm'] = 1006
    moves_map['magnet_bomb'] = 611
    moves_map['magnet_rise'] = 779
    moves_map['magnetic_flux'] = 954
    opp_moves_map['magnetic_flux'] = 955
    moves_map['magnitude'] = 671
    moves_map['make_it_rain'] = 118 # flash_cannon
    moves_map['malicious_moonsault'] = 83 # dark_pulse
    moves_map['malignant_chain'] = 249 # sludge_bomb
    moves_map['mat_block'] = 854
    opp_moves_map['mat_block'] = 855
    moves_map['matcha_gotcha'] = 124 # giga_drain
    moves_map['moonblast'] = 425
    opp_moves_map['moonblast'] = 426

    # Map 19 Max Moves
    max_move_map = {
        'max_airstream': 27,   # air_slash
        'max_darkness': 83,    # dark_pulse
        'max_flare': 116,      # flamethrower
        'max_flutterby': 57,   # bug_buzz
        'max_geyser': 159,     # hydro_pump
        'max_guard': 218,      # protect
        'max_hailstorm': 46,   # blizzard
        'max_knuckle': 70,     # close_combat
        'max_lightning': 280,  # thunderbolt
        'max_mindstorm': 220,  # psychic
        'max_ooze': 249,       # sludge_bomb
        'max_overgrowth': 106, # energy_ball
        'max_phantasm': 241,   # shadow_ball
        'max_quake': 97,       # earthquake
        'max_rockfall': 266,   # stone_edge
        'max_starfall': 425,   # moonblast
        'max_steelspike': 118, # flash_cannon
        'max_strike': 160,     # hyper_beam
        'max_wyrmwind': 89,    # dragon_pulse
    }
    for mm, aid in max_move_map.items():
        moves_map[mm] = aid

    with open(mam_path, 'w', encoding='utf-8') as f:
        json.dump(mam, f, indent=2, ensure_ascii=False)

    # Update moves-db.json targets for self-moves
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    self_target_moves = ['magic_coat', 'magic_room', 'magnet_rise', 'magnetic_flux', 'mat_block', 'max_guard']
    for sm in self_target_moves:
        if sm in moves_db.get('moves', {}):
            moves_db['moves'][sm]['target'] = 'user'
            if sm == 'max_guard':
                moves_db['moves'][sm]['category'] = 'status'

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 1 import completed successfully!')

if __name__ == '__main__':
    main()
