#!/usr/bin/env python3
"""
Importer for Pokémon Unbreakable Ties 4.1.2 T Group (Batch 1) Battle Animations.
32 moves handled (50 dedicated animation definitions: IDs 7247..7296) + 6 Fallbacks & 1 Alias:
  1. tackle (Target IDs: 7247 PL / 7248 OPP) - Normal Physical (PRAS- Strike.png, 7 frames)
  2. tail_glow (Target IDs: 7249 PL / 7250 OPP) - Bug Status (PRAS- Tail Glow.png, 44 frames)
  3. tail_slap (Target IDs: 7251 PL / 7252 OPP) - Normal Physical (PRAS- Tail slap.png, 12 frames)
  4. tail_whip (Target IDs: 7253 PL / 7254 OPP) - Normal Status (PRAS- Tail Glow.png, 25 frames)
  5. tailwind (Target IDs: 7255 PL / 7256 OPP) - Flying Status (PRAS- Tailwind.png, 50 frames)
  6. take_down (Target IDs: 7257 PL / 7258 OPP) - Normal Physical (PRAS- Strike.png, 20 frames)
  7. tar_shot (Target IDs: 7259 PL / 7260 OPP) - Rock Status (GEN8- Tar Shot.png, 27 frames)
  8. taunt (Target IDs: 7261 PL / 7262 OPP) - Dark Status (PRAS- Taunt.png, 34 frames)
  9. tearful_look (Target IDs: 7263 PL / 7264 OPP) - Normal Status (PRAS- Baby Doll Eyes.png, 30 frames)
  10. teatime (Target IDs: 7265 PL / 7266 OPP) - Normal Status (GEN8- Tea Time.png, 48 frames)
  11. techno_blast (Target IDs: 7267 PL / 7268 OPP) - Normal Special (PRAS- Techno Blast.png, 70 frames)
  12. teeter_dance (Target IDs: 7269 PL / 7270 OPP) - Normal Status (PRAS- Sound.png, 30 frames)
  13. telekinesis (Target IDs: 7271 PL / 7272 OPP) - Psychic Status (PRAS- Soft Boil.png, 30 frames)
  14. teleport (Target IDs: 7273 PL / 7274 OPP) - Psychic Status (PRAS- Teleport.png, 21 frames)
  15. terrain_pulse (Target IDs: 7275 PL / 7276 OPP) - Normal Special (PRAS- Soft Boil.png, 16 frames)
  16. thief (Target IDs: 7277 PL / 7278 OPP) - Dark Physical (PRAS- Strike.png / PRAS- Thief.png, 20 frames)
  17. thousand_arrows (Target IDs: 7279 PL / 7280 OPP) - Ground Physical (PRAS- ThousandWA.png, 82 frames)
  18. thousand_waves (Target IDs: 7281 PL / 7282 OPP) - Ground Physical (PRAS- ThousandWA.png, 80 frames)
  19. thrash (Target IDs: 7283 PL / 7284 OPP) - Normal Physical (PRAS- Strike.png, 30 frames)
  20. throat_chop (Target IDs: 7285 PL / 7286 OPP) - Dark Physical (PRAS- Sound.png, 37 frames)
  21. thunder (Target IDs: 7287 PL / 7288 OPP) - Electric Special (PRAS- Electric.png, 46 frames)
  22. thunder_cage (Target IDs: 7289 PL / 7290 OPP) - Electric Special (GEN8- Thundercage.png, 25 frames)
  23. thunder_fang (Target IDs: 7291 PL / 7292 OPP) - Electric Physical (PRAS- Elemental Fangs.png, 15 frames)
  24. thunder_punch (Target IDs: 7293 PL / 7294 OPP) - Electric Physical (PRAS- Elemental Punch.png, 25 frames)
  25. thunder_shock (Target IDs: 7295 PL / 7296 OPP) - Electric Special (PRAS- Electric.png, 20 frames)
  26. thundershock (Alias -> 7295 PL / 7296 OPP)

Fallbacks:
  - tachyon_cutter -> metal_claw (176)
  - take_heart -> calm_mind (59)
  - tectonic_rage -> earth_power (97)
  - temper_flare -> flame_charge (6786 PL / 6787 OPP)
  - tera_blast -> swift (7240 PL / 7241 OPP)
  - tera_starstorm -> hyper_beam (144)
"""

import os
import sys
import json
import shutil
import copy
import math
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

def build_thief_animation(is_opp=False):
    """Builds an authentic Thief animation with Dark strike & stolen item bag trajectory."""
    # User / Target positions
    user_x = 384 if is_opp else 128
    user_y = 96 if is_opp else 224
    tgt_x = 128 if is_opp else 384
    tgt_y = 224 if is_opp else 96
    
    frames = []
    # 20 frames total
    for f in range(20):
        cels = []
        # Battler user
        u_cel = {
            'pattern': -1,
            'x': user_x,
            'y': user_y,
            'zoomX': 100,
            'zoomY': 100,
            'angle': 0,
            'mirror': is_opp,
            'opacity': 255,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'user'
        }
        # Battler target
        t_cel = {
            'pattern': -2,
            'x': tgt_x,
            'y': tgt_y,
            'zoomX': 100,
            'zoomY': 100,
            'angle': 0,
            'mirror': not is_opp,
            'opacity': 255,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'target'
        }
        
        # Phase 1: Fast dash and dark shadow approach (Frames 0..6)
        if f <= 6:
            progress = f / 6.0
            # Dash shadow toward target
            dash_x = int(user_x + (tgt_x - user_x) * progress * 0.75)
            dash_y = int(user_y + (tgt_y - user_y) * progress * 0.75)
            cels.append({
                'pattern': 0, # Strike particle
                'x': dash_x,
                'y': dash_y,
                'zoomX': int(80 + progress * 40),
                'zoomY': int(80 + progress * 40),
                'angle': int(progress * 45) if not is_opp else int(-progress * 45),
                'mirror': is_opp,
                'opacity': int(progress * 220),
                'blendMode': 'additive',
                'visible': True,
                'priority': 1,
                'focus': 'target'
            })
        
        # Phase 2: Impact slash & Item Snatch (Frames 7..12)
        if 7 <= f <= 13:
            # Shake target
            shake = 6 if f % 2 == 1 else -6
            t_cel['x'] += shake
            
            # Strike claws
            cels.append({
                'pattern': 1 if f < 10 else 2,
                'x': tgt_x,
                'y': tgt_y,
                'zoomX': 120,
                'zoomY': 120,
                'angle': -15 if not is_opp else 15,
                'mirror': is_opp,
                'opacity': 240,
                'blendMode': 'normal',
                'visible': True,
                'priority': 1,
                'focus': 'target'
            })
            
        # Phase 3: Stolen pouch/loot swooping back to user (Frames 10..19)
        if f >= 10:
            ret_prog = (f - 10) / 9.0
            pouch_x = int(tgt_x + (user_x - tgt_x) * ret_prog)
            arc_y = -35 * (4 * ret_prog * (1 - ret_prog)) # Parabolic hop
            pouch_y = int(tgt_y + (user_y - tgt_y) * ret_prog + arc_y)
            
            cels.append({
                'pattern': 0, # Shiny pouch speckle
                'x': pouch_x,
                'y': pouch_y,
                'zoomX': int(110 - ret_prog * 20),
                'zoomY': int(110 - ret_prog * 20),
                'angle': int(ret_prog * 360) if not is_opp else int(-ret_prog * 360),
                'mirror': is_opp,
                'opacity': int(255 - ret_prog * 60),
                'blendMode': 'additive',
                'visible': True,
                'priority': 1,
                'focus': 'both'
            })
            
        cels.insert(0, u_cel)
        cels.insert(1, t_cel)
        frames.append({'cels': cels})
        
    timings = [
        {'frame': 0, 'type': 'sound', 'payload': {'sound': 'Darkness6.ogg', 'volume': 80, 'pitch': 100}},
        {'frame': 7, 'type': 'sound', 'payload': {'sound': 'Blow6.ogg', 'volume': 85, 'pitch': 100}},
        {'frame': 11, 'type': 'sound', 'payload': {'sound': 'PRSFX- Switcheroo.wav', 'volume': 75, 'pitch': 110}}
    ]
    
    return {
        'graphic': 'PRAS- Strike.png',
        'hue': 0,
        'position': 2,
        'fps': 20,
        'frames': frames,
        'timings': timings
    }

def build_teeter_dance_animation(is_opp=False):
    """Builds Teeter Dance animation with dizzy musical notes and swirling confusion stars."""
    frames = []
    tgt_x = 128 if is_opp else 384
    tgt_y = 224 if is_opp else 96
    user_x = 384 if is_opp else 128
    user_y = 96 if is_opp else 224
    
    for f in range(30):
        cels = []
        # Battler user swaying
        sway_u = 8 if (f // 3) % 2 == 0 else -8
        cels.append({
            'pattern': -1,
            'x': user_x + sway_u,
            'y': user_y,
            'zoomX': 100,
            'zoomY': 100,
            'angle': sway_u * 2,
            'mirror': is_opp,
            'opacity': 255,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'user'
        })
        # Battler target swaying
        sway_t = -8 if (f // 3) % 2 == 0 else 8
        cels.append({
            'pattern': -2,
            'x': tgt_x + sway_t,
            'y': tgt_y,
            'zoomX': 100,
            'zoomY': 100,
            'angle': sway_t * 2,
            'mirror': not is_opp,
            'opacity': 255,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'target'
        })
        
        # Musical notes and dizzy waves around target
        angle = (f * 24) % 360
        rad = 36
        import math
        nx = int(tgt_x + rad * math.cos(math.radians(angle)))
        ny = int(tgt_y + (rad * 0.5) * math.sin(math.radians(angle)) - 25)
        cels.append({
            'pattern': (f // 3) % 5,
            'x': nx,
            'y': ny,
            'zoomX': 100,
            'zoomY': 100,
            'angle': angle,
            'mirror': is_opp,
            'opacity': 200,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'target'
        })
        frames.append({'cels': cels})
        
    timings = [
        {'frame': 0, 'type': 'sound', 'payload': {'sound': 'PRSFX- Teeter Dance.wav', 'volume': 80, 'pitch': 100}},
        {'frame': 14, 'type': 'sound', 'payload': {'sound': 'PRSFX- Teeter Dance.wav', 'volume': 80, 'pitch': 110}}
    ]
    return {
        'graphic': 'PRAS- Sound.png',
        'hue': 0,
        'position': 2,
        'fps': 20,
        'frames': frames,
        'timings': timings
    }

def build_telekinesis_animation(is_opp=False):
    """Builds Telekinesis animation with glowing psychic levitation circles."""
    frames = []
    tgt_x = 128 if is_opp else 384
    tgt_y = 224 if is_opp else 96
    user_x = 384 if is_opp else 128
    user_y = 96 if is_opp else 224
    
    for f in range(30):
        cels = []
        lift_y = int(-18 * math.sin(math.radians((f / 30.0) * 180)))
        cels.append({
            'pattern': -1,
            'x': user_x,
            'y': user_y,
            'zoomX': 100,
            'zoomY': 100,
            'angle': 0,
            'mirror': is_opp,
            'opacity': 255,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'user'
        })
        cels.append({
            'pattern': -2,
            'x': tgt_x,
            'y': tgt_y + lift_y,
            'zoomX': 100,
            'zoomY': 100,
            'angle': 0,
            'mirror': not is_opp,
            'opacity': 255,
            'blendMode': 'normal',
            'visible': True,
            'priority': 1,
            'focus': 'target'
        })
        
        # Psychic aura rings underneath target
        scale = int(70 + (f % 10) * 8)
        alpha = int(220 - (f % 10) * 18)
        cels.append({
            'pattern': 2,
            'x': tgt_x,
            'y': tgt_y + 10,
            'zoomX': scale,
            'zoomY': int(scale * 0.45),
            'angle': f * 12,
            'mirror': False,
            'opacity': alpha,
            'blendMode': 'additive',
            'visible': True,
            'priority': 0,
            'focus': 'target'
        })
        frames.append({'cels': cels})
        
    timings = [
        {'frame': 0, 'type': 'sound', 'payload': {'sound': 'PRSFX- Telekinesis.wav', 'volume': 80, 'pitch': 100}}
    ]
    return {
        'graphic': 'PRAS- Soft Boil.png',
        'hue': 0,
        'position': 2,
        'fps': 20,
        'frames': frames,
        'timings': timings
    }

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

    # Specification for T Group Batch 1 moves (25 moves with dedicated 50 animations: 7247..7296):
    t_specs = [
        # 1. tackle (7247 PL / 7248 OPP)
        {'rx_id': 136, 'tgt_id': 7247, 'name': 'Move:TACKLE', 'default_name': 'Tackle', 'move_key': 'tackle', 'is_opp': False},
        {'rx_id': 136, 'tgt_id': 7248, 'name': 'OppMove:TACKLE', 'default_name': 'Tackle (Opp)', 'move_key': 'tackle', 'is_opp': True, 'mirror_opp': True},
        # 2. tail_glow (7249 PL / 7250 OPP)
        {'rx_id': 201, 'tgt_id': 7249, 'name': 'Move:TAILGLOW', 'default_name': 'Tail Glow', 'move_key': 'tail_glow', 'is_opp': False},
        {'rx_id': 202, 'tgt_id': 7250, 'name': 'OppMove:TAILGLOW', 'default_name': 'Tail Glow (Opp)', 'move_key': 'tail_glow', 'is_opp': True},
        # 3. tail_slap (7251 PL / 7252 OPP)
        {'rx_id': 783, 'tgt_id': 7251, 'name': 'Move:TAILSLAP', 'default_name': 'Tail Slap', 'move_key': 'tail_slap', 'is_opp': False},
        {'rx_id': 783, 'tgt_id': 7252, 'name': 'OppMove:TAILSLAP', 'default_name': 'Tail Slap (Opp)', 'move_key': 'tail_slap', 'is_opp': True, 'mirror_opp': True},
        # 4. tail_whip (7253 PL / 7254 OPP)
        {'rx_id': 255, 'tgt_id': 7253, 'name': 'Move:TAILWHIP', 'default_name': 'Tail Whip', 'move_key': 'tail_whip', 'is_opp': False},
        {'rx_id': 255, 'tgt_id': 7254, 'name': 'OppMove:TAILWHIP', 'default_name': 'Tail Whip (Opp)', 'move_key': 'tail_whip', 'is_opp': True, 'mirror_opp': True},
        # 5. tailwind (7255 PL / 7256 OPP)
        {'rx_id': 724, 'tgt_id': 7255, 'name': 'Move:TAILWIND', 'default_name': 'Tailwind', 'move_key': 'tailwind', 'is_opp': False},
        {'rx_id': 725, 'tgt_id': 7256, 'name': 'OppMove:TAILWIND', 'default_name': 'Tailwind (Opp)', 'move_key': 'tailwind', 'is_opp': True},
        # 6. take_down (7257 PL / 7258 OPP)
        {'rx_id': 602, 'tgt_id': 7257, 'name': 'Move:TAKEDOWN', 'default_name': 'Take Down', 'move_key': 'take_down', 'is_opp': False},
        {'rx_id': 603, 'tgt_id': 7258, 'name': 'OppMove:TAKEDOWN', 'default_name': 'Take Down (Opp)', 'move_key': 'take_down', 'is_opp': True},
        # 7. tar_shot (7259 PL / 7260 OPP)
        {'rx_id': 1298, 'tgt_id': 7259, 'name': 'Move:TARSHOT', 'default_name': 'Tar Shot', 'move_key': 'tar_shot', 'is_opp': False},
        {'rx_id': 1299, 'tgt_id': 7260, 'name': 'OppMove:TARSHOT', 'default_name': 'Tar Shot (Opp)', 'move_key': 'tar_shot', 'is_opp': True},
        # 8. taunt (7261 PL / 7262 OPP)
        {'rx_id': 513, 'tgt_id': 7261, 'name': 'Move:TAUNT', 'default_name': 'Taunt', 'move_key': 'taunt', 'is_opp': False},
        {'rx_id': 514, 'tgt_id': 7262, 'name': 'OppMove:TAUNT', 'default_name': 'Taunt (Opp)', 'move_key': 'taunt', 'is_opp': True},
        # 9. tearful_look (7263 PL / 7264 OPP)
        {'rx_id': 1068, 'tgt_id': 7263, 'name': 'Move:TEARFULLOOK', 'default_name': 'Tearful Look', 'move_key': 'tearful_look', 'is_opp': False},
        {'rx_id': 1069, 'tgt_id': 7264, 'name': 'OppMove:TEARFULLOOK', 'default_name': 'Tearful Look (Opp)', 'move_key': 'tearful_look', 'is_opp': True},
        # 10. teatime (7265 PL / 7266 OPP)
        {'rx_id': 1297, 'tgt_id': 7265, 'name': 'Move:TEATIME', 'default_name': 'Teatime', 'move_key': 'teatime', 'is_opp': False},
        {'rx_id': 1297, 'tgt_id': 7266, 'name': 'OppMove:TEATIME', 'default_name': 'Teatime (Opp)', 'move_key': 'teatime', 'is_opp': True, 'mirror_opp': True},
        # 11. techno_blast (7267 PL / 7268 OPP)
        {'rx_id': 976, 'tgt_id': 7267, 'name': 'Move:TECHNOBLAST', 'default_name': 'Techno Blast', 'move_key': 'techno_blast', 'is_opp': False},
        {'rx_id': 977, 'tgt_id': 7268, 'name': 'OppMove:TECHNOBLAST', 'default_name': 'Techno Blast (Opp)', 'move_key': 'techno_blast', 'is_opp': True},
        # 12. teeter_dance (7269 PL / 7270 OPP)
        {'custom_builder': build_teeter_dance_animation, 'tgt_id': 7269, 'name': 'Move:TEETERDANCE', 'default_name': 'Teeter Dance', 'move_key': 'teeter_dance', 'is_opp': False},
        {'custom_builder': build_teeter_dance_animation, 'tgt_id': 7270, 'name': 'OppMove:TEETERDANCE', 'default_name': 'Teeter Dance (Opp)', 'move_key': 'teeter_dance', 'is_opp': True},
        # 13. telekinesis (7271 PL / 7272 OPP)
        {'custom_builder': build_telekinesis_animation, 'tgt_id': 7271, 'name': 'Move:TELEKINESIS', 'default_name': 'Telekinesis', 'move_key': 'telekinesis', 'is_opp': False},
        {'custom_builder': build_telekinesis_animation, 'tgt_id': 7272, 'name': 'OppMove:TELEKINESIS', 'default_name': 'Telekinesis (Opp)', 'move_key': 'telekinesis', 'is_opp': True},
        # 14. teleport (7273 PL / 7274 OPP)
        {'rx_id': 152, 'tgt_id': 7273, 'name': 'Move:TELEPORT', 'default_name': 'Teleport', 'move_key': 'teleport', 'is_opp': False},
        {'rx_id': 152, 'tgt_id': 7274, 'name': 'OppMove:TELEPORT', 'default_name': 'Teleport (Opp)', 'move_key': 'teleport', 'is_opp': True, 'mirror_opp': True},
        # 15. terrain_pulse (7275 PL / 7276 OPP)
        {'rx_id': 1332, 'tgt_id': 7275, 'name': 'Move:TERRAINPULSE', 'default_name': 'Terrain Pulse', 'move_key': 'terrain_pulse', 'is_opp': False},
        {'rx_id': 1332, 'tgt_id': 7276, 'name': 'OppMove:TERRAINPULSE', 'default_name': 'Terrain Pulse (Opp)', 'move_key': 'terrain_pulse', 'is_opp': True, 'mirror_opp': True},
        # 16. thief (7277 PL / 7278 OPP)
        {'custom_builder': build_thief_animation, 'tgt_id': 7277, 'name': 'Move:THIEF', 'default_name': 'Thief', 'move_key': 'thief', 'is_opp': False},
        {'custom_builder': build_thief_animation, 'tgt_id': 7278, 'name': 'OppMove:THIEF', 'default_name': 'Thief (Opp)', 'move_key': 'thief', 'is_opp': True},
        # 17. thousand_arrows (7279 PL / 7280 OPP)
        {'rx_id': 1120, 'tgt_id': 7279, 'name': 'Move:THOUSANDARROWS', 'default_name': 'Thousand Arrows', 'move_key': 'thousand_arrows', 'is_opp': False},
        {'rx_id': 1120, 'tgt_id': 7280, 'name': 'OppMove:THOUSANDARROWS', 'default_name': 'Thousand Arrows (Opp)', 'move_key': 'thousand_arrows', 'is_opp': True, 'mirror_opp': True},
        # 18. thousand_waves (7281 PL / 7282 OPP)
        {'rx_id': 1132, 'tgt_id': 7281, 'name': 'Move:THOUSANDWAVES', 'default_name': 'Thousand Waves', 'move_key': 'thousand_waves', 'is_opp': False},
        {'rx_id': 1132, 'tgt_id': 7282, 'name': 'OppMove:THOUSANDWAVES', 'default_name': 'Thousand Waves (Opp)', 'move_key': 'thousand_waves', 'is_opp': True, 'mirror_opp': True},
        # 19. thrash (7283 PL / 7284 OPP)
        {'rx_id': 604, 'tgt_id': 7283, 'name': 'Move:THRASH', 'default_name': 'Thrash', 'move_key': 'thrash', 'is_opp': False},
        {'rx_id': 604, 'tgt_id': 7284, 'name': 'OppMove:THRASH', 'default_name': 'Thrash (Opp)', 'move_key': 'thrash', 'is_opp': True, 'mirror_opp': True},
        # 20. throat_chop (7285 PL / 7286 OPP)
        {'rx_id': 916, 'tgt_id': 7285, 'name': 'Move:THROATCHOP', 'default_name': 'Throat Chop', 'move_key': 'throat_chop', 'is_opp': False},
        {'rx_id': 917, 'tgt_id': 7286, 'name': 'OppMove:THROATCHOP', 'default_name': 'Throat Chop (Opp)', 'move_key': 'throat_chop', 'is_opp': True},
        # 21. thunder (7287 PL / 7288 OPP)
        {'rx_id': 125, 'tgt_id': 7287, 'name': 'Move:THUNDER', 'default_name': 'Thunder', 'move_key': 'thunder', 'is_opp': False},
        {'rx_id': 125, 'tgt_id': 7288, 'name': 'OppMove:THUNDER', 'default_name': 'Thunder (Opp)', 'move_key': 'thunder', 'is_opp': True, 'mirror_opp': True},
        # 22. thunder_cage (7289 PL / 7290 OPP)
        {'rx_id': 1350, 'tgt_id': 7289, 'name': 'Move:THUNDERCAGE', 'default_name': 'Thunder Cage', 'move_key': 'thunder_cage', 'is_opp': False},
        {'rx_id': 1350, 'tgt_id': 7290, 'name': 'OppMove:THUNDERCAGE', 'default_name': 'Thunder Cage (Opp)', 'move_key': 'thunder_cage', 'is_opp': True, 'mirror_opp': True},
        # 23. thunder_fang (7291 PL / 7292 OPP)
        {'rx_id': 237, 'tgt_id': 7291, 'name': 'Move:THUNDERFANG', 'default_name': 'Thunder Fang', 'move_key': 'thunder_fang', 'is_opp': False},
        {'rx_id': 237, 'tgt_id': 7292, 'name': 'OppMove:THUNDERFANG', 'default_name': 'Thunder Fang (Opp)', 'move_key': 'thunder_fang', 'is_opp': True, 'mirror_opp': True},
        # 24. thunder_punch (7293 PL / 7294 OPP)
        {'rx_id': 99, 'tgt_id': 7293, 'name': 'Move:THUNDERPUNCH', 'default_name': 'Thunder Punch', 'move_key': 'thunder_punch', 'is_opp': False},
        {'rx_id': 99, 'tgt_id': 7294, 'name': 'OppMove:THUNDERPUNCH', 'default_name': 'Thunder Punch (Opp)', 'move_key': 'thunder_punch', 'is_opp': True, 'mirror_opp': True},
        # 25. thunder_shock (7295 PL / 7296 OPP)
        {'rx_id': 238, 'tgt_id': 7295, 'name': 'Move:THUNDERSHOCK', 'default_name': 'Thunder Shock', 'move_key': 'thunder_shock', 'is_opp': False},
        {'rx_id': 238, 'tgt_id': 7296, 'name': 'OppMove:THUNDERSHOCK', 'default_name': 'Thunder Shock (Opp)', 'move_key': 'thunder_shock', 'is_opp': True, 'mirror_opp': True},
    ]

    used_graphics = set()
    used_se_files = set()
    exported_anim_defs = {}

    print(f'[2/6] Parsing and exporting {len(t_specs)} animation definitions...')
    for spec in t_specs:
        tgt_id = spec['tgt_id']
        default_name = spec['default_name']
        is_opp = spec.get('is_opp', False)

        if 'custom_builder' in spec:
            anim_data = spec['custom_builder'](is_opp=is_opp)
            name = spec['name']
            graphic = anim_data['graphic']
            hue = anim_data['hue']
            position = anim_data['position']
            fps = anim_data['fps']
            frames = anim_data['frames']
            timings = anim_data['timings']
            used_graphics.add(graphic)
            for t in timings:
                s = t.get('payload', {}).get('sound')
                if s: used_se_files.add(s)
        else:
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
                ttype = t_attrs.get('@timingType') if '@timingType' in t_attrs else t_attrs.get(b'@timingType', 0)
                tname = t_attrs.get('@name') if '@name' in t_attrs else t_attrs.get(b'@name', b'')
                if isinstance(tname, bytes):
                    tname = tname.decode('utf-8', errors='ignore')

                se = t_attrs.get('@se') or t_attrs.get(b'@se')
                se_name = ''
                volume = 80
                pitch = 100
                if se and hasattr(se, 'attributes'):
                    se_attrs = se.attributes
                    se_name = se_attrs.get('@name') or se_attrs.get(b'@name', '')
                    if isinstance(se_name, bytes):
                        se_name = se_name.decode('utf-8', errors='ignore')
                    volume = se_attrs.get('@volume') or se_attrs.get(b'@volume', 80)
                    pitch = se_attrs.get('@pitch') or se_attrs.get(b'@pitch', 100)

                if se_name:
                    used_se_files.add(se_name)
                    timings.append({
                        'frame': frame,
                        'type': 'sound',
                        'payload': {
                            'sound': se_name,
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
        out_json_path = os.path.join(anims_out_dir, f'{tgt_id}.json')
        with open(out_json_path, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        # Save to packages/game-data/animations/last-chance/{tgt_id}.json
        lc_json_path = os.path.join(last_chance_dir, f'{tgt_id}.json')
        with open(lc_json_path, 'w', encoding='utf-8') as f:
            json.dump(anim_def, f, indent=2)

        exported_anim_defs[str(tgt_id)] = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'position': position,
            'frameCount': len(frames),
            'timingCount': len(timings)
        }

    print(f'  Successfully generated {len(exported_anim_defs)} animation definitions (7247..7296).')

    print('[3/6] Syncing Graphics Spritesheets & Registering Atlas Entries...')
    # Check images across graphics folders and sync to apps/web/public/Graphics/Animations
    atlas_path = os.path.join(game_data_dir, 'animation-atlas.json')
    lc_atlas_path = os.path.join(game_data_dir, 'last-chance-animation-atlas.json')
    with open(atlas_path, 'r', encoding='utf-8') as f:
        atlas = json.load(f)
    with open(lc_atlas_path, 'r', encoding='utf-8') as f:
        lc_atlas = json.load(f)

    for g in sorted(list(used_graphics)):
        # Ensure it exists in local Graphics/Animations and apps/web
        local_p = os.path.join(local_gfx_dir, g)
        web_p = os.path.join(dest_gfx_dir, g)
        src_p = os.path.join(source_gfx_dir, g)

        if not os.path.exists(local_p) and os.path.exists(src_p):
            shutil.copy2(src_p, local_p)
            print(f'  Copied {g} from source to Graphics/Animations')
        if not os.path.exists(web_p) and os.path.exists(local_p):
            shutil.copy2(local_p, web_p)
            print(f'  Copied {g} to web public Graphics/Animations')
        elif not os.path.exists(web_p) and os.path.exists(src_p):
            shutil.copy2(src_p, web_p)
            print(f'  Copied {g} from source to web public Graphics/Animations')

        # Read dimensions
        actual_path = local_p if os.path.exists(local_p) else web_p
        if os.path.exists(actual_path):
            with Image.open(actual_path) as im:
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
                # Copy to public_se_anim_dir
                target_p = os.path.join(public_se_anim_dir, clean_s)
                if not os.path.exists(target_p):
                    shutil.copy2(sp, target_p)
                found = True
                break
        if not found:
            print(f'  [Notice] SE {clean_s} not found in common source dirs (may be pre-bundled)')

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

    # Map the 25 primary moves
    for spec in t_specs:
        m_key = spec['move_key']
        tgt_id = spec['tgt_id']
        if spec.get('is_opp', False):
            move_map['opponentMoves'][m_key] = tgt_id
        else:
            move_map['moves'][m_key] = tgt_id

    # Alias: thundershock -> 7295 / 7296
    move_map['moves']['thundershock'] = 7295
    move_map['opponentMoves']['thundershock'] = 7296

    # Fallbacks:
    fallbacks = {
        'tachyon_cutter': (176, None),          # metal_claw
        'take_heart': (59, None),               # calm_mind
        'tectonic_rage': (97, None),            # earth_power
        'temper_flare': (6786, 6787),           # flame_charge
        'tera_blast': (7240, 7241),             # swift
        'tera_starstorm': (144, None)           # hyper_beam
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

    all_batch1_keys = [spec['move_key'] for spec in t_specs] + list(fallbacks.keys()) + ['thundershock']
    for k in all_batch1_keys:
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
    self_target_moves = ['tail_glow', 'tailwind', 'take_heart', 'teleport']
    for m in self_target_moves:
        if m in m_dict:
            m_dict[m]['target'] = 'user'
            print(f'  Updated target: user for {m}')

    # Update animationId
    for m in all_batch1_keys:
        if m in m_dict and m in move_map['moves']:
            m_dict[m]['animationId'] = move_map['moves'][m]

    with open(moves_db_path, 'w', encoding='utf-8') as f:
        json.dump(moves_db, f, indent=2)

    print('[6/6] Batch 1 import and registration completed successfully!')

if __name__ == '__main__':
    main()
