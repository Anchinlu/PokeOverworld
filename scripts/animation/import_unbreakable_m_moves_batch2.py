#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 M Group Battle Animations - Batch 2 (30 moves + moongeist_beam).
Moves handled:
  1. me_first (991) - Normal Status (PRAS- Me First.png, 42 frames)
  2. mean_look (Safe ID: 6891) - Normal Status (PRAS- Mean Look.png, 24 frames)
  3. meditate (635) - Psychic Status (22 frames, target: 'user')
  4. mega_drain (Safe IDs: 6892 PL / 6893 OPP) - Grass Special (PRAS- Absorption.png, 34/33 frames)
  5. mega_kick (Safe IDs: 6894 PL / 6895 OPP) - Normal Physical (PRAS- Strike.png, 10 frames)
  6. mega_punch (Safe ID: 6896) - Normal Physical (PRAS- Strike.png, 15 frames)
  7. megahorn (338 PL / 339 OPP) - Bug Physical (PRAS- Megahorn.png, 19 frames)
  8. memento (921) - Dark Status (25 frames)
  9. menacing_moonraze_maelstrom - Gen 7 Lunala signature Ghost Special Z-Move (mapped to moongeist_beam 1382)
  10. metal_burst (959 PL / 960 OPP) - Steel Physical (PRAS- Metal Burst.png, 46 frames)
  11. metal_claw (Safe ID: 6897) - Steel Physical (PRAS- Slash.png, 15 frames)
  12. metal_sound (649 PL / 650 OPP) - Steel Status (PRAS- Metal Sound.png, 26/28 frames)
  13. meteor_assault (1278 PL / 1279 OPP) - Fighting Physical (PRAS- Me First.png, 35 frames)
  14. meteor_beam (1314) - Rock Special (GEN8- Meteor Beam.png, 60 frames)
  15. meteor_mash (Safe ID: 6898) - Steel Physical (PRAS- Meteor Mash.png, 45 frames)
  16. metronome (Safe IDs: 6899 PL / 6900 OPP) - Normal Status (PRAS- Hands.png, 17 frames, target: 'user')
  17. mighty_cleave - Gen 9 Iron Boulder signature Rock Physical (Fallback to stone_edge 266)
  18. milk_drink (847) - Normal Status (PRAS- Milk Drink.png, 36 frames, target: 'user')
  19. mimic (806) - Normal Status (20 frames)
  20. mind_blown (1114 PL / 1115 OPP) - Fire Special (PRAS- Mind Blown.png, 58 frames)
  21. mind_reader (1037) - Normal Status (PRAS- Miracle Eye.png, 23 frames)
  22. minimize (485) - Normal Status (33 frames, target: 'user')
  23. miracle_eye (502) - Psychic Status (PRAS- Miracle Eye.png, 30 frames)
  24. mirror_coat (930 PL / 931 OPP) - Psychic Special (PRAS- Mirror Coat.png, 24 frames, target: 'user')
  25. mirror_move (1380 PL / 1381 OPP) - Flying Status (PRAS- Mirror Shot.png, 17 frames, target: 'user')
  26. mirror_shot (597 PL / 598 OPP) - Steel Special (PRAS- Mirror Shot.png, 20 frames)
  27. mist (Safe ID: 6901) - Ice Status (PRAS- Mist.png, 35 frames, target: 'user')
  28. mist_ball (Safe ID: 6902) - Psychic Special (PRAS- Water.png, 30 frames)
  29. misty_explosion (1315) - Fairy Special (GEN8- Misty Explosion.png, 65 frames)
  30. misty_terrain (439) - Fairy Status (PRAS- Orbs.png, 30 frames, target: 'user')
  + moongeist_beam (1382 PL / 1383 OPP) - Ghost Special (GEN8- Moongeist Beam.png, 35 frames)
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

    # Specification for Batch 2:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_export)
    batch2_specs = [
        ('me_first', 991, None, 991, None, False),
        ('mean_look', 230, None, 6891, None, False), # Safe ID 6891 (preserving ROAR 230)
        ('meditate', 635, None, 635, None, False),
        ('mega_drain', 172, 173, 6892, 6893, False), # Safe IDs 6892/6893 (preserving JUMPKICK/KARATECHOP 172/173)
        ('mega_kick', 293, 294, 6894, 6895, False),  # Safe IDs 6894/6895 (preserving WATERPULSE/WHIRLWIND 293/294)
        ('mega_punch', 204, None, 6896, None, False), # Safe ID 6896 (preserving NIGHTMARE 204)
        ('megahorn', 338, 339, 338, 339, False),
        ('memento', 921, None, 921, None, False),
        ('menacing_moonraze_maelstrom', None, None, None, None, True), # Mapped to moongeist_beam 1382
        ('metal_burst', 959, 960, 959, 960, False),
        ('metal_claw', 162, None, 6897, None, False), # Safe ID 6897 (preserving ICEFANG 162)
        ('metal_sound', 649, 650, 649, 650, False),
        ('meteor_assault', 1278, 1279, 1278, 1279, False),
        ('meteor_beam', 1314, None, 1314, None, False),
        ('meteor_mash', 95, None, 6898, None, False), # Safe ID 6898 (preserving DYNAMICPUNCH 95)
        ('metronome', 295, 296, 6899, 6900, False),   # Safe IDs 6899/6900 (preserving WILLOWISP/WINGATTACK 295/296)
        ('mighty_cleave', None, None, None, None, True), # Fallback to stone_edge 266
        ('milk_drink', 847, None, 847, None, False),
        ('mimic', 806, None, 806, None, False),
        ('mind_blown', 1114, 1115, 1114, 1115, False),
        ('mind_reader', 1037, None, 1037, None, False),
        ('minimize', 485, None, 485, None, False),
        ('miracle_eye', 502, None, 502, None, False),
        ('mirror_coat', 930, 931, 930, 931, False),
        ('mirror_move', 1380, 1381, 1380, 1381, False),
        ('mirror_shot', 597, 598, 597, 598, False),
        ('mist', 245, None, 6901, None, False),       # Safe ID 6901 (preserving SING 245)
        ('mist_ball', 103, None, 6902, None, False),  # Safe ID 6902 (preserving FIERYDANCE 103)
        ('misty_explosion', 1315, None, 1315, None, False),
        ('misty_terrain', 439, None, 439, None, False),
        ('moongeist_beam', 1382, 1383, 1382, 1383, False),
    ]

    export_queue = []
    for spec in batch2_specs:
        mkey, rx_pl, rx_opp, tgt_pl, tgt_opp, skip_exp = spec
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

        # Process timings / audio SE
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
        print(f'  [OK] Exported ID {rx_id} -> {tgt_id} ({name}, {len(frames)} frames)')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2, ensure_ascii=False)

    print(f'[3/6] Syncing audio SE ({len(used_se_files)} files) and graphics ({len(used_graphics)} files)...')
    # Copy sound files from Unbreakable Ties if present
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
            # Check if file already exists locally
            if not os.path.exists(os.path.join(public_se_dir, se)) and not os.path.exists(os.path.join(public_se_dir, 'Anim', se)):
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
        'PRAS- Absorption.png': {
            'assetKey': 'animation.pras-absorption',
            'file': 'PRAS- Absorption.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Metal Burst.png': {
            'assetKey': 'animation.pras-metal-burst',
            'file': 'PRAS- Metal Burst.png',
            'width': 960,
            'height': 1536,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 8,
            'maxPattern': 40
        },
        'GEN8- Meteor Beam.png': {
            'assetKey': 'animation.gen8-meteor-beam',
            'file': 'GEN8- Meteor Beam.png',
            'width': 960,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 3,
            'maxPattern': 15
        },
        'PRAS- Milk Drink.png': {
            'assetKey': 'animation.pras-milk-drink',
            'file': 'PRAS- Milk Drink.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Mind Blown.png': {
            'assetKey': 'animation.pras-mind-blown',
            'file': 'PRAS- Mind Blown.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Miracle Eye.png': {
            'assetKey': 'animation.pras-miracle-eye',
            'file': 'PRAS- Miracle Eye.png',
            'width': 960,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 2,
            'maxPattern': 10
        },
        'PRAS- Mirror Shot.png': {
            'assetKey': 'animation.pras-mirror-shot',
            'file': 'PRAS- Mirror Shot.png',
            'width': 1152,
            'height': 384,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 6,
            'rows': 2,
            'maxPattern': 12
        },
        'GEN8- Misty Explosion.png': {
            'assetKey': 'animation.gen8-misty-explosion',
            'file': 'GEN8- Misty Explosion.png',
            'width': 768,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 4,
            'rows': 3,
            'maxPattern': 12
        },
        'GEN8- Moongeist Beam.png': {
            'assetKey': 'animation.gen8-moongeist-beam',
            'file': 'GEN8- Moongeist Beam.png',
            'width': 960,
            'height': 192,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 1,
            'maxPattern': 5
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

    # Map imported moves for Batch 2
    moves_map['me_first'] = 991
    moves_map['mean_look'] = 6891
    moves_map['meditate'] = 635
    moves_map['mega_drain'] = 6892
    opp_moves_map['mega_drain'] = 6893
    moves_map['mega_kick'] = 6894
    opp_moves_map['mega_kick'] = 6895
    moves_map['mega_punch'] = 6896
    moves_map['megahorn'] = 338
    opp_moves_map['megahorn'] = 339
    moves_map['memento'] = 921
    moves_map['menacing_moonraze_maelstrom'] = 1382 # moongeist_beam
    moves_map['metal_burst'] = 959
    opp_moves_map['metal_burst'] = 960
    moves_map['metal_claw'] = 6897
    moves_map['metal_sound'] = 649
    opp_moves_map['metal_sound'] = 650
    moves_map['meteor_assault'] = 1278
    opp_moves_map['meteor_assault'] = 1279
    moves_map['meteor_beam'] = 1314
    moves_map['meteor_mash'] = 6898
    moves_map['metronome'] = 6899
    opp_moves_map['metronome'] = 6900
    moves_map['mighty_cleave'] = 266 # stone_edge
    moves_map['milk_drink'] = 847
    moves_map['mimic'] = 806
    moves_map['mind_blown'] = 1114
    opp_moves_map['mind_blown'] = 1115
    moves_map['mind_reader'] = 1037
    moves_map['minimize'] = 485
    moves_map['miracle_eye'] = 502
    moves_map['mirror_coat'] = 930
    opp_moves_map['mirror_coat'] = 931
    moves_map['mirror_move'] = 1380
    opp_moves_map['mirror_move'] = 1381
    moves_map['mirror_shot'] = 597
    opp_moves_map['mirror_shot'] = 598
    moves_map['mist'] = 6901
    moves_map['mist_ball'] = 6902
    moves_map['misty_explosion'] = 1315
    moves_map['misty_terrain'] = 439
    moves_map['moongeist_beam'] = 1382
    opp_moves_map['moongeist_beam'] = 1383

    with open(mam_path, 'w', encoding='utf-8') as f:
        json.dump(mam, f, indent=2, ensure_ascii=False)

    # Update moves-db.json targets for self-moves
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    self_target_moves = [
        'meditate', 'milk_drink', 'minimize', 'mirror_coat',
        'mirror_move', 'mist', 'misty_terrain', 'metronome'
    ]
    for sm in self_target_moves:
        if sm in moves_db.get('moves', {}):
            moves_db['moves'][sm]['target'] = 'user'

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 2 import completed successfully!')

if __name__ == '__main__':
    main()
