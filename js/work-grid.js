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
  const DEFERRED_TRIGGER_BUFFER_PX = 320;

  const pad = (n) => String(n).padStart(3, "0");

  const getImageInfo = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          exists: true,
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
      const info = await getImageInfo(src);
      if (info.exists) return { src, isLandscape: info.isLandscape };
    }

    return null;
  };

  const getColumnCount = () =>
    window.matchMedia("(max-width: 900px)").matches ? 1 : 2;

  const getGridSpan = (item, columnCount) => {
    if (columnCount === 1) return 1;
    return item.isLandscape ? 2 : 1;
  };

  const appendItem = (
    item,
    index,
    { deferred = false, firstRow = false } = {},
  ) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");

    if (item.isLandscape) {
      figure.classList.add("work-item-landscape");
    }

    if (firstRow) {
      figure.classList.add("first-row-item");
    }

    img.alt = `Work image ${index}`;
    img.decoding = "async";

    if (!deferred) {
      img.src = item.src;
      img.loading = "eager";
      img.fetchPriority = "high";
      figure.classList.add("is-visible");
    } else {
      figure.classList.add("is-deferred");
      img.dataset.src = item.src;
      img.loading = "lazy";
    }

    figure.appendChild(img);
    grid.appendChild(figure);

    return figure;
  };

  const revealFigure = (figure, img) => {
    const show = () => figure.classList.add("is-visible");

    if (img.complete && img.naturalWidth > 0) {
      show();
      return;
    }

    img.addEventListener("load", show, { once: true });
    img.addEventListener("error", show, { once: true });
  };

  const createDeferredController = () => {
    const deferredItems = [];
    const preloadedSources = new Set();
    let nextRevealIndex = 0;
    let hasScrollIntent = false;
    let isFinished = false;

    const preloadItem = (item) => {
      if (preloadedSources.has(item.src)) return;
      preloadedSources.add(item.src);

      const preloader = new Image();
      preloader.decoding = "async";
      preloader.src = item.src;
    };

    const revealNextRow = () => {
      if (nextRevealIndex >= deferredItems.length) return false;

      const columns = getColumnCount();
      let rowUnits = 0;

      while (nextRevealIndex < deferredItems.length && rowUnits < columns) {
        const entry = deferredItems[nextRevealIndex];
        const span = getGridSpan(entry.item, columns);

        if (rowUnits > 0 && rowUnits + span > columns) {
          break;
        }

        const figure = appendItem(entry.item, entry.index, { deferred: true });
        const img = figure.querySelector("img");

        img.src = entry.item.src;
        delete img.dataset.src;
        revealFigure(figure, img);

        rowUnits += span;
        nextRevealIndex += 1;
      }

      return true;
    };

    const maybeReveal = () => {
      if (!hasScrollIntent) return;

      while (
        nextRevealIndex < deferredItems.length &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - DEFERRED_TRIGGER_BUFFER_PX
      ) {
        if (!revealNextRow()) break;
      }

      if (isFinished && nextRevealIndex >= deferredItems.length) {
        window.removeEventListener("scroll", onScrollEvent);
        window.removeEventListener("wheel", onScrollIntent);
        window.removeEventListener("touchmove", onScrollIntent);
        window.removeEventListener("resize", onScrollEvent);
      }
    };

    const onScrollIntent = () => {
      const isFirstScrollIntent = !hasScrollIntent;
      hasScrollIntent = true;

      if (isFirstScrollIntent) {
        revealNextRow();
      }

      maybeReveal();
    };

    const onScrollEvent = () => {
      if (!hasScrollIntent) return;
      maybeReveal();
    };

    window.addEventListener("wheel", onScrollIntent, { passive: true });
    window.addEventListener("touchmove", onScrollIntent, { passive: true });
    window.addEventListener("scroll", onScrollEvent, { passive: true });
    window.addEventListener("resize", onScrollEvent);

    return {
      addDeferredItem(item, index) {
        deferredItems.push({ item, index });
        preloadItem(item);
      },
      finalize() {
        isFinished = true;
        maybeReveal();
      },
    };
  };

  const populateGrid = async () => {
    grid.innerHTML = "";
    const deferredController = createDeferredController();
    const columns = getColumnCount();
    let firstRowUnits = 0;

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

      const span = getGridSpan(item, columns);

      if (
        firstRowUnits < columns &&
        (firstRowUnits === 0 || firstRowUnits + span <= columns)
      ) {
        appendItem(item, i, { firstRow: true });
        firstRowUnits += span;
      } else {
        deferredController.addDeferredItem(item, i);
      }

      foundCount += 1;
    }

    deferredController.finalize();
  };

  void populateGrid();
})();
