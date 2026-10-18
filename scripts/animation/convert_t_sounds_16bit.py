import wave, struct, os, time

def convert_wav_file(path):
    try:
        w_in = wave.open(path, 'rb')
        n_channels = w_in.getnchannels()
        sampwidth = w_in.getsampwidth()
        framerate = w_in.getframerate()
        n_frames = w_in.getnframes()
        
        if sampwidth != 1:
            w_in.close()
            return False # Already 16-bit
            
        raw_data = w_in.readframes(n_frames)
        w_in.close()
        
        # 8-bit unsigned -> samples in [-128, 127] scaled by 256 to [-32768, 32512]
        samples_in = [b - 128 for b in raw_data]
        samples_16 = [s * 256 for s in samples_in]
        
        target_rate = 48000
        ratio = target_rate / framerate
        
        total_in_frames = len(samples_16) // n_channels
        total_out_frames = int(total_in_frames * ratio)
        
        out_samples = []
        for out_f in range(total_out_frames):
            in_pos = out_f / ratio
            idx = int(in_pos)
            frac = in_pos - idx
            
            for ch in range(n_channels):
                s1 = samples_16[idx * n_channels + ch] if idx < total_in_frames else 0
                s2 = samples_16[(idx + 1) * n_channels + ch] if (idx + 1) < total_in_frames else s1
                val = int(s1 + frac * (s2 - s1))
                if val > 32767: val = 32767
                elif val < -32768: val = -32768
                out_samples.append(val)
                
        out_bytes = struct.pack(f"<{len(out_samples)}h", *out_samples)
        
        w_out = wave.open(path, 'wb')
        w_out.setnchannels(n_channels)
        w_out.setsampwidth(2) # 16-bit
        w_out.setframerate(target_rate) # 48000 Hz
        w_out.writeframes(out_bytes)
        w_out.close()
        return True
    except Exception as e:
        print(f"Error on {path}: {e}")
        return False

# First convert all sound files specifically used by Group T
import json
moves_db = json.load(open('packages/game-data/moves-db.json'))['moves']
anim_map = json.load(open('packages/game-data/move-animation-map.json'))

t_moves = sorted([k for k in moves_db.keys() if k.startswith('t')])
t_sounds = set()
for m in t_moves:
    for side in ['moves', 'opponentMoves']:
        aid = anim_map[side].get(m)
        if aid:
            p = f'packages/game-data/animations/{aid}.json'
            if os.path.exists(p):
                a = json.load(open(p))
                for t in a.get('timings', []):
                    if t.get('type') == 'sound':
                        s = t.get('payload', {}).get('sound')
                        if s: t_sounds.add(s)

print(f"Converting all {len(t_sounds)} sound files for Group T...")
converted_count = 0
for s in t_sounds:
    clean = s.replace('\\', '/').replace('Audio/SE/', '')
    for d in ['apps/web/public/Audio/SE', 'apps/web/public/Audio/SE/Anim', 'apps/web/public']:
        fp = os.path.join(d, clean)
        if os.path.exists(fp) and fp.lower().endswith('.wav'):
            if convert_wav_file(fp):
                converted_count += 1
                print(f"  Converted T sound: {fp}")

print(f"Total T sound instances converted: {converted_count}")
