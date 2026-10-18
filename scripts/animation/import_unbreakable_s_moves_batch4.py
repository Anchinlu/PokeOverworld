#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 S Group (Batch 4 - Final S Batch) Battle Animations.
36 moves handled (46 animation definitions: IDs 7201..7246) + 4 Fallbacks & 1 Alias:
  1. sticky_web (Target IDs: 7201 PL / 7202 OPP) - Bug Status (PRAS- Sticky Web.png, 35 frames)
  2. stockpile (Target ID: 7203) - Normal Status (PRAS- Stockpile.png, 28 frames)
  3. stomp (Target ID: 7204) - Normal Physical (PRAS- Normal.png, 15 frames)
  4. stomping_tantrum (Target ID: 7205) - Ground Physical (PRAS- Stomping Tantrum.png, 30 frames)
  5. stone_edge (Target ID: 7206) - Rock Physical (PRAS- Stone Edge.png, 40 frames)
  6. stored_power (Target ID: 7207) - Psychic Special (PRAS- Psychic.png, 40 frames)
  7. storm_throw (Target ID: 7208) - Fighting Physical (PRAS- Fighting.png, 20 frames)
  8. strange_steam (Target ID: 7209) - Fairy Special (PRAS- Fairy.png, 25 frames)
  9. strength (Target ID: 7210) - Normal Physical (PRAS- Normal.png, 24 frames)
  10. strength_sap (Target IDs: 7211 PL / 7212 OPP) - Grass Status (PRAS- Absorption2.png, 55 frames)
  11. string_shot (Target ID: 7213) - Bug Status (PRAS- String Shot.png, 16 frames)
  12. struggle (Target ID: 7214) - Normal Physical (PRAS- Normal.png, 15 frames)
  13. struggle_bug (Target ID: 7215) - Bug Special (PRAS- Bug.png, 16 frames)
  14. stuff_cheeks (Target IDs: 7216 PL / 7217 OPP) - Normal Status (GEN8- Eat Berry.png, 40 frames)
  15. stun_spore & stunspore (Target ID: 7218) - Grass Status (PRAS- Spore.png, 24 frames)
  16. submission (Target ID: 7219) - Fighting Physical (PRAS- Fighting.png, 20 frames)
  17. substitute (Target IDs: 7220 PL / 7221 OPP) - Normal Status (PRAS- Substitute.png, 22 frames)
  18. subzero_slammer (Target ID: 7222) - Ice Special (PRAS- Ice.png, 80 frames)
  19. sucker_punch (Target ID: 7223) - Dark Physical (PRAS- Dark.png, 16 frames)
  20. sunny_day (Target ID: 7224) - Fire Status (PRAS- SunnyDay.png, 30 frames)
  21. sunsteel_strike (Target ID: 7225) - Steel Physical (GEN8- Sunsteel Strike.png, 60 frames)
  22. super_fang (Target ID: 7226) - Normal Physical (PRAS- Normal.png, 20 frames)
  23. superpower (Target ID: 7227) - Fighting Physical (PRAS- Fighting.png, 30 frames)
  24. supersonic (Target IDs: 7228 PL / 7229 OPP) - Normal Status (PRAS- Supersonic.png, 26/28 frames)
  25. supersonic_skystrike (Target ID: 7230) - Flying Physical (PRAS- Flying.png, 60 frames)
  26. surf (Target IDs: 7231 PL / 7232 OPP) - Water Special (Battler motion/sound, 43 frames)
  27. surging_strikes (Target ID: 7233) - Water Physical (GEN8- Surging Strikes.png, 25 frames)
  28. swagger (Target IDs: 7234 PL / 7235 OPP) - Normal Status (PRAS- Swagger.png, 40 frames)
  29. swallow (Target IDs: 7236 PL / 7237 OPP) - Normal Status (PRAS- Swap.png, 23 frames)
  30. sweet_kiss (Target ID: 7238) - Fairy Status (PRAS- Heart.png, 25 frames)
  31. sweet_scent (Target ID: 7239) - Normal Status (PRAS- Sweet Scent.png, 30 frames)
  32. swift (Target IDs: 7240 PL / 7241 OPP) - Normal Special (PRAS- Swift.png, 24 frames)
  33. switcheroo (Target IDs: 7242 PL / 7243 OPP) - Dark Status (PRAS- Strike.png, 15 frames)
  34. swords_dance (Target ID: 7244) - Normal Status (PRAS- Normal.png, 25 frames)
  35. synchronoise (Target ID: 7245) - Psychic Special (PRAS- Sound.png, 30 frames)
  36. synthesis (Target ID: 7246) - Grass Status (PRAS- Grass.png, 30 frames)

Fallbacks:
  - stoked_sparksurfer -> thunderbolt (100)
  - stone_axe -> stone_edge (7206)
  - supercell_slam -> rising_voltage (7043)
  - syrup_bomb -> apple_acid (1241 PL / 1242 OPP)
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

    # Specification for S Group Batch 4 moves:
    s_specs = [
        {'rx_id': 974, 'tgt_id': 7201, 'name': 'Move:STICKYWEB', 'default_name': 'Sticky Web', 'move_key': 'sticky_web', 'is_opp': False},
        {'rx_id': 975, 'tgt_id': 7202, 'name': 'OppMove:STICKYWEB', 'default_name': 'Sticky Web (Opp)', 'move_key': 'sticky_web', 'is_opp': True},
        {'rx_id': 872, 'tgt_id': 7203, 'name': 'Move:STOCKPILE', 'default_name': 'Stockpile', 'move_key': 'stockpile', 'is_opp': False},
        {'rx_id': 189, 'tgt_id': 7204, 'name': 'Move:STOMP', 'default_name': 'Stomp', 'move_key': 'stomp', 'is_opp': False},
        {'rx_id': 989, 'tgt_id': 7205, 'name': 'Move:STOMPINGTANTRUM', 'default_name': 'Stomping Tantrum', 'move_key': 'stomping_tantrum', 'is_opp': False},
        {'rx_id': 718, 'tgt_id': 7206, 'name': 'Move:STONEEDGE', 'default_name': 'Stone Edge', 'move_key': 'stone_edge', 'is_opp': False},
        {'rx_id': 571, 'tgt_id': 7207, 'name': 'Move:STOREDPOWER', 'default_name': 'Stored Power', 'move_key': 'stored_power', 'is_opp': False},
        {'rx_id': 782, 'tgt_id': 7208, 'name': 'Move:STORMTHROW', 'default_name': 'Storm Throw', 'move_key': 'storm_throw', 'is_opp': False},
        {'rx_id': 1294, 'tgt_id': 7209, 'name': 'Move:STRANGESTEAM', 'default_name': 'Strange Steam', 'move_key': 'strange_steam', 'is_opp': False},
        {'rx_id': 676, 'tgt_id': 7210, 'name': 'Move:STRENGTH', 'default_name': 'Strength', 'move_key': 'strength', 'is_opp': False},
        {'rx_id': 904, 'tgt_id': 7211, 'name': 'Move:STRENGTHSAP', 'default_name': 'Strength Sap', 'move_key': 'strength_sap', 'is_opp': False},
        {'rx_id': 905, 'tgt_id': 7212, 'name': 'OppMove:STRENGTHSAP', 'default_name': 'Strength Sap (Opp)', 'move_key': 'strength_sap', 'is_opp': True},
        {'rx_id': 329, 'tgt_id': 7213, 'name': 'Move:STRINGSHOT', 'default_name': 'String Shot', 'move_key': 'string_shot', 'is_opp': False},
        {'rx_id': 247, 'tgt_id': 7214, 'name': 'Move:STRUGGLE', 'default_name': 'Struggle', 'move_key': 'struggle', 'is_opp': False},
        {'rx_id': 709, 'tgt_id': 7215, 'name': 'Move:STRUGGLEBUG', 'default_name': 'Struggle Bug', 'move_key': 'struggle_bug', 'is_opp': False},
        {'rx_id': 1295, 'tgt_id': 7216, 'name': 'Move:STUFFCHEEKS', 'default_name': 'Stuff Cheeks', 'move_key': 'stuff_cheeks', 'is_opp': False},
        {'rx_id': 1296, 'tgt_id': 7217, 'name': 'OppMove:STUFFCHEEKS', 'default_name': 'Stuff Cheeks (Opp)', 'move_key': 'stuff_cheeks', 'is_opp': True},
        {'rx_id': 276, 'tgt_id': 7218, 'name': 'Move:STUNSPORE', 'default_name': 'Stun Spore', 'move_key': 'stun_spore', 'is_opp': False},
        {'rx_id': 601, 'tgt_id': 7219, 'name': 'Move:SUBMISSION', 'default_name': 'Submission', 'move_key': 'submission', 'is_opp': False},
        {'rx_id': 497, 'tgt_id': 7220, 'name': 'Move:SUBSTITUTE', 'default_name': 'Substitute', 'move_key': 'substitute', 'is_opp': False},
        {'rx_id': 498, 'tgt_id': 7221, 'name': 'OppMove:SUBSTITUTE', 'default_name': 'Substitute (Opp)', 'move_key': 'substitute', 'is_opp': True},
        {'rx_id': 1198, 'tgt_id': 7222, 'name': 'Move:SUBZEROSLAMMER', 'default_name': 'Subzero Slammer', 'move_key': 'subzero_slammer', 'is_opp': False},
        {'rx_id': 684, 'tgt_id': 7223, 'name': 'Move:SUCKERPUNCH', 'default_name': 'Sucker Punch', 'move_key': 'sucker_punch', 'is_opp': False},
        {'rx_id': 343, 'tgt_id': 7224, 'name': 'Move:SUNNYDAY', 'default_name': 'Sunny Day', 'move_key': 'sunny_day', 'is_opp': False},
        {'rx_id': 1397, 'tgt_id': 7225, 'name': 'Move:SUNSTEELSTRIKE', 'default_name': 'Sunsteel Strike', 'move_key': 'sunsteel_strike', 'is_opp': False},
        {'rx_id': 863, 'tgt_id': 7226, 'name': 'Move:SUPERFANG', 'default_name': 'Super Fang', 'move_key': 'super_fang', 'is_opp': False},
        {'rx_id': 587, 'tgt_id': 7227, 'name': 'Move:SUPERPOWER', 'default_name': 'Superpower', 'move_key': 'superpower', 'is_opp': False},
        {'rx_id': 253, 'tgt_id': 7228, 'name': 'Move:SUPERSONIC', 'default_name': 'Supersonic', 'move_key': 'supersonic', 'is_opp': False},
        {'rx_id': 254, 'tgt_id': 7229, 'name': 'OppMove:SUPERSONIC', 'default_name': 'Supersonic (Opp)', 'move_key': 'supersonic', 'is_opp': True},
        {'rx_id': 1400, 'tgt_id': 7230, 'name': 'Move:SUPERSONICSKYSTRIKE', 'default_name': 'Supersonic Skystrike', 'move_key': 'supersonic_skystrike', 'is_opp': False},
        {'rx_id': 473, 'tgt_id': 7231, 'name': 'Move:SURF', 'default_name': 'Surf', 'move_key': 'surf', 'is_opp': False},
        {'rx_id': 474, 'tgt_id': 7232, 'name': 'OppMove:SURF', 'default_name': 'Surf (Opp)', 'move_key': 'surf', 'is_opp': True},
        {'rx_id': 1329, 'tgt_id': 7233, 'name': 'Move:SURGINGSTRIKES', 'default_name': 'Surging Strikes', 'move_key': 'surging_strikes', 'is_opp': False},
        {'rx_id': 150, 'tgt_id': 7234, 'name': 'Move:SWAGGER', 'default_name': 'Swagger', 'move_key': 'swagger', 'is_opp': False},
        {'rx_id': 151, 'tgt_id': 7235, 'name': 'OppMove:SWAGGER', 'default_name': 'Swagger (Opp)', 'move_key': 'swagger', 'is_opp': True},
        {'rx_id': 961, 'tgt_id': 7236, 'name': 'Move:SWALLOW', 'default_name': 'Swallow', 'move_key': 'swallow', 'is_opp': False},
        {'rx_id': 962, 'tgt_id': 7237, 'name': 'OppMove:SWALLOW', 'default_name': 'Swallow (Opp)', 'move_key': 'swallow', 'is_opp': True},
        {'rx_id': 409, 'tgt_id': 7238, 'name': 'Move:SWEETKISS', 'default_name': 'Sweet Kiss', 'move_key': 'sweet_kiss', 'is_opp': False},
        {'rx_id': 887, 'tgt_id': 7239, 'name': 'Move:SWEETSCENT', 'default_name': 'Sweet Scent', 'move_key': 'sweet_scent', 'is_opp': False},
        {'rx_id': 326, 'tgt_id': 7240, 'name': 'Move:SWIFT', 'default_name': 'Swift', 'move_key': 'swift', 'is_opp': False},
        {'rx_id': 327, 'tgt_id': 7241, 'name': 'OppMove:SWIFT', 'default_name': 'Swift (Opp)', 'move_key': 'swift', 'is_opp': True},
        {'rx_id': 864, 'tgt_id': 7242, 'name': 'Move:SWITCHEROO', 'default_name': 'Switcheroo', 'move_key': 'switcheroo', 'is_opp': False},
        {'rx_id': 865, 'tgt_id': 7243, 'name': 'OppMove:SWITCHEROO', 'default_name': 'Switcheroo (Opp)', 'move_key': 'switcheroo', 'is_opp': True},
        {'rx_id': 186, 'tgt_id': 7244, 'name': 'Move:SWORDSDANCE', 'default_name': 'Swords Dance', 'move_key': 'swords_dance', 'is_opp': False},
        {'rx_id': 1012, 'tgt_id': 7245, 'name': 'Move:SYNCHRONOISE', 'default_name': 'Synchronoise', 'move_key': 'synchronoise', 'is_opp': False},
        {'rx_id': 687, 'tgt_id': 7246, 'name': 'Move:SYNTHESIS', 'default_name': 'Synthesis', 'move_key': 'synthesis', 'is_opp': False},
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

    # Move map specs for Batch 4 S moves:
    move_configs = [
        ('sticky_web', 7201, 7202),
        ('stockpile', 7203, 7203),
        ('stomp', 7204, 7204),
        ('stomping_tantrum', 7205, 7205),
        ('stone_edge', 7206, 7206),
        ('stored_power', 7207, 7207),
        ('storm_throw', 7208, 7208),
        ('strange_steam', 7209, 7209),
        ('strength', 7210, 7210),
        ('strength_sap', 7211, 7212),
        ('string_shot', 7213, 7213),
        ('struggle', 7214, 7214),
        ('struggle_bug', 7215, 7215),
        ('stuff_cheeks', 7216, 7217),
        ('stun_spore', 7218, 7218),
        ('stunspore', 7218, 7218),
        ('submission', 7219, 7219),
        ('substitute', 7220, 7221),
        ('subzero_slammer', 7222, 7222),
        ('sucker_punch', 7223, 7223),
        ('sunny_day', 7224, 7224),
        ('sunsteel_strike', 7225, 7225),
        ('super_fang', 7226, 7226),
        ('superpower', 7227, 7227),
        ('supersonic', 7228, 7229),
        ('supersonic_skystrike', 7230, 7230),
        ('surf', 7231, 7232),
        ('surging_strikes', 7233, 7233),
        ('swagger', 7234, 7235),
        ('swallow', 7236, 7237),
        ('sweet_kiss', 7238, 7238),
        ('sweet_scent', 7239, 7239),
        ('swift', 7240, 7241),
        ('switcheroo', 7242, 7243),
        ('swords_dance', 7244, 7244),
        ('synchronoise', 7245, 7245),
        ('synthesis', 7246, 7246),
        # Fallbacks:
        ('stoked_sparksurfer', 100, 100),
        ('stone_axe', 7206, 7206),
        ('supercell_slam', 7043, 7043),
        ('syrup_bomb', 1241, 1242),
    ]

    for move_key, pl_id, opp_id in move_configs:
        anim_map[move_key] = pl_id
        if 'playerMoves' in anim_map:
            anim_map['playerMoves'][move_key] = pl_id
        if 'opponentMoves' in anim_map and pl_id != opp_id:
            anim_map['opponentMoves'][move_key] = opp_id

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

    print('[6/6] S Group Batch 4 import completed successfully!')

if __name__ == '__main__':
    main()
