/**
 * Battle Animation & Atlas Integrity Validator
 *
 * Enforces:
 * 1. Pattern bounds: 0 <= pattern < maxPattern for all non-battler cels.
 * 2. Atlas crop geometry: col * cellWidth + cellWidth <= width, row * cellHeight + cellHeight <= height.
 * 3. Asset existence: every graphic referenced in atlas exists in Graphics/Animations.
 * 4. Non-empty timelines: every animation has frames > 0 (unless explicitly whitelisted).
 * 5. Mapping validity: all moves, opponentMoves, and type/category fallbacks resolve to valid definitions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

export function validateAnimationAtlas() {
  const atlasPath = path.join(ROOT, 'packages/game-data/animation-atlas.json');
  const lastChanceAtlasPath = path.join(
    ROOT,
    'packages/game-data/last-chance-animation-atlas.json'
  );
  const manifestPath = path.join(ROOT, 'packages/game-data/animations/manifest.json');
  const lastChanceManifestPath = path.join(
    ROOT,
    'packages/game-data/last-chance-animation-manifest.json'
  );
  const moveMapPath = path.join(ROOT, 'packages/game-data/move-animation-map.json');
  const moveExtensionsPath = path.join(ROOT, 'packages/game-data/move-animation-extensions.json');
  const fallbacksPath = path.join(ROOT, 'packages/game-data/animation-fallbacks.json');
  const animsDir = path.join(ROOT, 'packages/game-data/animations');
  const graphicsDir = path.join(ROOT, 'Graphics/Animations');

  const atlas = JSON.parse(fs.readFileSync(atlasPath, 'utf8'));
  const lastChanceAtlas = JSON.parse(fs.readFileSync(lastChanceAtlasPath, 'utf8'));
  const manifests = [
    {
      name: 'current',
      data: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
      directory: animsDir,
    },
    {
      name: 'last-chance',
      data: JSON.parse(fs.readFileSync(lastChanceManifestPath, 'utf8')),
      directory: path.join(animsDir, 'last-chance'),
    },
  ];
  const allAtlas = Object.fromEntries(
    Object.entries({ ...atlas, ...lastChanceAtlas }).map(([key, entry]) => [
      key.toLowerCase(),
      entry,
    ])
  );
  const moveMap = JSON.parse(fs.readFileSync(moveMapPath, 'utf8'));
  const moveExtensions = JSON.parse(fs.readFileSync(moveExtensionsPath, 'utf8'));
  const fallbacks = JSON.parse(fs.readFileSync(fallbacksPath, 'utf8'));

  let errors = 0;
  const issues = [];

  // Reverse map: animation ID -> move name(s)
  const animToMoves = {};
  for (const [m, id] of Object.entries(moveMap.moves)) {
    animToMoves[id] = (animToMoves[id] || []).concat(m);
  }
  for (const [m, id] of Object.entries(moveMap.opponentMoves)) {
    animToMoves[id] = (animToMoves[id] || []).concat(`opp:${m}`);
  }
  for (const [m, id] of Object.entries(moveExtensions.moves)) {
    animToMoves[id] = (animToMoves[id] || []).concat(m);
  }
  for (const [m, id] of Object.entries(moveExtensions.opponentMoves)) {
    animToMoves[id] = (animToMoves[id] || []).concat(`opp:${m}`);
  }
  for (const [m, id] of Object.entries(moveExtensions.replacedMoves || {})) {
    animToMoves[id] = (animToMoves[id] || []).concat(`replaced:${m}`);
  }
  for (const [m, id] of Object.entries(moveExtensions.replacedOpponentMoves || {})) {
    animToMoves[id] = (animToMoves[id] || []).concat(`replaced-opp:${m}`);
  }

  // 1. Verify graphics exist on disk
  for (const [assetKey, entry] of Object.entries(allAtlas)) {
    const filePath = path.join(graphicsDir, entry.file);
    if (!fs.existsSync(filePath)) {
      issues.push(
        `[missing-asset] asset=${assetKey} file=${entry.file} not found in ${graphicsDir}`
      );
      errors++;
    }
  }

  // 2. Verify all animation definitions and cels
  const EMPTY_WHITELIST = new Set([]);
  const lastChanceActiveIds = new Set(
    [
      ...Object.values(moveExtensions.moves),
      ...Object.values(moveExtensions.opponentMoves),
      ...(moveExtensions.replacedMoves ? Object.values(moveExtensions.replacedMoves) : []),
      ...(moveExtensions.replacedOpponentMoves
        ? Object.values(moveExtensions.replacedOpponentMoves)
        : []),
    ].map(String)
  );

  for (const pack of manifests) {
    for (const [id, meta] of Object.entries(pack.data)) {
      if (pack.name === 'last-chance' && !lastChanceActiveIds.has(id)) {
        continue;
      }
      const filePath = path.join(pack.directory, `${id}.json`);
      if (!fs.existsSync(filePath)) {
        issues.push(
          `[missing-definition-file] pack=${pack.name} animationId=${id} manifestName=${meta.name}`
        );
        errors++;
        continue;
      }

      const def = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const moveName = (animToMoves[id] || []).join('/') || def.name;

      if (!def.frames || def.frames.length === 0) {
        if (!EMPTY_WHITELIST.has(id)) {
          issues.push(`[empty-timeline] pack=${pack.name} move=${moveName} animationId=${id}`);
          errors++;
        }
        continue;
      }

      const atlasEntry = allAtlas[def.graphic?.toLowerCase?.() ?? def.graphic];
      if (def.graphic && !atlasEntry) {
        issues.push(
          `[missing-atlas-entry] pack=${pack.name} move=${moveName} animationId=${id} asset=${def.graphic}`
        );
        errors++;
        continue;
      }

      if (atlasEntry) {
        for (let frameIdx = 0; frameIdx < def.frames.length; frameIdx++) {
          const frame = def.frames[frameIdx];
          for (let celIdx = 0; celIdx < frame.cels.length; celIdx++) {
            const cel = frame.cels[celIdx];
            // Pattern < 0 denotes battler placeholder (-1 user, -2 target)
            if (cel.pattern < 0) continue;

            const effectiveAtlas =
              (cel.graphic ? allAtlas[cel.graphic.toLowerCase()] : null) || atlasEntry;
            const effectiveGraphic = cel.graphic || def.graphic;
            const curMaxPattern = effectiveAtlas.maxPattern;
            const curCellW = effectiveAtlas.cellWidth || 192;
            const curCellH = effectiveAtlas.cellHeight || 192;
            const curCols = effectiveAtlas.columns || 1;

            if (cel.pattern >= curMaxPattern) {
              issues.push(
                `[pattern-out-of-range] pack=${pack.name} move=${moveName} animationId=${id} asset=${effectiveGraphic} frame=${frameIdx} cel=${celIdx} pattern=${cel.pattern} maxPattern=${curMaxPattern - 1}`
              );
              errors++;
            }

            // Check cell crop geometry
            const col = cel.pattern % curCols;
            const row = Math.floor(cel.pattern / curCols);
            const srcX = col * curCellW;
            const srcY = row * curCellH;
            if (srcX + curCellW > effectiveAtlas.width || srcY + curCellH > effectiveAtlas.height) {
              issues.push(
                `[crop-out-of-bounds] pack=${pack.name} move=${moveName} animationId=${id} asset=${effectiveGraphic} pattern=${cel.pattern} srcX=${srcX} srcY=${srcY} imgW=${effectiveAtlas.width} imgH=${effectiveAtlas.height}`
              );
              errors++;
            }
          }
        }
      }
    }
  }

  // 3. Verify move mappings
  for (const [m, id] of Object.entries(moveMap.moves)) {
    if (!manifests[0].data[String(id)]) {
      issues.push(`[invalid-move-mapping] move=${m} animationId=${id} does not exist in manifest`);
      errors++;
    }
  }
  for (const [m, id] of Object.entries(moveMap.opponentMoves)) {
    if (!manifests[0].data[String(id)]) {
      issues.push(
        `[invalid-oppmove-mapping] move=${m} animationId=${id} does not exist in manifest`
      );
      errors++;
    }
  }
  for (const [m, id] of Object.entries(moveExtensions.moves)) {
    if (!manifests[1].data[String(id)]) {
      issues.push(
        `[invalid-extension-mapping] move=${m} animationId=${id} does not exist in Last Chance manifest`
      );
      errors++;
    }
  }
  for (const [m, id] of Object.entries(moveExtensions.opponentMoves)) {
    if (!manifests[1].data[String(id)]) {
      issues.push(
        `[invalid-extension-oppmove-mapping] move=${m} animationId=${id} does not exist in Last Chance manifest`
      );
      errors++;
    }
  }
  for (const [m, id] of Object.entries(moveExtensions.replacedMoves || {})) {
    if (!manifests[1].data[String(id)]) {
      issues.push(
        `[invalid-extension-replaced-mapping] move=${m} animationId=${id} does not exist in Last Chance manifest`
      );
      errors++;
    }
  }
  for (const [m, id] of Object.entries(moveExtensions.replacedOpponentMoves || {})) {
    if (!manifests[1].data[String(id)]) {
      issues.push(
        `[invalid-extension-replaced-oppmove-mapping] move=${m} animationId=${id} does not exist in Last Chance manifest`
      );
      errors++;
    }
  }

  // 4. Verify fallbacks
  for (const [type, cats] of Object.entries(fallbacks)) {
    for (const [cat, fallbackMove] of Object.entries(cats)) {
      if (
        moveMap.moves[fallbackMove] === undefined &&
        moveExtensions.moves[fallbackMove] === undefined
      ) {
        issues.push(
          `[invalid-fallback-target] type=${type} category=${cat} fallbackMove=${fallbackMove}`
        );
        errors++;
      }
    }
  }

  return {
    errors,
    issues,
    totalAnimations: manifests.reduce((total, pack) => total + Object.keys(pack.data).length, 0),
  };
}

// Standalone CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('--- Starting Battle Animation & Atlas Integrity Validation ---');
  const result = validateAnimationAtlas();
  if (result.errors > 0) {
    console.error(`\x1b[31m✖ FAIL:\x1b[0m Found ${result.errors} animation atlas issues:`);
    for (const issue of result.issues) {
      console.error(`  ${issue}`);
    }
    process.exit(1);
  } else {
    console.log(
      `\x1b[32m✔ PASS:\x1b[0m All ${result.totalAnimations} animations and atlas assets validated with 0 errors!`
    );
    process.exit(0);
  }
}
