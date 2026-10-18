#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 M Group Battle Animations - Batch 3 (Final Batch: 15 moves).
Moves handled:
  1. moonlight (Safe ID: 6903) - Fairy Status (PRAS- Moonlight.png, 25 frames, target: 'user')
  2. morning_sun (Safe ID: 6904) - Normal Status (PRAS- Recovery.png, 20 frames, target: 'user')
  3. mortal_spin - Gen 9 Glimmora signature Poison Physical (Fallback to rapid_spin 493)
  4. mountain_gale - Gen 8/9 Legends Arceus Hisuian Avalugg Ice Physical (Fallback to icicle_crash 163)
  5. mud_bomb (672 PL / 673 OPP) - Ground Special (PRAS- Mud Bomb.png, 21 frames)
  6. mud_shot (714 PL / 715 OPP) - Ground Special (PRAS- Mud Shot.png, 30 frames)
  7. mud_sport (682) - Ground Status (PRAS- Mud Sport.png, 25 frames, target: 'user')
  8. mud_slap (735) - Ground Special (PRAS- Mud Slap.png, 18 frames)
  9. mudslap - Alias of mud_slap (735)
  10. muddy_water (793 PL / 794 OPP) - Water Special (50 frames)
  11. multi_attack (1133 PL / 1134 OPP) - Normal Physical (PRAS- Multi Attack.png, 65 frames)
  12. mystical_fire (478 PL / 479 OPP) - Fire Special (PRAS- Mystical Fire.png, 32 frames)
  13. mystical_power - Gen 8/9 Legends Arceus Psychic Special (Fallback to psychic 220)
  + moonblast (425 PL / 426 OPP) - Already exported in Batch 1
  + moongeist_beam (1382 PL / 1383 OPP) - Already exported in Batch 2
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

    # Specification for Batch 3:
    # (move_key, rxdata_player_id, rxdata_opp_id, target_player_id, target_opp_id, skip_export)
    batch3_specs = [
        ('moonlight', 174, None, 6903, None, False),   # Safe ID 6903 (preserving KINESIS 174)
        ('morning_sun', 164, None, 6904, None, False), # Safe ID 6904 (preserving ICICLESPEAR 164)
        ('mortal_spin', None, None, None, None, True), # Fallback to rapid_spin 493
        ('mountain_gale', None, None, None, None, True), # Fallback to icicle_crash 163
        ('mud_bomb', 672, 673, 672, 673, False),
        ('mud_shot', 714, 715, 714, 715, False),
        ('mud_sport', 682, None, 682, None, False),
        ('mud_slap', 735, None, 735, None, False),
        ('mudslap', None, None, None, None, True),     # Alias of mud_slap 735
        ('muddy_water', 793, 794, 793, 794, False),
        ('multi_attack', 1133, 1134, 1133, 1134, False),
        ('mystical_fire', 478, 479, 478, 479, False),
        ('mystical_power', None, None, None, None, True), # Fallback to psychic 220
    ]

    export_queue = []
    for spec in batch3_specs:
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
                        elif graphic == 'PRAS- Moonlight.png' and cel.get('pattern', -1) > 0:
                            cel['pattern'] = 0
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
        'PRAS- Multi Attack.png': {
            'assetKey': 'animation.pras-multi-attack',
            'file': 'PRAS- Multi Attack.png',
            'width': 960,
            'height': 576,
            'cellWidth': 192,
            'cellHeight': 192,
            'columns': 5,
            'rows': 3,
            'maxPattern': 15
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

    # Map imported moves for Batch 3
    moves_map['moonlight'] = 6903
    moves_map['morning_sun'] = 6904
    moves_map['mortal_spin'] = 215 # poison_tail
    moves_map['mountain_gale'] = 163 # icicle_crash
    moves_map['mud_bomb'] = 672
    opp_moves_map['mud_bomb'] = 673
    moves_map['mud_shot'] = 714
    opp_moves_map['mud_shot'] = 715
    moves_map['mud_sport'] = 682
    moves_map['mud_slap'] = 735
    moves_map['mudslap'] = 735
    moves_map['muddy_water'] = 793
    opp_moves_map['muddy_water'] = 794
    moves_map['multi_attack'] = 1133
    opp_moves_map['multi_attack'] = 1134
    moves_map['mystical_fire'] = 478
    opp_moves_map['mystical_fire'] = 479
    moves_map['mystical_power'] = 220 # psychic

    with open(mam_path, 'w', encoding='utf-8') as f:
        json.dump(mam, f, indent=2, ensure_ascii=False)

    # Update moves-db.json targets for self-moves
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)

    self_target_moves = ['moonlight', 'morning_sun', 'mud_sport']
    for sm in self_target_moves:
        if sm in moves_db.get('moves', {}):
            moves_db['moves'][sm]['target'] = 'user'

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2, ensure_ascii=False)

    print('[6/6] Batch 3 import completed successfully!')

if __name__ == '__main__':
    main()
