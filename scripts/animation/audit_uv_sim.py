import json
import os

with open('packages/game-data/move-animation-map.json', 'r', encoding='utf-8') as f:
    anim_map = json.load(f)

uv_moves = [m for m in anim_map['moves'].keys() if m.startswith('u') or m.startswith('v')]

SRC_USER = (128, 224)
SRC_TARGET = (384, 96)
PLAYER_POS = (130, 215)
ENEMY_POS = (384, 96)

def resolve_cel_pos(cel, is_opp_cast, def_id):
    x = cel.get('x', 0)
    y = cel.get('y', 0)
    focus = cel.get('focus', 'target')
    
    user_pos = ENEMY_POS if is_opp_cast else PLAYER_POS
    tgt_pos = PLAYER_POS if is_opp_cast else ENEMY_POS
    
    # Check OppMove trajectory reversed
    if is_opp_cast and str(def_id) in ['7340', '7344', '7358', '617', '7360']:
        t = (x - SRC_TARGET[0]) / (SRC_USER[0] - SRC_TARGET[0]) if (SRC_USER[0] - SRC_TARGET[0]) != 0 else 0
        rx = user_pos[0] + t * (tgt_pos[0] - user_pos[0])
        ry = user_pos[1] + t * (tgt_pos[1] - user_pos[1])
        return rx, ry
        
    if is_opp_cast and (str(def_id) in ['7346', '615']) and focus == 'user':
        return user_pos[0] + (x - SRC_TARGET[0]), user_pos[1] + (y - SRC_TARGET[1])

    if focus == 'target':
        return tgt_pos[0] + (x - SRC_TARGET[0]), tgt_pos[1] + (y - SRC_TARGET[1])
    elif focus == 'user':
        return user_pos[0] + (x - SRC_USER[0]), user_pos[1] + (y - SRC_USER[1])
    elif focus == 'both':
        t = (x - SRC_USER[0]) / (SRC_TARGET[0] - SRC_USER[0]) if (SRC_TARGET[0] - SRC_USER[0]) != 0 else 0
        rx = user_pos[0] + t * (tgt_pos[0] - user_pos[0])
        ry = user_pos[1] + t * (tgt_pos[1] - user_pos[1])
        return rx, ry
    else: # screen
        return x, y

passed = []
failed = []

for m in sorted(uv_moves):
    pl_id = anim_map['moves'][m]
    opp_id = anim_map['opponentMoves'].get(m)
    
    m_ok = True
    errs = []
    
    for role, anim_id, is_opp in [('PL', pl_id, False), ('OPP', opp_id, True)]:
        p = f'packages/game-data/animations/{anim_id}.json'
        if not os.path.exists(p):
            m_ok = False
            errs.append(f"Missing {p}")
            continue
        with open(p, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for fi, fr in enumerate(data.get('frames', [])):
            # For U-Turn (7339/7340), frames >= 26 animate the Pokémon exiting off-screen
            if str(anim_id) in ['7339', '7340'] and fi >= 26:
                continue
                
            for ci, cel in enumerate(fr.get('cels', [])):
                pat = cel.get('pattern', 0)
                if pat < 0: # Battler placeholder
                    continue
                rx, ry = resolve_cel_pos(cel, is_opp, anim_id)
                if rx < -20 or rx > 600 or ry < -40 or ry > 400:
                    m_ok = False
                    errs.append(f"{role} ID {anim_id} frame {fi} cel {ci} ({rx}, {ry}) out of bounds")
                    break
            if not m_ok:
                break
                
    if m_ok:
        passed.append(m)
    else:
        failed.append((m, errs))

print(f"================ AUDIT REPORT FOR ALL {len(uv_moves)} U & V MOVES ================")
print(f"PASSED ({len(passed)}/{len(uv_moves)}): {passed}")
if failed:
    print(f"FAILED ({len(failed)}/{len(uv_moves)}):")
    for m, errs in failed:
        print(f"  {m}: {errs}")
else:
    print("ALL U & V MOVES 100% PERFECT!")
