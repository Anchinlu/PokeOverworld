#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 S Group (Batch 3) Battle Animations.
34 moves handled (47 animation definitions: IDs 7154..7200) + 8 Fallbacks & 3 Aliases:
  1. smog (Target ID: 7154) - Poison Special (PRAS- Smog.png, 22 frames)
  2. smokescreen (Target ID: 7155) - Normal Status (PRAS- Smog.png, 20 frames)
  3. snap_trap (Target ID: 7156) - Grass Physical (PRAS- Grass.png, 20 frames)
  4. snarl (Target IDs: 7157 PL / 7158 OPP) - Dark Special (PRAS- Dark.png, 13 frames)
  5. snatch (Target ID: 7159) - Dark Status (PRAS- Dark.png, 30 frames)
  6. snipe_shot (Target ID: 7160) - Water Special (PRAS- Water.png, 25 frames)
  7. snore (Target ID: 7161) - Normal Special (PRAS- Sound.png, 20 frames)
  8. soak (Target ID: 7162) - Water Status (PRAS- Water.png, 22 frames)
  9. soft_boiled & softboiled (Target ID: 7163) - Normal Status (PRAS- Soft Boil.png, 32 frames)
  10. solar_beam & solarbeam (Target ID: 7164) - Grass Special (PRAS- Grass.png, 40 frames)
  11. solar_blade (Target IDs: 7165 PL / 7166 OPP) - Grass Physical (PRAS- Grass.png, 25 frames)
  12. sonic_boom & sonicboom (Target IDs: 7167 PL / 7168 OPP) - Normal Special (PRAS- Sound.png, 18 frames)
  13. spacial_rend (Target IDs: 7169 PL / 7170 OPP) - Dragon Special (PRAS- Spacial Rend.png, 65 frames)
  14. spark (Target ID: 7171) - Electric Physical (PRAS- Electric.png, 15 frames)
  15. sparkling_aria (Target ID: 7172) - Water Special (PRAS- Sparkling Aria.png, 30 frames)
  16. spectral_thief (Target IDs: 7173 PL / 7174 OPP) - Ghost Physical (PRAS- Spectral Thief.png, 45 frames)
  17. speed_swap (Target ID: 7175) - Psychic Status (PRAS- Swap.png, 30 frames)
  18. spider_web (Target ID: 7176) - Bug Status (PRAS- Spider Web.png, 20 frames)
  19. spike_cannon (Target IDs: 7177 PL / 7178 OPP) - Normal Physical (PRAS- Spike Cannon.png, 15 frames)
  20. spikes (Target IDs: 7179 PL / 7180 OPP) - Ground Status (PRAS- Spikes.png, 20 frames)
  21. spiky_shield (Target ID: 7181) - Grass Status (PRAS- Spiky Shield.png, 20 frames)
  22. spirit_break (Target ID: 7182) - Fairy Physical (PRAS- Fairy.png, 16 frames)
  23. spirit_shackle (Target IDs: 7183 PL / 7184 OPP) - Ghost Physical (PRAS- Spirit Shackle.png, 30 frames)
  24. spit_up (Target IDs: 7185 PL / 7186 OPP) - Normal Special (PRAS- Spit Up.png, 25 frames)
  25. spite (Target ID: 7187) - Ghost Status (PRAS- Spite.png, 24 frames)
  26. splash (Target ID: 7188) - Normal Status (PRAS- Water.png, 16 frames)
  27. spore (Target ID: 7189) - Grass Status (PRAS- Spore.png, 24 frames)
  28. spotlight (Target IDs: 7190 PL / 7191 OPP) - Normal Status (PRAS- Spotlight.png, 58 frames)
  29. stealth_rock (Target IDs: 7192 PL / 7193 OPP) - Rock Status (PRAS- Stealth Rock.png, 25 frames)
  30. steam_eruption (Target IDs: 7194 PL / 7195 OPP) - Water Special (PRAS- Steam Eruption.png, 74/77 frames)
  31. steamroller (Target ID: 7196) - Bug Physical (PRAS- Steamroller.png, 24 frames)
  32. steel_beam (Target ID: 7197) - Steel Special (PRAS- Steel.png, 30 frames)
  33. steel_roller (Target ID: 7198) - Steel Physical (GEN8- Steel Roller.png, 20 frames)
  34. steel_wing (Target IDs: 7199 PL / 7200 OPP) - Steel Physical (PRAS- Steel Wing.png, 24 frames)

Fallbacks:
  - snowscape -> hail (6861)
  - soul_stealing_7_star_strike -> spectral_thief (7173 PL / 7174 OPP)
  - sparkly_swirl -> dazzling_gleam (6775)
  - spicy_extract -> growth (6858)
  - spin_out -> steel_roller (7198)
  - splintered_stormshards -> stone_edge (718)
  - splishy_splash -> surf (473)
  - springtide_storm -> fairy_wind (6829)
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

    # Specification for S Group Batch 3 moves:
    s_specs = [
        {'rx_id': 385, 'tgt_id': 7154, 'name': 'Move:SMOG', 'default_name': 'Smog', 'move_key': 'smog', 'is_opp': False},
        {'rx_id': 222, 'tgt_id': 7155, 'name': 'Move:SMOKESCREEN', 'default_name': 'Smokescreen', 'move_key': 'smokescreen', 'is_opp': False},
        {'rx_id': 1289, 'tgt_id': 7156, 'name': 'Move:SNAPTRAP', 'default_name': 'Snap Trap', 'move_key': 'snap_trap', 'is_opp': False},
        {'rx_id': 941, 'tgt_id': 7157, 'name': 'Move:SNARL', 'default_name': 'Snarl', 'move_key': 'snarl', 'is_opp': False},
        {'rx_id': 942, 'tgt_id': 7158, 'name': 'OppMove:SNARL', 'default_name': 'Snarl (Opp)', 'move_key': 'snarl', 'is_opp': True},
        {'rx_id': 807, 'tgt_id': 7159, 'name': 'Move:SNATCH', 'default_name': 'Snatch', 'move_key': 'snatch', 'is_opp': False},
        {'rx_id': 1291, 'tgt_id': 7160, 'name': 'Move:SNIPESHOT', 'default_name': 'Snipe Shot', 'move_key': 'snipe_shot', 'is_opp': False},
        {'rx_id': 1059, 'tgt_id': 7161, 'name': 'Move:SNORE', 'default_name': 'Snore', 'move_key': 'snore', 'is_opp': False},
        {'rx_id': 924, 'tgt_id': 7162, 'name': 'Move:SOAK', 'default_name': 'Soak', 'move_key': 'soak', 'is_opp': False},
        {'rx_id': 851, 'tgt_id': 7163, 'name': 'Move:SOFTBOILED', 'default_name': 'Soft-Boiled', 'move_key': 'soft_boiled', 'is_opp': False},
        {'rx_id': 732, 'tgt_id': 7164, 'name': 'Move:SOLARBEAM', 'default_name': 'Solar Beam', 'move_key': 'solar_beam', 'is_opp': False},
        {'rx_id': 1393, 'tgt_id': 7165, 'name': 'Move:SOLARBLADE', 'default_name': 'Solar Blade', 'move_key': 'solar_blade', 'is_opp': False},
        {'rx_id': 1395, 'tgt_id': 7166, 'name': 'OppMove:SOLARBLADE', 'default_name': 'Solar Blade (Opp)', 'move_key': 'solar_blade', 'is_opp': True},
        {'rx_id': 987, 'tgt_id': 7167, 'name': 'Move:SONICBOOM', 'default_name': 'Sonic Boom', 'move_key': 'sonic_boom', 'is_opp': False},
        {'rx_id': 988, 'tgt_id': 7168, 'name': 'OppMove:SONICBOOM', 'default_name': 'Sonic Boom (Opp)', 'move_key': 'sonic_boom', 'is_opp': True},
        {'rx_id': 893, 'tgt_id': 7169, 'name': 'Move:SPACIALREND', 'default_name': 'Spacial Rend', 'move_key': 'spacial_rend', 'is_opp': False},
        {'rx_id': 894, 'tgt_id': 7170, 'name': 'OppMove:SPACIALREND', 'default_name': 'Spacial Rend (Opp)', 'move_key': 'spacial_rend', 'is_opp': True},
        {'rx_id': 496, 'tgt_id': 7171, 'name': 'Move:SPARK', 'default_name': 'Spark', 'move_key': 'spark', 'is_opp': False},
        {'rx_id': 1140, 'tgt_id': 7172, 'name': 'Move:SPARKLINGARIA', 'default_name': 'Sparkling Aria', 'move_key': 'sparkling_aria', 'is_opp': False},
        {'rx_id': 1111, 'tgt_id': 7173, 'name': 'Move:SPECTRALTHIEF', 'default_name': 'Spectral Thief', 'move_key': 'spectral_thief', 'is_opp': False},
        {'rx_id': 1112, 'tgt_id': 7174, 'name': 'OppMove:SPECTRALTHIEF', 'default_name': 'Spectral Thief (Opp)', 'move_key': 'spectral_thief', 'is_opp': True},
        {'rx_id': 830, 'tgt_id': 7175, 'name': 'Move:SPEEDSWAP', 'default_name': 'Speed Swap', 'move_key': 'speed_swap', 'is_opp': False},
        {'rx_id': 196, 'tgt_id': 7176, 'name': 'Move:SPIDERWEB', 'default_name': 'Spider Web', 'move_key': 'spider_web', 'is_opp': False},
        {'rx_id': 397, 'tgt_id': 7177, 'name': 'Move:SPIKECANNON', 'default_name': 'Spike Cannon', 'move_key': 'spike_cannon', 'is_opp': False},
        {'rx_id': 402, 'tgt_id': 7178, 'name': 'OppMove:SPIKECANNON', 'default_name': 'Spike Cannon (Opp)', 'move_key': 'spike_cannon', 'is_opp': True},
        {'rx_id': 112, 'tgt_id': 7179, 'name': 'Move:SPIKES', 'default_name': 'Spikes', 'move_key': 'spikes', 'is_opp': False},
        {'rx_id': 113, 'tgt_id': 7180, 'name': 'OppMove:SPIKES', 'default_name': 'Spikes (Opp)', 'move_key': 'spikes', 'is_opp': True},
        {'rx_id': 906, 'tgt_id': 7181, 'name': 'Move:SPIKYSHIELD', 'default_name': 'Spiky Shield', 'move_key': 'spiky_shield', 'is_opp': False},
        {'rx_id': 1292, 'tgt_id': 7182, 'name': 'Move:SPIRITBREAK', 'default_name': 'Spirit Break', 'move_key': 'spirit_break', 'is_opp': False},
        {'rx_id': 1090, 'tgt_id': 7183, 'name': 'Move:SPIRITSHACKLE', 'default_name': 'Spirit Shackle', 'move_key': 'spirit_shackle', 'is_opp': False},
        {'rx_id': 1091, 'tgt_id': 7184, 'name': 'OppMove:SPIRITSHACKLE', 'default_name': 'Spirit Shackle (Opp)', 'move_key': 'spirit_shackle', 'is_opp': True},
        {'rx_id': 879, 'tgt_id': 7185, 'name': 'Move:SPITUP', 'default_name': 'Spit Up', 'move_key': 'spit_up', 'is_opp': False},
        {'rx_id': 880, 'tgt_id': 7186, 'name': 'OppMove:SPITUP', 'default_name': 'Spit Up (Opp)', 'move_key': 'spit_up', 'is_opp': True},
        {'rx_id': 639, 'tgt_id': 7187, 'name': 'Move:SPITE', 'default_name': 'Spite', 'move_key': 'spite', 'is_opp': False},
        {'rx_id': 114, 'tgt_id': 7188, 'name': 'Move:SPLASH', 'default_name': 'Splash', 'move_key': 'splash', 'is_opp': False},
        {'rx_id': 278, 'tgt_id': 7189, 'name': 'Move:SPORE', 'default_name': 'Spore', 'move_key': 'spore', 'is_opp': False},
        {'rx_id': 1105, 'tgt_id': 7190, 'name': 'Move:SPOTLIGHT', 'default_name': 'Spotlight', 'move_key': 'spotlight', 'is_opp': False},
        {'rx_id': 1106, 'tgt_id': 7191, 'name': 'OppMove:SPOTLIGHT', 'default_name': 'Spotlight (Opp)', 'move_key': 'spotlight', 'is_opp': True},
        {'rx_id': 317, 'tgt_id': 7192, 'name': 'Move:STEALTHROCK', 'default_name': 'Stealth Rock', 'move_key': 'stealth_rock', 'is_opp': False},
        {'rx_id': 318, 'tgt_id': 7193, 'name': 'OppMove:STEALTHROCK', 'default_name': 'Stealth Rock (Opp)', 'move_key': 'stealth_rock', 'is_opp': True},
        {'rx_id': 947, 'tgt_id': 7194, 'name': 'Move:STEAMERUPTION', 'default_name': 'Steam Eruption', 'move_key': 'steam_eruption', 'is_opp': False},
        {'rx_id': 948, 'tgt_id': 7195, 'name': 'OppMove:STEAMERUPTION', 'default_name': 'Steam Eruption (Opp)', 'move_key': 'steam_eruption', 'is_opp': True},
        {'rx_id': 780, 'tgt_id': 7196, 'name': 'Move:STEAMROLLER', 'default_name': 'Steamroller', 'move_key': 'steamroller', 'is_opp': False},
        {'rx_id': 1293, 'tgt_id': 7197, 'name': 'Move:STEELBEAM', 'default_name': 'Steel Beam', 'move_key': 'steel_beam', 'is_opp': False},
        {'rx_id': 1328, 'tgt_id': 7198, 'name': 'Move:STEELROLLER', 'default_name': 'Steel Roller', 'move_key': 'steel_roller', 'is_opp': False},
        {'rx_id': 640, 'tgt_id': 7199, 'name': 'Move:STEELWING', 'default_name': 'Steel Wing', 'move_key': 'steel_wing', 'is_opp': False},
        {'rx_id': 641, 'tgt_id': 7200, 'name': 'OppMove:STEELWING', 'default_name': 'Steel Wing (Opp)', 'move_key': 'steel_wing', 'is_opp': True},
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

    # Move map specs for Batch 3 S moves:
    move_configs = [
        ('smog', 7154, 7154),
        ('smokescreen', 7155, 7155),
        ('snap_trap', 7156, 7156),
        ('snarl', 7157, 7158),
        ('snatch', 7159, 7159),
        ('snipe_shot', 7160, 7160),
        ('snore', 7161, 7161),
        ('soak', 7162, 7162),
        ('soft_boiled', 7163, 7163),
        ('softboiled', 7163, 7163),
        ('solar_beam', 7164, 7164),
        ('solarbeam', 7164, 7164),
        ('solar_blade', 7165, 7166),
        ('sonic_boom', 7167, 7168),
        ('sonicboom', 7167, 7168),
        ('spacial_rend', 7169, 7170),
        ('spark', 7171, 7171),
        ('sparkling_aria', 7172, 7172),
        ('spectral_thief', 7173, 7174),
        ('speed_swap', 7175, 7175),
        ('spider_web', 7176, 7176),
        ('spike_cannon', 7177, 7178),
        ('spikes', 7179, 7180),
        ('spiky_shield', 7181, 7181),
        ('spirit_break', 7182, 7182),
        ('spirit_shackle', 7183, 7184),
        ('spit_up', 7185, 7186),
        ('spite', 7187, 7187),
        ('splash', 7188, 7188),
        ('spore', 7189, 7189),
        ('spotlight', 7190, 7191),
        ('stealth_rock', 7192, 7193),
        ('steam_eruption', 7194, 7195),
        ('steamroller', 7196, 7196),
        ('steel_beam', 7197, 7197),
        ('steel_roller', 7198, 7198),
        ('steel_wing', 7199, 7200),
        # Fallbacks:
        ('snowscape', 6861, 6861),
        ('soul_stealing_7_star_strike', 7173, 7174),
        ('sparkly_swirl', 6775, 6775),
        ('spicy_extract', 6858, 6858),
        ('spin_out', 7198, 7198),
        ('splintered_stormshards', 718, 718),
        ('splishy_splash', 473, 474),
        ('springtide_storm', 6829, 6829),
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

    print('[6/6] S Group Batch 3 import completed successfully!')

if __name__ == '__main__':
    main()
