import urllib.request
import json
import re
import time
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

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

def build_move_normalizer(moves_db):
    slug_map = {}
    for mid in moves_db.keys():
        slug_map[mid] = mid
        slug_map[mid.replace('_', '-')] = mid
        slug_map[re.sub(r'[^a-z0-9]+', '', mid)] = mid
    return slug_map

def normalize_move(raw_slug, slug_map):
    s = raw_slug.lower()
    if s in slug_map:
        return slug_map[s]
    clean = s.replace('-', '_')
    if clean in slug_map:
        return slug_map[clean]
    alphanumeric = re.sub(r'[^a-z0-9]+', '', s)
    if alphanumeric in slug_map:
        return slug_map[alphanumeric]
    return clean

def fetch_pokemon_tm_moves(pid, name, slug, slug_map):
    urls = [
        f'https://pokemondb.net/pokedex/{slug}',
        f'https://pokemondb.net/pokedex/{slug}/moves/7',
        f'https://pokemondb.net/pokedex/{slug}/moves/6'
    ]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    tm_moves = set()

    for url in urls:
        for attempt in range(2):
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=12) as r:
                    html = r.read().decode('utf-8')
                
                sections = re.split(r'<h[234][^>]*>', html)
                for sec in sections:
                    if 'Moves learnt by TM' in sec or 'Moves learnt by HM' in sec or 'Moves learnt by TR' in sec:
                        moves = re.findall(r'href="/move/([a-z0-9\-]+)"', sec)
                        for m in moves:
                            norm = normalize_move(m, slug_map)
                            tm_moves.add(norm)
                break
            except Exception as e:
                time.sleep(0.5)

    return pid, name, sorted(list(tm_moves))

def main():
    print('Loading moves-db.json & pokemon-db.json...')
    with open('packages/game-data/moves-db.json', 'r', encoding='utf-8') as f:
        moves_db = json.load(f)['moves']
    
    slug_map = build_move_normalizer(moves_db)

    with open('packages/game-data/pokemon-db.json', 'r', encoding='utf-8') as f:
        pkmn_root = json.load(f)
    
    pkmn_data = pkmn_root['pokemon']
    tasks = []
    for i in range(1, 152):
        sid = str(i)
        p = pkmn_data[sid]
        slug = get_slug(p['name'])
        tasks.append((i, p['name'], slug))

    print(f'Starting sync for {len(tasks)} Pokémon from pokemondb.net (8 workers)...')
    start_time = time.time()
    results = {}

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(fetch_pokemon_tm_moves, pid, name, slug, slug_map): pid
            for pid, name, slug in tasks
        }
        for future in as_completed(futures):
            pid, name, tm_moves = future.result()
            results[pid] = tm_moves
            safe_name = name.encode('ascii', 'replace').decode('ascii')
            print(f'[{len(results)}/151] #{pid:03d} {safe_name}: {len(tm_moves)} TM/HM moves')

    # Apply to pokemon-db.json
    total_tm_assigned = 0
    zero_tm_count = 0
    for i in range(1, 152):
        sid = str(i)
        tm_list = results.get(i, [])
        pkmn_data[sid]['tmMoves'] = tm_list
        if len(tm_list) == 0:
            zero_tm_count += 1
        else:
            total_tm_assigned += len(tm_list)

    elapsed = time.time() - start_time
    print(f'\nCompleted in {elapsed:.1f}s.')
    print(f'Total TM moves assigned across 151 Pokémon: {total_tm_assigned}')
    print(f'Pokémon with 0 TM moves (canonical restricted, e.g. Caterpie, Metapod, Magikarp with few/none): {zero_tm_count}')

    with open('packages/game-data/pokemon-db.json', 'w', encoding='utf-8') as f:
        json.dump(pkmn_root, f, indent=2, ensure_ascii=False)
        f.write('\n')
    
    print('Saved to packages/game-data/pokemon-db.json successfully!')

if __name__ == '__main__':
    main()
