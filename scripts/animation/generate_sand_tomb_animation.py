import json
import os

def create_sand_tomb_animation():
    total_frames = 25
    frames = []

    # Cycle pairs of (back_pattern, front_pattern)
    cycle_pairs = [
        (0, 5),
        (1, 6),
        (2, 7),
        (3, 8),
        (4, 9),
    ]

    for fi in range(total_frames):
        cels = []

        # Target battler tremor when trapped in full storm
        target_x = 384
        target_y = 96
        if 6 <= fi <= 19:
            # Subtle vibration of trapped battler
            offsets = [0, -3, 3, -2, 2, 0]
            target_x += offsets[(fi - 6) % len(offsets)]

        # 1. Battlers
        # User battler
        cels.append({
            "pattern": -1,
            "x": 128,
            "y": 224,
            "zoomX": 100,
            "zoomY": 100,
            "angle": 0,
            "mirror": False,
            "opacity": 255,
            "blendMode": "normal",
            "visible": True,
            "priority": 1,
            "focus": "user",
            "_sourceXMissing": False,
            "_sourceYMissing": False
        })

        # Target battler (priority 1: between back layer and front layer!)
        cels.append({
            "pattern": -2,
            "x": target_x,
            "y": target_y,
            "zoomX": 100,
            "zoomY": 100,
            "angle": 0,
            "mirror": False,
            "opacity": 255,
            "blendMode": "normal",
            "visible": True,
            "priority": 1,
            "focus": "target",
            "_sourceXMissing": False,
            "_sourceYMissing": False
        })

        # 2. Sand Vortex Tiers
        # Progression parameters:
        if fi < 5:
            # Phase 1: Rising from ground
            progress = (fi + 1) / 5.0
            zoom_base = int(50 + progress * 70)  # 50 -> 120
            opacity_base = int(80 + progress * 140) # 80 -> 220
            y_base = int(140 - progress * 20)      # 140 -> 120

            p_back, p_front = cycle_pairs[fi % len(cycle_pairs)]

            # Base tier (back)
            cels.append({
                "pattern": p_back,
                "x": 384,
                "y": y_base,
                "zoomX": zoom_base,
                "zoomY": zoom_base,
                "angle": 0,
                "mirror": False,
                "opacity": opacity_base,
                "blendMode": "normal",
                "visible": True,
                "priority": 0,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })
            # Base tier (front)
            cels.append({
                "pattern": p_front,
                "x": 384,
                "y": y_base,
                "zoomX": zoom_base,
                "zoomY": zoom_base,
                "angle": 0,
                "mirror": False,
                "opacity": opacity_base,
                "blendMode": "normal",
                "visible": True,
                "priority": 2,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

            if fi >= 3:
                # Emerging mid tier
                p_back_mid, p_front_mid = cycle_pairs[(fi + 2) % len(cycle_pairs)]
                cels.append({
                    "pattern": p_back_mid,
                    "x": 384,
                    "y": 100,
                    "zoomX": int(zoom_base * 1.1),
                    "zoomY": int(zoom_base * 1.1),
                    "angle": 0,
                    "mirror": False,
                    "opacity": int(opacity_base * 0.7),
                    "blendMode": "normal",
                    "visible": True,
                    "priority": 0,
                    "focus": "target",
                    "_sourceXMissing": False,
                    "_sourceYMissing": False
                })
                cels.append({
                    "pattern": p_front_mid,
                    "x": 384,
                    "y": 100,
                    "zoomX": int(zoom_base * 1.1),
                    "zoomY": int(zoom_base * 1.1),
                    "angle": 0,
                    "mirror": False,
                    "opacity": int(opacity_base * 0.7),
                    "blendMode": "normal",
                    "visible": True,
                    "priority": 2,
                    "focus": "target",
                    "_sourceXMissing": False,
                    "_sourceYMissing": False
                })

        elif fi <= 19:
            # Phase 2: Full Roaring Vortex
            p1_back, p1_front = cycle_pairs[fi % len(cycle_pairs)]
            p2_back, p2_front = cycle_pairs[(fi + 2) % len(cycle_pairs)]
            p3_back, p3_front = cycle_pairs[(fi + 4) % len(cycle_pairs)]

            # Slight pulsing scale
            pulse = ((fi % 3) - 1) * 4

            # Tier 1: Base / feet level (y=125)
            cels.append({
                "pattern": p1_back,
                "x": 384,
                "y": 125,
                "zoomX": 135 + pulse,
                "zoomY": 135 + pulse,
                "angle": 0,
                "mirror": False,
                "opacity": 230,
                "blendMode": "normal",
                "visible": True,
                "priority": 0,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })
            cels.append({
                "pattern": p1_front,
                "x": 384,
                "y": 125,
                "zoomX": 135 + pulse,
                "zoomY": 135 + pulse,
                "angle": 0,
                "mirror": False,
                "opacity": 230,
                "blendMode": "normal",
                "visible": True,
                "priority": 2,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

            # Tier 2: Mid / core level (y=95)
            cels.append({
                "pattern": p2_back,
                "x": 384,
                "y": 95,
                "zoomX": 155 - pulse,
                "zoomY": 155 - pulse,
                "angle": 0,
                "mirror": False,
                "opacity": 245,
                "blendMode": "normal",
                "visible": True,
                "priority": 0,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })
            cels.append({
                "pattern": p2_front,
                "x": 384,
                "y": 95,
                "zoomX": 155 - pulse,
                "zoomY": 155 - pulse,
                "angle": 0,
                "mirror": False,
                "opacity": 245,
                "blendMode": "normal",
                "visible": True,
                "priority": 2,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

            # Tier 3: High / funnel level (y=65)
            cels.append({
                "pattern": p3_back,
                "x": 384,
                "y": 65,
                "zoomX": 175 + pulse,
                "zoomY": 175 + pulse,
                "angle": 0,
                "mirror": False,
                "opacity": 210,
                "blendMode": "normal",
                "visible": True,
                "priority": 0,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })
            cels.append({
                "pattern": p3_front,
                "x": 384,
                "y": 65,
                "zoomX": 175 + pulse,
                "zoomY": 175 + pulse,
                "angle": 0,
                "mirror": False,
                "opacity": 210,
                "blendMode": "normal",
                "visible": True,
                "priority": 2,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

        else:
            # Phase 3: Subsidence & Collapse (Frames 20 to 24)
            decay = (fi - 19) / 5.0 # 0.2 to 1.0
            zoom_decay = int(140 * (1.0 - decay * 0.5))  # 140 -> 70
            opacity_decay = int(220 * (1.0 - decay * 0.85)) # 220 -> 33
            y_decay = int(95 + decay * 35)               # 95 -> 130

            p_back, p_front = cycle_pairs[fi % len(cycle_pairs)]

            cels.append({
                "pattern": p_back,
                "x": 384,
                "y": y_decay,
                "zoomX": zoom_decay,
                "zoomY": zoom_decay,
                "angle": 0,
                "mirror": False,
                "opacity": opacity_decay,
                "blendMode": "normal",
                "visible": True,
                "priority": 0,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })
            cels.append({
                "pattern": p_front,
                "x": 384,
                "y": y_decay,
                "zoomX": zoom_decay,
                "zoomY": zoom_decay,
                "angle": 0,
                "mirror": False,
                "opacity": opacity_decay,
                "blendMode": "normal",
                "visible": True,
                "priority": 2,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

        frames.append({"cels": cels})

    # Timings
    timings = [
        {
            "frame": 0,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Sand Tomb.wav",
                "volume": 90,
                "pitch": 100
            },
            "sound": {
                "file": "PRSFX- Sand Tomb.wav",
                "volume": 90,
                "pitch": 100
            }
        },
        {
            "frame": 6,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Sandstorm.wav",
                "volume": 80,
                "pitch": 110
            },
            "sound": {
                "file": "PRSFX- Sandstorm.wav",
                "volume": 80,
                "pitch": 110
            }
        }
    ]

    doc = {
        "id": 7077,
        "name": "Move:SANDTOMB",
        "graphic": "PRAS- sandstorm2.png",
        "frames": frames,
        "timings": timings
    }

    return doc

if __name__ == '__main__':
    doc = create_sand_tomb_animation()
    p1 = 'packages/game-data/animations/7077.json'
    p2 = 'packages/game-data/animations/last-chance/7077.json'
    with open(p1, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2)
    with open(p2, 'w', encoding='utf-8') as f:
        json.dump(doc, f, indent=2)

    # Also update move-animations-db.json
    db_path = 'packages/game-data/move-animations-db.json'
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)
    db['7077'] = doc
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2)

    # Update manifest.json
    man_path = 'packages/game-data/animations/manifest.json'
    with open(man_path, 'r', encoding='utf-8') as f:
        man = json.load(f)
    man['7077'] = {
        'id': '7077',
        'name': 'Move:SANDTOMB',
        'graphic': 'PRAS- sandstorm2.png',
        'position': 2,
        'frameCount': len(doc['frames']),
        'timingCount': len(doc['timings'])
    }
    with open(man_path, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=2)

    print(f"Successfully generated new Sand Tomb animation 7077 with {len(doc['frames'])} frames and {len(doc['timings'])} timings using PRAS- sandstorm2.png")
