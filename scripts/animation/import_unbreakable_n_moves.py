#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 N Group Battle Animations (14 moves).
Moves handled:
  1. nasty_plot (Target ID: 6520) - Dark Status (PRAS- Nasty Plot.png, 30 frames, PRSFX- Nasty Plot.wav)
  2. natural_gift (Target ID: 6521) - Normal Physical (PRAS- Strike.png, 34 frames, PRSFX- Natural Gift1/2.wav)
  3. nature_power (Target ID: 6706) - Normal Status (1 frame, transform move)
  4. natures_madness (Target ID: 6909) - Fairy Special (Tapu signature, 65 frames, PRSFX- Natures Madness1/2.wav)
  5. needle_arm (Target ID: 6522) - Grass Physical (Cacturne signature, 16 frames, PRAS- Needle Arm.png, PRSFX- Needle Arm1/2.wav)
  6. never_ending_nightmare (Target ID: 6910) - Ghost Special (Gen 7 Ghost Z-Move, 95 frames, PRAS- NeverEndingNightmare.png, 6 PRSFX)
  7. night_daze (Target IDs: 6523 PL / 6911 OPP) - Dark Special (Zoroark signature, 42 frames, PRAS- Night Daze.png, PRSFX- Night Daze1/2.wav)
  8. night_shade (Target ID: 6524) - Ghost Special (24 frames, PRAS- Psychic BG.png, PRSFX- Night Shade.wav)
  9. night_slash (Target ID: 6525) - Dark Physical (20 frames, PRAS- Slash.png, PRSFX- Night Slash1/2.wav)
  10. nightmare (Target ID: 6912) - Ghost Status (45 frames, PRAS- Love.png, PRSFX- Nightmare.wav)
  11. no_retreat (Target ID: 6913) - Fighting Status (Falinks signature, 20 frames, GEN8- No Retreat.png)
  12. noble_roar (Target IDs: 6736 PL / 6914 OPP) - Normal Status (Pyroar signature, 24 frames, PRAS- Sound.png, PRSFX- Noble Roar1/2.wav)
  13. noxious_torque - Poison Physical (Gen 9 Starmobile signature, mapped to poison_jab 214)
  14. nuzzle (Target IDs: 6526 PL / 6915 OPP) - Electric Physical (18 frames, PRAS- Electric.png, PRSFX- Nuzzle1/2.wav)
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

    # Specification for N Group moves:
    n_specs = [
        {'rx_id': 547, 'tgt_id': 6520, 'name': 'Move:NASTYPLOT', 'default_name': 'Nasty Plot', 'move_key': 'nasty_plot', 'is_opp': False},
        {'rx_id': 956, 'tgt_id': 6521, 'name': 'Move:NATURALGIFT', 'default_name': 'Natural Gift', 'move_key': 'natural_gift', 'is_opp': False},
        {'rx_id': 460, 'tgt_id': 6706, 'name': 'Move:NATUREPOWER', 'default_name': 'Nature Power', 'move_key': 'nature_power', 'is_opp': False},
        {'rx_id': 964, 'tgt_id': 6909, 'name': 'Move:NATURESMADNESS', 'default_name': "Nature's Madness", 'move_key': 'natures_madness', 'is_opp': False},
        {'rx_id': 1026, 'tgt_id': 6522, 'name': 'Move:NEEDLEARM', 'default_name': 'Needle Arm', 'move_key': 'needle_arm', 'is_opp': False},
        {'rx_id': 1184, 'tgt_id': 6910, 'name': 'Move:NEVERENDINGNIGHTMARE', 'default_name': 'Never-Ending Nightmare', 'move_key': 'never_ending_nightmare', 'is_opp': False},
        {'rx_id': 899, 'tgt_id': 6523, 'name': 'Move:NIGHTDAZE', 'default_name': 'Night Daze', 'move_key': 'night_daze', 'is_opp': False},
        {'rx_id': 900, 'tgt_id': 6911, 'name': 'OppMove:NIGHTDAZE', 'default_name': 'Night Daze (Opp)', 'move_key': 'night_daze', 'is_opp': True},
        {'rx_id': 495, 'tgt_id': 6524, 'name': 'Move:NIGHTSHADE', 'default_name': 'Night Shade', 'move_key': 'night_shade', 'is_opp': False},
        {'rx_id': 599, 'tgt_id': 6525, 'name': 'Move:NIGHTSLASH', 'default_name': 'Night Slash', 'move_key': 'night_slash', 'is_opp': False},
        {'rx_id': 246, 'tgt_id': 6912, 'name': 'Move:NIGHTMARE', 'default_name': 'Nightmare', 'move_key': 'nightmare', 'is_opp': False},
        {'rx_id': 1280, 'tgt_id': 6913, 'name': 'Move:NORETREAT', 'default_name': 'No Retreat', 'move_key': 'no_retreat', 'is_opp': False},
        {'rx_id': 1008, 'tgt_id': 6736, 'name': 'Move:NOBLEROAR', 'default_name': 'Noble Roar', 'move_key': 'noble_roar', 'is_opp': False},
        {'rx_id': 1009, 'tgt_id': 6914, 'name': 'OppMove:NOBLEROAR', 'default_name': 'Noble Roar (Opp)', 'move_key': 'noble_roar', 'is_opp': True},
        {'rx_id': 429, 'tgt_id': 6526, 'name': 'Move:NUZZLE', 'default_name': 'Nuzzle', 'move_key': 'nuzzle', 'is_opp': False},
        {'rx_id': 430, 'tgt_id': 6915, 'name': 'OppMove:NUZZLE', 'default_name': 'Nuzzle (Opp)', 'move_key': 'nuzzle', 'is_opp': True},
        {'rx_id': 759, 'tgt_id': 6916, 'name': 'Move:NOXIOUSTORQUE', 'default_name': 'Noxious Torque', 'move_key': 'noxious_torque', 'is_opp': False},
        {'rx_id': 760, 'tgt_id': 6917, 'name': 'OppMove:NOXIOUSTORQUE', 'default_name': 'Noxious Torque (Opp)', 'move_key': 'noxious_torque', 'is_opp': True},
    ]

    print(f'[2/6] Parsing and exporting {len(n_specs)} animation definitions...')
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)

    used_graphics = set()
    used_se_files = set()

    for spec in n_specs:
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

        # Process timings / audio SE / flashes
        raw_timings = attrs.get('@timing') or attrs.get(b'@timing', [])
        timings = []
        for t in raw_timings:
            if hasattr(t, 'attributes'):
                t_attrs = t.attributes
                frame_val = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
                se_name = t_attrs.get('@name') or t_attrs.get(b'@name', '')
                if isinstance(se_name, bytes):
                    se_name = se_name.decode('utf-8', errors='ignore')
                se_name = se_name.strip()

                timing_type_code = t_attrs.get('@timingType') or t_attrs.get(b'@timingType', 0)

                # Sound effect
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
                            'volume': t_attrs.get('@volume') or t_attrs.get(b'@volume', 80),
                            'pitch': t_attrs.get('@pitch') or t_attrs.get(b'@pitch', 100)
                        }
                    })

                # Flash timing
                flash_scope = t_attrs.get('@flashScope') or t_attrs.get(b'@flashScope', 0)
                if flash_scope and flash_scope > 0:
                    fc = t_attrs.get('@flashColor') or t_attrs.get(b'@flashColor')
                    color = [255, 255, 255, 200]
                    if fc and hasattr(fc, 'attributes'):
                        c_attrs = fc.attributes
                        r_col = c_attrs.get('@red') or c_attrs.get(b'@red', 255)
                        g_col = c_attrs.get('@green') or c_attrs.get(b'@green', 255)
                        b_col = c_attrs.get('@blue') or c_attrs.get(b'@blue', 255)
                        a_col = c_attrs.get('@alpha') or c_attrs.get(b'@alpha', 200)
                        color = [r_col, g_col, b_col, a_col]
                    timings.append({
                        'frame': frame_val,
                        'type': 'flash',
                        'payload': {
                            'flashScope': flash_scope,
                            'flashDuration': t_attrs.get('@flashDuration') or t_attrs.get(b'@flashDuration', 5),
                            'flashColor': color
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
            'name': name,
            'graphic': graphic,
            'frameWidth': 192,
            'frameHeight': 192,
            'fps': 20,
            'frames': len(frames),
            'sourcePack': 'Pokemon Unbreakable Ties 4.1.2'
        }
        manifest[str(tgt_id)] = manifest_entry
        last_chance_manifest[str(tgt_id)] = manifest_entry
        print(f'  [OK] Exported ID {rx_id} -> {tgt_id} ({name}, {len(frames)} frames, {len(timings)} timings)')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2, ensure_ascii=False)

    print(f'[3/6] Syncing audio SE ({len(used_se_files)} files) and graphics ({len(used_graphics)} files)...')
    # Copy sound files from Unbreakable Ties
    for se in sorted(used_se_files):
        found = False
        for sdir in [source_se_anim_dir, source_se_dir]:
            sp = os.path.join(sdir, se)
            if os.path.exists(sp):
                shutil.copy2(sp, os.path.join(public_se_dir, se))
                shutil.copy2(sp, os.path.join(public_se_dir, 'Anim', se))
                found = True
                break
        if not found:
            if not os.path.exists(os.path.join(public_se_dir, se)) and not os.path.exists(os.path.join(public_se_dir, 'Anim', se)):
                print(f'  [WARN] Audio SE not found in source: {se}')

    # Extra sound files from Unbreakable Ties if needed
    extra_sounds = [
        'PRSFX- Nasty Plot.wav',
        'PRSFX- Natural Gift1.wav', 'PRSFX- Natural Gift2.wav',
        'PRSFX- Natures Madness1.wav', 'PRSFX- Natures Madness2.wav',
        'PRSFX- Needle Arm1.wav', 'PRSFX- Needle Arm2.wav',
        'PRSFX- NeverEndingNightmare1.wav', 'PRSFX- NeverEndingNightmare2.wav',
        'PRSFX- NeverEndingNightmare3.wav', 'PRSFX- NeverEndingNightmare4.wav',
        'PRSFX- NeverEndingNightmare5.wav', 'PRSFX- NeverEndingNightmare6.wav',
        'PRSFX- Night Daze1.wav', 'PRSFX- Night Daze2.wav',
        'PRSFX- Night Shade.wav',
        'PRSFX- Night Slash1.wav', 'PRSFX- Night Slash2.wav',
        'PRSFX- Nightmare.wav',
        'PRSFX- Noble Roar1.wav', 'PRSFX- Noble Roar2.wav',
        'PRSFX- Nuzzle1.wav', 'PRSFX- Nuzzle2.wav',
    ]
    for es in extra_sounds:
        for sdir in [source_se_anim_dir, source_se_dir]:
            sp = os.path.join(sdir, es)
            if os.path.exists(sp):
                shutil.copy2(sp, os.path.join(public_se_dir, es))
                shutil.copy2(sp, os.path.join(public_se_dir, 'Anim', es))
                break

    # Copy graphics files if not present
    all_graphics_to_sync = list(used_graphics) + [
        'GEN8- No Retreat.png',
        'PRAS- Black BG.png',
        'PRAS- Ghost BG.png',
        'PRAS- Natures Madness BG.png',
        'PRAS- NeverendingNightmare FG.png',
        'PRAS- Nasty Plot.png',
        'PRAS- Night Daze.png',
        'PRAS- Needle Arm.png',
        'PRAS- NeverEndingNightmare.png',
        'PRAS- Psychic BG.png'
    ]
    for g in sorted(set(all_graphics_to_sync)):
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
        'PRAS- Nasty Plot.png': {
            'assetKey': 'animation.pras-nasty-plot',
            'file': 'PRAS- Nasty Plot.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Night Daze.png': {
            'assetKey': 'animation.pras-night-daze',
            'file': 'PRAS- Night Daze.png',
            'width': 768,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 4,
            'rows': 1,
            'maxPattern': 4
        },
        'PRAS- Needle Arm.png': {
            'assetKey': 'animation.pras-needle-arm',
            'file': 'PRAS- Needle Arm.png',
            'width': 960,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 1,
            'maxPattern': 5
        },
        'PRAS- NeverEndingNightmare.png': {
            'assetKey': 'animation.pras-neverendingnightmare',
            'file': 'PRAS- NeverEndingNightmare.png',
            'width': 960,
            'height': 1920,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 10,
            'maxPattern': 50
        },
        'GEN8- No Retreat.png': {
            'assetKey': 'animation.gen8-no-retreat',
            'file': 'GEN8- No Retreat.png',
            'width': 960,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 3,
            'maxPattern': 15
        },
        'PRAS- Psychic BG.png': {
            'assetKey': 'animation.pras-psychic-bg',
            'file': 'PRAS- Psychic BG.png',
            'width': 512,
            'height': 390,
            'cellWidth': 512,
            'cellHeight': 390,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Black BG.png': {
            'assetKey': 'animation.pras-black-bg',
            'file': 'PRAS- Black BG.png',
            'width': 512,
            'height': 288,
            'cellWidth': 512,
            'cellHeight': 288,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Ghost BG.png': {
            'assetKey': 'animation.pras-ghost-bg',
            'file': 'PRAS- Ghost BG.png',
            'width': 512,
            'height': 390,
            'cellWidth': 512,
            'cellHeight': 390,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Natures Madness BG.png': {
            'assetKey': 'animation.pras-natures-madness-bg',
            'file': 'PRAS- Natures Madness BG.png',
            'width': 512,
            'height': 288,
            'cellWidth': 512,
            'cellHeight': 288,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- NeverendingNightmare FG.png': {
            'assetKey': 'animation.pras-neverendingnightmare-fg',
            'file': 'PRAS- NeverendingNightmare FG.png',
            'width': 550,
            'height': 310,
            'cellWidth': 550,
            'cellHeight': 310,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        }
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

    print('[5/6] Updating move-animation-map.json, move-animation-extensions.json, and moves-db.json...')
    mam_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(mam_path, 'r', encoding='utf-8') as f:
        mam = json.load(f)

    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext = json.load(f)

    moves_map = mam.setdefault('moves', {})
    opp_moves_map = mam.setdefault('opponentMoves', {})
    ext_moves = ext.setdefault('moves', {})
    ext_opp = ext.setdefault('opponentMoves', {})

    # Map imported N moves
    moves_map['nasty_plot'] = 6520
    ext_moves['nasty_plot'] = 6520

    moves_map['natural_gift'] = 6521
    ext_moves['natural_gift'] = 6521

    moves_map['nature_power'] = 6706
    ext_moves['nature_power'] = 6706

    moves_map['natures_madness'] = 6909
    ext_moves['natures_madness'] = 6909

    moves_map['needle_arm'] = 6522
    ext_moves['needle_arm'] = 6522

    moves_map['never_ending_nightmare'] = 6910
    ext_moves['never_ending_nightmare'] = 6910

    moves_map['night_daze'] = 6523
    opp_moves_map['night_daze'] = 6911
    ext_moves['night_daze'] = 6523
    ext_opp['night_daze'] = 6911

    moves_map['night_shade'] = 6524
    ext_moves['night_shade'] = 6524

    moves_map['night_slash'] = 6525
    ext_moves['night_slash'] = 6525

    moves_map['nightmare'] = 6912
    ext_moves['nightmare'] = 6912

    moves_map['no_retreat'] = 6913
    ext_moves['no_retreat'] = 6913

    moves_map['noble_roar'] = 6736
    opp_moves_map['noble_roar'] = 6914
    ext_moves['noble_roar'] = 6736
    ext_opp['noble_roar'] = 6914

    moves_map['noxious_torque'] = 6916
    opp_moves_map['noxious_torque'] = 6917
    ext_moves['noxious_torque'] = 6916
    ext_opp['noxious_torque'] = 6917

    moves_map['nuzzle'] = 6526
    opp_moves_map['nuzzle'] = 6915
    ext_moves['nuzzle'] = 6526
    ext_opp['nuzzle'] = 6915

    with open(mam_path, 'w', encoding='utf-8') as f:
        json.dump(mam, f, indent=2, ensure_ascii=False)
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext, f, indent=2, ensure_ascii=False)

    # Update moves-db.json targets for self-target moves
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    self_target_n_moves = ['nasty_plot', 'nature_power', 'no_retreat']
    for sm in self_target_n_moves:
        if sm in moves_db.get('moves', {}):
            moves_db['moves'][sm]['target'] = 'user'

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    # Update move-animations-db.json
    madb_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(madb_path, 'r', encoding='utf-8') as f:
        madb = json.load(f)

    n_meta = {
        'nasty_plot': {'name': 'Nasty Plot (Âm Mưu)', 'type': 'Dark', 'category': 'status', 'graphic': 'PRAS- Nasty Plot.png', 'sounds': ['PRSFX- Nasty Plot.wav'], 'animId': 6520, 'oppId': None},
        'natural_gift': {'name': 'Natural Gift (Quà Tự Nhiên)', 'type': 'Normal', 'category': 'physical', 'graphic': 'PRAS- Strike.png', 'sounds': ['PRSFX- Natural Gift1.wav', 'PRSFX- Natural Gift2.wav'], 'animId': 6521, 'oppId': None},
        'nature_power': {'name': 'Nature Power (Năng Lực Tự Nhiên)', 'type': 'Normal', 'category': 'status', 'graphic': '', 'sounds': [], 'animId': 6706, 'oppId': None},
        'natures_madness': {'name': "Nature's Madness (Cuồng Nộ Tự Nhiên)", 'type': 'Fairy', 'category': 'special', 'graphic': 'PRAS- Natures Madness BG.png', 'sounds': ['PRSFX- Natures Madness1.wav', 'PRSFX- Natures Madness2.wav'], 'animId': 6909, 'oppId': None},
        'needle_arm': {'name': 'Needle Arm (Tay Gai Kim)', 'type': 'Grass', 'category': 'physical', 'graphic': 'PRAS- Needle Arm.png', 'sounds': ['PRSFX- Needle Arm1.wav', 'PRSFX- Needle Arm2.wav'], 'animId': 6522, 'oppId': None},
        'never_ending_nightmare': {'name': 'Never-Ending Nightmare (Cơn Ác Mộng Vô Tận)', 'type': 'Ghost', 'category': 'special', 'graphic': 'PRAS- NeverEndingNightmare.png', 'sounds': ['PRSFX- NeverEndingNightmare1.wav', 'PRSFX- NeverEndingNightmare2.wav', 'PRSFX- NeverEndingNightmare3.wav', 'PRSFX- NeverEndingNightmare4.wav', 'PRSFX- NeverEndingNightmare5.wav', 'PRSFX- NeverEndingNightmare6.wav'], 'animId': 6910, 'oppId': None},
        'night_daze': {'name': 'Night Daze (Ám Dạ Huyền Ảo)', 'type': 'Dark', 'category': 'special', 'graphic': 'PRAS- Night Daze.png', 'sounds': ['PRSFX- Night Daze1.wav', 'PRSFX- Night Daze2.wav'], 'animId': 6523, 'oppId': 6911},
        'night_shade': {'name': 'Night Shade (Bóng Đêm U Hồn)', 'type': 'Ghost', 'category': 'special', 'graphic': 'PRAS- Psychic BG.png', 'sounds': ['PRSFX- Night Shade.wav'], 'animId': 6524, 'oppId': None},
        'night_slash': {'name': 'Night Slash (Trảm Kích Bóng Tối)', 'type': 'Dark', 'category': 'physical', 'graphic': 'PRAS- Slash.png', 'sounds': ['PRSFX- Night Slash1.wav', 'PRSFX- Night Slash2.wav'], 'animId': 6525, 'oppId': None},
        'nightmare': {'name': 'Nightmare (Ác Mộng)', 'type': 'Ghost', 'category': 'status', 'graphic': 'PRAS- Love.png', 'sounds': ['PRSFX- Nightmare.wav'], 'animId': 6912, 'oppId': None},
        'no_retreat': {'name': 'No Retreat (Không Lùi Bước)', 'type': 'Fighting', 'category': 'status', 'graphic': 'GEN8- No Retreat.png', 'sounds': [], 'animId': 6913, 'oppId': None},
        'noble_roar': {'name': 'Noble Roar (Tiếng Gầm Kiêu Hãnh)', 'type': 'Normal', 'category': 'status', 'graphic': 'PRAS- Sound.png', 'sounds': ['PRSFX- Noble Roar1.wav', 'PRSFX- Noble Roar2.wav'], 'animId': 6736, 'oppId': 6914},
        'noxious_torque': {'name': 'Noxious Torque (Vòng Xoáy Độc Dược)', 'type': 'Poison', 'category': 'physical', 'graphic': 'PRAS- Cross Poison.png', 'sounds': ['PRSFX- Cross Poison.wav'], 'animId': 6916, 'oppId': 6917},
        'nuzzle': {'name': 'Nuzzle (Nựng Má Tê Tái)', 'type': 'Electric', 'category': 'physical', 'graphic': 'PRAS- Electric.png', 'sounds': ['PRSFX- Nuzzle1.wav', 'PRSFX- Nuzzle2.wav'], 'animId': 6526, 'oppId': 6915},
    }

    for mk, meta in n_meta.items():
        madb[mk] = {
            'moveId': mk,
            'name': meta['name'],
            'type': meta['type'],
            'category': meta['category'],
            'graphic': meta['graphic'],
            'hasGraphicFile': bool(meta['graphic']),
            'soundEffects': meta['sounds'],
            'animId': meta['animId'],
            'opponentAnimId': meta['oppId'],
            'hasDedicatedAnimation': True,
            'source': 'Unbreakable Ties 4.1.2'
        }

    with open(madb_path, 'w', encoding='utf-8') as f:
        json.dump(madb, f, indent=2, ensure_ascii=False)

    print('[6/6] Group N import completed successfully!')

if __name__ == '__main__':
    main()
