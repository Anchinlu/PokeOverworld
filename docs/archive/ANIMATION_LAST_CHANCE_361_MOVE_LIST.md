# 361 move có timeline mới từ Last Chance 1.22

> Danh sách này là key đã chuẩn hóa theo tên trong `Move:NAME` của nguồn Last Chance và **chưa có trong `move-animation-map.json` hiện tại**.
>
> Có 354 key khớp database dự án sau khi chuẩn hóa alias; 7 key cuối danh sách hiện chưa có trong `moves-db.json`.

> Trạng thái triển khai: 334 key an toàn đã được đưa vào `move-animation-extensions.json`. Các key còn lại hoặc bị loại do pattern/graphic không hợp lệ, hoặc cần xử lý visual QA riêng trước khi promote.

```text
accelerock, air_cutter, air_slash, aqua_jet, aqua_tail, arm_thrust,
aromatic_mist, assist, assurance, astonish, attract, aura_sphere,
autotomize, avalanche, baby_doll_eyes, baneful_bunker, baton_pass, beak_blast,
belch, belly_drum, bestow, bide, blaze_kick, blizzard,
bolt_strike, bone_club, bone_rush, bonemerang, boomburst, bounce,
brave_bird, brine, bug_bite, bug_buzz, buldoze, calm_mind,
camouflage, captivate, charge_beam, chatter, chip_away, circle_throw,
clamp, clanging_scales, coil, confide, confusion, constrict,
conversion, conversion_2, copycat, cosmic_power, covet, crabhammer,
crafty_shield, cross_chop, cross_poison, crush_grip, cutecut, dark_pulse,
dark_void, dazzling_gleam, defog, destiny_bond, dig, disarming_voice,
discharge, dive, doom_desire, double_hit, double_team, draco_meteor,
dragon_pulse, dragon_rush, dragon_tail, drain_punch, draining_kiss, dream_eater,
drill_peck, drill_run, dual_chop, earth_power, earthquake, echoed_voice,
eerie_impulse, egg_bomb, electro_ball, electroweb, embargo, endeavor,
entrainment, extrasensory, extremespeed, facade, fairy_lock, fairy_wind,
false_swipe, fariypunch, featherdance, feint, feint_attack, fell_stinger,
fissure, flare_blitz, flash_cannon, flatter, fling, flying_press,
focus_blast, focus_punch, force_palm, foul_play, frost_breath, frustration,
fusion_bolt, fusion_flare, giga_impact, grass_knot, grass_pledge, growth,
guard_split, guard_swap, gullotine, gunk_shot, gyro_ball, hammer_arm,
haze, head_charge, head_smash, heal_bell, heal_block, heal_pulse,
healing_wish, heart_stamp, heart_swap, heat_crash, heavy_slam, helping_hand,
hex, hidden_power, high_horsepower, hijumpkick, holdbeck, hone_claws,
horn_drill, horn_leech, howl, hydro_cannon, hyper_beam, hyper_voice,
hypnosis, ice_beam, ice_hammer, imprison, incinerate, infestation,
ingrain, ion_deluge, iron_tail, irondefence, kings_shield, knock_off,
last_resort, lava_plume, leaf_storm, leaf_tornado, leafage, liquidation,
low_sweep, magic_room, magical_leaf, magnet_bomb, magnitude, me_first,
meditate, memento, metal_burst, metal_sound, milk_drink, mimic,
mind_reader, minimize, miracle_eye, mirror_coat, mirror_shot, misty_terrain,
moonblast, mud_bomb, mud_shot, mud_sport, muddy_water, mudslap,
mystical_fire, mysticaltackle, nasty_plot, natural_gift, nature_power, needle_arm,
newmoon, night_daze, night_shade, night_slash, noble_roar, nuzzle,
octazooka, odor_sleuth, ominous_wind, pain_split, parabolic_charge, payback,
peck, perish_song, petal_blizzard, phantom_force, play_nice, play_rough,
pluck, poison_jab, pollen_puff, powder, powder_snow, power_gem,
power_split, power_swap, power_trick, power_up_punch, power_whip, protect,
psybeam, psych_up, psychic_terrain, psycho_boost, psycho_shift, psyshock,
psystrike, psywave, punishment, quash, quick_guard, quiver_dance,
rage, rage_powder, rapid_spin, razor_shell, razor_wind, recover,
recycle, refresh, retaliate, return, revenge, reversal,
rock_blast, rock_climb, rock_polish, rock_slide, rock_tomb, role_play,
rollout, rookieslam, roost, round, sacred_fire, sacred_sword,
safeguard, sand_tomb, scald, secret_sword, seed_bomb, seismic_toss,
shadow_claw, shadow_punch, shadow_sneak, sharpen, sheer_cold, shell_smash,
shock_wave, simple_beam, skill_swap, skull_bash, sky_attack, sky_drop,
sky_uppercut, slack_off, sleep_talk, sludge_wave, smack_down, smellingsalts,
snarl, snatch, snore, soak, softboiled, solar_blade,
solarbeam, sonicboom, spark, spiky_shield, spiritenergy, spit_up,
spite, steamroller, steel_wing, sticky_web, stockpile, stone_edge,
strength, struggle_bug, submission, substitute, sucker_punch, super_fang,
superpower, surf, swallow, sweet_scent, switcheroo, synchronoise,
synthesis, tailwind, take_down, taunt, teeter_dance, telekinesis,
terfullook, thief, thrash, tickle, torment, toxic_spikes,
tri_attack, trick, trick_or_treat, triple_kick, u_turn, uproar,
v_create, vacuum_wave, venom_drench, venoshock, vicegrip, vital_throw,
volt_tackle, wake_up_slap, water_shuriken, water_sport, water_spout, waterfall,
weather_ball, whirlpool, wide_guard, wild_charge, wish, withdraw,
wonder_room, wood_hammer, work_up, worry_seed, yawn, zen_headbutt,
zing_zap
```

## 7 key chưa có trong database hiện tại

Các key này có timeline ở nguồn nhưng chưa thể import vào move catalog hiện tại nếu không bổ sung/đổi tên dữ liệu:

```text
cutecut
fariypunch
holdbeck
mysticaltackle
newmoon
rookieslam
spiritenergy
```

## Alias cần xử lý trước khi import

```text
buldoze       -> bulldoze
fariypunch    -> fairy_punch
gullotine     -> guillotine
hijumpkick    -> highjumpkick
irondefence   -> iron_defense
mysticaltackle -> mystical_tackle
newmoon       -> new_moon
rookieslam    -> rookie_slam
solarbeam     -> solar_beam
terfullook    -> tearful_look
```

