/**
 * Asset Loader for static game textures, sprites, and tilesets.
 * Replaces monolithic base64 strings with clean HTTP-cached PNG assets and manifest.
 */

export type ProgressCallback = (loaded: number, total: number, currentKey: string) => void;

export interface LoadManifestOptions {
  /**
   * When true, critical core/UI/starter-biome assets are awaited first so the
   * title screen and starting world can launch faster, while distant biome
   * assets (desert, dark-land, autumn, snow) finish prefetching in the background.
   */
  deferBackgroundBiomes?: boolean;
}

const DEFERRED_BIOME_PATH_PREFIXES = [
  '/assets/biomes/desert/',
  '/assets/biomes/dark-land/',
  '/assets/biomes/autumn/',
  '/assets/biomes/snow/',
  '/assets/biomes/rocky_highland/',
] as const;

function isDeferredBiomeUrl(url: string): boolean {
  return DEFERRED_BIOME_PATH_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export class AssetLoader {
  private static defaultInstance: AssetLoader | null = null;

  public static getDefault(): AssetLoader {
    if (!AssetLoader.defaultInstance) {
      AssetLoader.defaultInstance = new AssetLoader();
    }
    return AssetLoader.defaultInstance;
  }

  public static setDefault(loader: AssetLoader): void {
    AssetLoader.defaultInstance = loader;
  }

  private images = new Map<string, HTMLImageElement>();
  private manifest = new Map<string, string>();
  private loaded = false;
  private backgroundComplete = false;
  private backgroundListeners = new Set<() => void>();

  public isLoaded(): boolean {
    return this.loaded;
  }

  public isBackgroundComplete(): boolean {
    return this.backgroundComplete;
  }

  /**
   * Registers a callback invoked whenever a background asset batch finishes loading.
   * Used by `GroundRenderer` to invalidate cached chunk canvases if deferred biome
   * textures finish decoding after initial world launch.
   */
  public onBackgroundBatchComplete(listener: () => void): () => void {
    this.backgroundListeners.add(listener);
    return () => {
      this.backgroundListeners.delete(listener);
    };
  }

  private notifyBackgroundListeners(): void {
    for (const listener of this.backgroundListeners) {
      listener();
    }
  }

  public getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  public getAssetUrl(key: string): string | undefined {
    return this.manifest.get(key);
  }

  public hasAsset(key: string): boolean {
    return this.manifest.has(key);
  }

  private loadSingleImage(
    key: string,
    url: string,
    onDone?: (key: string) => void
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        onDone?.(key);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load asset [${key}] from ${url}, creating fallback.`);
        this.images.set(key, img);
        onDone?.(key);
        resolve();
      };
      img.src = url;
    });
  }

  /**
   * Fetches the asset manifest and preloads PNG assets.
   */
  public async loadFromManifest(
    manifestUrl = '/assets/manifest.json',
    onProgress?: ProgressCallback,
    options: LoadManifestOptions = {}
  ): Promise<void> {
    const res = await fetch(manifestUrl);
    if (!res.ok) {
      throw new Error(`Failed to load asset manifest from: ${manifestUrl}`);
    }

    const manifest: Record<string, string> = await res.json();
    const entries = Object.entries(manifest);
    for (const [key, url] of entries) {
      this.manifest.set(key, url);
    }

    if (!options.deferBackgroundBiomes) {
      const total = entries.length;
      let loadedCount = 0;
      await Promise.all(
        entries.map(([key, url]) =>
          this.loadSingleImage(key, url, (k) => {
            loadedCount++;
            onProgress?.(loadedCount, total, k);
          })
        )
      );
      this.loaded = true;
      this.backgroundComplete = true;
      return;
    }

    const criticalEntries: Array<[string, string]> = [];
    const deferredEntries: Array<[string, string]> = [];
    for (const entry of entries) {
      if (isDeferredBiomeUrl(entry[1])) {
        deferredEntries.push(entry);
      } else {
        criticalEntries.push(entry);
      }
    }

    const criticalTotal = criticalEntries.length;
    let criticalLoaded = 0;
    await Promise.all(
      criticalEntries.map(([key, url]) =>
        this.loadSingleImage(key, url, (k) => {
          criticalLoaded++;
          onProgress?.(criticalLoaded, criticalTotal, k);
        })
      )
    );
    this.loaded = true;

    if (deferredEntries.length === 0) {
      this.backgroundComplete = true;
      return;
    }

    // Prefetch distant biome assets in the background and notify render caches on completion
    void Promise.all(
      deferredEntries.map(([key, url]) => this.loadSingleImage(key, url))
    ).then(() => {
      this.backgroundComplete = true;
      this.notifyBackgroundListeners();
    });
  }
}
