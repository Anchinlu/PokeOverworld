#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 L Group Battle Animations - Batch 1 (16 entries).
Moves handled:
  1. lands_wrath (1376) - Ground Physical (GEN8- Land's Wrath.png, 51 frames)
  2. laser_focus (1081) - Normal Status (PRAS- Leer.png, 44 frames, target: 'user')
  3. lash_out (1312 PL / 1313 OPP) - Dark Physical (PRAS- Fire.png, 32 frames)
  4. last_resort (1050 PL / 1051 OPP) - Normal Physical (PRAS- Last Resort.png, 43 frames)
  5. last_respects - Gen 9 Houndstone signature Ghost Physical (Dynamic Type Fallback to shadow_ball 241)
  6. lava_plume (489) - Fire Special (PRAS- Fire.png, 25 frames)
  7. leaf_blade (393 PL / 394 OPP) - Grass Physical (PRAS- Grass.png, 25 frames)
  8. leaf_storm (728 PL / 729 OPP) - Grass Special (PRAS- Grass.png, 35 frames)
  9. leaf_tornado (1065) - Grass Special (PRAS- Leaf Tornado.png, 55 frames)
  10. leafage (1082 PL / 1083 OPP) - Grass Physical (PRAS- Grass.png, 30 frames)
  11. leech_life (Safe ID: 6876) - Bug Physical (PRAS- Leech Life.png, 22 frames, preserving THUNDERPUNCH 282)
  12. leech_seed (Safe IDs: 6877 PL / 6878 OPP) - Grass Status (PRAS- Leech Seed.png, 40 frames, preserving SUPERSONIC 270)
  13. leechseed (Alias: Safe IDs: 6877 PL / 6878 OPP)
  14. leer (344 PL / 345 OPP) - Normal Status (PRAS- Leer.png, 7 frames)
  15. lets_snuggle_forever - Gen 7 Mimikyu Fairy Z-Move (Dynamic Type Fallback to play_rough)
  16. lick (Safe IDs: 6879 PL / 6880 OPP) - Ghost Physical (PRAS- Sketch + Lick.png, 15 frames, preserving FUTURESIGHT 142)
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

    # Specification for Batch 1:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_export, direct_custom_id)
    batch1_specs = [
        ('lands_wrath', 1376, None, 1376, None, False, None),
        ('laser_focus', 1081, None, 1081, None, False, None),
        ('lash_out', 1312, 1313, 1312, 1313, False, None),
        ('last_resort', 1050, 1051, 1050, 1051, False, None),
        ('last_respects', None, None, None, None, True, None), # Dynamic fallback to shadow_ball 241
        ('lava_plume', 489, None, 489, None, False, None),
        ('leaf_blade', 393, 394, 393, 394, False, None),
        ('leaf_storm', 728, 729, 728, 729, False, None),
        ('leaf_tornado', 1065, None, 1065, None, False, None),
        ('leafage', 1082, 1083, 1082, 1083, False, None),
        ('leech_life', 282, None, 6876, None, False, None), # Safe ID 6876 (preserving THUNDERPUNCH 282)
        ('leech_seed', 270, 271, 6877, 6878, False, None), # Safe IDs 6877/6878 (preserving SUPERSONIC 270)
        ('leechseed', 270, 271, 6877, 6878, True, None),   # Alias of leech_seed
        ('leer', 344, 345, 344, 345, False, None),
        ('lets_snuggle_forever', None, None, None, None, True, None), # Z-move dynamic fallback
        ('lick', 142, 143, 6879, 6880, False, None),       # Safe IDs 6879/6880 (preserving FUTURESIGHT 142)
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

        # Fix missing coordinates in raw rxdata entry 271 for Leech Seed cel 2
        if tgt_id == 6878:
            leech_traj = {
                11: (304, 110),
                12: (278, 130),
                13: (253, 156),
                14: (227, 186),
                15: (202, 218),
                16: (176, 250),
            }
            for fi, fr in enumerate(frames):
                if len(fr['cels']) > 2:
                    c = fr['cels'][2]
                    if fi <= 10:
                        c['x'] = 368
                        c['y'] = 98
                    elif fi in leech_traj:
                        c['x'] = leech_traj[fi][0]
                        c['y'] = leech_traj[fi][1]
                    else:
                        c['x'] = 168
                        c['y'] = 258
                    c['_sourceXMissing'] = False
                    c['_sourceYMissing'] = False

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

    # Pad PRAS- Last Resort.png to 960x384 if needed
    for g_dir in [dest_gfx_dir, local_gfx_dir]:
        lr_path = os.path.join(g_dir, 'PRAS- Last Resort.png')
        if os.path.exists(lr_path):
            with Image.open(lr_path) as im:
                if im.size == (950, 384):
                    padded = Image.new('RGBA', (960, 384), (0, 0, 0, 0))
                    padded.paste(im, (0, 0))
                    padded.save(lr_path)
                    print(f'  [PADDED] PRAS- Last Resort.png in {g_dir} to 960x384')

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
                # If 950, normalize to 960
                if w == 950 and h == 384:
                    padded = Image.new('RGBA', (960, 384), (0, 0, 0, 0))
                    padded.paste(im, (0, 0))
                    padded.save(local_path)
                    padded.save(os.path.join(local_gfx_dir, fname))
                    w, h = 960, 384
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

    for spec in batch1_specs:
        mkey, rx_pl, rx_opp, tgt_pl, tgt_opp, skip_exp, direct_id = spec
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

    for spec in batch1_specs:
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

    user_targets = ['laser_focus']
    for utm in user_targets:
        if utm in moves_db['moves']:
            moves_db['moves'][utm]['target'] = 'user'
            print(f'  [TARGET UPDATED] {utm} -> target: "user"')

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('\n[COMPLETED] Batch 1 L-Group animations imported successfully!')

if __name__ == '__main__':
    main()
