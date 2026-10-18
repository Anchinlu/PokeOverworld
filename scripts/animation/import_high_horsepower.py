import os, sys, json
sys.path.append(os.path.dirname(__file__))
import import_source_animations
import_source_animations.patch_reader()
import rubymarshal.reader as r

def main():
    source_root = r'E:\Pokemon spries\Pokemon Unbreakable Ties 4.1.2\Pokemon Unbreakable Ties 4.1.2'
    rxdata_path = os.path.join(source_root, 'Data', 'PkmnAnimations.rxdata')
    
    out_base = r'e:\Pokemon'
    game_data_dir = os.path.join(out_base, 'packages', 'game-data')
    anims_out_dir = os.path.join(game_data_dir, 'animations')
    last_chance_dir = os.path.join(anims_out_dir, 'last-chance')
    
    with open(rxdata_path, 'rb') as f:
        raw_anims = r.load(f)
    anim_list = raw_anims.attributes.get(b'@array') or raw_anims.attributes.get('@array', [])
    
    manifest_path = os.path.join(anims_out_dir, 'manifest.json')
    last_chance_manifest_path = os.path.join(game_data_dir, 'last-chance-animation-manifest.json')
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    with open(last_chance_manifest_path, 'r', encoding='utf-8') as f:
        last_chance_manifest = json.load(f)
        
    for aid, tgt_id in [(1126, 1126), (1127, 1127)]:
        anim = anim_list[aid]
        attrs = anim.attributes
        name = attrs.get(b'@name') or attrs.get('@name', '')
        if isinstance(name, bytes): name = name.decode('utf-8', errors='ignore')
        graphic = attrs.get(b'@graphic') or attrs.get('@graphic', '')
        if isinstance(graphic, bytes): graphic = graphic.decode('utf-8', errors='ignore')
        
        raw_frames = attrs.get(b'@array') or attrs.get('@array', [])
        frames = []
        for fi, f in enumerate(raw_frames):
            cels = []
            if isinstance(f, list):
                for cel_data in f:
                    cel = import_source_animations.parse_cel(cel_data)
                    if cel is not None:
                        if cel.get('pattern') == -1:
                            cel['focus'] = 'user'
                        elif cel.get('pattern') == -2:
                            cel['focus'] = 'target'
                        elif cel.get('pattern', -99) >= 0:
                            # Graphic cels
                            cel['graphic'] = graphic
                            cel['focus'] = 'target' # Horseshoe impact on target
                        cels.append(cel)
            frames.append({'cels': cels})
            
        raw_timings = attrs.get(b'@timing') or attrs.get('@timing', [])
        timings = []
        for t in raw_timings:
            if hasattr(t, 'attributes'):
                t_attrs = t.attributes
                frame_val = t_attrs.get(b'@frame') or t_attrs.get('@frame', 0)
                se_name = t_attrs.get(b'@name') or t_attrs.get('@name', '')
                if isinstance(se_name, bytes): se_name = se_name.decode('utf-8', errors='ignore')
                se_name = se_name.strip()
                if se_name:
                    timings.append({
                        'frame': frame_val,
                        'type': 'sound',
                        'payload': {
                            'sound': se_name,
                            'volume': t_attrs.get(b'@volume') or t_attrs.get('@volume', 80),
                            'pitch': t_attrs.get(b'@pitch') or t_attrs.get('@pitch', 100)
                        }
                    })
                    
        anim_json = {
            'id': tgt_id,
            'name': name,
            'graphic': graphic,
            'frameWidth': 192,
            'frameHeight': 192,
            'fps': 20,
            'frames': frames,
            'timings': timings,
            'sourcePack': 'Pokemon Unbreakable Ties 4.1.2'
        }
        
        for d in [anims_out_dir, last_chance_dir]:
            tgt_file = os.path.join(d, f'{tgt_id}.json')
            with open(tgt_file, 'w', encoding='utf-8') as fp:
                json.dump(anim_json, fp, indent=2, ensure_ascii=False)
                
        manifest_entry = {
            'id': str(tgt_id),
            'name': name,
            'graphic': graphic,
            'position': attrs.get(b'@position') or attrs.get('@position', 2),
            'frameCount': len(frames),
            'timingCount': len(timings),
        }
        manifest[str(tgt_id)] = manifest_entry
        last_chance_manifest[str(tgt_id)] = manifest_entry
        print(f'Exported {tgt_id}: {name} ({len(frames)} frames, {len(timings)} timings)')

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(last_chance_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(last_chance_manifest, f, indent=2, ensure_ascii=False)

    # Update move-animation-map.json
    map_path = os.path.join(game_data_dir, 'move-animation-map.json')
    with open(map_path, 'r', encoding='utf-8') as f:
        anim_map = json.load(f)
    anim_map['moves']['high_horsepower'] = 1126
    anim_map['opponentMoves']['high_horsepower'] = 1127
    with open(map_path, 'w', encoding='utf-8') as f:
        json.dump(anim_map, f, indent=2, ensure_ascii=False)

    # Update move-animation-extensions.json
    ext_path = os.path.join(game_data_dir, 'move-animation-extensions.json')
    with open(ext_path, 'r', encoding='utf-8') as f:
        anim_ext = json.load(f)
    if 'newMoves' in anim_ext:
        anim_ext['newMoves']['high_horsepower'] = 1126
    if 'opponentMoves' in anim_ext:
        anim_ext['opponentMoves']['high_horsepower'] = 1127
    anim_ext['high_horsepower'] = 1126
    anim_ext['high-horsepower'] = 1126
    with open(ext_path, 'w', encoding='utf-8') as f:
        json.dump(anim_ext, f, indent=2, ensure_ascii=False)

    # Update move-animations-db.json
    db_path = os.path.join(game_data_dir, 'move-animations-db.json')
    with open(db_path, 'r', encoding='utf-8') as f:
        anim_db = json.load(f)
    if 'high_horsepower' in anim_db:
        anim_db['high_horsepower']['animationId'] = 1126
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(anim_db, f, indent=2, ensure_ascii=False)

    print('Updated all move animation registries to 1126 (Player) & 1127 (Opponent)!')

if __name__ == '__main__':
    main()
