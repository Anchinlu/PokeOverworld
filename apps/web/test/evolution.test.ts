import { describe, it, expect, beforeEach } from 'vitest';
import { createPartyPokemon } from '../src/domain/party/party-state';
import { partyService } from '../src/domain/party/party-service';
import { GameSession } from '../src/game/game-session';
import {
  canPokemonEvolve,
  getAvailableEvolutions,
  getEvolutionRequirements,
  applyEvolution,
} from '../src/domain/pokemon/evolution-rules';
import { inventoryService } from '../src/domain/inventory/inventory-service';

describe('Pokémon Evolution System (0.91)', () => {
  beforeEach(() => {
    inventoryService.clear();
  });

  describe('Level-based Evolution Rules', () => {
    it('Bulbasaur cannot evolve before level 16', () => {
      const bulbasaur = createPartyPokemon('BULBASAUR', 15);
      const check = canPokemonEvolve(bulbasaur);
      expect(check.canEvolve).toBe(false);
      expect(check.reason).toContain('Cần đạt Cấp độ 16');
    });

    it('Bulbasaur can evolve into Ivysaur at level 16 or above', () => {
      const bulbasaur = createPartyPokemon('BULBASAUR', 16);
      const check = canPokemonEvolve(bulbasaur);
      expect(check.canEvolve).toBe(true);
      expect(check.evolution?.targetSpeciesKey).toBe('IVYSAUR');
      expect(check.evolution?.requiredLevel).toBe(16);
    });

    it('Ivysaur can evolve into Venusaur at level 32', () => {
      const ivysaur = createPartyPokemon('IVYSAUR', 32);
      const check = canPokemonEvolve(ivysaur);
      expect(check.canEvolve).toBe(true);
      expect(check.evolution?.targetSpeciesKey).toBe('VENUSAUR');
    });

    it('Venusaur has no further evolutions', () => {
      const venusaur = createPartyPokemon('VENUSAUR', 50);
      const check = canPokemonEvolve(venusaur);
      expect(check.canEvolve).toBe(false);
      expect(check.reason).toContain('không thể tiến hóa thêm');
    });

    it('Magikarp evolves into Gyarados at level 20', () => {
      const magikarpUnder = createPartyPokemon('MAGIKARP', 19);
      expect(canPokemonEvolve(magikarpUnder).canEvolve).toBe(false);

      const magikarpReady = createPartyPokemon('MAGIKARP', 20);
      const check = canPokemonEvolve(magikarpReady);
      expect(check.canEvolve).toBe(true);
      expect(check.evolution?.targetSpeciesKey).toBe('GYARADOS');
    });

    it('Caterpie evolves into Metapod at level 7 and Butterfree at level 10', () => {
      const caterpie = createPartyPokemon('CATERPIE', 7);
      expect(canPokemonEvolve(caterpie).evolution?.targetSpeciesKey).toBe('METAPOD');

      const metapod = createPartyPokemon('METAPOD', 10);
      expect(canPokemonEvolve(metapod).evolution?.targetSpeciesKey).toBe('BUTTERFREE');
    });
  });

  describe('Item & Evolution Stone Rules', () => {
    it('Pikachu cannot evolve without holding Thunder Stone', () => {
      const pikachu = createPartyPokemon('PIKACHU', 35);
      const check = canPokemonEvolve(pikachu);
      expect(check.canEvolve).toBe(false);
      expect(check.reason).toContain('Đá Sét');
    });

    it('Pikachu can evolve into Raichu when holding Thunder Stone', () => {
      const pikachu = createPartyPokemon('PIKACHU', 35);
      pikachu.heldItem = 'thunder-stone';

      const check = canPokemonEvolve(pikachu);
      expect(check.canEvolve).toBe(true);
      expect(check.evolution?.targetSpeciesKey).toBe('RAICHU');
      expect(check.evolution?.method).toBe('stone');
    });

    it('Eevee evolves into corresponding form based on which Stone it is holding', () => {
      const eevee = createPartyPokemon('EEVEE', 25);

      // Without stones: not ready
      expect(canPokemonEvolve(eevee).canEvolve).toBe(false);

      // Holding Water Stone
      eevee.heldItem = 'water-stone';
      const evosWater = getAvailableEvolutions(eevee);
      expect(evosWater.length).toBe(1);
      expect(evosWater[0].targetSpeciesKey).toBe('VAPOREON');

      // Switch to Thunder Stone
      eevee.heldItem = 'thunder-stone';
      const evosThunder = getAvailableEvolutions(eevee);
      expect(evosThunder.length).toBe(1);
      expect(evosThunder[0].targetSpeciesKey).toBe('JOLTEON');

      // Switch to Fire Stone
      eevee.heldItem = 'fire-stone';
      const evosFire = getAvailableEvolutions(eevee);
      expect(evosFire.length).toBe(1);
      expect(evosFire[0].targetSpeciesKey).toBe('FLAREON');
    });

    it('Vulpix evolves into Ninetales when holding Fire Stone', () => {
      const vulpix = createPartyPokemon('VULPIX', 20);
      expect(canPokemonEvolve(vulpix).canEvolve).toBe(false);

      vulpix.heldItem = 'fire-stone';
      const check = canPokemonEvolve(vulpix);
      expect(check.canEvolve).toBe(true);
      expect(check.evolution?.targetSpeciesKey).toBe('NINETALES');
    });

    it('consumes held evolution stone upon applying evolution', () => {
      const pikachu = createPartyPokemon('PIKACHU', 25);
      pikachu.heldItem = 'thunder-stone';

      applyEvolution(pikachu, 'RAICHU');
      expect(pikachu.speciesKey).toBe('RAICHU');
      expect(pikachu.heldItem).toBeNull();
    });
  });

  describe('Evolution Mutation & Stat Recalculation (applyEvolution)', () => {
    it('mutates entity species, stats, and scales HP upon evolution', () => {
      const charmander = createPartyPokemon('CHARMANDER', 16);
      const oldHp = charmander.currentHp;
      const oldAtk = charmander.stats.attack;

      const result = applyEvolution(charmander, 'CHARMELEON');

      expect(result.oldName).toBe('Charmander');
      expect(result.newName).toBe('Charmeleon');
      expect(charmander.speciesId).toBe(5);
      expect(charmander.speciesKey).toBe('CHARMELEON');
      expect(charmander.name).toBe('Charmeleon');

      // Evolved base stats are strictly higher
      expect(charmander.stats.attack).toBeGreaterThan(oldAtk);
      expect(charmander.maxHp).toBeGreaterThanOrEqual(oldHp);
      expect(charmander.currentHp).toBeGreaterThanOrEqual(oldHp);
    });

    it('preserves custom nickname when evolving', () => {
      const squirtle = createPartyPokemon('SQUIRTLE', 16);
      squirtle.nickname = 'HydroTurtle';

      const result = applyEvolution(squirtle, 'WARTORTLE');

      expect(result.oldName).toBe('HydroTurtle');
      expect(squirtle.nickname).toBe('HydroTurtle');
      expect(squirtle.name).toBe('HydroTurtle');
      expect(squirtle.speciesKey).toBe('WARTORTLE');
    });

    it('retrieves all evolution requirements correctly for Gen 1 species', () => {
      const reqsDratini = getEvolutionRequirements('DRATINI');
      expect(reqsDratini.length).toBe(1);
      expect(reqsDratini[0].targetSpeciesKey).toBe('DRAGONAIR');
      expect(reqsDratini[0].requiredLevel).toBe(30);

      const reqsDragonair = getEvolutionRequirements('DRAGONAIR');
      expect(reqsDragonair[0].targetSpeciesKey).toBe('DRAGONITE');
      expect(reqsDragonair[0].requiredLevel).toBe(55);
    });

    it('automatically synchronizes overworld follower when the followed Pokémon evolves', () => {
      partyService.clear();
      const pika = createPartyPokemon('PIKACHU', 35);
      partyService.addPokemon(pika);
      partyService.setActiveFollowerUid(pika.uid);

      const session = new GameSession();
      expect(session.follower.speciesKey).toBe('PIKACHU');

      // Now evolve Pikachu into Raichu
      applyEvolution(pika, 'RAICHU');
      partyService.notify();

      // Overworld follower should immediately update to Raichu
      expect(session.follower.speciesKey).toBe('RAICHU');
      expect(session.follower.nickname).toBe('Raichu');
    });
  });
});
