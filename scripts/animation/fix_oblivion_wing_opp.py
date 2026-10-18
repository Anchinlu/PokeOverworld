"""Fix OppMove:OBLIVIONWING (6919): swap battler roles + re-aim the beam.

The authored Essentials OppMove timeline places the *attacker* at the source
TARGET anchor (384, 96) but labels it pat -2 / focus 'target'. Our engine maps
'target' to the defending Player, so the Player flew into the sky. Here we move
the ascent/descent onto pat -1 / focus 'user' (the Enemy attacker) and keep the
defending Player (pat -2 / 'target') on the ground, shaking on impact like the
Player-side timeline (6918).

Battler cels are not applied to the sprites by the engine, so the beam connects the
real battlers: its centre is the midpoint (x=256 -> progress 0.5 in
CoordinateTransformer) and its angle follows the Enemy (380,115) -> Player (130,215)
diagonal (up-right, about 338 degrees clockwise on canvas).
"""
import json
import sys

ASCENT_DELTA = {8: -46, 9: -92, 10: -138, 11: -184}  # frame idx -> y delta (user focus)
SKY_DELTA = -184
DESCENT_DELTA = {27: -138, 28: -92, 29: -46}


def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def main():
    ref = load('packages/game-data/animations/6918.json')
    for path in [
        'packages/game-data/animations/6919.json',
        'packages/game-data/animations/last-chance/6919.json',
    ]:
        d = load(path)
        for i, fr in enumerate(d['frames']):
            ref_pat2 = next(c for c in ref['frames'][i]['cels'] if c['pattern'] == -2)
            for c in fr['cels']:
                if c['pattern'] == -1:
                    delta = 0
                    if i in ASCENT_DELTA:
                        delta = ASCENT_DELTA[i]
                    elif 11 < i <= 26:
                        delta = SKY_DELTA
                    elif i in DESCENT_DELTA:
                        delta = DESCENT_DELTA[i]
                    c['x'] = 128
                    c['y'] = 224 + delta
                elif c['pattern'] == -2:
                    c['x'] = ref_pat2['x']
                    c['y'] = 96
                elif c['pattern'] >= 0 and c.get('focus') == 'both':
                    c['x'] = 256
                    c['angle'] = 338
        indent = 2
        with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
            json.dump(d, f, indent=indent, ensure_ascii=False)
        print('fixed', path)


if __name__ == '__main__':
    sys.exit(main())
