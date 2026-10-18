import json
import os

def generate_heat_wave():
    total_frames = 28
    
    # Virtual reference coordinates
    user_x, user_y = 128.0, 224.0
    target_x, target_y = 384.0, 96.0
    
    frames_player = []
    frames_opp = []
    
    for f in range(total_frames):
        cels_p = []
        cels_o = []
        
        # Battler placeholders: cel 0 = user, cel 1 = target
        cels_p.append({
            "pattern": -1, "x": int(user_x), "y": int(user_y),
            "zoomX": 100, "zoomY": 100, "angle": 0, "mirror": False,
            "opacity": 255, "blendMode": "normal", "visible": True, "priority": 1, "focus": "user"
        })
        cels_p.append({
            "pattern": -2, "x": int(target_x), "y": int(target_y),
            "zoomX": 100, "zoomY": 100, "angle": 0, "mirror": False,
            "opacity": 255, "blendMode": "normal", "visible": True, "priority": 1, "focus": "target"
        })
        
        cels_o.append({
            "pattern": -1, "x": int(user_x), "y": int(user_y),
            "zoomX": 100, "zoomY": 100, "angle": 0, "mirror": False,
            "opacity": 255, "blendMode": "normal", "visible": True, "priority": 1, "focus": "user"
        })
        cels_o.append({
            "pattern": -2, "x": int(target_x), "y": int(target_y),
            "zoomX": 100, "zoomY": 100, "angle": 0, "mirror": False,
            "opacity": 255, "blendMode": "normal", "visible": True, "priority": 1, "focus": "target"
        })
        
        # -------------------------------------------------------------
        # Full-Screen Heat Wave Animation Layer (PRAS- Heat Wave BG.png)
        # Authored at (256, 144) to cover 100% of the 512x288 battle screen.
        # Only this full-screen heat wave animation is retained.
        # -------------------------------------------------------------
        if f <= 26:
            if f <= 3:
                bg_op = int((f + 1) / 4.0 * 200) # 50 -> 200
            elif f <= 19:
                bg_op = 230 # Strong shimmering heat wave across battlefield
            else:
                bg_op = int((1.0 - (f - 19) / 8.0) * 230) # 230 -> 0
            bg_op = max(0, min(255, bg_op))
            
            cels_p.append({
                "pattern": f % 6,
                "graphic": "PRAS- Heat Wave BG.png",
                "x": 256,
                "y": 144,
                "zoomX": 102,
                "zoomY": 102,
                "angle": 0,
                "mirror": False,
                "opacity": bg_op,
                "blendMode": "additive",
                "visible": True,
                "priority": 0,
                "focus": "screen"
            })
            cels_o.append({
                "pattern": f % 6,
                "graphic": "PRAS- Heat Wave BG.png",
                "x": 256,
                "y": 144,
                "zoomX": 102,
                "zoomY": 102,
                "angle": 0,
                "mirror": True,
                "opacity": bg_op,
                "blendMode": "additive",
                "visible": True,
                "priority": 0,
                "focus": "screen"
            })
        
        frames_player.append({"cels": cels_p})
        frames_opp.append({"cels": cels_o})
        
    timings_p = [
        {"frame": 0, "type": "sound", "payload": {"sound": "PRSFX- Heat Wave.wav", "volume": 100, "pitch": 100}},
        {"frame": 4, "type": "flash", "payload": {"flashDuration": 6, "flashScope": 2, "flashColor": [255, 130, 40, 90], "screenShake": True}}
    ]
    
    timings_o = [
        {"frame": 0, "type": "sound", "payload": {"sound": "PRSFX- Heat Wave.wav", "volume": 100, "pitch": 100}},
        {"frame": 4, "type": "flash", "payload": {"flashDuration": 6, "flashScope": 2, "flashColor": [255, 130, 40, 90], "screenShake": True}}
    ]
    
    anim_player = {
        "id": 6860,
        "name": "Move:HEATWAVE",
        "graphic": "PRAS- Heat Wave BG.png",
        "frameWidth": 512,
        "frameHeight": 288,
        "fps": 20,
        "frames": frames_player,
        "timings": timings_p,
        "sourcePack": "Pokemon PRAS Authentic"
    }
    
    anim_opp = {
        "id": 6861,
        "name": "OppMove:HEATWAVE",
        "graphic": "PRAS- Heat Wave BG.png",
        "frameWidth": 512,
        "frameHeight": 288,
        "fps": 20,
        "frames": frames_opp,
        "timings": timings_o,
        "sourcePack": "Pokemon PRAS Authentic"
    }
    
    out_dir = r'e:\Pokemon\packages\game-data\animations'
    lc_dir = os.path.join(out_dir, 'last-chance')
    
    for aid, obj in [(6860, anim_player), (6861, anim_opp)]:
        f1 = os.path.join(out_dir, f"{aid}.json")
        f2 = os.path.join(lc_dir, f"{aid}.json")
        with open(f1, 'w', encoding='utf-8') as fp:
            json.dump(obj, fp, indent=2, ensure_ascii=False)
        with open(f2, 'w', encoding='utf-8') as fp:
            json.dump(obj, fp, indent=2, ensure_ascii=False)
        print(f"Saved animation {aid} ({len(obj['frames'])} frames, {sum(len(f['cels']) for f in obj['frames'])} total cels)")

if __name__ == '__main__':
    generate_heat_wave()
