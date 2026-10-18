import json
import math
import os

def create_stealth_rock_player():
    total_frames = 35
    frames = []

    # 6 floating rocks surrounding the Opponent target (384, 96)
    rock_offsets = [
        {"pat": 6, "dx": 0, "dy": -46, "priority": 0},   # top
        {"pat": 7, "dx": 56, "dy": -24, "priority": 0},  # top-right
        {"pat": 5, "dx": 52, "dy": 30, "priority": 1},   # bottom-right
        {"pat": 6, "dx": 0, "dy": 44, "priority": 1},    # bottom
        {"pat": 4, "dx": -52, "dy": 30, "priority": 1},  # bottom-left
        {"pat": 7, "dx": -56, "dy": -24, "priority": 0}, # top-left
    ]

    # Ground start positions around Player (128, 224)
    start_offsets = [
        (-24, 18),
        (-10, 26),
        (12, 22),
        (28, 16),
        (-18, 30),
        (20, 24)
    ]

    for fi in range(total_frames):
        cels = []

        # Battlers
        cels.append({
            "pattern": -1, "x": 128, "y": 224, "zoomX": 100, "zoomY": 100,
            "angle": 0, "mirror": False, "opacity": 255, "blendMode": "normal",
            "visible": True, "priority": 1, "focus": "user",
            "_sourceXMissing": False, "_sourceYMissing": False
        })
        cels.append({
            "pattern": -2, "x": 384, "y": 96, "zoomX": 100, "zoomY": 100,
            "angle": 0, "mirror": False, "opacity": 255, "blendMode": "normal",
            "visible": True, "priority": 1, "focus": "target",
            "_sourceXMissing": False, "_sourceYMissing": False
        })

        for k in range(6):
            r_info = rock_offsets[k]
            s_dx, s_dy = start_offsets[k]

            if fi < 7:
                # Phase 1: Rising from ground at Player (user)
                t_rise = (fi + 1) / 7.0
                cx = 128 + s_dx
                cy = int((224 + s_dy) - t_rise * 32)
                zoom = int(60 + t_rise * 35) # 60 -> 95
                op = int(80 + t_rise * 160)  # 80 -> 240
                angle = int(k * 30 + fi * 10)
                cels.append({
                    "pattern": r_info["pat"],
                    "x": cx, "y": cy, "zoomX": zoom, "zoomY": zoom,
                    "angle": angle, "mirror": False, "opacity": op,
                    "blendMode": "normal", "visible": True,
                    "priority": 1, "focus": "user",
                    "_sourceXMissing": False, "_sourceYMissing": False
                })
            elif fi < 18:
                # Phase 2: Parabolic flight to Opponent field
                t_flight = (fi - 7) / 11.0 # 0.09 to 1.0
                start_x = 128 + s_dx
                start_y = 224 + s_dy - 32
                dest_x = 384 + r_info["dx"]
                dest_y = 96 + r_info["dy"]

                cx = int((1.0 - t_flight) * start_x + t_flight * dest_x)
                line_y = (1.0 - t_flight) * start_y + t_flight * dest_y
                arc_y = int(line_y - math.sin(t_flight * math.pi) * 65)

                zoom = int(95 + t_flight * 5)
                angle = int(k * 30 + fi * 15)
                cels.append({
                    "pattern": r_info["pat"],
                    "x": cx, "y": arc_y, "zoomX": zoom, "zoomY": zoom,
                    "angle": angle, "mirror": False, "opacity": 255,
                    "blendMode": "normal", "visible": True,
                    "priority": r_info["priority"], "focus": "both",
                    "_sourceXMissing": False, "_sourceYMissing": False
                })
            else:
                # Phase 3: Hovering in floating perimeter around Opponent (target)
                bob = int(math.sin((fi - 18) * 0.45 + k * 1.05) * 4)
                cx = 384 + r_info["dx"]
                cy = 96 + r_info["dy"] + bob

                if fi >= 30:
                    t_shimmer = (fi - 30) / 4.0
                    op = int(255 - t_shimmer * 85) # 255 -> 170
                else:
                    op = 255

                angle = int(k * 30 + (fi - 18) * 4)
                cels.append({
                    "pattern": r_info["pat"],
                    "x": cx, "y": cy, "zoomX": 100, "zoomY": 100,
                    "angle": angle, "mirror": False, "opacity": op,
                    "blendMode": "normal", "visible": True,
                    "priority": r_info["priority"], "focus": "target",
                    "_sourceXMissing": False, "_sourceYMissing": False
                })

        frames.append({"cels": cels})

    timings = [
        {
            "frame": 0,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Stealth Rocks.wav",
                "volume": 90,
                "pitch": 100
            },
            "sound": {
                "file": "PRSFX- Stealth Rocks.wav",
                "volume": 90,
                "pitch": 100
            }
        }
    ]

    return {
        "id": 7192,
        "name": "Move:STEALTHROCK",
        "graphic": "PRAS- Stealth Rock.png",
        "frames": frames,
        "timings": timings
    }

def create_stealth_rock_opponent():
    total_frames = 35
    frames = []

    # 6 floating rocks surrounding the Player target (128, 224)
    rock_offsets = [
        {"pat": 6, "dx": 0, "dy": -48, "priority": 0},   # top
        {"pat": 7, "dx": 58, "dy": -24, "priority": 0},  # top-right
        {"pat": 5, "dx": 52, "dy": 30, "priority": 1},   # bottom-right
        {"pat": 6, "dx": 0, "dy": 44, "priority": 1},    # bottom
        {"pat": 4, "dx": -52, "dy": 30, "priority": 1},  # bottom-left
        {"pat": 7, "dx": -58, "dy": -24, "priority": 0}, # top-left
    ]

    # Ground start positions around Enemy (384, 96)
    start_offsets = [
        (-20, 20),
        (-8, 28),
        (10, 24),
        (22, 18),
        (-14, 30),
        (16, 22)
    ]

    for fi in range(total_frames):
        cels = []

        # Battlers
        cels.append({
            "pattern": -1, "x": 128, "y": 224, "zoomX": 100, "zoomY": 100,
            "angle": 0, "mirror": False, "opacity": 255, "blendMode": "normal",
            "visible": True, "priority": 1, "focus": "user",
            "_sourceXMissing": False, "_sourceYMissing": False
        })
        cels.append({
            "pattern": -2, "x": 384, "y": 96, "zoomX": 100, "zoomY": 100,
            "angle": 0, "mirror": False, "opacity": 255, "blendMode": "normal",
            "visible": True, "priority": 1, "focus": "target",
            "_sourceXMissing": False, "_sourceYMissing": False
        })

        for k in range(6):
            r_info = rock_offsets[k]
            s_dx, s_dy = start_offsets[k]

            if fi < 7:
                # Phase 1: Rising from ground at Enemy (user, anchor SRC_TARGET 384, 96)
                t_rise = (fi + 1) / 7.0
                cx = 384 + s_dx
                cy = int((96 + s_dy) - t_rise * 28)
                zoom = int(60 + t_rise * 35) # 60 -> 95
                op = int(80 + t_rise * 160)  # 80 -> 240
                angle = int(k * 30 + fi * 10)
                cels.append({
                    "pattern": r_info["pat"],
                    "x": cx, "y": cy, "zoomX": zoom, "zoomY": zoom,
                    "angle": angle, "mirror": False, "opacity": op,
                    "blendMode": "normal", "visible": True,
                    "priority": 1, "focus": "user",
                    "_sourceXMissing": False, "_sourceYMissing": False
                })
            elif fi < 18:
                # Phase 2: Parabolic flight from Enemy (384, 96) to Player field (128, 224)
                t_flight = (fi - 7) / 11.0 # 0.09 to 1.0
                start_x = 384 + s_dx
                start_y = 96 + s_dy - 28
                dest_x = 128 + r_info["dx"]
                dest_y = 224 + r_info["dy"]

                cx = int((1.0 - t_flight) * start_x + t_flight * dest_x)
                line_y = (1.0 - t_flight) * start_y + t_flight * dest_y
                arc_y = int(line_y - math.sin(t_flight * math.pi) * 65)

                zoom = int(95 + t_flight * 5)
                angle = int(k * 30 + fi * 15)
                cels.append({
                    "pattern": r_info["pat"],
                    "x": cx, "y": arc_y, "zoomX": zoom, "zoomY": zoom,
                    "angle": angle, "mirror": False, "opacity": 255,
                    "blendMode": "normal", "visible": True,
                    "priority": r_info["priority"], "focus": "both",
                    "_sourceXMissing": False, "_sourceYMissing": False
                })
            else:
                # Phase 3: Hovering in floating perimeter around Player (target, anchor SRC_USER 128, 224)
                bob = int(math.sin((fi - 18) * 0.45 + k * 1.05) * 4)
                cx = 128 + r_info["dx"]
                cy = 224 + r_info["dy"] + bob

                if fi >= 30:
                    t_shimmer = (fi - 30) / 4.0
                    op = int(255 - t_shimmer * 85)
                else:
                    op = 255

                angle = int(k * 30 + (fi - 18) * 4)
                cels.append({
                    "pattern": r_info["pat"],
                    "x": cx, "y": cy, "zoomX": 100, "zoomY": 100,
                    "angle": angle, "mirror": False, "opacity": op,
                    "blendMode": "normal", "visible": True,
                    "priority": r_info["priority"], "focus": "target",
                    "_sourceXMissing": False, "_sourceYMissing": False
                })

        frames.append({"cels": cels})

    timings = [
        {
            "frame": 0,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Stealth Rocks.wav",
                "volume": 90,
                "pitch": 100
            },
            "sound": {
                "file": "PRSFX- Stealth Rocks.wav",
                "volume": 90,
                "pitch": 100
            }
        }
    ]

    return {
        "id": 7193,
        "name": "OppMove:STEALTHROCK",
        "graphic": "PRAS- Stealth Rock.png",
        "frames": frames,
        "timings": timings
    }

def main():
    doc_7192 = create_stealth_rock_player()
    doc_7193 = create_stealth_rock_opponent()

    # Save 7192 (Player)
    for p in ['packages/game-data/animations/7192.json', 'packages/game-data/animations/last-chance/7192.json']:
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(doc_7192, f, indent=2)

    # Save 7193 (Opponent)
    for p in ['packages/game-data/animations/7193.json', 'packages/game-data/animations/last-chance/7193.json']:
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(doc_7193, f, indent=2)

    # Also update fallbacks 6260, 6261, 263, 264
    doc_6260 = json.loads(json.dumps(doc_7192))
    doc_6260['id'] = '6260'
    with open('packages/game-data/animations/last-chance/6260.json', 'w', encoding='utf-8') as f:
        json.dump(doc_6260, f, indent=2)

    doc_6261 = json.loads(json.dumps(doc_7193))
    doc_6261['id'] = '6261'
    with open('packages/game-data/animations/last-chance/6261.json', 'w', encoding='utf-8') as f:
        json.dump(doc_6261, f, indent=2)

    doc_263 = json.loads(json.dumps(doc_7192))
    doc_263['id'] = '263'
    with open('packages/game-data/animations/263.json', 'w', encoding='utf-8') as f:
        json.dump(doc_263, f, indent=2)

    doc_264 = json.loads(json.dumps(doc_7193))
    doc_264['id'] = '264'
    with open('packages/game-data/animations/264.json', 'w', encoding='utf-8') as f:
        json.dump(doc_264, f, indent=2)

    # Update move-animations-db.json
    db_path = 'packages/game-data/move-animations-db.json'
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)
    db['7192'] = doc_7192
    db['7193'] = doc_7193
    db['6260'] = doc_6260
    db['6261'] = doc_6261
    db['263'] = doc_263
    db['264'] = doc_264
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2)

    # Update manifest.json
    man_path = 'packages/game-data/animations/manifest.json'
    with open(man_path, 'r', encoding='utf-8') as f:
        man = json.load(f)
    man['7192'] = {
        'id': '7192',
        'name': 'Move:STEALTHROCK',
        'graphic': 'PRAS- Stealth Rock.png',
        'position': 2,
        'frameCount': 35,
        'timingCount': 1
    }
    man['7193'] = {
        'id': '7193',
        'name': 'OppMove:STEALTHROCK',
        'graphic': 'PRAS- Stealth Rock.png',
        'position': 1,
        'frameCount': 35,
        'timingCount': 1
    }
    man['263'] = man['7192']
    man['264'] = man['7193']
    with open(man_path, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=2)

    # Update last-chance-animation-manifest.json
    lc_man_path = 'packages/game-data/last-chance-animation-manifest.json'
    with open(lc_man_path, 'r', encoding='utf-8') as f:
        lc_man = json.load(f)
    lc_man['6260']['graphic'] = 'PRAS- Stealth Rock.png'
    lc_man['6260']['frameCount'] = 35
    lc_man['6260']['timingCount'] = 1
    lc_man['6261']['graphic'] = 'PRAS- Stealth Rock.png'
    lc_man['6261']['frameCount'] = 35
    lc_man['6261']['timingCount'] = 1
    with open(lc_man_path, 'w', encoding='utf-8') as f:
        json.dump(lc_man, f, indent=2)

    # Clean move-animation-extensions.json
    ext_path = 'packages/game-data/move-animation-extensions.json'
    with open(ext_path, 'r', encoding='utf-8') as f:
        ext = json.load(f)
    for sec in ['replacedMoves', 'replacedOpponentMoves', 'moves', 'opponentMoves']:
        if sec in ext and 'stealth_rock' in ext[sec]:
            del ext[sec]['stealth_rock']
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(ext, f, indent=2)

    # Set move-animation-map.json
    map_path = 'packages/game-data/move-animation-map.json'
    with open(map_path, 'r', encoding='utf-8') as f:
        amap = json.load(f)
    amap['moves']['stealth_rock'] = 7192
    amap['opponentMoves']['stealth_rock'] = 7193
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(amap, f, indent=2)

    # Set moves-db.json
    mdb_path = 'packages/game-data/moves-db.json'
    with open(mdb_path, 'r', encoding='utf-8') as f:
        mdb = json.load(f)
    if 'stealth_rock' in mdb.get('moves', {}):
        mdb['moves']['stealth_rock']['animationId'] = 7192
    with open(mdb_path, 'w', encoding='utf-8') as f:
        json.dump(mdb, f, indent=2)

    print("Stealth Rock animations generated and mappings cleanly updated!")

if __name__ == '__main__':
    main()
