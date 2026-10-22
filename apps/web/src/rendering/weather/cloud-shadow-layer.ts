import type { ViewportBounds } from '../../core/camera';
import type { AssetLoader } from '../asset-loader';
import type { WeatherCloudController } from './weather-cloud-controller';

/**
 * CloudShadowLayer
 * Renders drifting semi-transparent cloud shadows on top of the ground terrain,
 * beneath all 2.5D entities (trees, buildings, characters, pokemon) using multiply blend mode.
 */
export class CloudShadowLayer {
  private loader: AssetLoader;
  private fallbackImg: HTMLImageElement | null = null;

  constructor(loader: AssetLoader) {
    this.loader = loader;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    controller: WeatherCloudController
  ): void {
    const opacity = controller.getShadowOpacity();
    if (opacity <= 0) return;

    let img = this.loader.getImage('cloud_shadow');
    if (!img || !img.complete || img.naturalWidth === 0) {
      if (!this.fallbackImg && typeof Image !== 'undefined') {
        this.fallbackImg = new Image();
        this.fallbackImg.src = '/assets/weather/cloud_shadow.png';
      }
      img = this.fallbackImg ?? undefined;
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const size = controller.getCloudWorldSize();
    const offX = controller.getShadowOffsetX();
    const offY = controller.getShadowOffsetY();

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = controller.getProfile().shadowBlendMode;

    const startX = Math.floor((bounds.minX - offX) / size) * size + offX;
    const startY = Math.floor((bounds.minY - offY) / size) * size + offY;

    for (let x = startX; x <= bounds.maxX; x += size) {
      for (let y = startY; y <= bounds.maxY; y += size) {
        ctx.drawImage(img, x, y, size, size);
      }
    }

    ctx.restore();
  }
}
