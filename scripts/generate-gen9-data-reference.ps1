param(
  [string]$OutputPath = 'docs/GEN9_DATA_REFERENCE.md'
)

$ErrorActionPreference = 'Stop'
$baseUrl = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'

function Get-RemoteCsv([string]$name) {
  $content = (Invoke-WebRequest -Uri ($baseUrl + $name) -TimeoutSec 60).Content
  return $content | ConvertFrom-Csv
}

$machines = Get-RemoteCsv 'machines.csv'
$moves = Get-RemoteCsv 'moves.csv'
$moveNames = Get-RemoteCsv 'move_names.csv'
$pokemon = Get-RemoteCsv 'pokemon.csv'
$pokemonStats = Get-RemoteCsv 'pokemon_stats.csv'
$pokemonTypes = Get-RemoteCsv 'pokemon_types.csv'
$pokemonAbilities = Get-RemoteCsv 'pokemon_abilities.csv'
$abilities = Get-RemoteCsv 'abilities.csv'
$pokemonMoves = Get-RemoteCsv 'pokemon_moves.csv'

$localMoves = (Get-Content 'packages/game-data/moves-db.json' -Raw | ConvertFrom-Json).moves

$moveById = @{}
foreach ($move in $moves) { $moveById[[int]$move.id] = $move }

$moveNameById = @{}
foreach ($name in ($moveNames | Where-Object { $_.local_language_id -eq '9' })) {
  $moveNameById[[int]$name.move_id] = $name.name
}

$abilityById = @{}
foreach ($ability in $abilities) { $abilityById[[int]$ability.id] = $ability.identifier }

$typeById = @{
  1='Normal'; 2='Fighting'; 3='Flying'; 4='Poison'; 5='Ground'; 6='Rock';
  7='Bug'; 8='Ghost'; 9='Steel'; 10='Fire'; 11='Water'; 12='Grass';
  13='Electric'; 14='Psychic'; 15='Ice'; 16='Dragon'; 17='Dark'; 18='Fairy'
}

$categoryById = @{ 1='Status'; 2='Physical'; 3='Special' }
$statById = @{ 1='HP'; 2='Attack'; 3='Defense'; 4='Sp. Atk'; 5='Sp. Def'; 6='Speed' }

$svVersionGroups = @(25, 26, 27)
$tmRows = @(
  $machines |
    Where-Object { $svVersionGroups -contains [int]$_.version_group_id -and [int]$_.machine_number -ge 1 -and [int]$_.machine_number -le 229 } |
    Sort-Object @{Expression={[int]$_.machine_number}}, @{Expression={[int]$_.version_group_id}} |
    Group-Object machine_number |
    ForEach-Object { $_.Group[-1] }
)

if ($tmRows.Count -ne 229) {
  throw "Expected 229 Gen 9 TM rows, found $($tmRows.Count)."
}

$svMachineMoveByPokemon = @{}
foreach ($row in ($pokemonMoves | Where-Object { $svVersionGroups -contains [int]$_.version_group_id -and $_.pokemon_move_method_id -eq '4' })) {
  if ([int]$row.pokemon_id -le 151) {
    $key = "$( [int]$row.pokemon_id )/$([int]$row.move_id)"
    $svMachineMoveByPokemon[$key] = $true
  }
}

$tmLearnerCountByMove = @{}
foreach ($key in $svMachineMoveByPokemon.Keys) {
  $moveId = [int]($key -split '/')[1]
  if (-not $tmLearnerCountByMove.ContainsKey($moveId)) { $tmLearnerCountByMove[$moveId] = 0 }
  $tmLearnerCountByMove[$moveId]++
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# Gen 9 Data Reference — TM, Base Stats và Ability')
$lines.Add('')
$lines.Add("> Generated: $(Get-Date -Format 'yyyy-MM-dd')")
$lines.Add('> Scope: 151 Pokémon Kanto đang có trong dự án; luật dữ liệu tham chiếu Pokémon Scarlet/Violet và DLC Gen 9.')
$lines.Add('')
$lines.Add('## Trạng thái triển khai')
$lines.Add('')
$lines.Add('| Hạng mục | Trạng thái | Ghi chú |')
$lines.Add('|---|---|---|')
$lines.Add('| Roster | Đang giữ 151 Pokémon Gen 1 | Chưa mở rộng sang toàn bộ National Dex Gen 9. |')
$lines.Add('| Base stats | Có dữ liệu cho 151 Pokémon | Bảng dưới dùng HP, Attack, Defense, Sp. Atk, Sp. Def, Speed. |')
$lines.Add('| Ability | Tài liệu liệt kê đủ slot | Code hiện tại vẫn đang dùng trường `ability` đơn; chưa migrate `primary/secondary/hidden`. |')
$lines.Add('| TM catalog | Kế hoạch Gen 9 | Dự án hiện còn TM01–TM100; bảng mục tiêu là TM001–TM229. |')
$lines.Add('| Terastallization | Chưa triển khai | `Tera Blast` có trong data, nhưng `teraType`, trạng thái Terastallized và luật battle còn để kế hoạch. |')
$lines.Add('| TM Machine/crafting | Chưa triển khai | Chưa thay thế inventory item cũ bằng recipe, LP và Pokémon materials. |')
$lines.Add('')
$lines.Add('## TM001–TM229')
$lines.Add('')
$lines.Add('`Power`, `Accuracy` và `PP` lấy theo move data Gen 9. Dấu `—` nghĩa là chiêu Status hoặc không áp dụng chỉ số đó. `Kanto 151` là số Pokémon hiện có trong dự án có thể học TM tương ứng theo machine learnset Gen 9.')
$lines.Add('')
$lines.Add('| TM | Move | Type | Category | Power | Accuracy | PP | Kanto 151 |')
$lines.Add('|---:|---|---|---|---:|---:|---:|---:|')

foreach ($tm in ($tmRows | Sort-Object {[int]$_.machine_number})) {
  $move = $moveById[[int]$tm.move_id]
  $identifier = $move.identifier
  $local = $localMoves.PSObject.Properties[$identifier].Value
  $displayName = if ($moveNameById.ContainsKey([int]$tm.move_id)) { $moveNameById[[int]$tm.move_id] } else { $identifier }
  if ($local -and $local.nameVi) { $displayName = "$displayName ($($local.nameVi))" }
  $type = $typeById[[int]$move.type_id]
  $category = $categoryById[[int]$move.damage_class_id]
  $power = if ([string]::IsNullOrWhiteSpace($move.power)) { '—' } else { $move.power }
  $accuracy = if ([string]::IsNullOrWhiteSpace($move.accuracy)) { '—' } else { $move.accuracy }
  $learners = if ($tmLearnerCountByMove.ContainsKey([int]$tm.move_id)) { $tmLearnerCountByMove[[int]$tm.move_id] } else { 0 }
  $tmLabel = 'TM{0:D3}' -f [int]$tm.machine_number
  $lines.Add("| $tmLabel | $displayName | $type | $category | $power | $accuracy | $($move.pp) | $learners |")
}

$lines.Add('')
$lines.Add('## Ability đầy đủ của 151 Pokémon')
$lines.Add('')
$lines.Add('Slot được quy ước theo dữ liệu Pokémon: `Primary` = slot 1, `Secondary` = slot 2, `Hidden` = slot 3. Đây là tài liệu data reference; việc cho phép đổi Ability trong game vẫn chưa được triển khai.')
$lines.Add('')
$lines.Add('| # | Pokémon | Base Stats (HP/Atk/Def/SpA/SpD/Spe) | Ability đầy đủ |')
$lines.Add('|---:|---|---|---|')

$pokemonById = @{}
foreach ($entry in ($pokemon | Where-Object { [int]$_.id -ge 1 -and [int]$_.id -le 151 })) { $pokemonById[[int]$entry.id] = $entry }

foreach ($id in (1..151)) {
  $entry = $pokemonById[$id]
  $statRows = $pokemonStats | Where-Object { [int]$_.pokemon_id -eq $id }
  $statMap = @{}
  foreach ($stat in $statRows) { $statMap[[int]$stat.stat_id] = [int]$stat.base_stat }
  $stats = "$($statMap[1])/$($statMap[2])/$($statMap[3])/$($statMap[4])/$($statMap[5])/$($statMap[6])"
  $abilityText = @(
    $pokemonAbilities |
      Where-Object { [int]$_.pokemon_id -eq $id } |
      Sort-Object {[int]$_.slot} |
      ForEach-Object {
        $slot = switch ([int]$_.slot) { 1 {'Primary'} 2 {'Secondary'} 3 {'Hidden'} default { "Slot $($_.slot)" } }
        "${slot}: $($abilityById[[int]$_.ability_id])"
      }
  ) -join '; '
  $lines.Add("| $id | $($entry.identifier) | $stats | $abilityText |")
}

$lines.Add('')
$lines.Add('## Việc chưa triển khai')
$lines.Add('')
$lines.Add('1. Chuyển item registry từ `tm01`–`tm100` sang `tm001`–`tm229`.')
$lines.Add('2. Tách `PokemonSpeciesData.ability` thành `abilities.primary`, `abilities.secondary` và `abilities.hidden`.')
$lines.Add('3. Thêm `teraType` vào species/party Pokémon và trạng thái Terastallized vào battle state.')
$lines.Add('4. Cập nhật damage/type calculation cho Tera Blast và STAB Terastal.')
$lines.Add('5. Thêm TM Machine, crafting recipe, LP và Pokémon material theo Gen 9.')
$lines.Add('6. Tạo parity validator đối chiếu TM compatibility của 151 Pokémon với source generation 9.')
$lines.Add('')
$lines.Add('## Nguồn dữ liệu')
$lines.Add('')
$lines.Add('- [Pokémon Database — Scarlet/Violet TMs](https://pokemondb.net/scarlet-violet/tms)')
$lines.Add('- [Pokémon Database — Gen 9 learnset](https://pokemondb.net/pokedex/all)')
$lines.Add('- [PokeAPI data CSV](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) dùng để tổng hợp machine, move stats, base stats và Ability slots.')
$lines.Add('- [Local move database](../packages/game-data/moves-db.json) dùng để bổ sung tên tiếng Việt khi đã có trong dự án.')

$parent = Split-Path -Parent $OutputPath
if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
[System.IO.File]::WriteAllLines($OutputPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output "Generated $OutputPath with $($tmRows.Count) TMs and 151 Pokémon."
