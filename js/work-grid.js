(function () {
  const grid = document.querySelector("[data-work-grid]");
  const isWorkPage = document.body.classList.contains("work-page");

  if (!isWorkPage || !grid) return;

  const FOLDER = "./assets/img/work";
  const BASE_NAME = "website_";
  const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
  const START_INDEX = 1;
  const MAX_INDEX = 2000;
  const MAX_TRAILING_MISSES = 40;

  const pad = (n) => String(n).padStart(3, "0");

  const isLikelyBlankImage = (img) => {
    try {
      const sampleSize = 32;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) return false;

      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

      let minLum = 255;
      let maxLum = 0;
      let sumLum = 0;
      let sumLumSq = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
        sumLum += lum;
        sumLumSq += lum * lum;
      }

      const mean = sumLum / pixelCount;
      const variance = Math.max(0, sumLumSq / pixelCount - mean * mean);
      const stdDev = Math.sqrt(variance);
      const lumRange = maxLum - minLum;

      return stdDev < 3 && lumRange < 12;
    } catch {
      return false;
    }
  };

  const getImageMeta = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isBlank = isLikelyBlankImage(img);

        resolve({
          exists: !isBlank,
          isLandscape: img.naturalWidth > img.naturalHeight,
        });
      };
      img.onerror = () => resolve({ exists: false, isLandscape: false });
      img.src = src;
    });

  const firstExistingSourceForIndex = async (index) => {
    const fileStem = `${BASE_NAME}${pad(index)}`;

    for (const ext of EXTENSIONS) {
      const src = `${FOLDER}/${fileStem}.${ext}`;
      const meta = await getImageMeta(src);
      if (meta.exists) {
        return {
          src,
          isLandscape: meta.isLandscape,
        };
      }
    }

    return null;
  };

  const appendItem = (item, index) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");

    if (item.isLandscape) {
      figure.classList.add("work-item-landscape");
    }

    img.src = item.src;
    img.alt = `Work image ${index}`;
    img.loading = "lazy";
    img.decoding = "async";

    figure.appendChild(img);
    grid.appendChild(figure);
  };

  const populateGrid = async () => {
    grid.innerHTML = "";

    let trailingMisses = 0;
    let foundCount = 0;

    for (let i = START_INDEX; i <= MAX_INDEX; i += 1) {
      const item = await firstExistingSourceForIndex(i);

      if (!item) {
        trailingMisses += 1;
        if (trailingMisses >= MAX_TRAILING_MISSES && foundCount > 0) break;
        continue;
      }

      trailingMisses = 0;
      foundCount += 1;
      appendItem(item, i);
    }
  };

  void populateGrid();
})();
