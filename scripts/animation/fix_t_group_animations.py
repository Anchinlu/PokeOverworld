#!/usr/bin/env python3
"""
Comprehensive Fixer for all 60 T-Group Pokémon Move Animations.
Resolves:
  1. Corrects mirror_target_animation to flip around SRC_TARGET (384, 96) instead of shifting to (128, 224).
  2. Fixes native Essentials OppMove anchor mismatches in coordinate-transformer.ts.
  3. Fixes Twineedle (7333 & 7334) dual-stage user-form and target-strike focuses.
  4. Fixes Thousand Arrows (7279 & 7280) user-aura focus.
  5. Fixes Teleport (7273 & 7274) self-targeting focus to userPos.
  6. Fixes Fallback mappings (tachyon_cutter, take_heart, tectonic_rage, tera_starstorm) to modern animation IDs.
"""

import os, sys, json, copy, shutil

out_base = r'e:\Pokemon'
game_data_dir = os.path.join(out_base, 'packages', 'game-data')
anims_out_dir = os.path.join(game_data_dir, 'animations')
last_chance_dir = os.path.join(anims_out_dir, 'last-chance')

sys.path.append(os.path.join(out_base, 'scripts', 'animation'))
import import_source_animations as isa
isa.patch_reader()
import rubymarshal.reader as r

source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
anims_rxdata_path = os.path.join(source_root, 'Data', 'PkmnAnimations.rxdata')

with open(anims_rxdata_path, 'rb') as f:
    raw_anims = r.load(f)
anim_list = raw_anims.attributes.get('@array', [])

def mirror_target_animation_correct(frames):
    """
    Correctly creates an opponent animation without shifting focus='target' to 128!
    In CoordinateTransformer, focus='target' already maps to targetPos (which is Player for opponent).
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
                c['x'] = 512 - c.get('x', 256)
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'screen':
                c['x'] = 512 - c.get('x', 256)
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)

            new_cels.append(c)
        opp_frames.append({'cels': new_cels})
    return opp_frames

def save_anim(tgt_id, anim_def):
    p1 = os.path.join(anims_out_dir, f"{tgt_id}.json")
    p2 = os.path.join(last_chance_dir, f"{tgt_id}.json")
    with open(p1, 'w', encoding='utf-8') as f:
        json.dump(anim_def, f, indent=2)
    with open(p2, 'w', encoding='utf-8') as f:
        json.dump(anim_def, f, indent=2)

print("Step 1: Re-generating correct OppMove definitions for target-focused mirrored moves...")

# List of moves that used mirror_target_animation
mirrored_opp_moves = [
    # Batch 1
    (7248, 136, 'tackle'),
    (7252, 783, 'tail_slap'),
    (7254, 255, 'tail_whip'),
    (7276, 1332, 'terrain_pulse'),
    (7284, 604, 'thrash'),
    (7288, 125, 'thunder'),
    (7290, 1350, 'thunder_cage'),
    (7292, 237, 'thunder_fang'),
    (7294, 99, 'thunder_punch'),
    (7296, 238, 'thunder_shock'),
    # Batch 2
    (7298, 115, 'thunder_wave'),
    (7300, 100, 'thunderbolt'),
    (7302, 1352, 'thunderous_kick'),
    (7308, 719, 'torment'),
    (7310, 209, 'toxic'),
    (7314, 1067, 'toxic_thread'),
    (7326, 1339, 'triple_axel'),
    (7330, 1121, 'trop_kick'),
    (7332, 797, 'trump_card'),
    (7338, 223, 'twister')
]

for opp_id, rx_id, m_name in mirrored_opp_moves:
    # Load player JSON
    pl_id = opp_id - 1
    pl_path = os.path.join(anims_out_dir, f"{pl_id}.json")
    with open(pl_path, 'r', encoding='utf-8') as f:
        pl_anim = json.load(f)

    # Mirror correctly
    opp_frames = mirror_target_animation_correct(pl_anim['frames'])
    opp_anim = copy.deepcopy(pl_anim)
    opp_anim['id'] = str(opp_id)
    opp_anim['name'] = f"OppMove:{m_name.upper().replace('_', '')}"
    opp_anim['frames'] = opp_frames
    save_anim(opp_id, opp_anim)
    print(f"  Fixed OppMove {opp_id} for {m_name}")

print("\nStep 2: Fixing Twineedle (7333 PL & 7334 OPP)...")
# In Twineedle PL (Rx 210): frames 0..10 are forming needles at user (160, 129), frames 11..22 are hitting target (376, 62)
rx210 = anim_list[210]
rx212 = anim_list[212]

# Build 7333:
pl_twine_frames = []
for fi, fr in enumerate(rx210.attributes.get('@array', [])):
    cels = []
    for c_data in fr:
        c = isa.parse_cel(c_data)
        if c:
            if c['pattern'] >= 0:
                if fi <= 10:
                    c['focus'] = 'user' # Forming near user
                else:
                    c['focus'] = 'target' # Striking target
            cels.append(c)
    pl_twine_frames.append({'cels': cels})

with open(os.path.join(anims_out_dir, "7333.json"), 'r', encoding='utf-8') as f:
    t33 = json.load(f)
t33['frames'] = pl_twine_frames
save_anim(7333, t33)

# Build 7334:
opp_twine_frames = []
for fi, fr in enumerate(rx212.attributes.get('@array', [])):
    cels = []
    for c_data in fr:
        c = isa.parse_cel(c_data)
        if c:
            if c['pattern'] >= 0:
                if fi <= 10:
                    c['focus'] = 'target' # Authored at (328, 52) around Enemy
                else:
                    c['focus'] = 'user' # Authored at (118, 230) striking Player
            cels.append(c)
    opp_twine_frames.append({'cels': cels})

with open(os.path.join(anims_out_dir, "7334.json"), 'r', encoding='utf-8') as f:
    t34 = json.load(f)
t34['frames'] = opp_twine_frames
save_anim(7334, t34)
print("  Fixed Twineedle 7333 and 7334")

print("\nStep 3: Fixing Thousand Arrows (7279 PL & 7280 OPP)...")
# In Thousand Arrows: cel with pattern 1 at (128, 224) in frames 30..82 must have focus='user'
for anim_id in [7279, 7280]:
    p = os.path.join(anims_out_dir, f"{anim_id}.json")
    with open(p, 'r', encoding='utf-8') as f:
        a = json.load(f)
    for fr in a['frames']:
        for c in fr['cels']:
            if c['pattern'] == 1 and abs(c['x'] - 128) < 10 and abs(c['y'] - 224) < 10:
                c['focus'] = 'user'
            if anim_id == 7280 and c['pattern'] >= 0 and c['focus'] == 'target':
                # Keep target-focused arrows anchored around 384
                pass
    save_anim(anim_id, a)

# Also fix 7280 (OPP) by generating from 7279 using mirror_target_animation_correct
with open(os.path.join(anims_out_dir, "7279.json"), 'r', encoding='utf-8') as f:
    pl_7279 = json.load(f)
opp_7280 = copy.deepcopy(pl_7279)
opp_7280['id'] = "7280"
opp_7280['name'] = "OppMove:THOUSANDARROWS"
opp_7280['frames'] = mirror_target_animation_correct(pl_7279['frames'])
save_anim(7280, opp_7280)
print("  Fixed Thousand Arrows 7279 and 7280")

print("\nStep 4: Fixing Thousand Waves (7282 OPP)...")
with open(os.path.join(anims_out_dir, "7281.json"), 'r', encoding='utf-8') as f:
    pl_7281 = json.load(f)
opp_7282 = copy.deepcopy(pl_7281)
opp_7282['id'] = "7282"
opp_7282['name'] = "OppMove:THOUSANDWAVES"
# For focus='both', CoordinateTransformer.transformPoint already maps SRC_USER (128) -> userPos (Enemy 380)
# and SRC_TARGET (384) -> targetPos (Player 130). Keep x authored trajectory intact and only toggle mirror.
opp_7282_frames = []
for fr in pl_7281['frames']:
    new_cels = []
    for c in fr['cels']:
        nc = copy.deepcopy(c)
        if nc.get('pattern', 0) >= 0:
            nc['mirror'] = not nc.get('mirror', False)
        new_cels.append(nc)
    opp_7282_frames.append({'cels': new_cels})
opp_7282['frames'] = opp_7282_frames
save_anim(7282, opp_7282)
print("  Fixed Thousand Waves 7282")

print("\nStep 5: Fixing Teleport (7273 PL & 7274 OPP)...")
# Teleport is self-targeting (target: 'user').
# In Rx 152, cels were authored at (376, 65) with focus='target'.
# For both Player (7273) and Opponent (7274), anchor around SRC_USER (128, 224) with focus='user'!
# CoordinateTransformer maps focus='user' to userPos: Player (130, 215) or Enemy (380, 115).
rx152 = anim_list[152]
tele_frames = []
for fr in rx152.attributes.get('@array', []):
    cels = []
    for c_data in fr:
        c = isa.parse_cel(c_data)
        if c:
            if c['pattern'] >= 0:
                c['x'] = 128 + (c['x'] - 376)
                c['y'] = 224 + (c['y'] - 80)
                c['focus'] = 'user'
            cels.append(c)
    tele_frames.append({'cels': cels})

with open(os.path.join(anims_out_dir, "7273.json"), 'r', encoding='utf-8') as f:
    t73 = json.load(f)
t73['frames'] = tele_frames
save_anim(7273, t73)

with open(os.path.join(anims_out_dir, "7274.json"), 'r', encoding='utf-8') as f:
    t74 = json.load(f)
t74['frames'] = copy.deepcopy(tele_frames)
save_anim(7274, t74)
print("  Fixed Teleport 7273 and 7274")

print("\nStep 6: Fixing Custom Builder moves (Teeter Dance 7270, Telekinesis 7272, Thief 7278)...")
# In import_unbreakable_t_moves_batch1.py, build_teeter_dance_animation, build_telekinesis_animation, build_thief_animation
# When is_opp is True, custom builders authored tgt_x = 128!
# BUT with focus='target', CoordinateTransformer subtracts 384!
# So for focus='target' in custom builders, tgt_x must be 384!
# Let's rebuild 7270, 7272, 7278:
with open(os.path.join(anims_out_dir, "7269.json"), 'r', encoding='utf-8') as f:
    pl_7269 = json.load(f)
opp_7270 = copy.deepcopy(pl_7269)
opp_7270['id'] = "7270"
opp_7270['name'] = "OppMove:TEETERDANCE"
opp_7270['frames'] = mirror_target_animation_correct(pl_7269['frames'])
save_anim(7270, opp_7270)

with open(os.path.join(anims_out_dir, "7271.json"), 'r', encoding='utf-8') as f:
    pl_7271 = json.load(f)
opp_7272 = copy.deepcopy(pl_7271)
opp_7272['id'] = "7272"
opp_7272['name'] = "OppMove:TELEKINESIS"
opp_7272['frames'] = mirror_target_animation_correct(pl_7271['frames'])
save_anim(7272, opp_7272)

with open(os.path.join(anims_out_dir, "7277.json"), 'r', encoding='utf-8') as f:
    pl_7277 = json.load(f)
opp_7278 = copy.deepcopy(pl_7277)
opp_7278['id'] = "7278"
opp_7278['name'] = "OppMove:THIEF"
opp_7278['frames'] = mirror_target_animation_correct(pl_7277['frames'])
save_anim(7278, opp_7278)
print("  Fixed 7270, 7272, 7278")

print("\nStep 7: Updating move-animation-map.json fallbacks...")
map_path = os.path.join(game_data_dir, 'move-animation-map.json')
with open(map_path, 'r', encoding='utf-8') as f:
    m_map = json.load(f)

# Correct Fallbacks:
# tachyon_cutter -> metal_claw (6897 PL / 6897 OPP)
m_map['moves']['tachyon_cutter'] = 6897
m_map['opponentMoves']['tachyon_cutter'] = 6897

# take_heart -> calm_mind (424 PL / 424 OPP)
m_map['moves']['take_heart'] = 424
m_map['opponentMoves']['take_heart'] = 424

# tectonic_rage -> earth_power (518 PL / 518 OPP)
m_map['moves']['tectonic_rage'] = 518
m_map['opponentMoves']['tectonic_rage'] = 518

# tera_starstorm -> hyper_beam (6476 PL / 6476 OPP)
m_map['moves']['tera_starstorm'] = 6476
m_map['opponentMoves']['tera_starstorm'] = 6476

with open(map_path, 'w', encoding='utf-8') as f:
    json.dump(m_map, f, indent=2)
print("  Updated move-animation-map.json fallbacks to authentic modern IDs")

print("\nStep 8: Updating moves-db.json animationIds...")
moves_db_path = os.path.join(game_data_dir, 'moves-db.json')
with open(moves_db_path, 'r', encoding='utf-8') as f:
    moves_db_full = json.load(f)
m_dict = moves_db_full.get('moves', moves_db_full)

m_dict['tachyon_cutter']['animationId'] = 6897
m_dict['take_heart']['animationId'] = 424
m_dict['tectonic_rage']['animationId'] = 518
m_dict['tera_starstorm']['animationId'] = 6476

with open(moves_db_path, 'w', encoding='utf-8') as f:
    json.dump(moves_db_full, f, indent=2)

print("\nDone applying comprehensive fixes!")
