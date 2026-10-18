#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 O Group Battle Animations.
Moves handled:
  1. oblivion_wing (Target IDs: 6918 PL / 6919 OPP) - Flying Special (Yveltal signature, GEN8- Moongeist Beam.png, 35 frames)
  2. obstruct (Target IDs: 6920 PL / 6921 OPP) - Dark Status (Obstagoon signature, GEN8- Obstruct.png, 22 frames, target: 'user')
  3. oceanic_operetta (Target IDs: 6922 PL / 6923 OPP) - Water Special (Primarina Z-Move, PRAS- Oceanic Operetta.png, 65 frames)
  4. octazooka (Target IDs: 6924 PL / 6925 OPP) - Water Special (Octillery signature, PRAS- Octozooka.png, 23 frames)
  5. octolock (Target ID: 6926 PL) - Fighting Status (Grapploct signature, PRAS- Constrict.png, 22 frames)
  6. odor_sleuth (Target ID: 6927 PL) - Normal Status (PRAS- Odor Sleuth.png, 20 frames)
  7. ominous_wind (Target ID: 6928 PL) - Ghost Special (PRAS- Ominous Wind BG/FG.png, 35 frames)
  8. order_up - Dragon Physical (Dondozo signature, mapped to dragon_rush 6818)
  9. origin_pulse (Target IDs: 6929 PL / 6930 OPP) - Water Special (Kyogre signature, PRAS- Origin Pulse.png, 64 frames)
  10. outrage (Target IDs: 6931 PL / 6932 OPP) - Dragon Physical (PRAS- Fire.png, PRAS- Outrage BG/Opp.png, 28 frames)
  11. overdrive (Target ID: 6933 PL) - Electric Special (Toxtricity signature, PRAS- Sound.png, 20 frames)
  12. overheat (Target IDs: 6934 PL / 6935 OPP) - Fire Special (PRAS- Fire.png, PRAS- Fire BG.png, 30 frames)
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

    # Specification for O Group moves:
    o_specs = [
        {'rx_id': 1384, 'tgt_id': 6918, 'name': 'Move:OBLIVIONWING', 'default_name': 'Oblivion Wing', 'move_key': 'oblivion_wing', 'is_opp': False},
        {'rx_id': 1385, 'tgt_id': 6919, 'name': 'OppMove:OBLIVIONWING', 'default_name': 'Oblivion Wing (Opp)', 'move_key': 'oblivion_wing', 'is_opp': True},
        {'rx_id': 1281, 'tgt_id': 6920, 'name': 'Move:OBSTRUCT', 'default_name': 'Obstruct', 'move_key': 'obstruct', 'is_opp': False},
        {'rx_id': 1282, 'tgt_id': 6921, 'name': 'OppMove:OBSTRUCT', 'default_name': 'Obstruct (Opp)', 'move_key': 'obstruct', 'is_opp': True},
        {'rx_id': 1220, 'tgt_id': 6922, 'name': 'ZMove:OCEANICOPERETTA', 'default_name': 'Oceanic Operetta', 'move_key': 'oceanic_operetta', 'is_opp': False},
        {'rx_id': 1221, 'tgt_id': 6923, 'name': 'OppZMove:OCEANICOPERETTA', 'default_name': 'Oceanic Operetta (Opp)', 'move_key': 'oceanic_operetta', 'is_opp': True},
        {'rx_id': 932, 'tgt_id': 6924, 'name': 'Move:OCTAZOOKA', 'default_name': 'Octazooka', 'move_key': 'octazooka', 'is_opp': False},
        {'rx_id': 933, 'tgt_id': 6925, 'name': 'OppMove:OCTAZOOKA', 'default_name': 'Octazooka (Opp)', 'move_key': 'octazooka', 'is_opp': True},
        {'rx_id': 1284, 'tgt_id': 6926, 'name': 'Move:OCTOLOCK', 'default_name': 'Octolock', 'move_key': 'octolock', 'is_opp': False},
        {'rx_id': 934, 'tgt_id': 6927, 'name': 'Move:ODORSLEUTH', 'default_name': 'Odor Sleuth', 'move_key': 'odor_sleuth', 'is_opp': False},
        {'rx_id': 736, 'tgt_id': 6928, 'name': 'Move:OMINOUSWIND', 'default_name': 'Ominous Wind', 'move_key': 'ominous_wind', 'is_opp': False},
        {'rx_id': 1073, 'tgt_id': 6929, 'name': 'Move:ORIGINPULSE', 'default_name': 'Origin Pulse', 'move_key': 'origin_pulse', 'is_opp': False},
        {'rx_id': 1074, 'tgt_id': 6930, 'name': 'OppMove:ORIGINPULSE', 'default_name': 'Origin Pulse (Opp)', 'move_key': 'origin_pulse', 'is_opp': True},
        {'rx_id': 291, 'tgt_id': 6931, 'name': 'Move:OUTRAGE', 'default_name': 'Outrage', 'move_key': 'outrage', 'is_opp': False},
        {'rx_id': 292, 'tgt_id': 6932, 'name': 'OppMove:OUTRAGE', 'default_name': 'Outrage (Opp)', 'move_key': 'outrage', 'is_opp': True},
        {'rx_id': 1286, 'tgt_id': 6933, 'name': 'Move:OVERDRIVE', 'default_name': 'Overdrive', 'move_key': 'overdrive', 'is_opp': False},
        {'rx_id': 341, 'tgt_id': 6934, 'name': 'Move:OVERHEAT', 'default_name': 'Overheat', 'move_key': 'overheat', 'is_opp': False},
        {'rx_id': 342, 'tgt_id': 6935, 'name': 'OppMove:OVERHEAT', 'default_name': 'Overheat (Opp)', 'move_key': 'overheat', 'is_opp': True},
    ]

    print(f'[2/6] Parsing and exporting {len(o_specs)} animation definitions...')
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)

    used_graphics = set()
    used_se_files = set()

    for spec in o_specs:
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
            t_attrs = t.attributes if hasattr(t, 'attributes') else {}
            frame = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
            ttype = t_attrs.get('@timingType') or t_attrs.get(b'@timingType')
            tname = t_attrs.get('@name') or t_attrs.get(b'@name', b'')
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

            # If SE is empty but name looks like a sound file
            if not se_name and tname and not tname.lower().endswith(('.png', '.jpg', '.bmp')):
                se_name = tname

            if se_name:
                clean_se = os.path.basename(se_name).replace('\\', '/')
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
            flash_dur = t_attrs.get('@flashDuration') or t_attrs.get(b'@flashDuration', 4)
            flash_col = t_attrs.get('@flashColor') or t_attrs.get(b'@flashColor')
            if flash_scope and flash_col and hasattr(flash_col, 'attributes'):
                fc = flash_col.attributes
                r_c = fc.get('@red') or fc.get(b'@red', 255)
                g_c = fc.get('@green') or fc.get(b'@green', 255)
                b_c = fc.get('@blue') or fc.get(b'@blue', 255)
                a_c = fc.get('@alpha') or fc.get(b'@alpha', 180)
                timings.append({
                    'frame': frame,
                    'type': 'flash',
                    'payload': {
                        'flashDuration': flash_dur,
                        'flashScope': flash_scope,
                        'flashColor': [int(r_c), int(g_c), int(b_c), int(a_c)]
                    }
                })

        # Special enhancements for O-moves:
        # 1. Ominous Wind (6928): rx 736 only had BG/FG timings. Add screen cels for PRAS- Ominous Wind BG.png and FG.png
        if tgt_id == 6928:
            graphic = 'PRAS- Ominous Wind BG.png'
            used_graphics.add('PRAS- Ominous Wind BG.png')
            used_graphics.add('PRAS- Ominous Wind FG.png')
            # 35 frames: fade in BG from frame 0..10, hold until 25, fade out until 34
            for fi in range(len(frames)):
                if fi < 8:
                    bg_op = int(220 * (fi / 8.0))
                elif fi < 28:
                    bg_op = 220
                else:
                    bg_op = int(220 * (1.0 - (fi - 28) / 7.0))
                
                # BG cel
                frames[fi]['cels'].append({
                    'pattern': 0,
                    'x': 256,
                    'y': 144,
                    'zoomX': 100,
                    'zoomY': 100,
                    'angle': 0,
                    'mirror': False,
                    'opacity': max(0, min(255, bg_op)),
                    'blendMode': 'normal',
                    'visible': True,
                    'priority': 0,
                    'focus': 'screen'
                })

        # 2. Outrage BG overlay (6931 PL: PRAS- Outrage BG.png, 6932 OPP: PRAS- OutrageOpp BG.png)
        if tgt_id == 6931:
            used_graphics.add('PRAS- Outrage BG.png')
        elif tgt_id == 6932:
            used_graphics.add('PRAS- OutrageOpp BG.png')

        # 3. Origin Pulse BG/FG overlay
        if tgt_id in (6929, 6930):
            used_graphics.add('PRAS- Origin Pulse BG.png')
            used_graphics.add('PRAS- Origin Pulse FG.png')

        # 4. Oceanic Operetta BG overlay
        if tgt_id in (6922, 6923):
            used_graphics.add('PRAS- Oceanic Operetta BG.png')

        # 5. Overheat BG overlay
        if tgt_id in (6934, 6935):
            used_graphics.add('PRAS- Fire BG.png')

        anim_doc = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'hue': attrs.get('@hue', 0) or attrs.get(b'@hue', 0),
            'position': attrs.get('@position', 1) or attrs.get(b'@position', 1),
            'fps': 20,
            'frames': frames,
            'timings': timings
        }

        # Save to primary animations and last-chance
        out_file = os.path.join(anims_out_dir, f'{tgt_id}.json')
        lc_file = os.path.join(last_chance_dir, f'{tgt_id}.json')

        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(anim_doc, f, indent=2)
        with open(lc_file, 'w', encoding='utf-8') as f:
            json.dump(anim_doc, f, indent=2)

        # Update manifests
        m_entry = {
            'id': str(tgt_id),
            'name': name,
            'frames': len(frames),
            'graphic': graphic
        }
        manifest[str(tgt_id)] = m_entry
        last_chance_manifest[str(tgt_id)] = m_entry
        print(f'  Exported ID {tgt_id}: {name} ({len(frames)} frames, graphic={graphic}, timings={len(timings)})')

    # Also update canonical 205 (Outrage) and 206 (Overheat) with the updated authentic definitions!
    with open(os.path.join(anims_out_dir, '6931.json'), 'r', encoding='utf-8') as f:
        doc_205 = json.load(f)
    doc_205['id'] = '205'
    with open(os.path.join(anims_out_dir, '205.json'), 'w', encoding='utf-8') as f:
        json.dump(doc_205, f, indent=2)
    with open(os.path.join(last_chance_dir, '205.json'), 'w', encoding='utf-8') as f:
        json.dump(doc_205, f, indent=2)

    with open(os.path.join(anims_out_dir, '6934.json'), 'r', encoding='utf-8') as f:
        doc_206 = json.load(f)
    doc_206['id'] = '206'
    with open(os.path.join(anims_out_dir, '206.json'), 'w', encoding='utf-8') as f:
        json.dump(doc_206, f, indent=2)
    with open(os.path.join(last_chance_dir, '206.json'), 'w', encoding='utf-8') as f:
        json.dump(doc_206, f, indent=2)

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2)

    print(f'[3/6] Synchronizing {len(used_graphics)} graphics assets and fixing dimensions/transparency...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    lc_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')

    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(lc_atlas_path, 'r', encoding='utf-8') as f:
        lc_atlas = json.load(f)

    # Copy and process all needed graphics
    all_needed_gfx = [
        'GEN8- Moongeist Beam.png',
        'GEN8- Obstruct.png',
        'PRAS- Oceanic Operetta.png',
        'PRAS- Oceanic Operetta BG.png',
        'PRAS- Octozooka.png',
        'PRAS- Constrict.png',
        'PRAS- Odor Sleuth.png',
        'PRAS- Ominous Wind BG.png',
        'PRAS- Ominous Wind FG.png',
        'PRAS- Origin Pulse.png',
        'PRAS- Origin Pulse BG.png',
        'PRAS- Origin Pulse FG.png',
        'PRAS- Fire.png',
        'PRAS- Outrage BG.png',
        'PRAS- OutrageOpp BG.png',
        'PRAS- Sound.png',
        'PRAS- Fire BG.png',
    ]

    for gfx in all_needed_gfx:
        src_p = os.path.join(source_gfx_dir, gfx)
        local_p = os.path.join(local_gfx_dir, gfx)
        web_p = os.path.join(dest_gfx_dir, gfx)

        if os.path.exists(src_p):
            # Process image (e.g. crop octazooka, convert LA to RGBA)
            with Image.open(src_p) as img:
                w, h = img.size
                # If PRAS- Octozooka has 385 height, crop to 384
                if gfx == 'PRAS- Octozooka.png' and h == 385:
                    print(f'  Cropping {gfx} from 385 to 384 height')
                    img = img.crop((0, 0, w, 384))
                
                # Convert palette/LA to RGBA if needed
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                
                img.save(local_p, 'PNG')
                img.save(web_p, 'PNG')
                print(f'  Processed and saved {gfx} ({img.width}x{img.height})')
        elif os.path.exists(local_p):
            shutil.copy2(local_p, web_p)

    # Register new graphics in animation-atlas.json
    new_atlas_entries = {
        'GEN8- Obstruct': {
            'assetKey': 'animation.gen8-obstruct',
            'file': 'GEN8- Obstruct.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Oceanic Operetta': {
            'assetKey': 'animation.pras--oceanic-operetta',
            'file': 'PRAS- Oceanic Operetta.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Oceanic Operetta BG': {
            'assetKey': 'animation.pras--oceanic-operetta-bg',
            'file': 'PRAS- Oceanic Operetta BG.png',
            'width': 512,
            'height': 300,
            'cellWidth': 512,
            'cellHeight': 300,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Octozooka': {
            'assetKey': 'animation.pras--octozooka',
            'file': 'PRAS- Octozooka.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Odor Sleuth': {
            'assetKey': 'animation.pras--odor-sleuth',
            'file': 'PRAS- Odor Sleuth.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Ominous Wind BG': {
            'assetKey': 'animation.pras--ominous-wind-bg',
            'file': 'PRAS- Ominous Wind BG.png',
            'width': 512,
            'height': 300,
            'cellWidth': 512,
            'cellHeight': 300,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Ominous Wind FG': {
            'assetKey': 'animation.pras--ominous-wind-fg',
            'file': 'PRAS- Ominous Wind FG.png',
            'width': 512,
            'height': 300,
            'cellWidth': 512,
            'cellHeight': 300,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Origin Pulse': {
            'assetKey': 'animation.pras--origin-pulse',
            'file': 'PRAS- Origin Pulse.png',
            'width': 960,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 3,
            'maxPattern': 15
        },
        'PRAS- Origin Pulse BG': {
            'assetKey': 'animation.pras--origin-pulse-bg',
            'file': 'PRAS- Origin Pulse BG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Origin Pulse FG': {
            'assetKey': 'animation.pras--origin-pulse-fg',
            'file': 'PRAS- Origin Pulse FG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- Outrage BG': {
            'assetKey': 'animation.pras--outrage-bg',
            'file': 'PRAS- Outrage BG.png',
            'width': 512,
            'height': 384,
            'cellWidth': 512,
            'cellHeight': 384,
            'columns': 1,
            'rows': 1,
            'maxPattern': 1
        },
        'PRAS- OutrageOpp BG': {
            'assetKey': 'animation.pras--outrageopp-bg',
            'file': 'PRAS- OutrageOpp BG.png',
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

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2)
    with open(lc_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(lc_atlas, f, indent=2)
    print(f'  Updated atlas with {len(new_atlas_entries)} entries')

    print(f'[4/6] Synchronizing audio SE files...')
    audio_needed = [
        'PRSFX- Fusion Bolt1.wav', 'Saint9.ogg', 'Harden.ogg',
        'PRSFX- Oceanic Operetta1.wav', 'PRSFX- Oceanic Operetta2.wav',
        'PRSFX- Oceanic Operetta3.wav', 'PRSFX- Oceanic Operetta4.wav',
        'PRSFX- Octazooka.wav', 'PRSFX- Constrict.wav',
        'PRSFX- Odor Sleuth1.wav', 'PRSFX- Odor Sleuth2.wav',
        'PRSFX- Ominous Wind.wav',
        'PRSFX- Origin Pulse1.wav', 'PRSFX- Origin Pulse2.wav', 'PRSFX- Origin Pulse3.wav',
        'PRSFX- Outrage1.wav', 'PRSFX- Outrage2.wav',
        'PRSFX- Boomburst.wav',
        'PRSFX- Overheat1.wav', 'PRSFX- Overheat2.wav',
    ]

    for af in audio_needed:
        # Search in source
        src_candidates = [
            os.path.join(source_se_anim_dir, af),
            os.path.join(source_se_dir, af),
            os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE', 'Anim', af),
            os.path.join(out_base, 'apps', 'web', 'public', 'Audio', 'SE', af),
        ]
        found = False
        for c in src_candidates:
            if os.path.exists(c):
                target_dest = os.path.join(public_se_dir, 'Anim', af)
                if c != target_dest:
                    shutil.copy2(c, target_dest)
                found = True
                print(f'  Audio synced: {af}')
                break
        if not found:
            print(f'  [WARN] Audio not found: {af}')

    print('[5/6] Updating move-animation-map.json, moves-db.json, reunion-moves.json...')
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')

    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)

    if 'opponentMoves' not in anim_map:
        anim_map['opponentMoves'] = {}

    # Assign mappings
    o_mappings = {
        'oblivion_wing': 6918,
        'obstruct': 6920,
        'oceanic_operetta': 6922,
        'octazooka': 6924,
        'octolock': 6926,
        'odor_sleuth': 6927,
        'ominous_wind': 6928,
        'order_up': 6818, # Fallback to dragon_rush
        'origin_pulse': 6929,
        'outrage': 6931,
        'overdrive': 6933,
        'overheat': 6934,
    }

    o_opp_mappings = {
        'oblivion_wing': 6919,
        'obstruct': 6921,
        'oceanic_operetta': 6923,
        'octazooka': 6925,
        'origin_pulse': 6930,
        'outrage': 6932,
        'overheat': 6935,
    }

    if 'moves' not in anim_map:
        anim_map['moves'] = {}
    for m, aid in o_mappings.items():
        anim_map['moves'][m] = aid
        anim_map.pop(m, None)
    for m, aid in o_opp_mappings.items():
        anim_map['opponentMoves'][m] = aid

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2)

    # moves-db.json target updates
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)
    m_dict = moves_db.get('moves', moves_db)

    user_target_moves = ['obstruct']
    for m in user_target_moves:
        if m in m_dict:
            m_dict[m]['target'] = 'user'
            print(f'  Set target: user for {m}')

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2)

    # reunion-moves.json
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion = json.load(f)

    opt_set = set(reunion.get('optimizedMoves', []))
    all_set = set(reunion.get('allReunionMoves', []))

    for m in o_mappings.keys():
        opt_set.add(m)
        all_set.add(m)

    reunion['optimizedMoves'] = sorted(list(opt_set))
    reunion['allReunionMoves'] = sorted(list(all_set))

    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion, f, indent=2)

    print('[6/6] All O Group moves successfully imported and synchronized!')

if __name__ == '__main__':
    main()
