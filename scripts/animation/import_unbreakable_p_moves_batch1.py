#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 P-Group (Batch 1) Battle Animations.
16 moves handled:
  1. pain_split (Target ID: 6936) - Normal Status (PRAS- Bide.png, 19 frames)
  2. parabolic_charge (Target ID: 6937) - Electric Special (PRAS- Electric.png, 21 frames)
  3. parting_shot (Target IDs: 6938 PL / 6939 OPP) - Dark Status (PRAS- Sound.png, 26 frames)
  4. pay_day (Target IDs: 6940 PL / 6941 OPP) - Normal Physical (PRAS- Pay Day.png, 35 frames)
  5. payback (Target ID: 6942) - Dark Physical (PRAS- Strike.png, 24 frames)
  6. peck (Target ID: 6943) - Flying Physical (PRAS- Strike.png, 10 frames)
  7. perish_song (Target ID: 6944) - Normal Status (PRAS- Sound.png, 45 frames)
  8. petal_blizzard (Target IDs: 6945 PL / 6946 OPP) - Grass Physical (PRAS- Petal Blizzard.png, 63 frames)
  9. petal_dance (Target IDs: 6947 PL / 6948 OPP) - Grass Special (PRAS- Petal Dance.png, 40 frames)
  10. phantom_force (Target ID: 6949) - Ghost Physical (PRAS- Shadow Sneak.png, 22 frames)
  11. photon_geyser (Target IDs: 6950 PL / 6951 OPP) - Psychic Special (PRAS- Photon Guyser.png, 57 frames)
  12. pin_missile (Target IDs: 6952 PL / 6953 OPP) - Bug Physical (PRAS- Leech Life.png, 16 frames)
  13. plasma_fists (Target ID: 6954) - Electric Physical (PRAS- Plasma Fist.png, 51 frames)
  14. play_nice (Target ID: 6955) - Normal Status (PRAS- Love.png, 21 frames)
  15. play_rough (Target ID: 6956) - Fairy Physical (PRAS- Love.png, 65 frames)
  16. pluck (Target IDs: 6957 PL / 6958 OPP) - Flying Physical (PRAS- Strike.png, 15 frames)
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

    # Specification for P Group Batch 1 moves:
    p_specs = [
        {'rx_id': 874, 'tgt_id': 6936, 'name': 'Move:PAINSPLIT', 'default_name': 'Pain Split', 'move_key': 'pain_split', 'is_opp': False},
        {'rx_id': 1386, 'tgt_id': 6937, 'name': 'Move:PARABOLICCHARGE', 'default_name': 'Parabolic Charge', 'move_key': 'parabolic_charge', 'is_opp': False},
        {'rx_id': 1038, 'tgt_id': 6938, 'name': 'Move:PARTINGSHOT', 'default_name': 'Parting Shot', 'move_key': 'parting_shot', 'is_opp': False},
        {'rx_id': 1039, 'tgt_id': 6939, 'name': 'OppMove:PARTINGSHOT', 'default_name': 'Parting Shot (Opp)', 'move_key': 'parting_shot', 'is_opp': True},
        {'rx_id': 333, 'tgt_id': 6940, 'name': 'Move:PAYDAY', 'default_name': 'Pay Day', 'move_key': 'pay_day', 'is_opp': False},
        {'rx_id': 334, 'tgt_id': 6941, 'name': 'OppMove:PAYDAY', 'default_name': 'Pay Day (Opp)', 'move_key': 'pay_day', 'is_opp': True},
        {'rx_id': 636, 'tgt_id': 6942, 'name': 'Move:PAYBACK', 'default_name': 'Payback', 'move_key': 'payback', 'is_opp': False},
        {'rx_id': 623, 'tgt_id': 6943, 'name': 'Move:PECK', 'default_name': 'Peck', 'move_key': 'peck', 'is_opp': False},
        {'rx_id': 837, 'tgt_id': 6944, 'name': 'Move:PERISHSONG', 'default_name': 'Perish Song', 'move_key': 'perish_song', 'is_opp': False},
        {'rx_id': 1052, 'tgt_id': 6945, 'name': 'Move:PETALBLIZZARD', 'default_name': 'Petal Blizzard', 'move_key': 'petal_blizzard', 'is_opp': False},
        {'rx_id': 1053, 'tgt_id': 6946, 'name': 'OppMove:PETALBLIZZARD', 'default_name': 'Petal Blizzard (Opp)', 'move_key': 'petal_blizzard', 'is_opp': True},
        {'rx_id': 144, 'tgt_id': 6947, 'name': 'Move:PETALDANCE', 'default_name': 'Petal Dance', 'move_key': 'petal_dance', 'is_opp': False},
        {'rx_id': 145, 'tgt_id': 6948, 'name': 'OppMove:PETALDANCE', 'default_name': 'Petal Dance (Opp)', 'move_key': 'petal_dance', 'is_opp': True},
        {'rx_id': 539, 'tgt_id': 6949, 'name': 'Move:PHANTOMFORCE', 'default_name': 'Phantom Force', 'move_key': 'phantom_force', 'is_opp': False},
        {'rx_id': 1116, 'tgt_id': 6950, 'name': 'Move:PHOTONGEYSER', 'default_name': 'Photon Geyser', 'move_key': 'photon_geyser', 'is_opp': False},
        {'rx_id': 1117, 'tgt_id': 6951, 'name': 'OppMove:PHOTONGEYSER', 'default_name': 'Photon Geyser (Opp)', 'move_key': 'photon_geyser', 'is_opp': True},
        {'rx_id': 410, 'tgt_id': 6952, 'name': 'Move:PINMISSILE', 'default_name': 'Pin Missile', 'move_key': 'pin_missile', 'is_opp': False},
        {'rx_id': 415, 'tgt_id': 6953, 'name': 'OppMove:PINMISSILE', 'default_name': 'Pin Missile (Opp)', 'move_key': 'pin_missile', 'is_opp': True},
        {'rx_id': 1118, 'tgt_id': 6954, 'name': 'Move:PLASMAFISTS', 'default_name': 'Plasma Fists', 'move_key': 'plasma_fists', 'is_opp': False},
        {'rx_id': 520, 'tgt_id': 6955, 'name': 'Move:PLAYNICE', 'default_name': 'Play Nice', 'move_key': 'play_nice', 'is_opp': False},
        {'rx_id': 470, 'tgt_id': 6956, 'name': 'Move:PLAYROUGH', 'default_name': 'Play Rough', 'move_key': 'play_rough', 'is_opp': False},
        {'rx_id': 838, 'tgt_id': 6957, 'name': 'Move:PLUCK', 'default_name': 'Pluck', 'move_key': 'pluck', 'is_opp': False},
        {'rx_id': 839, 'tgt_id': 6958, 'name': 'OppMove:PLUCK', 'default_name': 'Pluck (Opp)', 'move_key': 'pluck', 'is_opp': True},
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
                    
                    # 1. Parting Shot Opp (1039 / 6939):
                    # In 1039, author reversed battler roles: B-2 (defender) moved off screen,
                    # while B-1 (attacker) shook at (128, 224). Swap B-1 and B-2!
                    if tgt_id == 6939:
                        if cel['pattern'] == -1:
                            cel['pattern'] = -2
                        elif cel['pattern'] == -2:
                            cel['pattern'] = -1
                        # Sound waves F02-F07 were authored around (304..320, 47..118) near Enemy.
                        # Re-anchor them relative to SRC_USER (128, 224) so they originate from the Enemy!
                        if cel['focus'] == 'user' and cel['pattern'] >= 0 and cel['x'] >= 250:
                            cel['x'] = cel['x'] - 256 # (x - 384) + 128
                            cel['y'] = cel['y'] + 128 # (y - 96) + 224
                    
                    # 2. Photon Geyser Opp (1117 / 6951):
                    # In 1117, geyser eruption F30+ was authored at (128, 224) with focus 'user' and moved B-1.
                    # Swap B-1 and B-2 so defender (B-2) gets lifted/shaken into the sky.
                    if tgt_id == 6951:
                        if cel['pattern'] == -1:
                            cel['pattern'] = -2
                        elif cel['pattern'] == -2:
                            cel['pattern'] = -1
                        # Geyser eruption cels: change focus to 'target' and adjust coords to SRC_TARGET (384, 96)
                        if fi >= 30 and cel['focus'] == 'user' and cel['pattern'] >= 0:
                            cel['focus'] = 'target'
                            cel['x'] = cel['x'] + 256 # (x - 128) + 384
                            cel['y'] = cel['y'] - 128 # (y - 224) + 96
                    
                    # 3. Petal Blizzard Opp (1053 / 6946):
                    # Opening petals F00-F24 were authored around (332, 109) with focus 'target'.
                    # Re-anchor to focus 'user' relative to SRC_USER (128, 224) so they swirl around Enemy!
                    if tgt_id == 6946:
                        if fi < 25 and cel['focus'] == 'target' and cel['pattern'] >= 0:
                            cel['focus'] = 'user'
                            cel['x'] = cel['x'] - 256 # (x - 384) + 128
                            cel['y'] = cel['y'] + 128 # (y - 96) + 224

                    # 4. Petal Dance Opp (145 / 6948):
                    # In 145, author used pattern -2 (Defender) for the dancing battler instead of -1 (Attacker).
                    # When Enemy attacks:
                    # - Dancing battler (pattern -2) should be -1 (Attacker/Enemy), re-anchored to focus 'user' at Enemy pos.
                    # - Target battler (pattern -1) should be -2 (Defender/Player), fixed at target pos (384, 96) focus 'target'.
                    # - Opening petals (fi < 27) authored around (384, 96) with focus 'both':
                    #   Change focus to 'user' and re-anchor (x - 256, y + 128) so they swirl around Enemy!
                    # - Flight petals (fi >= 27) flying from (384, 96) to (-72, 360):
                    #   Convert from authored frame to (SRC_USER -> SRC_TARGET):
                    #   new_x = 512 - x, new_y = x + y - 256, focus 'both' so they launch from Enemy to Player!
                    if tgt_id == 6948:
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
                            if fi < 27:
                                cel['focus'] = 'user'
                                cel['x'] = cel['x'] - 256
                                cel['y'] = cel['y'] + 128
                            else:
                                ox, oy = cel['x'], cel['y']
                                cel['focus'] = 'both'
                                cel['x'] = 512 - ox
                                cel['y'] = ox + oy - 256

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
            'name': spec['name'],
            'graphic': graphic,
            'hue': attrs.get('@hue', 0) or attrs.get(b'@hue', 0),
            'position': attrs.get('@position', 1) or attrs.get(b'@position', 1),
            'fps': 20,
            'frames': frames,
            'timings': timings
        }

        # Write to animations/ and last-chance/
        out_file = os.path.join(anims_out_dir, f'{tgt_id}.json')
        lc_out_file = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)
        with open(lc_out_file, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        # Update manifests
        meta = {
            'id': str(tgt_id),
            'name': spec['name'],
            'frameCount': len(frames),
            'timingCount': len(timings),
            'graphic': graphic,
            'position': anim_def['position'],
            'fps': 20
        }
        manifest[str(tgt_id)] = meta
        last_chance_manifest[str(tgt_id)] = meta
        print(f'  Exported [{tgt_id}] {spec["name"]} ({len(frames)} frames, {len(timings)} timings)')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2)

    print(f'[3/6] Registering atlas graphics into animation-atlas.json...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    lc_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(lc_atlas_path, 'r', encoding='utf-8') as f:
        lc_atlas = json.load(f)

    new_atlas_entries = {
        'PRAS- Pay Day.png': {
            'assetKey': 'animation.pras--pay-day',
            'file': 'PRAS- Pay Day.png',
            'width': 960,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 1,
            'maxPattern': 5
        },
        'PRAS- Petal Blizzard.png': {
            'assetKey': 'animation.pras--petal-blizzard',
            'file': 'PRAS- Petal Blizzard.png',
            'width': 960,
            'height': 960,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 5,
            'maxPattern': 25
        },
        'PRAS- Petal Dance.png': {
            'assetKey': 'animation.pras--petal-dance',
            'file': 'PRAS- Petal Dance.png',
            'width': 1344,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 7,
            'rows': 2,
            'maxPattern': 14
        },
        'PRAS- Photon Guyser.png': {
            'assetKey': 'animation.pras--photon-guyser',
            'file': 'PRAS- Photon Guyser.png',
            'width': 960,
            'height': 960,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 5,
            'maxPattern': 25
        },
        'PRAS- Plasma Fist.png': {
            'assetKey': 'animation.pras--plasma-fist',
            'file': 'PRAS- Plasma Fist.png',
            'width': 960,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 3,
            'maxPattern': 15
        },
        'PRAS- Petal BG.png': {
            'assetKey': 'animation.pras--petal-bg',
            'file': 'PRAS- Petal BG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Petal Blizzard BG.png': {
            'assetKey': 'animation.pras--petal-blizzard-bg',
            'file': 'PRAS- Petal Blizzard BG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Plasma Fist BG.png': {
            'assetKey': 'animation.pras--plasma-fist-bg',
            'file': 'PRAS- Plasma Fist BG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
    }

    for k, v in new_atlas_entries.items():
        atlas[k] = v
        lc_atlas[k] = v
        f_name = v['file']
        atlas[f_name] = v
        lc_atlas[f_name] = v
        no_ext = os.path.splitext(f_name)[0]
        atlas[no_ext] = v
        lc_atlas[no_ext] = v

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2)
    with open(lc_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(lc_atlas, f, indent=2)
    print(f'  Updated atlas with {len(new_atlas_entries)} entries')

    print(f'[4/6] Synchronizing audio SE files...')
    audio_needed = [
        'PRSFX- Electro Ball2.wav',
        'PRSFX- Pain Split.wav',
        'PRSFX- Parting Shot.wav',
        'PRSFX- Pay Day1.wav',
        'PRSFX- Pay Day2.wav',
        'PRSFX- Payback1.wav',
        'PRSFX- Payback2.wav',
        'PRSFX- Peck.wav',
        'PRSFX- Perish Song.wav',
        'PRSFX- Petal Blizzard1.wav',
        'PRSFX- Petal Blizzard2.wav',
        'PRSFX- Petal Dance.wav',
        'PRSFX- Phantom Force2.wav',
        'PRSFX- Photon Guyser1.wav',
        'PRSFX- Photon Guyser2.wav',
        'PRSFX- Photon Guyser3.wav',
        'PRSFX- Pin Missile.wav',
        'PRSFX- Plasma Fist1.wav',
        'PRSFX- Plasma Fist2.wav',
        'PRSFX- Plasma Fist3.wav',
        'PRSFX- Play Nice1.wav',
        'PRSFX- Play Nice2.wav',
        'PRSFX- Play Rough1.wav',
        'PRSFX- Play Rough2.wav',
        'PRSFX- Play Rough3.wav',
        'PRSFX- Play Rough4.wav',
        'PRSFX- Pluck1.wav',
        'PRSFX- Pluck2.wav',
    ]

    for af in audio_needed:
        base_name = os.path.splitext(af)[0]
        src_candidates = [
            os.path.join(source_se_anim_dir, af),
            os.path.join(source_se_dir, af),
            os.path.join(source_se_anim_dir, base_name + '.wav'),
            os.path.join(source_se_dir, base_name + '.wav'),
            os.path.join(source_se_anim_dir, base_name + '.ogg'),
            os.path.join(source_se_dir, base_name + '.ogg'),
            os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE', 'Anim', af),
            os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE', af),
        ]
        found = False
        for c in src_candidates:
            if os.path.exists(c):
                target_dest = os.path.join(public_se_dir, 'Anim', af)
                if c != target_dest:
                    shutil.copy2(c, target_dest)
                # Also copy to root Audio/SE for safety
                root_dest = os.path.join(public_se_dir, af)
                if c != root_dest:
                    shutil.copy2(c, root_dest)
                found = True
                print(f'  Audio synced: {af}')
                break
        if not found:
            print(f'  [WARN] Audio not found: {af}')

    print('[5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...')
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    move_anims_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    extensions_path = os.path.join(game_data_dir, 'move-animation-extensions.json')

    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)

    if 'opponentMoves' not in anim_map:
        anim_map['opponentMoves'] = {}

    # Move mappings for P Group Batch 1
    move_mappings = {
        'pain_split': {'pl': 6936, 'opp': None},
        'parabolic_charge': {'pl': 6937, 'opp': None},
        'parting_shot': {'pl': 6938, 'opp': 6939},
        'pay_day': {'pl': 6940, 'opp': 6941},
        'payback': {'pl': 6942, 'opp': None},
        'peck': {'pl': 6943, 'opp': None},
        'perish_song': {'pl': 6944, 'opp': None},
        'petal_blizzard': {'pl': 6945, 'opp': 6946},
        'petal_dance': {'pl': 6947, 'opp': 6948},
        'phantom_force': {'pl': 6949, 'opp': None},
        'photon_geyser': {'pl': 6950, 'opp': 6951},
        'pin_missile': {'pl': 6952, 'opp': 6953},
        'plasma_fists': {'pl': 6954, 'opp': None},
        'play_nice': {'pl': 6955, 'opp': None},
        'play_rough': {'pl': 6956, 'opp': None},
        'pluck': {'pl': 6957, 'opp': 6958},
    }

    for m_key, m_val in move_mappings.items():
        anim_map['moves'][m_key] = m_val['pl']
        if m_val['opp'] is not None:
            anim_map['opponentMoves'][m_key] = m_val['opp']

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2)

    # Sync move-animations-db.json
    if os.path.exists(move_anims_db_path):
        with open(move_anims_db_path, 'r', encoding='utf-8') as f:
            madb = json.load(f)
        if 'moves' not in madb: madb['moves'] = {}
        if 'opponentMoves' not in madb: madb['opponentMoves'] = {}
        for m_key, m_val in move_mappings.items():
            madb['moves'][m_key] = m_val['pl']
            if m_val['opp'] is not None:
                madb['opponentMoves'][m_key] = m_val['opp']
        with open(move_anims_db_path, 'w', encoding='utf-8') as f:
            json.dump(madb, f, indent=2)

    # Sync move-animation-extensions.json
    if os.path.exists(extensions_path):
        with open(extensions_path, 'r', encoding='utf-8') as f:
            extdb = json.load(f)
        if 'moves' not in extdb: extdb['moves'] = {}
        if 'opponentMoves' not in extdb: extdb['opponentMoves'] = {}
        for m_key, m_val in move_mappings.items():
            extdb['moves'][m_key] = m_val['pl']
            if m_val['opp'] is not None:
                extdb['opponentMoves'][m_key] = m_val['opp']
        with open(extensions_path, 'w', encoding='utf-8') as f:
            json.dump(extdb, f, indent=2)

    # Sync moves-db.json
    if os.path.exists(moves_db_path):
        with open(moves_db_path, 'r', encoding='utf-8') as f:
            moves_db = json.load(f)
        for m_key, m_val in move_mappings.items():
            if m_key in moves_db:
                moves_db[m_key]['animationId'] = m_val['pl']
                if m_val['opp'] is not None:
                    moves_db[m_key]['opponentAnimationId'] = m_val['opp']
        with open(moves_db_path, 'w', encoding='utf-8') as f:
            json.dump(moves_db, f, indent=2)

    print('[6/6] P Group Batch 1 moves imported successfully!')

if __name__ == '__main__':
    main()
