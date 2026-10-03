import os
import re
import json

content1 = r'C:\Users\lctan\.gemini\antigravity-ide\brain\531f914a-f71b-4549-bce0-d98504f09da3\.system_generated\steps\14120\content.md'
content2 = r'C:\Users\lctan\.gemini\antigravity-ide\brain\531f914a-f71b-4549-bce0-d98504f09da3\.system_generated\steps\14158\content.md'
items_dir = r'e:\Pokemon\Graphics\Items'
out_db = r'e:\Pokemon\packages\game-data\items-db.json'
out_unmatched = r'e:\Pokemon\packages\game-data\unmatched-items.json'

row_pattern = re.compile(
    r'<tr>\s*<td class="cell-fixed"[^>]*>.*?<a class="ent-name" href="/item/([^"]+)">([^<]+)</a>\s*</td>\s*<td class="cell-fixed"[^>]*data-sort-value="([^"]*)"[^>]*>([^<]*)</td>\s*<td class="cell-long-text">([^<]*)</td>\s*</tr>',
    re.DOTALL
)

key_row_pattern = re.compile(
    r'<tr>\s*<td class="cell-fixed"[^>]*>.*?<a class="ent-name" href="/item/([^"]+)">([^<]+)</a>\s*</td>\s*<td class="cell-long-text">([^<]*)</td>\s*</tr>',
    re.DOTALL
)

def clean_key(s):
    return re.sub(r'[^a-zA-Z0-9]', '', s).upper()

db_by_key = {}
db_by_slug = {}

# Category translations
CAT_NAMES_VI = {
    'pokeballs': 'Bóng Poké',
    'medicine': 'Dược phẩm & Hồi máu',
    'berries': 'Quả mọng (Berries)',
    'hold': 'Vật phẩm trang bị (Hold)',
    'battle': 'Vật phẩm chiến đấu',
    'machines': 'Đĩa kỹ năng (TM/HM)',
    'key': 'Vật phẩm quan trọng',
    'general': 'Vật phẩm thông thường'
}

# Vietnamese translation dictionary for items
ITEM_NAME_VI = {
    'potion': 'Thuốc Hồi Phục',
    'super-potion': 'Thuốc Hồi Phục Lớn',
    'hyper-potion': 'Siêu Thuốc Hồi Phục',
    'max-potion': 'Thuốc Hồi Phục Tối Đa',
    'full-restore': 'Hồi Phục Toàn Diện',
    'revive': 'Hồi Sinh',
    'max-revive': 'Siêu Hồi Sinh',
    'antidote': 'Thuốc Giải Độc',
    'burn-heal': 'Thuốc Trị Bỏng',
    'ice-heal': 'Thuốc Trị Băng Giá',
    'awakening': 'Thuốc Trị Ngủ',
    'paralyze-heal': 'Thuốc Trị Tê Liệt',
    'full-heal': 'Trị Mọi Trạng Thái',
    'ether': 'Thuốc Hồi Điểm PP',
    'max-ether': 'Siêu Thuốc Hồi PP',
    'elixir': 'Thuốc Hồi Toàn PP',
    'max-elixir': 'Siêu Hồi Toàn PP',
    'poke-ball': 'Bóng Poké',
    'great-ball': 'Bóng Great',
    'ultra-ball': 'Bóng Ultra',
    'master-ball': 'Bóng Master',
    'safari-ball': 'Bóng Safari',
    'fast-ball': 'Bóng Fast',
    'level-ball': 'Bóng Level',
    'lure-ball': 'Bóng Lure',
    'heavy-ball': 'Bóng Heavy',
    'love-ball': 'Bóng Love',
    'friend-ball': 'Bóng Friend',
    'moon-ball': 'Bóng Moon',
    'sport-ball': 'Bóng Sport',
    'net-ball': 'Bóng Net',
    'dive-ball': 'Bóng Dive',
    'nest-ball': 'Bóng Nest',
    'repeat-ball': 'Bóng Repeat',
    'timer-ball': 'Bóng Timer',
    'luxury-ball': 'Bóng Luxury',
    'premier-ball': 'Bóng Premier',
    'dusk-ball': 'Bóng Dusk',
    'heal-ball': 'Bóng Heal',
    'quick-ball': 'Bóng Quick',
    'cherish-ball': 'Bóng Cherish',
    'rare-candy': 'Kẹo Hiếm',
    'fire-stone': 'Đá Lửa',
    'water-stone': 'Đá Nước',
    'thunder-stone': 'Đá Sấm Sét',
    'leaf-stone': 'Đá Lá',
    'moon-stone': 'Đá Mặt Trăng',
    'sun-stone': 'Đá Mặt Trời',
    'shiny-stone': 'Đá Ánh Sáng',
    'dusk-stone': 'Đá Hoàng Hôn',
    'dawn-stone': 'Đá Bình Minh',
    'ice-stone': 'Đá Băng',
    'oval-stone': 'Đá Trứng Ovan',
    'everstone': 'Đá Ngăn Tiến Hóa',
    'exp-share': 'Chia Sẻ EXP',
    'lucky-egg': 'Trứng May Mắn',
    'amulet-coin': 'Đồng Xu May Mắn',
    'soothe-bell': 'Chuông Xoa Dịu',
    'cleanse-tag': 'Bùa Thanh Tẩy',
    'smoke-ball': 'Quả Cầu Khói',
    'leftovers': 'Đồ Ăn Thừa',
    'focus-sash': 'Đai Tập Trung',
    'focus-band': 'Băng Buộc Tập Trung',
    'choice-band': 'Băng Đô Lựa Chọn',
    'choice-specs': 'Kính Lựa Chọn',
    'choice-scarf': 'Khăn Choàng Lựa Chọn',
    'life-orb': 'Ngọc Sinh Mệnh',
    'toxic-orb': 'Ngọc Kịch Độc',
    'flame-orb': 'Ngọc Hỏa Thiêu',
    'rocky-helmet': 'Mũ Gai Cứng',
    'assault-vest': 'Áo Giáp Tấn Công',
    'eviolite': 'Khoáng Thạch Tiến Hóa',
    'air-balloon': 'Khinh Khí Cầu',
    'quick-claw': 'Vuốt Nhanh Nhẹn',
    'kings-rock': 'Vương Miện Chúa Tể',
    'metal-coat': 'Lớp Phủ Kim Loại',
    'dragon-scale': 'Vảy Rồng',
    'up-grade': 'Bản Nâng Cấp Chip',
    'dubious-disc': 'Đĩa Dữ Liệu Lạ',
    'protector': 'Bộ Giáp Hộ Mệnh',
    'electirizer': 'Hạt Năng Lượng Điện',
    'magmarizer': 'Lõi Nham Thạch',
    'reaper-cloth': 'Tấm Vải Tử Thần',
    'prism-scale': 'Vảy Cầu Vồng',
    'whipped-dream': 'Kem Tươi Giấc Mơ',
    'sachet': 'Túi Thơm Tinh Dầu',
    'black-belt': 'Đai Đen Võ Thuật',
    'black-glasses': 'Kính Râm Đen',
    'charcoal': 'Than Đốt Lửa',
    'dragon-fang': 'Nanh Rồng',
    'hard-stone': 'Đá Cứng',
    'magnet': 'Nam Châm Từ Tính',
    'miracle-seed': 'Hạt Giống Kì Diệu',
    'mystic-water': 'Giọt Nước Bí Ẩn',
    'never-melt-ice': 'Băng Vĩnh Cửu',
    'poison-barb': 'Gai Độc',
    'sharp-beak': 'Mỏ Chim Sắc Nhọn',
    'silk-scarf': 'Khăn Lụa',
    'silver-powder': 'Bột Bạc',
    'soft-sand': 'Cát Mịn',
    'spell-tag': 'Bùa Trừ Tà',
    'twisted-spoon': 'Muỗng Uốn Cong',
    'ability-capsule': 'Viên Nang Đặc Tính',
    'ability-patch': 'Miếng Dán Ẩn Tính',
    'bike': 'Xe Đạp Thể Thao',
    'old-rod': 'Cần Câu Cũ',
    'good-rod': 'Cần Câu Tốt',
    'super-rod': 'Cần Câu Cao Cấp',
    'town-map': 'Bản Đồ Thị Trấn',
    'poke-flute': 'Sáo Đánh Thức Pokémon',
    'silph-scope': 'Kính Hồng Ngoại Silph Scope',
    'itemfinder': 'Máy Tìm Vật Phẩm Ẩn',
    'dowsing-machine': 'Máy Tìm Đồ Radar',
    'coin-case': 'Hộp Đựng Tiền Xu',
    'escape-rope': 'Dây Thừng Thoát Hiểm',
    'repel': 'Bình Xịt Đuổi Pokémon',
    'super-repel': 'Siêu Bình Xịt Đuổi',
    'max-repel': 'Bình Xịt Đuổi Tối Đa',
    'nugget': 'Thỏi Vàng',
    'big-nugget': 'Khối Vàng Lớn',
    'pearl': 'Ngọc Trai Biển',
    'big-pearl': 'Ngọc Trai Lớn',
    'stardust': 'Bụi Sao Lấp Lánh',
    'star-piece': 'Mảnh Vỡ Ngôi Sao',
}

# 1. Parse General Items
with open(content1, 'r', encoding='utf-8') as f:
    text = f.read()
matches1 = row_pattern.findall(text)
for slug, name, cat_code, cat_name, desc in matches1:
    clean_name = name.strip()
    k = clean_key(clean_name)
    sk = clean_key(slug)
    data = {
        'id': slug,
        'name': clean_name,
        'slug': slug,
        'category': cat_code or 'general',
        'categoryName': cat_name or 'General items',
        'categoryVi': CAT_NAMES_VI.get(cat_code or 'general', 'Vật phẩm thông thường'),
        'description': desc.strip(),
    }
    db_by_key[k] = data
    db_by_slug[sk] = data

# 2. Parse Key Items
with open(content2, 'r', encoding='utf-8') as f:
    text2 = f.read()
matches2 = key_row_pattern.findall(text2)
for slug, name, desc in matches2:
    clean_name = name.strip()
    k = clean_key(clean_name)
    sk = clean_key(slug)
    data = {
        'id': slug,
        'name': clean_name,
        'slug': slug,
        'category': 'key',
        'categoryName': 'Key items',
        'categoryVi': 'Vật phẩm quan trọng',
        'description': desc.strip(),
    }
    db_by_key[k] = data
    db_by_slug[sk] = data

# 3. Match against files in Graphics/Items
files = [f for f in os.listdir(items_dir) if f.lower().endswith('.png')]

ALIASES = {
    'BICYCLE': 'BIKE',
    'OLDROD': 'OLDROD',
    'GOODROD': 'GOODROD',
    'SUPERROD': 'SUPERROD',
    'TOWNMAP': 'TOWNMAP',
    'POKEFLUTE': 'POKEFLUTE',
    'SILPHSCOPE': 'SILPHSCOPE',
    'DEVONSCOPE': 'DEVONSCOPE',
    'COINCASE': 'COINCASE',
    'BLUEORB': 'BLUEORB',
    'REDORB': 'REDORB',
    'ITEMFINDER': 'DOWSINGMACHINE',
    'DOWSINGMACHINE': 'DOWSINGMACHINE',
    'AURORATICKET': 'AURORATICKET',
    'OLDSEAMAP': 'OLDSEAMAP',
    'EXPALL': 'EXPSHARE',
    'EXPCHARM': 'EXPCHARM',
    'CATCHINGCHARM': 'CATCHINGCHARM',
    'ROTOMCATALOG': 'ROTOMCATALOG',
    'ZYGARDECUBE': 'ZYGARDECUBE',
    'RUSTEDSWORD': 'RUSTEDSWORD',
    'RUSTEDSHIELD': 'RUSTEDSHIELD',
    'REINSOFUNITY': 'REINSOFUNITY',
}

matched_items = {}
unmatched_files = []

for filename in sorted(files):
    stem = os.path.splitext(filename)[0]
    ck = clean_key(stem)
    match = db_by_key.get(ck) or db_by_slug.get(ck)
    if not match and ck in ALIASES:
        alt_k = ALIASES[ck]
        match = db_by_key.get(alt_k) or db_by_slug.get(alt_k)
        
    if match:
        item = dict(match)
        item['sprite'] = f'Graphics/Items/{filename}'
        item['filename'] = filename
        item['nameVi'] = ITEM_NAME_VI.get(item['id'], item['name'])
        matched_items[item['id']] = item
    else:
        # Formulate formatted name
        formatted_name = re.sub(r'([A-Z]+)', r' \1', stem).strip().title()
        unmatched_files.append({
            'filename': filename,
            'sprite': f'Graphics/Items/{filename}',
            'rawKey': stem,
            'suggestedName': formatted_name,
            'nameVi': '',
            'category': 'unknown',
            'categoryVi': 'Chưa phân loại',
            'description': '',
            'descriptionVi': '',
            'status': 'pending_info'
        })

print(f'Total matched items with sprites: {len(matched_items)}')
print(f'Total unmatched files: {len(unmatched_files)}')

# Output matched items db
with open(out_db, 'w', encoding='utf-8') as f:
    json.dump({
        'version': '1.0.0',
        'count': len(matched_items),
        'items': matched_items
    }, f, ensure_ascii=False, indent=2)

# Output unmatched items for user to customize
with open(out_unmatched, 'w', encoding='utf-8') as f:
    json.dump({
        'notice': 'Danh sách các file ảnh vật phẩm chưa có thông tin từ pokemondb.net. Bạn có thể cập nhật thông tin (nameVi, category, descriptionVi) tại đây.',
        'count': len(unmatched_files),
        'items': unmatched_files
    }, f, ensure_ascii=False, indent=2)

print('Successfully created items-db.json and unmatched-items.json')
