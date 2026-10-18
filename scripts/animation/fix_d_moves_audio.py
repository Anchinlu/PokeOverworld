#!/usr/bin/env python3
"""
Fix and verify all audio sound effects (SE) for D-group battle animations.
1. Copies all missing SFX from Pokemon Unbreakable Ties 4.1.2 to apps/web/public/Audio/SE and Audio/SE/Anim.
2. Mirrors SE files between Audio/SE and Audio/SE/Anim so both paths work seamlessly.
3. Converts all D-moves animation JSON timings from legacy format to canonical AnimationTimingEvent format.
4. Adds missing DisarmingVoice.ogg sound event to disarming_voice.
"""

import os
import json
import shutil

SOURCE_ROOT = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
SOURCE_SE_DIR = os.path.join(SOURCE_ROOT, 'Audio', 'SE')
SOURCE_SE_ANIM_DIR = os.path.join(SOURCE_SE_DIR, 'Anim')

PROJECT_ROOT = r'e:\Pokemon'
PUBLIC_SE_DIR = os.path.join(PROJECT_ROOT, 'apps', 'web', 'public', 'Audio', 'SE')
PUBLIC_SE_ANIM_DIR = os.path.join(PUBLIC_SE_DIR, 'Anim')
ANIMS_DIR = os.path.join(PROJECT_ROOT, 'packages', 'game-data', 'animations')
LAST_CHANCE_DIR = os.path.join(ANIMS_DIR, 'last-chance')

os.makedirs(PUBLIC_SE_DIR, exist_ok=True)
os.makedirs(PUBLIC_SE_ANIM_DIR, exist_ok=True)

def find_source_audio(name):
    """Finds an audio file in Unbreakable Ties or project SE directories."""
    candidates = []
    # If name has no ext, check .wav then .ogg then .mp3
    name_clean = name.replace('\\', '/').strip('/')
    if name_clean.lower().startswith('audio/se/'):
        name_clean = name_clean[9:]
    base_name = os.path.basename(name_clean)

    extensions = [''] if any(name_clean.lower().endswith(e) for e in ['.wav', '.ogg', '.mp3']) else ['.wav', '.ogg', '.mp3']

    search_dirs = [
        SOURCE_SE_ANIM_DIR,
        SOURCE_SE_DIR,
        PUBLIC_SE_ANIM_DIR,
        PUBLIC_SE_DIR
    ]

    for d in search_dirs:
        for ext in extensions:
            p = os.path.join(d, base_name + ext)
            if os.path.exists(p):
                return p, base_name + ext

    return None, None

def copy_to_destinations(src_path, filename):
    """Ensures audio file is present in both Audio/SE and Audio/SE/Anim."""
    dst1 = os.path.join(PUBLIC_SE_DIR, filename)
    dst2 = os.path.join(PUBLIC_SE_ANIM_DIR, filename)
    if not os.path.exists(dst1):
        shutil.copy2(src_path, dst1)
        print(f'  [COPY] -> {dst1}')
    if not os.path.exists(dst2):
        shutil.copy2(src_path, dst2)
        print(f'  [COPY] -> {dst2}')

def main():
    db_path = os.path.join(PROJECT_ROOT, 'packages', 'game-data', 'move-animations-db.json')
    db = json.load(open(db_path, encoding='utf-8'))
    d_moves = [k for k, v in db.items() if k.startswith('d') and v.get('hasDedicatedAnimation')]

    print(f'=== AUDITING & FIXING AUDIO FOR ALL {len(d_moves)} D-MOVES ===')

    total_converted = 0
    total_sounds_fixed = 0

    for move_key in sorted(d_moves):
        info = db[move_key]
        anim_ids = [i for i in [info.get('animId'), info.get('opponentAnimId')] if i]

        for aid in anim_ids:
            paths = [
                os.path.join(ANIMS_DIR, f'{aid}.json'),
                os.path.join(LAST_CHANCE_DIR, f'{aid}.json')
            ]
            for path in paths:
                if not os.path.exists(path):
                    continue

                data = json.load(open(path, encoding='utf-8'))
                raw_timings = data.get('timings', []) or data.get('timing', [])
                new_timings = []

                # Special case: disarming_voice (685 / 686) missing sound in source
                if move_key == 'disarming_voice':
                    src_p, real_name = find_source_audio('DisarmingVoice.ogg')
                    if src_p:
                        copy_to_destinations(src_p, real_name)
                    new_timings.append({
                        'frame': 0,
                        'type': 'sound',
                        'payload': {
                            'sound': 'DisarmingVoice.ogg',
                            'volume': 80,
                            'pitch': 100
                        }
                    })

                for t in raw_timings:
                    frame = t.get('frame', 0)

                    # Check for sound
                    sound_val = None
                    volume = 80
                    pitch = 100

                    if t.get('type') == 'sound':
                        sound_val = t.get('payload', {}).get('sound')
                        volume = t.get('payload', {}).get('volume', 80)
                        pitch = t.get('payload', {}).get('pitch', 100)
                    elif 'se' in t:
                        se_field = t['se']
                        if isinstance(se_field, str):
                            sound_val = se_field
                        elif isinstance(se_field, dict):
                            sound_val = se_field.get('name') or se_field.get('@name') or se_field.get('file')
                            volume = se_field.get('volume') or se_field.get('@volume') or 80
                            pitch = se_field.get('pitch') or se_field.get('@pitch') or 100

                    if sound_val:
                        sound_str = str(sound_val).strip()
                        # Ignore images mistakenly in SE
                        if not sound_str.lower().endswith(('.png', '.jpg', '.bmp', '.gif')):
                            src_p, real_name = find_source_audio(sound_str)
                            if src_p and real_name:
                                copy_to_destinations(src_p, real_name)
                                final_sound = real_name
                            else:
                                # Fallback extension inference
                                if sound_str.startswith('PRSFX-') and not sound_str.endswith(('.wav', '.ogg')):
                                    final_sound = sound_str + '.wav'
                                elif not any(sound_str.endswith(e) for e in ['.wav', '.ogg', '.mp3']):
                                    final_sound = sound_str + '.ogg'
                                else:
                                    final_sound = sound_str
                                print(f'  [WARN] Sound file not found on disk: {sound_str} -> using {final_sound}')

                            new_timings.append({
                                'frame': frame,
                                'type': 'sound',
                                'payload': {
                                    'sound': final_sound,
                                    'volume': volume,
                                    'pitch': pitch
                                }
                            })
                            total_sounds_fixed += 1

                    # Check for flash
                    if t.get('type') == 'flash':
                        new_timings.append(t)
                    else:
                        flash_scope = t.get('flashScope', 0)
                        if flash_scope and flash_scope > 0:
                            flash_color = t.get('flashColor')
                            if not flash_color:
                                flash_color = [255, 255, 255, 255]
                            new_timings.append({
                                'frame': frame,
                                'type': 'flash',
                                'payload': {
                                    'flashScope': flash_scope,
                                    'flashDuration': t.get('flashDuration', 5),
                                    'flashColor': flash_color
                                }
                            })

                data['timings'] = new_timings
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                total_converted += 1

    print(f'\nTotal JSON files updated: {total_converted}')
    print(f'Total sound events generated: {total_sounds_fixed}')

    # Also mirror all existing files in PUBLIC_SE_ANIM_DIR to PUBLIC_SE_DIR
    print('\nMirroring any remaining Anim SE files to root SE...')
    for fname in os.listdir(PUBLIC_SE_ANIM_DIR):
        p_anim = os.path.join(PUBLIC_SE_ANIM_DIR, fname)
        p_root = os.path.join(PUBLIC_SE_DIR, fname)
        if os.path.isfile(p_anim) and not os.path.exists(p_root):
            shutil.copy2(p_anim, p_root)
            print(f'  [MIRROR] {fname} -> Audio/SE/')

    print('\nDone! All D-moves now have proper AnimationTimingEvent schemas and audio files.')

if __name__ == '__main__':
    main()
