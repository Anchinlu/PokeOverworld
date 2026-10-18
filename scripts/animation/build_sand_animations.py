import json
import math
import os
import random
from PIL import Image

USER_UPLOADED_DIR = r"C:\Users\lctan\.gemini\antigravity-ide\brain\8f95e74a-0f6a-47b7-8ce7-363c0ba85587\.user_uploaded"

P0_FILE = os.path.join(USER_UPLOADED_DIR, "media_1792301608841.png")
P1_FILE = os.path.join(USER_UPLOADED_DIR, "media_1792301618296.png")
P2_FILE = os.path.join(USER_UPLOADED_DIR, "media_1792301626620.png")
P3_FILE = os.path.join(USER_UPLOADED_DIR, "media_1792301635564.png")

def create_sand_particles_spritesheet():
    p0 = Image.open(P0_FILE).convert("RGBA")
    p1 = Image.open(P1_FILE).convert("RGBA")
    p2 = Image.open(P2_FILE).convert("RGBA")
    p3 = Image.open(P3_FILE).convert("RGBA")
    particles = [p0, p1, p2, p3]

    sheet = Image.new("RGBA", (960, 384), (0, 0, 0, 0))

    def paste_centered(dst, img, cx, cy):
        # 16x16 image centered at (cx, cy)
        bx = cx - 8
        by = cy - 8
        dst.alpha_composite(img, (bx, by))

    # Row 0 (patterns 0..4): individual grains + pair
    # Pattern 0: speck grain
    paste_centered(sheet, particles[0], 96, 96)
    # Pattern 1: plus grain
    paste_centered(sheet, particles[1], 192 + 96, 96)
    # Pattern 2: jagged grain
    paste_centered(sheet, particles[2], 2 * 192 + 96, 96)
    # Pattern 3: diamond grain
    paste_centered(sheet, particles[3], 3 * 192 + 96, 96)
    # Pattern 4: Pair of grains (0 & 1)
    cx = 4 * 192 + 96
    paste_centered(sheet, particles[0], cx - 12, 96 - 8)
    paste_centered(sheet, particles[1], cx + 12, 96 + 8)

    # Row 1 (patterns 5..9): clusters and wind streaks
    # Pattern 5: Cluster of 3 grains (1, 2, 0)
    cx = 96
    cy = 288
    paste_centered(sheet, particles[1], cx - 14, cy + 10)
    paste_centered(sheet, particles[2], cx + 8, cy - 12)
    paste_centered(sheet, particles[0], cx + 16, cy + 14)

    # Pattern 6: Wind cluster of 4 grains (0, 1, 2, 3)
    cx = 192 + 96
    paste_centered(sheet, particles[0], cx - 22, cy - 12)
    paste_centered(sheet, particles[1], cx - 8, cy - 4)
    paste_centered(sheet, particles[2], cx + 8, cy + 6)
    paste_centered(sheet, particles[3], cx + 22, cy + 14)

    # Pattern 7: Wind gust streak of 5 grains along flight angle
    cx = 2 * 192 + 96
    paste_centered(sheet, particles[0], cx - 30, cy - 15)
    paste_centered(sheet, particles[1], cx - 15, cy - 7)
    paste_centered(sheet, particles[2], cx, cy)
    paste_centered(sheet, particles[1], cx + 16, cy + 8)
    paste_centered(sheet, particles[0], cx + 32, cy + 16)

    # Pattern 8: Fine dust trio
    cx = 3 * 192 + 96
    paste_centered(sheet, particles[0], cx - 10, cy - 6)
    paste_centered(sheet, particles[0], cx + 12, cy - 4)
    paste_centered(sheet, particles[0], cx + 2, cy + 10)

    # Pattern 9: Curved vortex arc
    cx = 4 * 192 + 96
    paste_centered(sheet, particles[0], cx - 24, cy + 16)
    paste_centered(sheet, particles[1], cx - 16, cy - 4)
    paste_centered(sheet, particles[3], cx, cy - 14)
    paste_centered(sheet, particles[2], cx + 16, cy - 6)
    paste_centered(sheet, particles[1], cx + 24, cy + 12)

    # Save to disk
    out_paths = [
        "Graphics/Animations/PRAS- Sand Particles.png",
        "apps/web/public/Graphics/Animations/PRAS- Sand Particles.png",
        "Graphics/Animations/PRAS- Sand Tomb.png",
        "apps/web/public/Graphics/Animations/PRAS- Sand Tomb.png",
    ]
    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        sheet.save(p, "PNG")
    print(f"Created spritesheet PRAS- Sand Particles.png (960x384) with 10 patterns.")

def update_atlas():
    atlas_entry = {
        "file": "PRAS- Sand Particles.png",
        "width": 960,
        "height": 384,
        "cellSize": 192,
        "cellWidth": 192,
        "cellHeight": 192,
        "columns": 5,
        "rows": 2,
        "maxPattern": 10
    }
    for atlas_path in [
        "packages/game-data/animation-atlas.json",
        "packages/game-data/last-chance-animation-atlas.json"
    ]:
        with open(atlas_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["PRAS- Sand Particles.png"] = atlas_entry
        with open(atlas_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print(f"Updated atlas at {atlas_path}")

def build_sand_tomb_animation():
    total_frames = 30
    frames = []

    # 28 particle streams orbiting the target
    num_particles = 28
    particle_defs = []
    rng = random.Random(42)

    for i in range(num_particles):
        is_inner_core = (i >= 22)
        base_pattern = i % 4
        # Height spread from feet (h=0) to head (h=1)
        h = (i % 7) / 6.0
        phase = (i / float(num_particles)) * 2 * math.pi
        omega = 0.42 if not is_inner_core else 0.65
        particle_defs.append({
            "id": i,
            "pattern": base_pattern,
            "is_inner": is_inner_core,
            "h": h,
            "phase": phase,
            "omega": omega,
            "rx_scale": 0.55 if is_inner_core else (0.85 + rng.uniform(-0.1, 0.15)),
        })

    for fi in range(total_frames):
        cels = []

        # Target battler tremor when trapped
        target_x = 384
        target_y = 96
        if 7 <= fi <= 23:
            shake = [-2, 2, -1, 1, 0][(fi - 7) % 5]
            target_x += shake

        # Battlers
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

        # Phase progression parameters
        if fi < 7:
            # Phase 1: Eruption from ground
            t = (fi + 1) / 7.0
            global_opacity_mult = min(1.0, t * 1.2)
            y_rise = (1.0 - t) * 35 # start 35px lower (at feet/ground)
            radius_mult = 0.4 + t * 0.6
        elif fi <= 23:
            # Phase 2: Full savage cyclone
            global_opacity_mult = 1.0
            y_rise = 0
            radius_mult = 1.0
        else:
            # Phase 3: Constriction & Sinking
            t_decay = (fi - 23) / 6.0
            global_opacity_mult = max(0.1, 1.0 - t_decay * 0.85)
            y_rise = t_decay * 25 # sinking into earth
            radius_mult = max(0.2, 1.0 - t_decay * 0.75) # constricting tight

        # Generate each particle cel
        for p in particle_defs:
            theta = p["phase"] + p["omega"] * fi

            # Height position: feet is y=128, chest is y=96, head is y=64
            # Funnel shape: wider at top, narrower at bottom
            h = p["h"]
            y_center = (96 + 32 - h * 62) + y_rise

            # Funnel radius: bottom R=36, top R=52
            base_rx = (36 + h * 16) * p["rx_scale"] * radius_mult
            base_ry = base_rx * 0.38 # 3D perspective tilt

            # 3D position offset relative to target anchor (384, 96)
            dx = base_rx * math.cos(theta)
            dy = (y_center - 96) + base_ry * math.sin(theta)

            cel_x = int(384 + dx)
            cel_y = int(96 + dy)

            # 3D depth layering based on sin(theta):
            # sin(theta) > 0 => front half of orbit (priority 1: above battler)
            # sin(theta) <= 0 => back half of orbit (priority 0: behind battler)
            is_front = (math.sin(theta) > 0)
            priority = 1 if is_front else 0

            # Scale and opacity based on depth
            depth_factor = math.sin(theta) # -1 (far back) to +1 (close front)
            if is_front:
                zoom = int((110 + depth_factor * 25) * (0.85 if p["is_inner"] else 1.0))
                op = int((210 + depth_factor * 45) * global_opacity_mult)
            else:
                zoom = int((85 + depth_factor * 15) * (0.85 if p["is_inner"] else 1.0))
                op = int((150 + depth_factor * 30) * global_opacity_mult)

            # Rotation angle follows motion direction + spin
            angle = int((theta * 180 / math.pi + fi * 15) % 360)

            cels.append({
                "pattern": p["pattern"],
                "x": cel_x,
                "y": cel_y,
                "zoomX": zoom,
                "zoomY": zoom,
                "angle": angle,
                "mirror": False,
                "opacity": min(255, max(0, op)),
                "blendMode": "normal",
                "visible": True,
                "priority": priority,
                "focus": "target",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

        frames.append({"cels": cels})

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
            "frame": 8,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Sandstorm.wav",
                "volume": 80,
                "pitch": 115
            },
            "sound": {
                "file": "PRSFX- Sandstorm.wav",
                "volume": 80,
                "pitch": 115
            }
        }
    ]

    doc = {
        "id": 7077,
        "name": "Move:SANDTOMB",
        "graphic": "PRAS- Sand Particles.png",
        "frames": frames,
        "timings": timings
    }
    return doc

def build_sandstorm_animation():
    total_frames = 32
    frames = []

    # 36 sand streams/gusts flying across the screen
    num_particles = 36
    rng = random.Random(1337)
    particle_defs = []

    for i in range(num_particles):
        # Variety of patterns: single grains (0-3) and flying clusters (4-7)
        if i % 3 == 0:
            pattern = rng.choice([4, 5, 6, 7]) # clusters
        else:
            pattern = i % 4 # fine grains

        # Priority: ~60% in front of battlers (priority 1), ~40% behind battlers (priority 0)
        priority = 1 if (i % 5 != 0) else 0

        # Wind lane start positions (staggered across x: 0..600, y: 15..320)
        start_x = rng.uniform(0, 650)
        start_y = rng.uniform(20, 310)
        # Fast speed: 45 to 65 pixels per frame
        speed_x = rng.uniform(42, 60)
        speed_y = rng.uniform(10, 18)
        zoom_base = rng.uniform(115, 160) if priority == 1 else rng.uniform(65, 90)
        opacity_base = rng.uniform(190, 245) if priority == 1 else rng.uniform(120, 175)
        angle = int(rng.uniform(16, 28))

        particle_defs.append({
            "pattern": pattern,
            "priority": priority,
            "start_x": start_x,
            "start_y": start_y,
            "speed_x": speed_x,
            "speed_y": speed_y,
            "zoom": int(zoom_base),
            "opacity": int(opacity_base),
            "angle": angle,
            "phase": rng.uniform(0, 2 * math.pi)
        })

    for fi in range(total_frames):
        cels = []

        # Battlers
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
        cels.append({
            "pattern": -2,
            "x": 384,
            "y": 96,
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

        # Wind envelope: rises over first 6 frames, steady, gentle settling
        if fi < 6:
            env = (fi + 1) / 6.0
        elif fi <= 26:
            env = 1.0
        else:
            env = 1.0 - (fi - 26) / 12.0 # settles into continuous weather

        for p in particle_defs:
            # Trajectory across screen: moving right-to-left
            # Total width span is 650px
            dist_x = p["speed_x"] * fi
            cur_x = (p["start_x"] - dist_x) % 650
            if cur_x > 550:
                cur_x -= 650 # wrap smoothly

            # Vertical movement with slight wave
            wave = math.sin(fi * 0.35 + p["phase"]) * 8
            dist_y = p["speed_y"] * (fi % 12)
            cur_y = p["start_y"] + dist_y + wave
            if cur_y > 340:
                cur_y = 20 + (cur_y % 320)

            # Opacity with envelope
            op = int(p["opacity"] * env)
            if op <= 10:
                continue

            cels.append({
                "pattern": p["pattern"],
                "x": int(cur_x),
                "y": int(cur_y),
                "zoomX": p["zoom"],
                "zoomY": p["zoom"],
                "angle": p["angle"],
                "mirror": False,
                "opacity": op,
                "blendMode": "normal",
                "visible": True,
                "priority": p["priority"],
                "focus": "screen",
                "_sourceXMissing": False,
                "_sourceYMissing": False
            })

        frames.append({"cels": cels})

    timings = [
        {
            "frame": 0,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Sandstorm.wav",
                "volume": 90,
                "pitch": 100
            },
            "sound": {
                "file": "PRSFX- Sandstorm.wav",
                "volume": 90,
                "pitch": 100
            }
        },
        {
            "frame": 14,
            "type": "sound",
            "payload": {
                "sound": "Anim/PRSFX- Sandstorm.wav",
                "volume": 75,
                "pitch": 105
            },
            "sound": {
                "file": "PRSFX- Sandstorm.wav",
                "volume": 75,
                "pitch": 105
            }
        }
    ]

    doc = {
        "id": 7078,
        "name": "Move:SANDSTORM",
        "graphic": "PRAS- Sand Particles.png",
        "frames": frames,
        "timings": timings
    }
    return doc

def save_animation(doc):
    mid = str(doc["id"])
    p1 = f"packages/game-data/animations/{mid}.json"
    p2 = f"packages/game-data/animations/last-chance/{mid}.json"
    with open(p1, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2)
    with open(p2, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2)

    db_path = "packages/game-data/move-animations-db.json"
    with open(db_path, "r", encoding="utf-8") as f:
        db = json.load(f)
    db[mid] = doc
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2)

    man_path = "packages/game-data/animations/manifest.json"
    with open(man_path, "r", encoding="utf-8") as f:
        man = json.load(f)
    man[mid] = {
        "id": mid,
        "name": doc["name"],
        "graphic": doc["graphic"],
        "position": 2 if doc["name"] == "Move:SANDTOMB" else 0,
        "frameCount": len(doc["frames"]),
        "timingCount": len(doc["timings"])
    }
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(man, f, indent=2)

    print(f"Saved animation {mid} ({doc['name']}) with {len(doc['frames'])} frames.")

if __name__ == "__main__":
    create_sand_particles_spritesheet()
    update_atlas()

    sand_tomb_doc = build_sand_tomb_animation()
    save_animation(sand_tomb_doc)

    sandstorm_doc = build_sandstorm_animation()
    save_animation(sandstorm_doc)

    print("All sand animations built and saved successfully!")
