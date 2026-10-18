#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 S Group (Batch 1) Battle Animations.
25 moves handled (37 animation definitions: IDs 7070..7106) + 5 Fallbacks & Aliases:
  1. sacred_fire (Target IDs: 7070 PL / 7071 OPP) - Fire Special (PRAS- Fire.png, 40 frames)
  2. sacred_sword (Target IDs: 7072 PL / 7073 OPP) - Fighting Physical (PRAS- Sacred Sword.png, 25 frames)
  3. safeguard (Target ID: 7074) - Normal Status (PRAS- Safeguard.png, 20 frames)
  4. sand_attack & sandattack (Target IDs: 7075 PL / 7076 OPP) - Ground Status (PRAS- Sand Attack.png, 11 frames)
  5. sand_tomb (Target ID: 7077) - Ground Physical (PRAS- Sand Tomb.png, 24 frames)
  6. sandstorm (Target ID: 7078) - Rock Status (PRAS- sandstorm2.png, 24 frames)
  7. scald (Target IDs: 7079 PL / 7080 OPP) - Water Special (PRAS- Scald.png, 20 frames)
  8. scale_shot (Target ID: 7081) - Dragon Physical (GEN8- Scale Shot.png, 21 frames)
  9. scary_face (Target IDs: 7082 PL / 7083 OPP) - Normal Status (PRAS- Scary Face.png, 23 frames)
  10. scorching_sands (Target ID: 7084) - Ground Special (PRAS- Sand Attack.png, 16 frames)
  11. scratch (Target ID: 7085) - Normal Physical (PRAS- Slash.png, 8 frames)
  12. screech (Target IDs: 7086 PL / 7087 OPP) - Normal Status (PRAS- Screech.png, 26/28 frames)
  13. searing_shot (Target ID: 7088) - Fire Special (PRAS- Fire.png, 100 frames)
  14. secret_power (Target ID: 7089) - Normal Physical (PRAS- Strike.png, 1 frame)
  15. secret_sword (Target IDs: 7090 PL / 7091 OPP) - Fighting Special (PRAS- Sacred Sword.png, 30 frames)
  16. seed_bomb (Target IDs: 7092 PL / 7093 OPP) - Grass Physical (PRAS- Seed Bomb.png, 18 frames)
  17. seed_flare (Target ID: 7094) - Grass Special (PRAS- Grass.png, 56 frames)
  18. seismic_toss (Target IDs: 7095 PL / 7096 OPP) - Fighting Physical (PRAS- Seismic Toss.png, 67/66 frames)
  19. self_destruct & selfdestruct (Target ID: 7097) - Normal Physical (PRAS- Explosions.png, 55 frames)
  20. shadow_ball (Target IDs: 7098 PL / 7099 OPP) - Ghost Special (PRAS- Shadow Ball.png, 40 frames)
  21. shadow_bone (Target IDs: 7100 PL / 7101 OPP) - Ghost Physical (PRAS- Shadow Bone.png, 41 frames)
  22. shadow_claw (Target ID: 7102) - Ghost Physical (PRAS- Shadow Claw.png, 12 frames)
  23. shadow_force (Target ID: 7103) - Ghost Physical (PRAS- Strike.png, 15 frames)
  24. shadow_punch (Target ID: 7104) - Ghost Physical (PRAS- Shadow Punch.png, 17 frames)
  25. shadow_sneak (Target IDs: 7105 PL / 7106 OPP) - Ghost Physical (PRAS- Shadow Sneak.png, 33 frames)

Fallbacks:
  - salt_cure -> sand_tomb (7077)
  - sandsear_storm -> scorching_sands (7084)
  - sappy_seed -> seed_bomb (7092 PL / 7093 OPP)
  - savage_spin_out -> bug_buzz (6737)
  - searing_sunraze_smash -> sunsteel_strike (1397)
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

    # Specification for S Group Batch 1 moves:
    s_specs = [
        {'rx_id': 861, 'tgt_id': 7070, 'name': 'Move:SACREDFIRE', 'default_name': 'Sacred Fire', 'move_key': 'sacred_fire', 'is_opp': False},
        {'rx_id': 862, 'tgt_id': 7071, 'name': 'OppMove:SACREDFIRE', 'default_name': 'Sacred Fire (Opp)', 'move_key': 'sacred_fire', 'is_opp': True},
        {'rx_id': 456, 'tgt_id': 7072, 'name': 'Move:SACREDSWORD', 'default_name': 'Sacred Sword', 'move_key': 'sacred_sword', 'is_opp': False},
        {'rx_id': 457, 'tgt_id': 7073, 'name': 'OppMove:SACREDSWORD', 'default_name': 'Sacred Sword (Opp)', 'move_key': 'sacred_sword', 'is_opp': True},
        {'rx_id': 1011, 'tgt_id': 7074, 'name': 'Move:SAFEGUARD', 'default_name': 'Safeguard', 'move_key': 'safeguard', 'is_opp': False},
        {'rx_id': 391, 'tgt_id': 7075, 'name': 'Move:SANDATTACK', 'default_name': 'Sand Attack', 'move_key': 'sand_attack', 'is_opp': False},
        {'rx_id': 392, 'tgt_id': 7076, 'name': 'OppMove:SANDATTACK', 'default_name': 'Sand Attack (Opp)', 'move_key': 'sand_attack', 'is_opp': True},
        {'rx_id': 738, 'tgt_id': 7077, 'name': 'Move:SANDTOMB', 'default_name': 'Sand Tomb', 'move_key': 'sand_tomb', 'is_opp': False},
        {'rx_id': 998, 'tgt_id': 7078, 'name': 'Move:SANDSTORM', 'default_name': 'Sandstorm', 'move_key': 'sandstorm', 'is_opp': False},
        {'rx_id': 612, 'tgt_id': 7079, 'name': 'Move:SCALD', 'default_name': 'Scald', 'move_key': 'scald', 'is_opp': False},
        {'rx_id': 613, 'tgt_id': 7080, 'name': 'OppMove:SCALD', 'default_name': 'Scald (Opp)', 'move_key': 'scald', 'is_opp': True},
        {'rx_id': 1318, 'tgt_id': 7081, 'name': 'Move:SCALESHOT', 'default_name': 'Scale Shot', 'move_key': 'scale_shot', 'is_opp': False},
        {'rx_id': 225, 'tgt_id': 7082, 'name': 'Move:SCARYFACE', 'default_name': 'Scary Face', 'move_key': 'scary_face', 'is_opp': False},
        {'rx_id': 226, 'tgt_id': 7083, 'name': 'OppMove:SCARYFACE', 'default_name': 'Scary Face (Opp)', 'move_key': 'scary_face', 'is_opp': True},
        {'rx_id': 1323, 'tgt_id': 7084, 'name': 'Move:SCORCHINGSANDS', 'default_name': 'Scorching Sands', 'move_key': 'scorching_sands', 'is_opp': False},
        {'rx_id': 325, 'tgt_id': 7085, 'name': 'Move:SCRATCH', 'default_name': 'Scratch', 'move_key': 'scratch', 'is_opp': False},
        {'rx_id': 331, 'tgt_id': 7086, 'name': 'Move:SCREECH', 'default_name': 'Screech', 'move_key': 'screech', 'is_opp': False},
        {'rx_id': 332, 'tgt_id': 7087, 'name': 'OppMove:SCREECH', 'default_name': 'Screech (Opp)', 'move_key': 'screech', 'is_opp': True},
        {'rx_id': 1077, 'tgt_id': 7088, 'name': 'Move:SEARINGSHOT', 'default_name': 'Searing Shot', 'move_key': 'searing_shot', 'is_opp': False},
        {'rx_id': 659, 'tgt_id': 7089, 'name': 'Move:SECRETPOWER', 'default_name': 'Secret Power', 'move_key': 'secret_power', 'is_opp': False},
        {'rx_id': 1042, 'tgt_id': 7090, 'name': 'Move:SECRETSWORD', 'default_name': 'Secret Sword', 'move_key': 'secret_sword', 'is_opp': False},
        {'rx_id': 1043, 'tgt_id': 7091, 'name': 'OppMove:SECRETSWORD', 'default_name': 'Secret Sword (Opp)', 'move_key': 'secret_sword', 'is_opp': True},
        {'rx_id': 482, 'tgt_id': 7092, 'name': 'Move:SEEDBOMB', 'default_name': 'Seed Bomb', 'move_key': 'seed_bomb', 'is_opp': False},
        {'rx_id': 483, 'tgt_id': 7093, 'name': 'OppMove:SEEDBOMB', 'default_name': 'Seed Bomb (Opp)', 'move_key': 'seed_bomb', 'is_opp': True},
        {'rx_id': 878, 'tgt_id': 7094, 'name': 'Move:SEEDFLARE', 'default_name': 'Seed Flare', 'move_key': 'seed_flare', 'is_opp': False},
        {'rx_id': 619, 'tgt_id': 7095, 'name': 'Move:SEISMICTOSS', 'default_name': 'Seismic Toss', 'move_key': 'seismic_toss', 'is_opp': False},
        {'rx_id': 620, 'tgt_id': 7096, 'name': 'OppMove:SEISMICTOSS', 'default_name': 'Seismic Toss (Opp)', 'move_key': 'seismic_toss', 'is_opp': True},
        {'rx_id': 306, 'tgt_id': 7097, 'name': 'Move:SELFDESTRUCT', 'default_name': 'Self-Destruct', 'move_key': 'self_destruct', 'is_opp': False},
        {'rx_id': 104, 'tgt_id': 7098, 'name': 'Move:SHADOWBALL', 'default_name': 'Shadow Ball', 'move_key': 'shadow_ball', 'is_opp': False},
        {'rx_id': 105, 'tgt_id': 7099, 'name': 'OppMove:SHADOWBALL', 'default_name': 'Shadow Ball (Opp)', 'move_key': 'shadow_ball', 'is_opp': True},
        {'rx_id': 1079, 'tgt_id': 7100, 'name': 'Move:SHADOWBONE', 'default_name': 'Shadow Bone', 'move_key': 'shadow_bone', 'is_opp': False},
        {'rx_id': 1080, 'tgt_id': 7101, 'name': 'OppMove:SHADOWBONE', 'default_name': 'Shadow Bone (Opp)', 'move_key': 'shadow_bone', 'is_opp': True},
        {'rx_id': 455, 'tgt_id': 7102, 'name': 'Move:SHADOWCLAW', 'default_name': 'Shadow Claw', 'move_key': 'shadow_claw', 'is_opp': False},
        {'rx_id': 819, 'tgt_id': 7103, 'name': 'Move:SHADOWFORCE', 'default_name': 'Shadow Force', 'move_key': 'shadow_force', 'is_opp': False},
        {'rx_id': 477, 'tgt_id': 7104, 'name': 'Move:SHADOWPUNCH', 'default_name': 'Shadow Punch', 'move_key': 'shadow_punch', 'is_opp': False},
        {'rx_id': 506, 'tgt_id': 7105, 'name': 'Move:SHADOWSNEAK', 'default_name': 'Shadow Sneak', 'move_key': 'shadow_sneak', 'is_opp': False},
        {'rx_id': 507, 'tgt_id': 7106, 'name': 'OppMove:SHADOWSNEAK', 'default_name': 'Shadow Sneak (Opp)', 'move_key': 'shadow_sneak', 'is_opp': True},
    ]

    used_graphics = set()
    used_se_files = set()
    exported_anim_defs = {}

    print(f'[2/6] Parsing and exporting {len(s_specs)} animation definitions...')
    for spec in s_specs:
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
            clean_gfx = graphic
            if not clean_gfx.lower().endswith(('.png', '.jpg', '.bmp')):
                clean_gfx += '.png'
            used_graphics.add(clean_gfx)
            graphic = clean_gfx

        raw_frames = attrs.get('@array') or attrs.get(b'@array', [])
        raw_timings = attrs.get('@timing') or attrs.get(b'@timing', [])

        frames = []
        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for ci, cel_data in enumerate(f):
                    cel = isa.parse_cel(cel_data)
                    if cel is None:
                        continue

                    # Special normalization for shadow_sneak OppMove (rx 507 / tgt 7106):
                    # c2 is the sneaking shadow traveling from Enemy (384) to Player (128).
                    # Switch its focus from 'target' to 'both' so it interpolates between the battlers.
                    if spec['tgt_id'] == 7106 and cel.get('pattern') == 0 and fi <= 16:
                        cel['focus'] = 'both'

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

        anim_doc = {
            'id': tgt_id,
            'name': name,
            'graphic': graphic,
            'frames': frames,
            'timings': timings
        }

        # Save to both animations/ and last-chance/
        tgt_file = os.path.join(anims_out_dir, f'{tgt_id}.json')
        last_chance_file = os.path.join(last_chance_dir, f'{tgt_id}.json')

        with open(tgt_file, 'w', encoding='utf-8') as f:
            json.dump(anim_doc, f, indent=2)
        with open(last_chance_file, 'w', encoding='utf-8') as f:
            json.dump(anim_doc, f, indent=2)

        exported_anim_defs[tgt_id] = anim_doc
        print(f'  [OK] Exported ID {tgt_id} ({name}) - Graphic: {graphic}, Frames: {len(frames)}, Timings: {len(timings)}')

    print(f'[3/6] Syncing {len(used_graphics)} graphics assets and updating animation atlas...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)

    for gfx in used_graphics:
        src_gfx = os.path.join(source_gfx_dir, gfx)
        if not os.path.exists(src_gfx):
            # check without extension or case-insensitive
            found = False
            for cand in os.listdir(source_gfx_dir):
                if cand.lower() == gfx.lower():
                    src_gfx = os.path.join(source_gfx_dir, cand)
                    found = True
                    break
            if not found:
                print(f'  [WARN] Graphic {gfx} not found in source!')
                continue

        dest_web = os.path.join(dest_gfx_dir, gfx)
        dest_loc = os.path.join(local_gfx_dir, gfx)
        if not os.path.exists(dest_web):
            shutil.copy2(src_gfx, dest_web)
        if not os.path.exists(dest_loc):
            shutil.copy2(src_gfx, dest_loc)

        if gfx not in atlas:
            with Image.open(src_gfx) as im:
                w, h = im.size
            atlas[gfx] = {
                'file': gfx,
                'width': w,
                'height': h,
                'cellSize': 192
            }
            print(f'  [ATLAS] Registered {gfx} ({w}x{h})')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2)

    print(f'[4/6] Syncing {len(used_se_files)} sound effect assets...')
    for se_file in used_se_files:
        src_se = os.path.join(source_se_anim_dir, se_file)
        if not os.path.exists(src_se):
            src_se = os.path.join(source_se_dir, se_file)
        if not os.path.exists(src_se):
            base, _ = os.path.splitext(se_file)
            for d in [source_se_anim_dir, source_se_dir]:
                for ext in ['.wav', '.ogg', '.mp3']:
                    cand = os.path.join(d, base + ext)
                    if os.path.exists(cand):
                        src_se = cand
                        se_file = os.path.basename(cand)
                        break
        if os.path.exists(src_se):
            dest_anim = os.path.join(public_se_anim_dir, se_file)
            dest_se = os.path.join(public_se_dir, se_file)
            shutil.copy2(src_se, dest_anim)
            shutil.copy2(src_se, dest_se)
            print(f'  [SE] Synced {se_file}')
        else:
            print(f'  [WARN] Sound effect {se_file} not found!')

    print('[5/6] Updating databases (move-animation-map, moves-db, move-animations-db, extensions, reunion)...')
    # 1. move-animation-map.json
    anim_map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(anim_map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)

    # 2. moves-db.json
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db_full = json.load(f)
    moves_db = moves_db_full['moves']

    # 3. move-animations-db.json
    move_anims_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(move_anims_db_path, 'r', encoding='utf-8') as f:
        move_anims_db = json.load(f)

    # 4. move-animation-extensions.json
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        extensions = json.load(f)

    # 5. reunion-moves.json
    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion_moves = json.load(f)

    # 6. last-chance-animation-manifest.json
    manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    # Move map specs for Batch 1 S moves:
    move_configs = [
        ('sacred_fire', 7070, 7071),
        ('sacred_sword', 7072, 7073),
        ('safeguard', 7074, 7074),
        ('sand_attack', 7075, 7076),
        ('sandattack', 7075, 7076),
        ('sand_tomb', 7077, 7077),
        ('sandstorm', 7078, 7078),
        ('scald', 7079, 7080),
        ('scale_shot', 7081, 7081),
        ('scary_face', 7082, 7083),
        ('scorching_sands', 7084, 7084),
        ('scratch', 7085, 7085),
        ('screech', 7086, 7087),
        ('searing_shot', 7088, 7088),
        ('secret_power', 7089, 7089),
        ('secret_sword', 7090, 7091),
        ('seed_bomb', 7092, 7093),
        ('seed_flare', 7094, 7094),
        ('seismic_toss', 7095, 7096),
        ('self_destruct', 7097, 7097),
        ('selfdestruct', 7097, 7097),
        ('shadow_ball', 7098, 7099),
        ('shadow_bone', 7100, 7101),
        ('shadow_claw', 7102, 7102),
        ('shadow_force', 7103, 7103),
        ('shadow_punch', 7104, 7104),
        ('shadow_sneak', 7105, 7106),
        # Fallbacks:
        ('salt_cure', 7077, 7077),
        ('sandsear_storm', 7084, 7084),
        ('sappy_seed', 7092, 7093),
        ('savage_spin_out', 6737, 6737),
        ('searing_sunraze_smash', 1397, 1397),
    ]

    for move_key, pl_id, opp_id in move_configs:
        anim_map[move_key] = pl_id

        # Update moves_db
        if move_key in moves_db:
            moves_db[move_key]['animationId'] = pl_id

        # Update reunion_moves
        if move_key in reunion_moves:
            reunion_moves[move_key]['animationId'] = pl_id

        # Update extensions
        if pl_id != opp_id:
            extensions[move_key] = {
                'animationId': pl_id,
                'enemyAnimationId': opp_id
            }
        else:
            extensions[move_key] = {
                'animationId': pl_id
            }

        # Register in move_anims_db
        if str(pl_id) in exported_anim_defs:
            move_anims_db[str(pl_id)] = exported_anim_defs[str(pl_id)]
        if pl_id != opp_id and str(opp_id) in exported_anim_defs:
            move_anims_db[str(opp_id)] = exported_anim_defs[str(opp_id)]

        # Register in manifest
        for aid in [pl_id, opp_id]:
            if aid in exported_anim_defs and str(aid) not in manifest.get('animations', {}):
                manifest.setdefault('animations', {})[str(aid)] = {
                    'name': exported_anim_defs[aid]['name'],
                    'file': f'{aid}.json'
                }

    with open(anim_map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2)
    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db_full, f, indent=2)
    with open(move_anims_db_path, 'w', encoding='utf-8') as f:
        json.dump(move_anims_db, f, indent=2)
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(extensions, f, indent=2)
    with open(reunion_path, 'w', encoding='utf-8') as f:
        json.dump(reunion_moves, f, indent=2)
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print('[6/6] S Group Batch 1 import completed successfully!')

if __name__ == '__main__':
    main()
