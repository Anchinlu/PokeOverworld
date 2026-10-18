#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 J and K Group Battle Animations (11 move entries).
Moves handled:
  1. jaw_lock (1275) - Dark Physical (PRAS- Elemental Fangs.png, 21 frames)
  2. jet_punch (6751) - Water Physical Priority punch (Palafin signature -> mapped to aqua_jet 6751)
  3. judgment (870) - Normal Special (PRAS- Judgement.png, 44 frames, Arceus signature)
  4. jump_kick / jumpkick (Safe IDs: 6871 PL / 6872 OPP) - Fighting Physical (PRAS- Strike.png, 21 frames)
  5. jungle_healing (1311) - Grass Status (PRAS- Healing Wish.png, 57 frames, Zarude signature, target: 'user')
  6. karate_chop (Safe ID: 6873) - Fighting Physical (PRAS- Strike.png, 15 frames, preserving benchmark LOVELYKISS 185)
  7. kinesis (Safe IDs: 6874 PL / 6875 OPP) - Psychic Status (PRAS- Kenesis.png, 31 frames, preserving benchmark SWIFT 273 and SWORDSDANCE 274)
  8. kings_shield (467 PL / 468 OPP) - Steel Status (PRAS- King's Shield.png, 21 frames, Aegislash signature, target: 'user')
  9. knock_off (501) - Dark Physical (PRAS- Strike.png, 20 frames)
  10. kowtow_cleave - Gen 9 Kingambit signature Dark Physical (Dynamic Type Fallback to bite 65)
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

    # Specification for J & K Moves:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_export, direct_custom_id)
    jk_specs = [
        ('jaw_lock', 1275, None, 1275, None, False, None),
        ('jet_punch', None, None, 6751, None, True, 6751), # Mapped to aqua_jet 6751
        ('judgment', 870, None, 870, None, False, None),
        ('jump_kick', 157, 158, 6871, 6872, False, None), # Safe IDs 6871/6872 preserving 157/158
        ('jumpkick', 157, 158, 6871, 6872, True, None),   # Alias of jump_kick
        ('jungle_healing', 1311, None, 1311, None, False, None),
        ('karate_chop', 185, None, 6873, None, False, None), # Safe ID 6873 preserving LOVELYKISS 185
        ('kinesis', 273, 274, 6874, 6875, False, None),      # Safe IDs 6874/6875 preserving SWIFT 273 & SWORDSDANCE 274
        ('kings_shield', 467, 468, 467, 468, False, None),
        ('knock_off', 501, None, 501, None, False, None),
        ('kowtow_cleave', None, None, None, None, True, None), # Dynamic Type Fallback (DARK Physical -> bite 65)
    ]

    export_queue = []
    for spec in jk_specs:
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
            # Check without extension or with alternate ext
            base_se, _ = os.path.splitext(se)
            for ext in ['.wav', '.ogg', '.mp3']:
                for sdir in [source_se_dir, source_se_anim_dir]:
                    sp = os.path.join(sdir, base_se + ext)
                    if os.path.exists(sp):
                        shutil.copy2(sp, os.path.join(public_se_dir, se))
                        shutil.copy2(sp, os.path.join(public_se_dir, 'Anim', se))
                        found = True
                        break
                if found:
                    break
        if found:
            print(f'  [SE OK] {se}')
        else:
            print(f'  [SE MISSING] {se}')

    # Copy graphics and register in atlas
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    for g in sorted(used_graphics):
        fname = g if g.lower().endswith('.png') else (g + '.png')
        src_path = os.path.join(source_gfx_dir, fname)
        if os.path.exists(src_path):
            shutil.copy2(src_path, os.path.join(dest_gfx_dir, fname))
            shutil.copy2(src_path, os.path.join(local_gfx_dir, fname))

        local_path = os.path.join(dest_gfx_dir, fname)
        clean_g = g[:-4] if g.lower().endswith('.png') else g

        if clean_g not in atlas and os.path.exists(local_path):
            with Image.open(local_path) as im:
                w, h = im.size
                cols = w // 192 if w >= 192 else 1
                rows = h // 192 if h >= 192 else 1
                cw = 192 if w >= 192 else w
                ch = 192 if h >= 192 else h
                entry = {
                    'assetKey': f'animation.{clean_g.lower().replace(" ", "_")}',
                    'file': fname,
                    'width': w,
                    'height': h,
                    'cellWidth': cw,
                    'cellHeight': ch,
                    'columns': cols,
                    'rows': rows,
                    'maxPattern': cols * rows
                }
                atlas[clean_g] = entry
                atlas[fname] = entry
                print(f'  [ATLAS ADDED] {clean_g} ({w}x{h}, {cols}x{rows})')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)

    print('[4/6] Updating move-animation-map.json and move-animation-extensions.json...')
    move_map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(move_map_path, 'r', encoding='utf-8') as f:
        move_map = json.load(f)

    ext_map_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_map_path, 'r', encoding='utf-8') as f:
        ext_map = json.load(f)

    if 'opponentMoves' not in move_map:
        move_map['opponentMoves'] = {}
    if 'opponentMoves' not in ext_map:
        ext_map['opponentMoves'] = {}

    for spec in jk_specs:
        mkey, rx_pl, rx_opp, tgt_pl, tgt_opp, skip_exp, direct_id = spec
        # Clean any legacy root-level entry if present
        if mkey in move_map:
            del move_map[mkey]
        if tgt_pl is not None:
            move_map['moves'][mkey] = tgt_pl
            if 'moves' in ext_map:
                ext_map['moves'][mkey] = tgt_pl
            ext_map[mkey] = tgt_pl
            if mkey.replace('_', '-') != mkey:
                ext_map[mkey.replace('_', '-')] = tgt_pl
        if tgt_opp is not None:
            move_map['opponentMoves'][mkey] = tgt_opp
            if 'opponentMoves' in ext_map:
                ext_map['opponentMoves'][mkey] = tgt_opp

    with open(move_map_path, 'w', encoding='utf-8') as f:
        json.dump(move_map, f, indent=2, ensure_ascii=False)
    with open(ext_map_path, 'w', encoding='utf-8') as f:
        json.dump(ext_map, f, indent=2, ensure_ascii=False)

    print('[5/6] Updating move-animations-db.json...')
    moves_anim_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(moves_anim_db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)

    for spec in jk_specs:
        mkey, rx_pl, rx_opp, tgt_pl, tgt_opp, skip_exp, direct_id = spec
        if tgt_pl is not None:
            if mkey not in anim_db:
                anim_db[mkey] = {}
            anim_db[mkey]['animationId'] = tgt_pl
            if tgt_opp is not None:
                anim_db[mkey]['opponentAnimationId'] = tgt_opp

    with open(moves_anim_db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Updating moves-db.json with user targets...')
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    user_targets = ['jungle_healing', 'kings_shield']
    for utm in user_targets:
        if utm in moves_db['moves']:
            moves_db['moves'][utm]['target'] = 'user'
            print(f'  [TARGET UPDATED] {utm} -> target: "user"')

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('\n[COMPLETED] Group J and K animations imported successfully!')

if __name__ == '__main__':
    main()
