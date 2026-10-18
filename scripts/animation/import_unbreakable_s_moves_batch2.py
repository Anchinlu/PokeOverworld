#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 S Group (Batch 2) Battle Animations.
32 moves handled (47 animation definitions: IDs 7107..7153) + 4 Fallbacks & Aliases:
  1. sharpen (Target ID: 7107) - Normal Status (PRAS- Sharpen.png, 15 frames)
  2. shattered_psyche (ID: 7011) - Psychic Z-Move (Already exported)
  3. sheer_cold (Target ID: 7108) - Ice Special OHKO (PRAS- Sheer Cold.png, 30 frames)
  4. shell_side_arm (Target ID: 7109) - Poison Special (PRAS- Sludge.png, 16 frames)
  5. shell_smash (Target ID: 7110) - Normal Status (PRAS- Status.png, 25 frames)
  6. shell_trap (Target IDs: 7111 PL / 7112 OPP) - Fire Special (PRAS- Shell Trap.png, 70 frames)
  7. shift_gear (Target ID: 7113) - Steel Status (PRAS- Shift Gear.png, 24 frames)
  8. shock_wave (Target IDs: 7114 PL / 7115 OPP) - Electric Special (PRAS- Shock Wave.png, 32 frames)
  9. shore_up (Target ID: 7116) - Ground Status (PRAS- Shore Up.png, 25 frames)
  10. signal_beam (Target IDs: 7117 PL / 7118 OPP) - Bug Special (PRAS- Signal Beam.png, 25 frames)
  11. silver_wind (Target ID: 7119) - Bug Special (PRAS- Silver Wind.png, 17 frames)
  12. simple_beam (Target IDs: 7120 PL / 7121 OPP) - Normal Status (PRAS- Simple Beam.png, 25 frames)
  13. sing (Target IDs: 7122 PL / 7123 OPP) - Normal Status (PRAS- Sound.png, 21 frames)
  14. sinister_arrow_raid (Target IDs: 7124 PL / 7125 OPP) - Ghost Physical Z-Move (PRAS- Sinister Arrow Raid.png, 40 frames)
  15. sketch (Target IDs: 7126 PL / 7127 OPP) - Normal Status (PRAS- Sketch.png, 48 frames)
  16. skill_swap (Target ID: 7128) - Psychic Status (PRAS- Swap.png, 30 frames)
  17. skitter_smack (Target IDs: 7129 PL / 7130 OPP) - Bug Physical (PRAS- Bug.png, 36 frames)
  18. skull_bash (Target ID: 7131) - Normal Physical (PRAS- Strike.png, 26 frames)
  19. sky_attack (Target IDs: 7132 PL / 7133 OPP) - Flying Physical (PRAS- Flying.png, 32 frames)
  20. sky_drop (Target ID: 7134) - Flying Physical (PRAS- Flying.png, 25 frames)
  21. sky_uppercut (Target ID: 7135) - Fighting Physical (PRAS- Strike.png, 15 frames)
  22. slack_off (Target IDs: 7136 PL / 7137 OPP) - Normal Status (PRAS- Slack Off.png, 19 frames)
  23. slam (Target IDs: 7138 PL / 7139 OPP) - Normal Physical (PRAS- Strike.png, 14 frames)
  24. slash (Target ID: 7140) - Normal Physical (PRAS- Slash.png, 8 frames)
  25. sleep_powder & sleeppowder (Target ID: 7141) - Grass Status (PRAS- Spore.png, 20 frames)
  26. sleep_talk (Target ID: 7142) - Normal Status (PRAS- Sleep Talk.png, 20 frames)
  27. sludge (Target IDs: 7143 PL / 7144 OPP) - Poison Special (PRAS- Sludge.png, 22 frames)
  28. sludge_bomb (Target IDs: 7145 PL / 7146 OPP) - Poison Special (PRAS- Sludge Bomb.png, 30 frames)
  29. sludge_wave (Target IDs: 7147 PL / 7148 OPP) - Poison Special (PRAS- Sludge.png, 50 frames)
  30. smack_down (Target IDs: 7149 PL / 7150 OPP) - Rock Physical (PRAS- Rock.png, 22 frames)
  31. smart_strike (Target IDs: 7151 PL / 7152 OPP) - Steel Physical (PRAS- Steel.png, 20 frames)
  32. smelling_salts & smellingsalts (Target ID: 7153) - Normal Physical (PRAS- Strike.png, 14 frames)

Fallbacks:
  - shed_tail -> substitute (497 PL / 498 OPP)
  - shelter -> iron_defense (6868)
  - silk_trap -> spiky_shield (906)
  - sizzly_slide -> flame_charge (6840)
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

    # Specification for S Group Batch 2 moves:
    s_specs = [
        {'rx_id': 957, 'tgt_id': 7107, 'name': 'Move:SHARPEN', 'default_name': 'Sharpen', 'move_key': 'sharpen', 'is_opp': False},
        {'rx_id': 871, 'tgt_id': 7108, 'name': 'Move:SHEERCOLD', 'default_name': 'Sheer Cold', 'move_key': 'sheer_cold', 'is_opp': False},
        {'rx_id': 1324, 'tgt_id': 7109, 'name': 'Move:SHELLSIDEARM', 'default_name': 'Shell Side Arm', 'move_key': 'shell_side_arm', 'is_opp': False},
        {'rx_id': 915, 'tgt_id': 7110, 'name': 'Move:SHELLSMASH', 'default_name': 'Shell Smash', 'move_key': 'shell_smash', 'is_opp': False},
        {'rx_id': 1087, 'tgt_id': 7111, 'name': 'Move:SHELLTRAP', 'default_name': 'Shell Trap', 'move_key': 'shell_trap', 'is_opp': False},
        {'rx_id': 1088, 'tgt_id': 7112, 'name': 'OppMove:SHELLTRAP', 'default_name': 'Shell Trap (Opp)', 'move_key': 'shell_trap', 'is_opp': True},
        {'rx_id': 923, 'tgt_id': 7113, 'name': 'Move:SHIFTGEAR', 'default_name': 'Shift Gear', 'move_key': 'shift_gear', 'is_opp': False},
        {'rx_id': 522, 'tgt_id': 7114, 'name': 'Move:SHOCKWAVE', 'default_name': 'Shock Wave', 'move_key': 'shock_wave', 'is_opp': False},
        {'rx_id': 523, 'tgt_id': 7115, 'name': 'OppMove:SHOCKWAVE', 'default_name': 'Shock Wave (Opp)', 'move_key': 'shock_wave', 'is_opp': True},
        {'rx_id': 990, 'tgt_id': 7116, 'name': 'Move:SHOREUP', 'default_name': 'Shore Up', 'move_key': 'shore_up', 'is_opp': False},
        {'rx_id': 146, 'tgt_id': 7117, 'name': 'Move:SIGNALBEAM', 'default_name': 'Signal Beam', 'move_key': 'signal_beam', 'is_opp': False},
        {'rx_id': 147, 'tgt_id': 7118, 'name': 'OppMove:SIGNALBEAM', 'default_name': 'Signal Beam (Opp)', 'move_key': 'signal_beam', 'is_opp': True},
        {'rx_id': 260, 'tgt_id': 7119, 'name': 'Move:SILVERWIND', 'default_name': 'Silver Wind', 'move_key': 'silver_wind', 'is_opp': False},
        {'rx_id': 795, 'tgt_id': 7120, 'name': 'Move:SIMPLEBEAM', 'default_name': 'Simple Beam', 'move_key': 'simple_beam', 'is_opp': False},
        {'rx_id': 796, 'tgt_id': 7121, 'name': 'OppMove:SIMPLEBEAM', 'default_name': 'Simple Beam (Opp)', 'move_key': 'simple_beam', 'is_opp': True},
        {'rx_id': 176, 'tgt_id': 7122, 'name': 'Move:SING', 'default_name': 'Sing', 'move_key': 'sing', 'is_opp': False},
        {'rx_id': 177, 'tgt_id': 7123, 'name': 'OppMove:SING', 'default_name': 'Sing (Opp)', 'move_key': 'sing', 'is_opp': True},
        {'rx_id': 1218, 'tgt_id': 7124, 'name': 'Move:SINISTERARROWRAID', 'default_name': 'Sinister Arrow Raid', 'move_key': 'sinister_arrow_raid', 'is_opp': False},
        {'rx_id': 1219, 'tgt_id': 7125, 'name': 'OppMove:SINISTERARROWRAID', 'default_name': 'Sinister Arrow Raid (Opp)', 'move_key': 'sinister_arrow_raid', 'is_opp': True},
        {'rx_id': 148, 'tgt_id': 7126, 'name': 'Move:SKETCH', 'default_name': 'Sketch', 'move_key': 'sketch', 'is_opp': False},
        {'rx_id': 149, 'tgt_id': 7127, 'name': 'OppMove:SKETCH', 'default_name': 'Sketch (Opp)', 'move_key': 'sketch', 'is_opp': True},
        {'rx_id': 828, 'tgt_id': 7128, 'name': 'Move:SKILLSWAP', 'default_name': 'Skill Swap', 'move_key': 'skill_swap', 'is_opp': False},
        {'rx_id': 1326, 'tgt_id': 7129, 'name': 'Move:SKITTERSMACK', 'default_name': 'Skitter Smack', 'move_key': 'skitter_smack', 'is_opp': False},
        {'rx_id': 1327, 'tgt_id': 7130, 'name': 'OppMove:SKITTERSMACK', 'default_name': 'Skitter Smack (Opp)', 'move_key': 'skitter_smack', 'is_opp': True},
        {'rx_id': 813, 'tgt_id': 7131, 'name': 'Move:SKULLBASH', 'default_name': 'Skull Bash', 'move_key': 'skull_bash', 'is_opp': False},
        {'rx_id': 965, 'tgt_id': 7132, 'name': 'Move:SKYATTACK', 'default_name': 'Sky Attack', 'move_key': 'sky_attack', 'is_opp': False},
        {'rx_id': 967, 'tgt_id': 7133, 'name': 'OppMove:SKYATTACK', 'default_name': 'Sky Attack (Opp)', 'move_key': 'sky_attack', 'is_opp': True},
        {'rx_id': 939, 'tgt_id': 7134, 'name': 'Move:SKYDROP', 'default_name': 'Sky Drop', 'move_key': 'sky_drop', 'is_opp': False},
        {'rx_id': 723, 'tgt_id': 7135, 'name': 'Move:SKYUPPERCUT', 'default_name': 'Sky Uppercut', 'move_key': 'sky_uppercut', 'is_opp': False},
        {'rx_id': 680, 'tgt_id': 7136, 'name': 'Move:SLACKOFF', 'default_name': 'Slack Off', 'move_key': 'slack_off', 'is_opp': False},
        {'rx_id': 681, 'tgt_id': 7137, 'name': 'OppMove:SLACKOFF', 'default_name': 'Slack Off (Opp)', 'move_key': 'slack_off', 'is_opp': True},
        {'rx_id': 267, 'tgt_id': 7138, 'name': 'Move:SLAM', 'default_name': 'Slam', 'move_key': 'slam', 'is_opp': False},
        {'rx_id': 268, 'tgt_id': 7139, 'name': 'OppMove:SLAM', 'default_name': 'Slam (Opp)', 'move_key': 'slam', 'is_opp': True},
        {'rx_id': 300, 'tgt_id': 7140, 'name': 'Move:SLASH', 'default_name': 'Slash', 'move_key': 'slash', 'is_opp': False},
        {'rx_id': 277, 'tgt_id': 7141, 'name': 'Move:SLEEPPOWDER', 'default_name': 'Sleep Powder', 'move_key': 'sleep_powder', 'is_opp': False},
        {'rx_id': 969, 'tgt_id': 7142, 'name': 'Move:SLEEPTALK', 'default_name': 'Sleep Talk', 'move_key': 'sleep_talk', 'is_opp': False},
        {'rx_id': 307, 'tgt_id': 7143, 'name': 'Move:SLUDGE', 'default_name': 'Sludge', 'move_key': 'sludge', 'is_opp': False},
        {'rx_id': 308, 'tgt_id': 7144, 'name': 'OppMove:SLUDGE', 'default_name': 'Sludge (Opp)', 'move_key': 'sludge', 'is_opp': True},
        {'rx_id': 192, 'tgt_id': 7145, 'name': 'Move:SLUDGEBOMB', 'default_name': 'Sludge Bomb', 'move_key': 'sludge_bomb', 'is_opp': False},
        {'rx_id': 193, 'tgt_id': 7146, 'name': 'OppMove:SLUDGEBOMB', 'default_name': 'Sludge Bomb (Opp)', 'move_key': 'sludge_bomb', 'is_opp': True},
        {'rx_id': 707, 'tgt_id': 7147, 'name': 'Move:SLUDGEWAVE', 'default_name': 'Sludge Wave', 'move_key': 'sludge_wave', 'is_opp': False},
        {'rx_id': 708, 'tgt_id': 7148, 'name': 'OppMove:SLUDGEWAVE', 'default_name': 'Sludge Wave (Opp)', 'move_key': 'sludge_wave', 'is_opp': True},
        {'rx_id': 526, 'tgt_id': 7149, 'name': 'Move:SMACKDOWN', 'default_name': 'Smack Down', 'move_key': 'smack_down', 'is_opp': False},
        {'rx_id': 527, 'tgt_id': 7150, 'name': 'OppMove:SMACKDOWN', 'default_name': 'Smack Down (Opp)', 'move_key': 'smack_down', 'is_opp': True},
        {'rx_id': 985, 'tgt_id': 7151, 'name': 'Move:SMARTSTRIKE', 'default_name': 'Smart Strike', 'move_key': 'smart_strike', 'is_opp': False},
        {'rx_id': 986, 'tgt_id': 7152, 'name': 'OppMove:SMARTSTRIKE', 'default_name': 'Smart Strike (Opp)', 'move_key': 'smart_strike', 'is_opp': True},
        {'rx_id': 857, 'tgt_id': 7153, 'name': 'Move:SMELLINGSALTS', 'default_name': 'Smelling Salts', 'move_key': 'smelling_salts', 'is_opp': False},
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
    anim_map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(anim_map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)

    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db_full = json.load(f)
    moves_db = moves_db_full['moves']

    move_anims_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(move_anims_db_path, 'r', encoding='utf-8') as f:
        move_anims_db = json.load(f)

    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        extensions = json.load(f)

    reunion_path = os.path.join(game_data_dir, 'reunion-moves.json')
    with open(reunion_path, 'r', encoding='utf-8') as f:
        reunion_moves = json.load(f)

    manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    # Move map specs for Batch 2 S moves:
    move_configs = [
        ('sharpen', 7107, 7107),
        ('shattered_psyche', 7011, 7011),
        ('sheer_cold', 7108, 7108),
        ('shell_side_arm', 7109, 7109),
        ('shell_smash', 7110, 7110),
        ('shell_trap', 7111, 7112),
        ('shift_gear', 7113, 7113),
        ('shock_wave', 7114, 7115),
        ('shore_up', 7116, 7116),
        ('signal_beam', 7117, 7118),
        ('silver_wind', 7119, 7119),
        ('simple_beam', 7120, 7121),
        ('sing', 7122, 7123),
        ('sinister_arrow_raid', 7124, 7125),
        ('sketch', 7126, 7127),
        ('skill_swap', 7128, 7128),
        ('skitter_smack', 7129, 7130),
        ('skull_bash', 7131, 7131),
        ('sky_attack', 7132, 7133),
        ('sky_drop', 7134, 7134),
        ('sky_uppercut', 7135, 7135),
        ('slack_off', 7136, 7137),
        ('slam', 7138, 7139),
        ('slash', 7140, 7140),
        ('sleep_powder', 7141, 7141),
        ('sleeppowder', 7141, 7141),
        ('sleep_talk', 7142, 7142),
        ('sludge', 7143, 7144),
        ('sludge_bomb', 7145, 7146),
        ('sludge_wave', 7147, 7148),
        ('smack_down', 7149, 7150),
        ('smart_strike', 7151, 7152),
        ('smelling_salts', 7153, 7153),
        ('smellingsalts', 7153, 7153),
        # Fallbacks:
        ('shed_tail', 497, 498),
        ('shelter', 6868, 6868),
        ('silk_trap', 906, 906),
        ('sizzly_slide', 6840, 6840),
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

    print('[6/6] S Group Batch 2 import completed successfully!')

if __name__ == '__main__':
    main()
