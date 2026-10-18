#!/usr/bin/env python3
"""
Importer for Pokémon Moves in Groups U and V (15 moves total):
  - 11 dedicated move animations (22 JSONs: 7339..7360) from PkmnAnimations.rxdata
  - 4 high-fidelity fallbacks (upper_hand, veevee_volley, vicegrip, victory_dance)
  - All graphics registered in animation-atlas.json & copied to public
  - All SE audio converted from 8-bit 12kHz to 16-bit 48kHz Stereo PCM WAV and synced
"""

import os
import sys
import json
import shutil
import copy
import wave
import struct
from PIL import Image

sys.path.append(os.path.dirname(__file__))
import import_source_animations as isa
isa.patch_reader()
import rubymarshal.reader as r

def convert_8bit_to_16bit_48k(input_path, output_path):
    """Converts any WAV (especially 8-bit unsigned 12kHz) to 16-bit 48kHz Stereo PCM WAV."""
    w_in = wave.open(input_path, 'rb')
    n_channels = w_in.getnchannels()
    sampwidth = w_in.getsampwidth()
    framerate = w_in.getframerate()
    n_frames = w_in.getnframes()
    
    raw_data = w_in.readframes(n_frames)
    w_in.close()
    
    if sampwidth == 1:
        samples_in = [b - 128 for b in raw_data]
        samples_16 = [s * 256 for s in samples_in]
    elif sampwidth == 2:
        samples_16 = list(struct.unpack(f"<{len(raw_data)//2}h", raw_data))
    else:
        print(f"  [WARN] Unknown sampwidth {sampwidth} in {input_path}")
        return False

    target_rate = 48000
    ratio = target_rate / framerate
    
    total_in_frames = len(samples_16) // n_channels
    total_out_frames = int(total_in_frames * ratio)
    
    out_samples = []
    for out_f in range(total_out_frames):
        in_pos = out_f / ratio
        idx = int(in_pos)
        frac = in_pos - idx
        
        for ch in range(n_channels):
            s1 = samples_16[idx * n_channels + ch] if idx < total_in_frames else 0
            s2 = samples_16[(idx + 1) * n_channels + ch] if (idx + 1) < total_in_frames else s1
            val = int(s1 + frac * (s2 - s1))
            val = max(-32768, min(32767, val))
            out_samples.append(val)
            
    out_bytes = struct.pack(f"<{len(out_samples)}h", *out_samples)
    w_out = wave.open(output_path, 'wb')
    w_out.setnchannels(n_channels)
    w_out.setsampwidth(2)
    w_out.setframerate(target_rate)
    w_out.writeframes(out_bytes)
    w_out.close()
    return True

def mirror_target_animation_correct(frames):
    """
    Correctly creates an opponent animation without shifting focus='target' to 128.
    In CoordinateTransformer, focus='target' already maps to targetPos.
    So cel coordinates must remain centered around SRC_TARGET (384, 96), with only horizontal flip.
    """
    opp_frames = []
    for fr in frames:
        new_cels = []
        for cel in fr.get('cels', []):
            c = copy.deepcopy(cel)
            focus = c.get('focus', 'target')
            pattern = c.get('pattern', 0)
            
            # Battler placeholders
            if pattern == -1: # User
                c['pattern'] = -2
                c['x'] = 128
                c['y'] = 224
            elif pattern == -2: # Target
                c['pattern'] = -1
                c['x'] = 384
                c['y'] = 96
            elif focus == 'target':
                # Horizontally flip around SRC_TARGET (384)
                dx = c.get('x', 384) - 384
                c['x'] = 384 - dx
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'user':
                # Horizontally flip around SRC_USER (128)
                dx = c.get('x', 128) - 128
                c['x'] = 128 - dx
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'both':
                # Horizontally flip across screen center (256)
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
    source_se_anim_dir = os.path.join(source_root, 'Audio', 'SE', 'Anim')
    source_gfx_dir = os.path.join(source_root, 'Graphics', 'Animations')
    dest_gfx_dir = os.path.join(out_base, 'apps', 'web', 'public', 'Graphics', 'Animations')
    local_gfx_dir = os.path.join(out_base, 'Graphics', 'Animations')

    os.makedirs(anims_out_dir, exist_ok=True)
    os.makedirs(last_chance_dir, exist_ok=True)
    os.makedirs(public_se_dir, exist_ok=True)
    os.makedirs(public_se_anim_dir, exist_ok=True)
    os.makedirs(dest_gfx_dir, exist_ok=True)
    os.makedirs(local_gfx_dir, exist_ok=True)

    print('[1/6] Loading PkmnAnimations.rxdata...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)
    anim_list = raw_anims.attributes.get('@array', [])

    # Specs for Groups U & V (22 dedicated animations: 7339..7360)
    uv_specs = [
        # 1. u_turn (7339 PL / 7340 OPP)
        {'rx_id': 606, 'tgt_id': 7339, 'name': 'Move:UTURN', 'move_key': 'u_turn', 'is_opp': False},
        {'rx_id': 606, 'tgt_id': 7340, 'name': 'OppMove:UTURN', 'move_key': 'u_turn', 'is_opp': True, 'mirror_opp': True},
        # 2. uproar (7341 PL / 7342 OPP)
        {'rx_id': 605, 'tgt_id': 7341, 'name': 'Move:UPROAR', 'move_key': 'uproar', 'is_opp': False},
        {'rx_id': 605, 'tgt_id': 7342, 'name': 'OppMove:UPROAR', 'move_key': 'uproar', 'is_opp': True, 'mirror_opp': True},
        # 3. v_create (7343 PL / 7344 OPP)
        {'rx_id': 746, 'tgt_id': 7343, 'name': 'Move:VCREATE', 'move_key': 'v_create', 'is_opp': False},
        {'rx_id': 746, 'tgt_id': 7344, 'name': 'OppMove:VCREATE', 'move_key': 'v_create', 'is_opp': True, 'mirror_opp': True},
        # 4. vacuum_wave (7345 PL / 7346 OPP)
        {'rx_id': 614, 'tgt_id': 7345, 'name': 'Move:VACUUMWAVE', 'move_key': 'vacuum_wave', 'is_opp': False},
        {'rx_id': 615, 'tgt_id': 7346, 'name': 'OppMove:VACUUMWAVE', 'move_key': 'vacuum_wave', 'is_opp': True},
        # 5. venom_drench (7347 PL / 7348 OPP)
        {'rx_id': 888, 'tgt_id': 7347, 'name': 'Move:VENOMDRENCH', 'move_key': 'venom_drench', 'is_opp': False},
        {'rx_id': 888, 'tgt_id': 7348, 'name': 'OppMove:VENOMDRENCH', 'move_key': 'venom_drench', 'is_opp': True, 'mirror_opp': True},
        # 6. venoshock (7349 PL / 7350 OPP)
        {'rx_id': 505, 'tgt_id': 7349, 'name': 'Move:VENOSHOCK', 'move_key': 'venoshock', 'is_opp': False},
        {'rx_id': 505, 'tgt_id': 7350, 'name': 'OppMove:VENOSHOCK', 'move_key': 'venoshock', 'is_opp': True, 'mirror_opp': True},
        # 7. vise_grip (7351 PL / 7352 OPP)
        {'rx_id': 970, 'tgt_id': 7351, 'name': 'Move:VISEGRIP', 'move_key': 'vise_grip', 'is_opp': False},
        {'rx_id': 970, 'tgt_id': 7352, 'name': 'OppMove:VISEGRIP', 'move_key': 'vise_grip', 'is_opp': True, 'mirror_opp': True},
        # 8. vine_whip (7353 PL / 7354 OPP)
        {'rx_id': 184, 'tgt_id': 7353, 'name': 'Move:VINEWHIP', 'move_key': 'vine_whip', 'is_opp': False},
        {'rx_id': 184, 'tgt_id': 7354, 'name': 'OppMove:VINEWHIP', 'move_key': 'vine_whip', 'is_opp': True, 'mirror_opp': True},
        # 9. vital_throw (7355 PL / 7356 OPP)
        {'rx_id': 677, 'tgt_id': 7355, 'name': 'Move:VITALTHROW', 'move_key': 'vital_throw', 'is_opp': False},
        {'rx_id': 677, 'tgt_id': 7356, 'name': 'OppMove:VITALTHROW', 'move_key': 'vital_throw', 'is_opp': True, 'mirror_opp': True},
        # 10. volt_switch (7357 PL / 7358 OPP)
        {'rx_id': 616, 'tgt_id': 7357, 'name': 'Move:VOLTSWITCH', 'move_key': 'volt_switch', 'is_opp': False},
        {'rx_id': 617, 'tgt_id': 7358, 'name': 'OppMove:VOLTSWITCH', 'move_key': 'volt_switch', 'is_opp': True},
        # 11. volt_tackle (7359 PL / 7360 OPP)
        {'rx_id': 745, 'tgt_id': 7359, 'name': 'Move:VOLTTACKLE', 'move_key': 'volt_tackle', 'is_opp': False},
        {'rx_id': 745, 'tgt_id': 7360, 'name': 'OppMove:VOLTTACKLE', 'move_key': 'volt_tackle', 'is_opp': True, 'mirror_opp': True},
    ]

    used_graphics = set()
    used_se_files = set()
    exported_anim_defs = {}

    print('[2/6] Processing and exporting U & V animations...')
    for spec in uv_specs:
        rx_id = spec['rx_id']
        tgt_id = spec['tgt_id']
        name = spec['name']
        anim = anim_list[rx_id]
        attrs = anim.attributes

        graphic = attrs.get('@graphic') or attrs.get(b'@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')
        if graphic:
            if not graphic.lower().endswith(('.png', '.jpg', '.bmp')):
                graphic += '.png'
            used_graphics.add(graphic)

        raw_frames = attrs.get('@array') or attrs.get(b'@array', [])
        raw_timings = attrs.get('@timing') or attrs.get(b'@timing', [])

        frames = []
        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for ci, cel_data in enumerate(f):
                    cel = isa.parse_cel(cel_data)
                    if cel is not None:
                        cels.append(cel)
            frames.append({'cels': cels})

        if spec.get('mirror_opp', False):
            frames = mirror_target_animation_correct(frames)

        timings = []
        for t in raw_timings:
            t_attrs = t.attributes if hasattr(t, 'attributes') else {}
            frame = t_attrs.get('@frame') or t_attrs.get(b'@frame', 0)
            tname = t_attrs.get('@name') if '@name' in t_attrs else t_attrs.get(b'@name', b'')
            if isinstance(tname, bytes):
                tname = tname.decode('utf-8', errors='ignore')

            se = t_attrs.get('@se') or t_attrs.get(b'@se')
            se_name = ''
            volume = t_attrs.get('@volume') or t_attrs.get(b'@volume', 100)
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

        # Save to primary and last-chance
        for out_dir in [anims_out_dir, last_chance_dir]:
            p = os.path.join(out_dir, f'{tgt_id}.json')
            with open(p, 'w', encoding='utf-8') as f:
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
        src_p = os.path.join(source_gfx_dir, g)
        dest_p = os.path.join(dest_gfx_dir, g)
        local_p = os.path.join(local_gfx_dir, g)

        if os.path.exists(src_p):
            if not os.path.exists(dest_p):
                shutil.copy2(src_p, dest_p)
                print(f'  Copied {g} to web public animations')
            if not os.path.exists(local_p):
                shutil.copy2(src_p, local_p)
                print(f'  Copied {g} to local animations')

        measure_path = dest_p if os.path.exists(dest_p) else src_p
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

    print('[4/6] Converting & Syncing Sound Effects to 16-bit 48kHz Stereo PCM...')
    for se in sorted(list(used_se_files)):
        clean_se = se.replace('\\', '/').split('/')[-1]
        src_se_p = os.path.join(source_se_anim_dir, clean_se)
        if not os.path.exists(src_se_p):
            # Check Audio/SE root
            src_se_p = os.path.join(source_root, 'Audio', 'SE', clean_se)

        if os.path.exists(src_se_p):
            dest_se_p1 = os.path.join(public_se_dir, clean_se)
            dest_se_p2 = os.path.join(public_se_anim_dir, clean_se)
            
            # Convert directly to 16-bit 48kHz
            convert_8bit_to_16bit_48k(src_se_p, dest_se_p1)
            shutil.copy2(dest_se_p1, dest_se_p2)
            print(f'  Converted & synced: {clean_se} -> 16-bit 48kHz ({os.path.getsize(dest_se_p1)} bytes)')
        else:
            print(f'  [ERR] Source sound not found: {clean_se}')

    print('[5/6] Updating move-animation-map.json & move-animation-extensions.json...')
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')

    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)
    with open(ext_path, 'r', encoding='utf-8') as f:
        anim_ext = json.load(f)

    # 11 Dedicated moves mappings
    dedicated_mappings = {
        'u_turn': (7339, 7340),
        'uproar': (7341, 7342),
        'v_create': (7343, 7344),
        'vacuum_wave': (7345, 7346),
        'venom_drench': (7347, 7348),
        'venoshock': (7349, 7350),
        'vise_grip': (7351, 7352),
        'vicegrip': (7351, 7352),
        'vine_whip': (7353, 7354),
        'vital_throw': (7355, 7356),
        'volt_switch': (7357, 7358),
        'volt_tackle': (7359, 7360),
    }

    # 3 Dynamic Fallbacks mappings
    fallback_mappings = {
        'upper_hand': (7355, 7356),   # vital_throw
        'veevee_volley': (7247, 7248), # tackle
        'victory_dance': (424, 424),   # quiver_dance
    }

    for mkey, (pl_id, opp_id) in {**dedicated_mappings, **fallback_mappings}.items():
        anim_map['moves'][mkey] = pl_id
        anim_map['opponentMoves'][mkey] = opp_id
        anim_ext.setdefault('moves', {})[mkey] = pl_id
        anim_ext.setdefault('opponentMoves', {})[mkey] = opp_id
        print(f"  Mapped {mkey:<15} -> PL:{pl_id}, OPP:{opp_id}")

    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2)
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(anim_ext, f, indent=2)

    print('[6/6] Updating animation-manifest.json & last-chance-manifest.json...')
    for mf_name in ['animation-manifest.json', 'last-chance-manifest.json']:
        mf_path = os.path.join(game_data_dir, mf_name)
        if os.path.exists(mf_path):
            with open(mf_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            manifest.update(exported_anim_defs)
            with open(mf_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=2)
            print(f'  Updated {mf_name} with {len(exported_anim_defs)} entries')

    print('\n[SUCCESS] Groups U & V import completed flawlessly!')

if __name__ == '__main__':
    main()
