import json
import copy

with open('packages/game-data/animations/537.json', 'r', encoding='utf-8') as f:
    pl_data = json.load(f)

def mirror_target_animation_correct(frames):
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
                dx = c.get('x', 384) - 384
                c['x'] = 384 - dx
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'user':
                dx = c.get('x', 128) - 128
                c['x'] = 128 - dx
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'both':
                c['x'] = 512 - c.get('x', 256)
                c['mirror'] = not c.get('mirror', False)
                c['angle'] = -c.get('angle', 0)
            elif focus == 'screen':
                c['mirror'] = not c.get('mirror', False)
            new_cels.append(c)
        opp_frames.append({'cels': new_cels})
    return opp_frames

opp_data = copy.deepcopy(pl_data)
opp_data['id'] = 538
opp_data['name'] = 'OppMove:FORCEPALM'
opp_data['frames'] = mirror_target_animation_correct(pl_data['frames'])

for out_path in ['packages/game-data/animations/538.json', 'packages/game-data/animations/last-chance/538.json']:
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(opp_data, f, indent=2)

print("538.json (Force Palm OppMove / upper_hand) successfully regenerated!")
