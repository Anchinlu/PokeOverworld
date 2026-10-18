#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 T Group (Batch 2) Battle Animations.
Completes 100% of Group T (28 remaining moves: 42 dedicated animation definitions IDs 7297..7338 + 7 Fallbacks):
  1. thunder_wave (Target IDs: 7297 PL / 7298 OPP) - Electric Status (PRAS- Electric.png, 16 frames)
  2. thunderbolt (Target IDs: 7299 PL / 7300 OPP) - Electric Special (PRAS- Electric.png, 27 frames)
  3. thunderclap (Fallback -> thunderbolt: 7299 PL / 7300 OPP)
  4. thunderous_kick (Target IDs: 7301 PL / 7302 OPP) - Fighting Physical (Thunderous kick.png, 32 frames)
  5. tickle (Target IDs: 7303 PL / 7304 OPP) - Normal Status (Rx 1013, 34 frames)
  6. tidy_up (Fallback -> rapid_spin: 7016 PL / 7017 OPP, target: 'user')
  7. topsy_turvy (Target IDs: 7305 PL / 7306 OPP) - Dark Status (Rx 843, 35 frames)
  8. torch_song (Fallback -> fiery_dance: 6830 PL / 6831 OPP)
  9. torment (Target IDs: 7307 PL / 7308 OPP) - Dark Status (PRAS- Torment.png, 17 frames)
  10. toxic (Target IDs: 7309 PL / 7310 OPP) - Poison Status (PRAS- Poison.png, 16 frames)
  11. toxic_spikes (Target IDs: 7311 PL / 7312 OPP) - Poison Status (PRAS- Spikes.png, 30/31 frames)
  12. toxic_thread (Target IDs: 7313 PL / 7314 OPP) - Poison Status (PRAS- String Shot.png, 26 frames)
  13. trailblaze (Fallback -> flame_charge: 6786 PL / 6787 OPP)
  14. transform (Target IDs: 7315 PL / 7316 OPP) - Normal Status (Rx 788, 15 frames, target: 'user')
  15. tri_attack (Target IDs: 7317 PL / 7318 OPP) - Normal Special (PRAS- Tri Attack.png, 70 frames)
  16. trick (Target IDs: 7319 PL / 7320 OPP) - Psychic Status (PRAS- Trick.png, 20 frames)
  17. trick_or_treat (Target IDs: 7321 PL / 7322 OPP) - Ghost Status (PRAS- Strike.png, 21 frames)
  18. trick_room (Target IDs: 7323 PL / 7324 OPP) - Psychic Status (Rx 131, 40 frames, target: 'user')
  19. triple_arrows (Fallback -> thousand_arrows: 7279 PL / 7280 OPP)
  20. triple_axel (Target IDs: 7325 PL / 7326 OPP) - Ice Physical (GEN8- Elemental Punch.png, 13 frames)
  21. triple_dive (Fallback -> surging_strikes: 7233 PL / 7233 OPP)
  22. triple_kick (Target IDs: 7327 PL / 7328 OPP) - Fighting Physical (PRAS- Strike.png, 7 frames)
  23. trop_kick (Target IDs: 7329 PL / 7330 OPP) - Grass Physical (PRAS- Trop Kick.png, 33 frames)
  24. trump_card (Target IDs: 7331 PL / 7332 OPP) - Normal Special (PRAS- Trump card.png, 18 frames)
  25. twin_beam (Fallback -> psybeam: 6988 PL / 6989 OPP)
  26. twineedle (Target IDs: 7333 PL / 7334 OPP) - Bug Physical (PRAS- Megahorn.png, 23 frames)
  27. twinkle_tackle (Target IDs: 7335 PL / 7336 OPP) - Fairy Physical (PRAS- Twinkle Tackle.png, 69/78 frames)
  28. twister (Target IDs: 7337 PL / 7338 OPP) - Dragon Special (PRAS- Twister.png, 30 frames)
"""

import os
import sys
import json
import shutil
import copy
from PIL import Image

sys.path.append(os.path.dirname(__file__))
import import_source_animations as isa
isa.patch_reader()
import rubymarshal.reader as r

def mirror_target_animation(frames, src_target_x=384, src_target_y=96, dst_target_x=128, dst_target_y=224):
    """Creates a mirrored opponent animation from a player-targeting animation."""
    opp_frames = []
    for fr in frames:
        new_cels = []
        for cel in fr.get('cels', []):
            c = copy.deepcopy(cel)
            focus = c.get('focus', 'target')
            pattern = c.get('pattern', 0)
            
            # Handle battler placeholders
            if pattern == -1: # User
                c['pattern'] = -2
                c['x'] = dst_target_x
                c['y'] = dst_target_y
            elif pattern == -2: # Target
                c['pattern'] = -1
                c['x'] = src_target_x
                c['y'] = src_target_y
            elif focus == 'target':
                # Delta from target
                dx = c.get('x', src_target_x) - src_target_x
                dy = c.get('y', src_target_y) - src_target_y
                c['x'] = dst_target_x - dx
                c['y'] = dst_target_y + dy
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'user':
                # Delta from user
                dx = c.get('x', 128) - 128
                dy = c.get('y', 224) - 224
                c['x'] = 384 - dx
                c['y'] = 96 + dy
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'both':
                # Screen mirrored
                c['x'] = 512 - c.get('x', 256)
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'screen':
                c['mirror'] = not c.get('mirror', False)
            new_cels.append(c)
        opp_frames.append({'cels': new_cels})
    return opp_frames

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

    # Specification for T Group Batch 2 moves (21 moves with dedicated 42 animations: 7297..7338):
    t_specs = [
        # 1. thunder_wave (7297 PL / 7298 OPP)
        {'rx_id': 115, 'tgt_id': 7297, 'name': 'Move:THUNDERWAVE', 'default_name': 'Thunder Wave', 'move_key': 'thunder_wave', 'is_opp': False},
        {'rx_id': 115, 'tgt_id': 7298, 'name': 'OppMove:THUNDERWAVE', 'default_name': 'Thunder Wave (Opp)', 'move_key': 'thunder_wave', 'is_opp': True, 'mirror_opp': True},
        # 2. thunderbolt (7299 PL / 7300 OPP)
        {'rx_id': 100, 'tgt_id': 7299, 'name': 'Move:THUNDERBOLT', 'default_name': 'Thunderbolt', 'move_key': 'thunderbolt', 'is_opp': False},
        {'rx_id': 100, 'tgt_id': 7300, 'name': 'OppMove:THUNDERBOLT', 'default_name': 'Thunderbolt (Opp)', 'move_key': 'thunderbolt', 'is_opp': True, 'mirror_opp': True},
        # 3. thunderous_kick (7301 PL / 7302 OPP)
        {'rx_id': 1352, 'tgt_id': 7301, 'name': 'Move:THUNDEROUSKICK', 'default_name': 'Thunderous Kick', 'move_key': 'thunderous_kick', 'is_opp': False},
        {'rx_id': 1352, 'tgt_id': 7302, 'name': 'OppMove:THUNDEROUSKICK', 'default_name': 'Thunderous Kick (Opp)', 'move_key': 'thunderous_kick', 'is_opp': True, 'mirror_opp': True},
        # 4. tickle (7303 PL / 7304 OPP)
        {'rx_id': 1013, 'tgt_id': 7303, 'name': 'Move:TICKLE', 'default_name': 'Tickle', 'move_key': 'tickle', 'is_opp': False},
        {'rx_id': 1013, 'tgt_id': 7304, 'name': 'OppMove:TICKLE', 'default_name': 'Tickle (Opp)', 'move_key': 'tickle', 'is_opp': True, 'mirror_opp': True},
        # 5. topsy_turvy (7305 PL / 7306 OPP)
        {'rx_id': 843, 'tgt_id': 7305, 'name': 'Move:TOPSYTURVY', 'default_name': 'Topsy-Turvy', 'move_key': 'topsy_turvy', 'is_opp': False},
        {'rx_id': 843, 'tgt_id': 7306, 'name': 'OppMove:TOPSYTURVY', 'default_name': 'Topsy-Turvy (Opp)', 'move_key': 'topsy_turvy', 'is_opp': True, 'mirror_opp': True},
        # 6. torment (7307 PL / 7308 OPP)
        {'rx_id': 719, 'tgt_id': 7307, 'name': 'Move:TORMENT', 'default_name': 'Torment', 'move_key': 'torment', 'is_opp': False},
        {'rx_id': 719, 'tgt_id': 7308, 'name': 'OppMove:TORMENT', 'default_name': 'Torment (Opp)', 'move_key': 'torment', 'is_opp': True, 'mirror_opp': True},
        # 7. toxic (7309 PL / 7310 OPP)
        {'rx_id': 209, 'tgt_id': 7309, 'name': 'Move:TOXIC', 'default_name': 'Toxic', 'move_key': 'toxic', 'is_opp': False},
        {'rx_id': 209, 'tgt_id': 7310, 'name': 'OppMove:TOXIC', 'default_name': 'Toxic (Opp)', 'move_key': 'toxic', 'is_opp': True, 'mirror_opp': True},
        # 8. toxic_spikes (7311 PL / 7312 OPP)
        {'rx_id': 116, 'tgt_id': 7311, 'name': 'Move:TOXICSPIKES', 'default_name': 'Toxic Spikes', 'move_key': 'toxic_spikes', 'is_opp': False},
        {'rx_id': 117, 'tgt_id': 7312, 'name': 'OppMove:TOXICSPIKES', 'default_name': 'Toxic Spikes (Opp)', 'move_key': 'toxic_spikes', 'is_opp': True},
        # 9. toxic_thread (7313 PL / 7314 OPP)
        {'rx_id': 1067, 'tgt_id': 7313, 'name': 'Move:TOXICTHREAD', 'default_name': 'Toxic Thread', 'move_key': 'toxic_thread', 'is_opp': False},
        {'rx_id': 1067, 'tgt_id': 7314, 'name': 'OppMove:TOXICTHREAD', 'default_name': 'Toxic Thread (Opp)', 'move_key': 'toxic_thread', 'is_opp': True, 'mirror_opp': True},
        # 10. transform (7315 PL / 7316 OPP)
        {'rx_id': 788, 'tgt_id': 7315, 'name': 'Move:TRANSFORM', 'default_name': 'Transform', 'move_key': 'transform', 'is_opp': False},
        {'rx_id': 788, 'tgt_id': 7316, 'name': 'OppMove:TRANSFORM', 'default_name': 'Transform (Opp)', 'move_key': 'transform', 'is_opp': True, 'mirror_opp': True},
        # 11. tri_attack (7317 PL / 7318 OPP)
        {'rx_id': 432, 'tgt_id': 7317, 'name': 'Move:TRIATTACK', 'default_name': 'Tri Attack', 'move_key': 'tri_attack', 'is_opp': False},
        {'rx_id': 433, 'tgt_id': 7318, 'name': 'OppMove:TRIATTACK', 'default_name': 'Tri Attack (Opp)', 'move_key': 'tri_attack', 'is_opp': True},
        # 12. trick (7319 PL / 7320 OPP)
        {'rx_id': 750, 'tgt_id': 7319, 'name': 'Move:TRICK', 'default_name': 'Trick', 'move_key': 'trick', 'is_opp': False},
        {'rx_id': 750, 'tgt_id': 7320, 'name': 'OppMove:TRICK', 'default_name': 'Trick (Opp)', 'move_key': 'trick', 'is_opp': True, 'mirror_opp': True},
        # 13. trick_or_treat (7321 PL / 7322 OPP)
        {'rx_id': 832, 'tgt_id': 7321, 'name': 'Move:TRICKORTREAT', 'default_name': 'Trick-or-Treat', 'move_key': 'trick_or_treat', 'is_opp': False},
        {'rx_id': 833, 'tgt_id': 7322, 'name': 'OppMove:TRICKORTREAT', 'default_name': 'Trick-or-Treat (Opp)', 'move_key': 'trick_or_treat', 'is_opp': True},
        # 14. trick_room (7323 PL / 7324 OPP)
        {'rx_id': 131, 'tgt_id': 7323, 'name': 'Move:TRICKROOM', 'default_name': 'Trick Room', 'move_key': 'trick_room', 'is_opp': False},
        {'rx_id': 131, 'tgt_id': 7324, 'name': 'OppMove:TRICKROOM', 'default_name': 'Trick Room (Opp)', 'move_key': 'trick_room', 'is_opp': True, 'mirror_opp': True},
        # 15. triple_axel (7325 PL / 7326 OPP)
        {'rx_id': 1339, 'tgt_id': 7325, 'name': 'Move:TRIPLEAXEL', 'default_name': 'Triple Axel', 'move_key': 'triple_axel', 'is_opp': False},
        {'rx_id': 1339, 'tgt_id': 7326, 'name': 'OppMove:TRIPLEAXEL', 'default_name': 'Triple Axel (Opp)', 'move_key': 'triple_axel', 'is_opp': True, 'mirror_opp': True},
        # 16. triple_kick (7327 PL / 7328 OPP)
        {'rx_id': 747, 'tgt_id': 7327, 'name': 'Move:TRIPLEKICK', 'default_name': 'Triple Kick', 'move_key': 'triple_kick', 'is_opp': False},
        {'rx_id': 747, 'tgt_id': 7328, 'name': 'OppMove:TRIPLEKICK', 'default_name': 'Triple Kick (Opp)', 'move_key': 'triple_kick', 'is_opp': True, 'mirror_opp': True},
        # 17. trop_kick (7329 PL / 7330 OPP)
        {'rx_id': 1121, 'tgt_id': 7329, 'name': 'Move:TROPKICK', 'default_name': 'Trop Kick', 'move_key': 'trop_kick', 'is_opp': False},
        {'rx_id': 1121, 'tgt_id': 7330, 'name': 'OppMove:TROPKICK', 'default_name': 'Trop Kick (Opp)', 'move_key': 'trop_kick', 'is_opp': True, 'mirror_opp': True},
        # 18. trump_card (7331 PL / 7332 OPP)
        {'rx_id': 797, 'tgt_id': 7331, 'name': 'Move:TRUMPCARD', 'default_name': 'Trump Card', 'move_key': 'trump_card', 'is_opp': False},
        {'rx_id': 797, 'tgt_id': 7332, 'name': 'OppMove:TRUMPCARD', 'default_name': 'Trump Card (Opp)', 'move_key': 'trump_card', 'is_opp': True, 'mirror_opp': True},
        # 19. twineedle (7333 PL / 7334 OPP)
        {'rx_id': 210, 'tgt_id': 7333, 'name': 'Move:TWINEEDLE', 'default_name': 'Twineedle', 'move_key': 'twineedle', 'is_opp': False},
        {'rx_id': 212, 'tgt_id': 7334, 'name': 'OppMove:TWINEEDLE', 'default_name': 'Twineedle (Opp)', 'move_key': 'twineedle', 'is_opp': True},
        # 20. twinkle_tackle (7335 PL / 7336 OPP)
        {'rx_id': 1204, 'tgt_id': 7335, 'name': 'Move:TWINKLETACKLE', 'default_name': 'Twinkle Tackle', 'move_key': 'twinkle_tackle', 'is_opp': False},
        {'rx_id': 1205, 'tgt_id': 7336, 'name': 'OppMove:TWINKLETACKLE', 'default_name': 'Twinkle Tackle (Opp)', 'move_key': 'twinkle_tackle', 'is_opp': True},
        # 21. twister (7337 PL / 7338 OPP)
        {'rx_id': 223, 'tgt_id': 7337, 'name': 'Move:TWISTER', 'default_name': 'Twister', 'move_key': 'twister', 'is_opp': False},
        {'rx_id': 223, 'tgt_id': 7338, 'name': 'OppMove:TWISTER', 'default_name': 'Twister (Opp)', 'move_key': 'twister', 'is_opp': True, 'mirror_opp': True},
    ]

    used_graphics = set()
    used_se_files = set()
    exported_anim_defs = {}

    print(f'[2/6] Parsing and exporting {len(t_specs)} animation definitions...')
    for spec in t_specs:
        tgt_id = spec['tgt_id']
        default_name = spec['default_name']
        is_opp = spec.get('is_opp', False)
        rx_id = spec['rx_id']

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
        else:
            graphic = ""

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

        if spec.get('mirror_opp', False):
            frames = mirror_target_animation(frames)

        timings = []
        for t in raw_timings:
            t_attrs = t.attributes if hasattr(t, 'attributes') else {}
            frame = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
            
            # Check sound from @name and @se
            tname = t_attrs.get('@name') if '@name' in t_attrs else t_attrs.get(b'@name', b'')
            if isinstance(tname, bytes):
                tname = tname.decode('utf-8', errors='ignore')

            se = t_attrs.get('@se') or t_attrs.get(b'@se')
            se_name = ''
            volume = t_attrs.get('@volume') or t_attrs.get(b'@volume', 80)
            pitch = t_attrs.get('@pitch') or t_attrs.get(b'@pitch', 100)
            if se and hasattr(se, 'attributes'):
                se_attrs = se.attributes
                se_name = se_attrs.get('@name') or se_attrs.get(b'@name', '')
                if isinstance(se_name, bytes):
                    se_name = se_name.decode('utf-8', errors='ignore')
                volume = se_attrs.get('@volume') or se_attrs.get(b'@volume', volume)
                pitch = se_attrs.get('@pitch') or se_attrs.get(b'@pitch', pitch)

            chosen_se = ''
            for cand in [tname, se_name]:
                if cand and any(cand.lower().endswith(ext) for ext in ['.wav', '.ogg', '.mp3']):
                    chosen_se = cand
                    break

            if chosen_se:
                used_se_files.add(chosen_se)
                timings.append({
                    'frame': frame,
                    'type': 'sound',
                    'payload': {
                        'sound': chosen_se,
                        'volume': volume,
                        'pitch': pitch
                    }
                })

        hue = attrs.get('@hue', 0)
        position = attrs.get('@position', 2)
        fps = 20

        anim_def = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'hue': hue,
            'position': position,
            'fps': fps,
            'frames': frames,
            'timings': timings
        }

        # Save to packages/game-data/animations/{tgt_id}.json
        primary_path = os.path.join(anims_out_dir, f'{tgt_id}.json')
        with open(primary_path, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        # Save to packages/game-data/animations/last-chance/{tgt_id}.json
        lc_path = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(lc_path, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        exported_anim_defs[str(tgt_id)] = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'position': position,
            'frameCount': len(frames),
            'timingCount': len(timings)
        }
        print(f"  Exported ID {tgt_id} ({name}): {len(frames)} frames, {len(timings)} timings, gfx='{graphic}'")

    print('[3/6] Syncing Graphics and Updating animation-atlas.json...')
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    lc_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')

    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(lc_atlas_path, 'r', encoding='utf-8') as f:
        lc_atlas = json.load(f)

    for g in sorted(list(used_graphics)):
        if not g:
            continue
        # Source graphics path
        src_p = os.path.join(source_gfx_dir, g)
        dest_p = os.path.join(dest_gfx_dir, g)
        local_p = os.path.join(local_gfx_dir, g)

        # Copy if needed
        if os.path.exists(src_p):
            if not os.path.exists(dest_p):
                shutil.copy2(src_p, dest_p)
                print(f'  Copied {g} to web public animations')
            if not os.path.exists(local_p):
                shutil.copy2(src_p, local_p)
                print(f'  Copied {g} to local animations')
        elif os.path.exists(local_p) and not os.path.exists(dest_p):
            shutil.copy2(local_p, dest_p)
            print(f'  Copied local {g} to web public animations')

        # Read dimensions
        measure_path = dest_p if os.path.exists(dest_p) else (local_p if os.path.exists(local_p) else src_p)
        if os.path.exists(measure_path):
            with Image.open(measure_path) as im:
                w, h = im.size
            cols = max(1, w // 192)
            rows = max(1, h // 192)
            max_p = cols * rows
            clean_key = g[:-4] if g.lower().endswith('.png') else g
            entry = {
                'assetKey': f'animation.{clean_key.lower()}',
                'file': g,
                'width': w,
                'height': h,
                'cellWidth': 192,
                'cellHeight': 192,
                'columns': cols,
                'rows': rows,
                'cols': cols,
                'maxPattern': max_p
            }
            atlas[g] = entry
            atlas[clean_key] = entry
            lc_atlas[g] = entry
            lc_atlas[clean_key] = entry
            print(f'  Registered {g} into animation-atlas.json ({w}x{h}, cols={cols}, rows={rows})')

    with open(atlas_path, 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2)
    with open(lc_atlas_path, 'w', encoding='utf-8') as f:
        json.dump(lc_atlas, f, indent=2)

    print('[4/6] Syncing Sound Effect (SE) Audio Files...')
    for s in sorted(list(used_se_files)):
        clean_s = s
        if not clean_s.lower().endswith(('.wav', '.ogg', '.mp3')):
            clean_s += '.wav'
        # Search locations
        found = False
        for sdir in [source_se_anim_dir, source_se_dir, public_se_anim_dir, public_se_dir]:
            sp = os.path.join(sdir, clean_s)
            if os.path.exists(sp):
                target_p = os.path.join(public_se_anim_dir, clean_s)
                if not os.path.exists(target_p):
                    shutil.copy2(sp, target_p)
                    print(f'  Copied SE: {clean_s}')
                found = True
                break
        if not found:
            print(f'  [Notice] SE {clean_s} not found in source dirs')

    print('[5/6] Updating Database Files & Move Mappings...')
    # 1. Update manifest.json and last-chance-animation-manifest.json
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    lc_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(lc_manifest_path, 'r', encoding='utf-8') as f:
        lc_manifest = json.load(f)

    for k, v in exported_anim_defs.items():
        manifest[k] = v
        lc_manifest[k] = v

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    with open(lc_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(lc_manifest, f, indent=2)

    # 2. Update move-animations-db.json
    anim_db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(anim_db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)

    for k, v in exported_anim_defs.items():
        anim_db[k] = {
            'id': v['id'],
            'name': v['name'],
            'graphic': v['graphic'],
            'position': v['position'],
            'frameCount': v['frameCount'],
            'timings': []
        }

    with open(anim_db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2)

    # 3. Update move-animation-map.json
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(map_path, 'r', encoding='utf-8') as f:
        move_map = json.load(f)

    # Map the 21 dedicated moves
    for spec in t_specs:
        m_key = spec['move_key']
        tgt_id = spec['tgt_id']
        if spec.get('is_opp', False):
            move_map['opponentMoves'][m_key] = tgt_id
        else:
            move_map['moves'][m_key] = tgt_id

    # Fallbacks for Batch 2:
    fallbacks = {
        'thunderclap': (7299, 7300),            # thunderbolt
        'tidy_up': (7016, 7017),                # rapid_spin
        'torch_song': (6830, 6831),             # fiery_dance
        'trailblaze': (6786, 6787),             # flame_charge
        'triple_arrows': (7279, 7280),          # thousand_arrows
        'triple_dive': (7233, 7233),            # surging_strikes
        'twin_beam': (6988, 6989)               # psybeam
    }
    for m_key, (pl_id, opp_id) in fallbacks.items():
        move_map['moves'][m_key] = pl_id
        if opp_id:
            move_map['opponentMoves'][m_key] = opp_id

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(move_map, f, indent=2)

    # 4. Clean up move-animation-extensions.json
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        extensions = json.load(f)

    all_batch2_keys = [spec['move_key'] for spec in t_specs] + list(fallbacks.keys())
    for k in all_batch2_keys:
        for section in ['replacedMoves', 'replacedOpponentMoves', 'moves', 'opponentMoves']:
            if section in extensions and k in extensions[section]:
                del extensions[section][k]
                print(f'  Removed override for {k} from extensions.{section}')

    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(extensions, f, indent=2)

    # 5. Update moves-db.json target & animationId
    moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
    with open(moves_db_path, 'r', encoding='utf-8') as f:
        moves_db = json.load(f)
    m_dict = moves_db.get('moves', moves_db)

    # Set self-targeting status moves
    self_target_moves = ['tidy_up', 'transform', 'trick_room']
    for m in self_target_moves:
        if m in m_dict:
            m_dict[m]['target'] = 'user'
            print(f'  Updated target: user for {m}')

    # Update animationId
    for m in all_batch2_keys:
        if m in m_dict and m in move_map['moves']:
            m_dict[m]['animationId'] = move_map['moves'][m]

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2)

    print('[6/6] Batch 2 import and registration completed successfully!')

if __name__ == '__main__':
    main()
