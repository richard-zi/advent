'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PuzzleGameProps = {
  imageUrl: string;
  gridSize?: number;
  onSolved?: () => void;
  darkMode?: boolean;
};

type ImageDimensions = {
  width: number;
  height: number;
};

const SHUFFLE_MULTIPLIER = 25;

export default function PuzzleGame({
  imageUrl,
  gridSize = 3,
  onSolved,
  darkMode = false,
}: PuzzleGameProps) {
  const tileCount = gridSize * gridSize;
  const [tiles, setTiles] = useState<number[]>(() =>
    Array.from({ length: tileCount }, (_, index) => index)
  );
  const [emptyIndex, setEmptyIndex] = useState(tileCount - 1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [moves, setMoves] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);

  const getNeighborIndices = useCallback(
    (index: number) => {
      const neighbors: number[] = [];
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      if (col > 0) neighbors.push(index - 1);
      if (col < gridSize - 1) neighbors.push(index + 1);
      if (row > 0) neighbors.push(index - gridSize);
      if (row < gridSize - 1) neighbors.push(index + gridSize);

      return neighbors;
    },
    [gridSize]
  );

  const movableIndices = useMemo(() => {
    return new Set(getNeighborIndices(emptyIndex));
  }, [emptyIndex, getNeighborIndices]);

  const shuffleTiles = useCallback(() => {
    let currentTiles = Array.from({ length: tileCount }, (_, index) => index);
    let currentEmpty = tileCount - 1;

    const shuffleCount = Math.max(tileCount * SHUFFLE_MULTIPLIER, 100);

    for (let i = 0; i < shuffleCount; i++) {
      const neighbors = getNeighborIndices(currentEmpty);
      const targetIndex = neighbors[Math.floor(Math.random() * neighbors.length)];

      [currentTiles[currentEmpty], currentTiles[targetIndex]] = [
        currentTiles[targetIndex],
        currentTiles[currentEmpty],
      ];
      currentEmpty = targetIndex;
    }

    if (currentTiles.every((value, index) => value === index)) {
      return shuffleTiles();
    }

    return { tiles: currentTiles, empty: currentEmpty };
  }, [getNeighborIndices, tileCount]);

  useEffect(() => {
    let cancelled = false;
    setImageLoaded(false);
    setHasError(false);
    setImageDimensions(null);

    if (!imageUrl) {
      setHasError(true);
      return () => {
        cancelled = true;
      };
    }

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (!cancelled) {
        const width = img.naturalWidth || 1;
        const height = img.naturalHeight || 1;
        setImageDimensions({ width, height });
        setImageLoaded(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setHasError(true);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!imageLoaded) return;

    const { tiles: shuffled, empty } = shuffleTiles();
    setTiles(shuffled);
    setEmptyIndex(empty);
    setMoves(0);
  }, [imageLoaded, shuffleKey, shuffleTiles]);

  const handleReset = () => {
    if (!imageLoaded) return;
    setShuffleKey((key) => key + 1);
  };

  const handleTileClick = (index: number) => {
    if (!imageLoaded) return;
    if (index === emptyIndex) return;
    if (!movableIndices.has(index)) return;

    const nextTiles = [...tiles];
    [nextTiles[index], nextTiles[emptyIndex]] = [
      nextTiles[emptyIndex],
      nextTiles[index],
    ];

    setTiles(nextTiles);
    setEmptyIndex(index);
    setMoves((value) => value + 1);

    const solved = nextTiles.every((value, tileIndex) => value === tileIndex);
    if (solved) {
      onSolved?.();
    }
  };

  if (hasError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        Das Puzzle-Bild konnte nicht geladen werden.
      </div>
    );
  }

  if (!imageLoaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted p-8">
        <Loader2 className="h-8 w-8 animate-spin text-christmas-gold" />
        <p className="text-sm text-muted-foreground">Puzzle wird vorbereitet...</p>
      </div>
    );
  }

  const ratio =
    imageDimensions && imageDimensions.height !== 0
      ? imageDimensions.width / imageDimensions.height
      : 1;

  const baseSize = gridSize * 100;
  let backgroundWidthPercent = baseSize;
  let backgroundHeightPercent = baseSize;
  let offsetXPercent = 0;
  let offsetYPercent = 0;

  if (ratio > 1) {
    backgroundWidthPercent = baseSize * ratio;
    offsetXPercent = ((ratio - 1) / (2 * ratio)) * 100;
  } else if (ratio > 0 && ratio < 1) {
    backgroundHeightPercent = baseSize * (1 / ratio);
    offsetYPercent = ((1 - ratio) / 2) * 100;
  }

  const denominator = gridSize > 1 ? gridSize - 1 : 1;
  const coverageX = 100 - offsetXPercent * 2;
  const coverageY = 100 - offsetYPercent * 2;

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full" style={{ maxWidth: 420 }}>
        <div
          className="grid w-full gap-1 rounded-lg border p-1 shadow-inner"
          style={{
            aspectRatio: '1 / 1',
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {tiles.map((tileValue, index) => {
            const isEmptyTile = tileValue === tileCount - 1;
            const isCorrectPosition = tileValue === index;
            const tileRow = Math.floor(tileValue / gridSize);
            const tileCol = tileValue % gridSize;
            const normalizedCol = gridSize > 1 ? tileCol / denominator : 0.5;
            const normalizedRow = gridSize > 1 ? tileRow / denominator : 0.5;

            const backgroundPositionX =
              gridSize > 1
                ? offsetXPercent + normalizedCol * coverageX
                : offsetXPercent + coverageX / 2;
            const backgroundPositionY =
              gridSize > 1
                ? offsetYPercent + normalizedRow * coverageY
                : offsetYPercent + coverageY / 2;

            return (
              <button
                key={`${tileValue}-${index}`}
                type="button"
                onClick={() => handleTileClick(index)}
                disabled={isEmptyTile}
                className={cn(
                  'relative flex h-full w-full items-center justify-center rounded-md border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-christmas-gold focus-visible:ring-offset-2',
                  isEmptyTile
                    ? 'border-transparent bg-muted/40'
                    : 'bg-muted/10 shadow-sm hover:-translate-y-[2px]',
                  !isEmptyTile &&
                    movableIndices.has(index) &&
                    'ring-1 ring-christmas-gold/60',
                  !isEmptyTile && isCorrectPosition && 'border-christmas-green/60',
                  !isEmptyTile && !isCorrectPosition && 'border-border/60'
                )}
                style={
                  isEmptyTile
                    ? undefined
                    : {
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: `${backgroundWidthPercent}% ${backgroundHeightPercent}%`,
                        backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
                        backgroundRepeat: 'no-repeat',
                      }
                }
                aria-label={
                  isEmptyTile
                    ? 'Freies Feld'
                    : `Kachel ${tileValue + 1}${
                        movableIndices.has(index) ? ', verschiebbar' : ''
                      }`
                }
              ></button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Züge: {moves}</span>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Neu mischen
        </Button>
      </div>
    </div>
  );
}
