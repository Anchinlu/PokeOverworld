import urllib.request
import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def get_slug(name):
    clean = name.lower()
    if 'nidoran' in clean and ('f' in clean or '♀' in clean):
        return 'nidoran-f'
    if 'nidoran' in clean and ('m' in clean or '♂' in clean):
        return 'nidoran-m'
    if 'mr' in clean and 'mime' in clean:
        return 'mr-mime'
    if 'farfetch' in clean:
        return 'farfetchd'
    clean = re.sub(r'[^a-z0-9]+', '-', clean).strip('-')
    return clean

def build_move_lookup(moves_db):
    name_to_id = {}
    for mid, m in moves_db.items():
        name_to_id[mid] = mid
        if 'nameEn' in m and m['nameEn']:
            name_to_id[m['nameEn'].lower()] = mid
            name_to_id[re.sub(r'[^a-z0-9]+', '', m['nameEn'].lower())] = mid
        if 'name' in m and m['name']:
            clean_name = m['name'].split('(')[0].strip().lower()
            name_to_id[clean_name] = mid
            name_to_id[re.sub(r'[^a-z0-9]+', '', clean_name)] = mid
    return name_to_id

def resolve_move(name, name_to_id, moves_db):
    clean = name.lower()
    mid = name_to_id.get(clean)
    if not mid:
        alphanumeric = re.sub(r'[^a-z0-9]+', '', clean)
        mid = name_to_id.get(alphanumeric)
    if not mid:
        normalized = re.sub(r'[^a-zA-Z0-9]+', '_', clean).strip('_')
        mid = name_to_id.get(normalized)
    
    if mid and mid in moves_db:
        m = moves_db[mid]
        return {
            'moveId': m['id'],
            'nameEn': m.get('nameEn') or name,
            'nameVi': m.get('nameVi') or name,
            'type': m.get('type') or 'Normal'
        }
    
    return {
        'moveId': re.sub(r'[^a-zA-Z0-9]+', '_', name.lower()).strip('_'),
        'nameEn': name,
        'nameVi': name,
        'type': 'Normal'
    }

def fetch_learnset(pkmn_id, name, slug, name_to_id, moves_db):
    url = f'https://pokemondb.net/pokedex/{slug}'
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as r:
                html = r.read().decode('utf-8')
            
            idx = html.find('Moves learnt by level up')
            if idx == -1:
                return pkmn_id, []
            
            table_match = re.search(r'<table[^>]*>(.*?)</table>', html[idx:], re.DOTALL)
            if not table_match:
                return pkmn_id, []
            
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_match.group(1), re.DOTALL)
            learnset = []
            seen_moves = set()
            
            for row in rows:
                cols = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL)]
                if not cols or cols[0] == 'Lv.':
                    continue
                
                lvl_str = cols[0]
                if lvl_str.isdigit():
                    lvl = int(lvl_str)
                elif lvl_str == '—' or lvl_str == '–' or lvl_str == '-':
                    lvl = 1
                else:
                    lvl = 1
                
                move_name = cols[1] if len(cols) > 1 else ''
                if not move_name:
                    continue
                
                resolved = resolve_move(move_name, name_to_id, moves_db)
                key = (lvl, resolved['moveId'])
                if key not in seen_moves:
                    seen_moves.add(key)
                    learnset.append({
                        'level': lvl,
                        'moveId': resolved['moveId'],
                        'nameEn': resolved['nameEn'],
                        'nameVi': resolved['nameVi'],
                        'type': resolved['type']
                    })
            
            return pkmn_id, learnset
        except Exception as e:
            if attempt < 2:
                time.sleep(1.0)
            else:
                print(f'Error fetching {name} ({slug}): {e}')
                return pkmn_id, []

def main():
    print('Loading data files...')
    with open('packages/game-data/moves-db.json', 'r', encoding='utf-8') as f:
        moves_db = json.load(f)['moves']
    
    with open('packages/game-data/pokemon-db.json', 'r', encoding='utf-8') as f:
        pkmn_root = json.load(f)
    
    pkmn_data = pkmn_root['pokemon']
    name_to_id = build_move_lookup(moves_db)
    
    tasks = []
    for i in range(1, 152):
        sid = str(i)
        p = pkmn_data[sid]
        slug = get_slug(p['name'])
        tasks.append((i, p['name'], slug))
    
    print(f'Fetching learnsets for {len(tasks)} Pokémon from pokemondb.net...')
    results = {}
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(fetch_learnset, pid, name, slug, name_to_id, moves_db): pid
            for pid, name, slug in tasks
        }
        for future in as_completed(futures):
            pid, learnset = future.result()
            results[pid] = learnset
            print(f'[{len(results)}/151] Synced #{pid} - {len(learnset)} moves')
    
    # Update pokemon-db.json
    success_count = 0
    total_moves_count = 0
    for i in range(1, 152):
        sid = str(i)
        moves = results.get(i, [])
        pkmn_data[sid]['moves'] = moves
        if moves:
            success_count += 1
            total_moves_count += len(moves)
    
    print(f'Successfully synced {success_count}/151 Pokémon ({total_moves_count} total move entries)')
    
    with open('packages/game-data/pokemon-db.json', 'w', encoding='utf-8') as f:
        json.dump(pkmn_root, f, indent=2, ensure_ascii=False)
        f.write('\n')
    
    print('Updated packages/game-data/pokemon-db.json successfully!')

if __name__ == '__main__':
    main()
