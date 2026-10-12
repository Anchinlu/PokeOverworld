#!/usr/bin/env python3
"""
Importer for Pokémon Essentials / EBDX animations into TypeScript JSON formats.
Reads:
  - Data/PkmnAnimations.rxdata
  - Data/move2anim.dat
  - Data/animationmap.ebdx
  - Graphics/Animations/*

Outputs:
  - packages/game-data/animations/definitions.json (or per-move json)
  - packages/game-data/move-animation-map.json
  - packages/game-data/animation-fallbacks.json
  - packages/game-data/animation-atlas.json
"""

import os
import sys
import json
import glob
from PIL import Image

import rubymarshal.reader as r
from rubymarshal.constants import *

def patch_reader():
    """Patches rubymarshal.Reader to correctly parse subclassed arrays and ivars in rxdata."""
    def read_patched(self, in_ivar=False):
        token = self.fd.read(1)
        if not token:
            return None
        object_index = None
        if token in (
            TYPE_CLASS,
            TYPE_MODULE,
            TYPE_FLOAT,
            TYPE_BIGNUM,
            TYPE_STRING,
            TYPE_REGEXP,
            TYPE_ARRAY,
            TYPE_HASH,
            TYPE_STRUCT,
            TYPE_OBJECT,
            TYPE_DATA,
            TYPE_USRMARSHAL,
            TYPE_USERDEF,
        ):
            object_index = len(self.objects)
            self.objects.append(None)

        if token == TYPE_NIL:
            result = None
        elif token == TYPE_TRUE:
            result = True
        elif token == TYPE_FALSE:
            result = False
        elif token == TYPE_IVAR:
            result = self.read(in_ivar=True)
        elif token == TYPE_STRING:
            result = self.read_blob()
        elif token == TYPE_SYMBOL:
            result = self.read_symreal()
        elif token == TYPE_FIXNUM:
            result = self.read_long()
        elif token == TYPE_ARRAY:
            num_elements = self.read_long()
            result = []
            if object_index is not None:
                self.objects[object_index] = result
            for _ in range(num_elements):
                result.append(self.read())
        elif token == TYPE_HASH:
            num_elements = self.read_long()
            result = {}
            if object_index is not None:
                self.objects[object_index] = result
            for _ in range(num_elements):
                key = self.ensure_hashable(self.read())
                result[key] = self.read()
        elif token == TYPE_FLOAT:
            floatn = self.read_blob().split(b'\0')
            result = float(floatn[0].decode('utf-8'))
        elif token == TYPE_BIGNUM:
            sign = 1 if self.fd.read(1) == b'+' else -1
            num_elements = self.read_long()
            result = 0
            factor = 1
            for _ in range(num_elements):
                result += self.read_short() * factor
                factor *= 2**16
            result *= sign
        elif token == TYPE_REGEXP:
            result = self.read_blob()
            _ = ord(self.fd.read(1))
        elif token == TYPE_USRMARSHAL:
            class_symbol = self.read()
            attr_list = self.read()
            result = self.registry.get(class_symbol.name, r.UsrMarshal)(class_symbol.name)
            result.marshal_load(attr_list)
        elif token == TYPE_SYMLINK:
            result = self.read_symlink()
        elif token == TYPE_LINK:
            result = self.objects[self.read_long()]
        elif token == TYPE_USERDEF:
            class_symbol = self.read()
            private_data = self.read_blob()
            result = self.registry.get(class_symbol.name, r.UserDef)(class_symbol.name)
            result._load(private_data)
        elif token == TYPE_MODULE:
            result = r.Module(self.read_blob().decode(), None)
        elif token == TYPE_OBJECT:
            class_symbol = self.read()
            result = self.registry.get(class_symbol.name, r.RubyObject)(class_symbol.name, {})
            if object_index is not None:
                self.objects[object_index] = result
            result.attributes = self.read_attributes()
        elif token == TYPE_EXTENDED:
            result = r.Extended(self.read_blob(), None)
        elif token == TYPE_CLASS:
            result = r.RubyObject
        elif token == TYPE_UCLASS:
            class_name = self.read()
            result = self.read()
            if in_ivar:
                name_str = class_name.name if hasattr(class_name, 'name') else str(class_name)
                result_obj = r.RubyObject(name_str, self.read_attributes())
                result_obj.elements = result
                return result_obj
            return result
        else:
            raise ValueError('token %s is not recognized' % token)

        if in_ivar:
            attributes = self.read_attributes()
            if hasattr(result, 'attributes'):
                result.attributes = attributes
        return result

    r.Reader.read = read_patched

patch_reader()

# Load canonical moves database to map Essentials symbol names (e.g. HYDROPUMP) to project snake_case IDs (hydro_pump)
MOVES_DB_PATH = os.path.join(r'e:\Pokemon', 'packages', 'game-data', 'moves-db.json')
CANONICAL_LOOKUP = {}
if os.path.exists(MOVES_DB_PATH):
    try:
        with open(MOVES_DB_PATH, 'r', encoding='utf-8') as f:
            raw_db = json.load(f)
            moves_dict = raw_db.get('moves', raw_db)
            for m_id in moves_dict.keys():
                c = m_id.lower().replace('_', '').replace('-', '')
                CANONICAL_LOOKUP[c] = m_id
    except Exception as err:
        print('Warning loading moves-db.json:', err)

def normalize_key(symbol_or_str):
    """Normalizes symbol or string into snake_case move id matching project convention."""
    if hasattr(symbol_or_str, 'name'):
        s = symbol_or_str.name
    elif isinstance(symbol_or_str, bytes):
        s = symbol_or_str.decode('utf-8', errors='ignore')
    else:
        s = str(symbol_or_str)

    compact = s.strip().lower().replace('_', '').replace('-', '')
    return CANONICAL_LOOKUP.get(compact, s.strip().lower())

ANIM_FOCUS_MAP = {
    1: 'target',
    2: 'user',
    3: 'both',
    4: 'screen',
}

BLEND_MODE_MAP = {
    0: 'normal',
    1: 'additive',
    2: 'multiply',
}

def parse_cel(cel_array):
    if not cel_array or len(cel_array) == 0:
        return None
    # Cel indices from AnimFrame
    # X=0, Y=1, ZOOMX=2, ANGLE=3, MIRROR=4, BLENDTYPE=5, VISIBLE=6, PATTERN=7, OPACITY=8,
    # ZOOMY=11, COLORRED=12..15, TONERED=16..19, FLASHRED=21..24, PRIORITY=25, FOCUS=26
    def get_val(idx, default=0):
        if idx < len(cel_array) and cel_array[idx] is not None:
            return cel_array[idx]
        return default

    pattern = get_val(7, -1)
    if pattern is None or pattern == -1 or pattern == -2:
        # Pattern < 0 denotes battler placeholder (user=-1, target=-2)
        # We preserve it with isBattler flag if pattern < 0
        pass

    focus_code = get_val(26, 4)
    focus = ANIM_FOCUS_MAP.get(focus_code, 'screen')
    blend_code = get_val(5, 0)
    blend_mode = BLEND_MODE_MAP.get(blend_code, 'normal')

    raw_x = cel_array[0] if len(cel_array) > 0 else None
    raw_y = cel_array[1] if len(cel_array) > 1 else None

    # Essentials stores omitted coordinates as nil for many
    # user-and-target cels. Keep the missing-axis markers here and restore
    # them after the complete animation timeline is available.
    cel_x = raw_x if raw_x is not None else 0
    cel_y = raw_y if raw_y is not None else 0

    cel = {
        'pattern': pattern,
        'x': cel_x,
        'y': cel_y,
        'zoomX': get_val(2, 100),
        'zoomY': get_val(11, get_val(2, 100)),
        'angle': get_val(3, 0),
        'mirror': bool(get_val(4, 0)),
        'opacity': get_val(8, 255),
        'blendMode': blend_mode,
        'visible': bool(get_val(6, 1)),
        'priority': get_val(25, 1),
        'focus': focus,
        '_sourceXMissing': raw_x is None,
        '_sourceYMissing': raw_y is None,
    }

    # Optional color / tone / flash
    cr = get_val(12, 0)
    cg = get_val(13, 0)
    cb = get_val(14, 0)
    ca = get_val(15, 0)
    if ca > 0:
        cel['color'] = [cr, cg, cb, ca]

    fr = get_val(21, 0)
    fg = get_val(22, 0)
    fb = get_val(23, 0)
    fa = get_val(24, 0)
    if fa > 0:
        cel['flash'] = [fr, fg, fb, fa]

    return cel


def normalize_both_focus_coordinates(frames):
    """Restore missing user/target cel coordinates as a smooth trajectory."""
    canonical_user = (128.0, 224.0)
    canonical_target = (384.0, 96.0)
    known_progress = {}

    for frame_index, frame in enumerate(frames):
        progress_values = []
        for cel in frame.get('cels', []):
            if cel.get('focus') != 'both':
                continue
            if cel.get('_sourceXMissing') or cel.get('_sourceYMissing'):
                continue
            x = float(cel['x'])
            y = float(cel['y'])
            progress_x = (x - canonical_user[0]) / (canonical_target[0] - canonical_user[0])
            progress_y = (y - canonical_user[1]) / (canonical_target[1] - canonical_user[1])
            progress_values.append((progress_x + progress_y) / 2)
        if progress_values:
            known_progress[frame_index] = sum(progress_values) / len(progress_values)

    def frame_progress(frame_index, frame_count):
        if not known_progress:
            return frame_index / max(1, frame_count - 1)

        lower = max((i for i in known_progress if i < frame_index), default=None)
        upper = min((i for i in known_progress if i > frame_index), default=None)
        if frame_index in known_progress:
            return known_progress[frame_index]
        if lower is None:
            first = min(known_progress)
            return known_progress[first] * frame_index / max(1, first)
        if upper is None:
            last = max(known_progress)
            tail_length = max(1, frame_count - 1 - last)
            return known_progress[last] + (1 - known_progress[last]) * (frame_index - last) / tail_length
        span = upper - lower
        ratio = (frame_index - lower) / span
        return known_progress[lower] + (known_progress[upper] - known_progress[lower]) * ratio

    frame_count = len(frames)
    for frame_index, frame in enumerate(frames):
        fallback_progress = frame_progress(frame_index, frame_count)
        for cel in frame.get('cels', []):
            if cel.get('focus') != 'both':
                cel.pop('_sourceXMissing', None)
                cel.pop('_sourceYMissing', None)
                continue

            missing_x = cel.pop('_sourceXMissing', False)
            missing_y = cel.pop('_sourceYMissing', False)
            if missing_x and missing_y:
                cel['x'] = canonical_user[0] + fallback_progress * (
                    canonical_target[0] - canonical_user[0]
                )
                cel['y'] = canonical_user[1] + fallback_progress * (
                    canonical_target[1] - canonical_user[1]
                )
            elif missing_x:
                cel['x'] = canonical_user[0] + (
                    (float(cel['y']) - canonical_user[1])
                    / (canonical_target[1] - canonical_user[1])
                ) * (canonical_target[0] - canonical_user[0])
            elif missing_y:
                cel['y'] = canonical_user[1] + (
                    (float(cel['x']) - canonical_user[0])
                    / (canonical_target[0] - canonical_user[0])
                ) * (canonical_target[1] - canonical_user[1])

def parse_timing(timing_obj):
    if not hasattr(timing_obj, 'attributes'):
        return None
    attrs = timing_obj.attributes
    # Attributes in PBAnimTiming:
    # @frame, @name, @volume, @pitch, @flashScope, @flashColor, @flashDuration
    frame = attrs.get('@frame', 0)
    sound_name = attrs.get('@name', '')
    if isinstance(sound_name, bytes):
        sound_name = sound_name.decode('utf-8', errors='ignore')

    timing_type = 'sound' if sound_name else 'flash'
    payload = {}
    if sound_name:
        payload['sound'] = sound_name
        payload['volume'] = attrs.get('@volume', 80)
        payload['pitch'] = attrs.get('@pitch', 100)

    flash_scope = attrs.get('@flashScope', 0)
    if flash_scope and flash_scope > 0:
        timing_type = 'flash'
        payload['flashScope'] = flash_scope
        payload['flashDuration'] = attrs.get('@flashDuration', 5)
        # flashColor is Color object or array
        fc = attrs.get('@flashColor')
        if fc:
            if hasattr(fc, 'attributes'):
                # Color object
                c_attrs = fc.attributes
                payload['flashColor'] = [
                    c_attrs.get('@red', 255),
                    c_attrs.get('@green', 255),
                    c_attrs.get('@blue', 255),
                    c_attrs.get('@alpha', 255),
                ]
            elif isinstance(fc, (list, tuple)):
                payload['flashColor'] = list(fc)

    return {
        'frame': frame,
        'type': timing_type,
        'payload': payload,
    }

def main():
    source_root = r'E:\Pokemon spries\Pokemon Reunion EX Trilogy 4.2'
    data_dir = os.path.join(source_root, 'Data')
    anims_rxdata_path = os.path.join(data_dir, 'PkmnAnimations.rxdata')
    move2anim_dat_path = os.path.join(data_dir, 'move2anim.dat')
    animmap_ebdx_path = os.path.join(data_dir, 'animationmap.ebdx')

    out_base = r'e:\Pokemon'
    game_data_dir = os.path.join(out_base, 'packages', 'game-data')
    anims_out_dir = os.path.join(game_data_dir, 'animations')
    os.makedirs(anims_out_dir, exist_ok=True)

    print('[1/5] Loading move2anim.dat...')
    with open(move2anim_dat_path, 'rb') as f:
        m2a_raw = r.load(f)

    # m2a_raw is [regular_dict, opp_dict]
    reg_moves = {}
    opp_moves = {}
    if isinstance(m2a_raw, list) and len(m2a_raw) >= 2:
        for k, v in m2a_raw[0].items():
            reg_moves[normalize_key(k)] = v
        for k, v in m2a_raw[1].items():
            opp_moves[normalize_key(k)] = v

    print(f'  Loaded {len(reg_moves)} regular move mappings, {len(opp_moves)} opponent move mappings.')

    print('[2/5] Loading animationmap.ebdx & Type Fallbacks...')
    fallbacks = {
        'NORMAL': {'physicalmove': 'tackle', 'specialmove': 'swift', 'statusmove': 'growl'},
        'FIRE': {'physicalmove': 'fire_punch', 'specialmove': 'flamethrower', 'statusmove': 'will_o_wisp'},
        'WATER': {'physicalmove': 'water_pulse', 'specialmove': 'water_gun', 'statusmove': 'rain_dance'},
        'ELECTRIC': {'physicalmove': 'thunder_punch', 'specialmove': 'thunderbolt', 'statusmove': 'thunder_wave'},
        'GRASS': {'physicalmove': 'razor_leaf', 'specialmove': 'mega_drain', 'statusmove': 'spore'},
        'ICE': {'physicalmove': 'ice_punch', 'specialmove': 'icy_wind', 'statusmove': 'hail'},
        'FIGHTING': {'physicalmove': 'double_kick', 'specialmove': 'close_combat', 'statusmove': 'bulk_up'},
        'POISON': {'physicalmove': 'poison_tail', 'specialmove': 'sludge_bomb', 'statusmove': 'poison_gas'},
        'GROUND': {'physicalmove': 'sandattack', 'specialmove': 'sandstorm', 'statusmove': 'sandattack'},
        'FLYING': {'physicalmove': 'wing_attack', 'specialmove': 'gust', 'statusmove': 'whirlwind'},
        'PSYCHIC': {'physicalmove': 'psycho_cut', 'specialmove': 'psychic', 'statusmove': 'amnesia'},
        'BUG': {'physicalmove': 'x_scissor', 'specialmove': 'signal_beam', 'statusmove': 'string_shot'},
        'ROCK': {'physicalmove': 'rock_throw', 'specialmove': 'ancientpower', 'statusmove': 'stealth_rock'},
        'GHOST': {'physicalmove': 'shadow_ball', 'specialmove': 'shadow_ball', 'statusmove': 'confuse_ray'},
        'DRAGON': {'physicalmove': 'dragon_claw', 'specialmove': 'dragon_rage', 'statusmove': 'dragon_dance'},
        'STEEL': {'physicalmove': 'iron_head', 'specialmove': 'metal_claw', 'statusmove': 'harden'},
        'DARK': {'physicalmove': 'bite', 'specialmove': 'crunch', 'statusmove': 'fake_tears'},
    }

    try:
        with open(animmap_ebdx_path, 'rb') as f:
            ebdx_raw = r.load(f)
        if isinstance(ebdx_raw, dict):
            for type_key, type_val in ebdx_raw.items():
                t_str = normalize_key(type_key).upper()
                if t_str not in fallbacks:
                    fallbacks[t_str] = {}
                if isinstance(type_val, dict):
                    for sub_k, sub_v in type_val.items():
                        if isinstance(sub_v, dict):
                            for cat_key, move_list in sub_v.items():
                                c_str = normalize_key(cat_key)
                                if isinstance(move_list, list) and len(move_list) > 0:
                                    cand = normalize_key(move_list[0])
                                    if cand in reg_moves:
                                        if c_str in ['physicalmove', 'specialmove', 'statusmove']:
                                            fallbacks[t_str][c_str] = cand
    except Exception as ebdx_err:
        print(f'  Notice: EBDX parse fallback used ({ebdx_err})')

    print(f'  Loaded fallback maps for {len(fallbacks)} types.')

    print('[3/5] Loading PkmnAnimations.rxdata...')
    with open(anims_rxdata_path, 'rb') as f:
        raw_anims = r.load(f)

    anim_list = raw_anims.attributes.get('@array', [])
    print(f'  Total raw animation entries: {len(anim_list)}')

    parsed_animations = {}
    used_graphics = set()

    for idx, anim in enumerate(anim_list):
        if not anim or not hasattr(anim, 'attributes'):
            continue
        attrs = anim.attributes
        name = attrs.get('@name', '')
        if isinstance(name, bytes):
            name = name.decode('utf-8', errors='ignore')
        graphic = attrs.get('@graphic', '')
        if isinstance(graphic, bytes):
            graphic = graphic.decode('utf-8', errors='ignore')

        if graphic:
            used_graphics.add(graphic)

        raw_frames = attrs.get('@array', [])
        frames = []
        for f in raw_frames:
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = parse_cel(cel_data)
                    if cel is not None:
                        cels.append(cel)
            frames.append({'cels': cels})

        normalize_both_focus_coordinates(frames)

        raw_timings = attrs.get('@timing', [])
        timings = []
        for t in raw_timings:
            t_obj = parse_timing(t)
            if t_obj:
                timings.append(t_obj)

        anim_id = attrs.get('@id', idx)
        parsed_animations[str(idx)] = {
            'id': str(idx),
            'name': name,
            'graphic': graphic,
            'hue': attrs.get('@hue', 0),
            'position': attrs.get('@position', 4),
            'fps': 20, # Essentials animations run at 20 fps default speed
            'frames': frames,
            'timings': timings,
        }

    print(f'  Parsed {len(parsed_animations)} animation definitions.')

    print('[4/5] Building Atlas Metadata...')
    # Check images across graphics folders
    search_dirs = [
        os.path.join(source_root, 'Graphics', 'Animations'),
        os.path.join(source_root, 'Graphics', 'Battle animations'),
        os.path.join(source_root, 'Graphics', 'EBDX', 'Animations'),
        os.path.join(out_base, 'Graphics', 'Animations'),
    ]

    atlas = {}
    for g in sorted(list(used_graphics)):
        found_path = None
        for d in search_dirs:
            p = os.path.join(d, g + '.png')
            if os.path.exists(p):
                found_path = p
                break
            # Case-insensitive search on Windows
            for actual_f in glob.glob(os.path.join(d, '*')):
                if os.path.basename(actual_f).lower() == (g + '.png').lower():
                    found_path = actual_f
                    break
            if found_path:
                break

        if found_path:
            try:
                with Image.open(found_path) as im:
                    w, h = im.size
                # Default cell width is 192 for 5-column sheets, or dynamic if width differs
                cell_w = 192
                cell_h = 192
                cols = w // cell_w if w >= cell_w else 1
                rows = h // cell_h if h >= cell_h else 1
                if cols == 0:
                    cols = 1
                if rows == 0:
                    rows = 1
                max_pattern = cols * rows

                atlas[g] = {
                    'assetKey': f'animation.{g.lower()}',
                    'file': os.path.basename(found_path),
                    'width': w,
                    'height': h,
                    'cellWidth': cell_w,
                    'cellHeight': cell_h,
                    'columns': cols,
                    'rows': rows,
                    'maxPattern': max_pattern,
                }
            except Exception as err:
                print(f'  Warning reading image {found_path}: {err}')
        else:
            atlas[g] = {
                'assetKey': f'animation.{g.lower()}',
                'file': g + '.png',
                'width': 960,
                'height': 960,
                'cellWidth': 192,
                'cellHeight': 192,
                'columns': 5,
                'rows': 5,
                'maxPattern': 25,
                'missingOnDisk': True,
            }

    print(f'  Generated atlas entries for {len(atlas)} spritesheets.')

    print('[5/5] Writing JSON output files...')
    # 1. move-animation-map.json
    map_payload = {
        'moves': reg_moves,
        'opponentMoves': opp_moves,
    }
    with open(os.path.join(game_data_dir, 'move-animation-map.json'), 'w', encoding='utf-8') as f:
        json.dump(map_payload, f, indent=2, ensure_ascii=False)

    # 2. animation-fallbacks.json
    with open(os.path.join(game_data_dir, 'animation-fallbacks.json'), 'w', encoding='utf-8') as f:
        json.dump(fallbacks, f, indent=2, ensure_ascii=False)

    # 3. animation-atlas.json
    with open(os.path.join(game_data_dir, 'animation-atlas.json'), 'w', encoding='utf-8') as f:
        json.dump(atlas, f, indent=2, ensure_ascii=False)

    # 4. per-animation JSONs in packages/game-data/animations/{id}.json
    manifest = {}
    for anim_id, anim_data in parsed_animations.items():
        manifest[anim_id] = {
            'id': anim_id,
            'name': anim_data['name'],
            'graphic': anim_data['graphic'],
            'position': anim_data['position'],
            'frameCount': len(anim_data['frames']),
            'timingCount': len(anim_data['timings']),
        }
        single_path = os.path.join(anims_out_dir, f'{anim_id}.json')
        with open(single_path, 'w', encoding='utf-8') as f:
            json.dump(anim_data, f, ensure_ascii=False)

    with open(os.path.join(anims_out_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    # Remove monolithic definitions.json if present
    monolith = os.path.join(anims_out_dir, 'definitions.json')
    if os.path.exists(monolith):
        os.remove(monolith)

    print(f'DONE! Successfully exported {len(parsed_animations)} animation files to packages/game-data/animations/.')

if __name__ == '__main__':
    main()
