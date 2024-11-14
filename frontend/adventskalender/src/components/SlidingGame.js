import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import Confetti from 'react-confetti'

const gridSize = 3;

function getValidMoves(grid) {
  const [row, col] = indexToCoords(grid.indexOf(gridSize * gridSize - 1));
  const cross = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  return cross
    .map(([rows, cols]) => [rows + row, cols + col])
    .filter(([rows, cols]) => rows >= 0 && rows < gridSize && cols >= 0 && cols < gridSize)
    .map(coords => coordsToIndex(coords));
}

function indexToCoords(index) {
  return [Math.floor(index / gridSize), index % gridSize];
}

function coordsToIndex(coords) {
  const [row, col] = coords;
  return gridSize * row + col;
}

function shuffle(grid) {
  const randomMoves = 10;
  const newGrid = [...grid];
  let lastMove = -1;
  
  for(let i = 0; i < randomMoves; i++) {
    const empty = newGrid.indexOf(gridSize * gridSize - 1);
    // eslint-disable-next-line no-loop-func
    const moves = getValidMoves(newGrid).filter(m => m !== lastMove);
    const chosenMove = moves[Math.floor(Math.random() * moves.length)];
    const tempLast = empty;
    newGrid[empty] = newGrid[chosenMove];
    newGrid[chosenMove] = gridSize * gridSize - 1;
    lastMove = tempLast;
  }
  
  return newGrid;
}

function createInitialGrid() {
  const arr = Array.from({ length: gridSize * gridSize }, (_, i) => i);
  return shuffle(arr);
}

/*
function createSolvedGrid() {
  return Array.from({ length: gridSize * gridSize }, (_, i) => i);
}
*/

function SlidingGame({imageUrl, doorStates, setDoorStates, day}) {
  const [puzzle, setPuzzle] = useState(() => {
    if (doorStates[day]?.puzzle) {
      return doorStates[day].puzzle;
    }
    const initialPuzzle = createInitialGrid();
    setDoorStates(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        puzzle: initialPuzzle,
        win: false
      }
    }));
    return initialPuzzle;
  });

  const [win, setWin] = useState(doorStates[day]?.win || false);
  const [showConfetti, setShowConfetti] = useState(false);
  const divRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  const getAbsolutePosition = (element) => {
    let x = 0;
    let y = 0;
    let width = element.offsetWidth;
    let height = element.offsetHeight;

    x += (element.offsetLeft + element.clientLeft);
    y += (element.offsetTop + element.clientTop);
    element = element.offsetParent;

    return { x, y, width, height };
  };

  /*
  const handleSolveClick = () => {
    const solvedPuzzle = createSolvedGrid();
    setPuzzle(solvedPuzzle);
    setWin(true);
    setShowConfetti(true);
  };
  */

  useEffect(() => {
    const updateDimensions = () => {
      if (divRef.current) {
        const absolutePosition = getAbsolutePosition(divRef.current);
        setDimensions(absolutePosition);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const handleScroll = (event) => {
      if (divRef.current?.contains(event.target) || event.target.contains(divRef.current)) {
        updateDimensions();
      }
    };
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  useEffect(() => {
    setDoorStates(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        puzzle: puzzle,
        win: win
      }
    }));
  }, [puzzle, win, day, setDoorStates]);

  function handlePieceClick(index) {
    if(win) return;

    const emptyIndex = puzzle.indexOf(gridSize * gridSize - 1);
    let newPuzzle;
    if (isAdjacent(index, emptyIndex)) {
      newPuzzle = [...puzzle];
      [newPuzzle[index], newPuzzle[emptyIndex]] = [newPuzzle[emptyIndex], newPuzzle[index]];
      setPuzzle(newPuzzle);
      
      if (isWin(newPuzzle)) {
        setWin(true);
        setShowConfetti(true);
      }
    }
  }

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  function isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / gridSize);
    const col1 = index1 % gridSize;
    const row2 = Math.floor(index2 / gridSize);
    const col2 = index2 % gridSize;

    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
  }

  function isWin(puzz) {
    return [...Array(puzz.length - 1).keys()]
      .map(x => puzz[x] < puzz[x + 1])
      .reduce((x, y) => x && y);
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="p-6">
        {win ? (
          <h2 className="text-1xl sm:text-2xl font-bold text-center">Sehr gut!</h2>
        ) : (
          <h2 className="text-1xl sm:text-2xl font-bold text-center">Kannst du das Puzzle lösen?</h2>
        )}
      </div>

      {/* Debug Button 
      <button
        onClick={handleSolveClick}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Debug: Puzzle lösen
      </button>
      */}

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          initialVelocityY={25}
          confettiSource={{
            x: dimensions.x + dimensions.width / 2,
            y: dimensions.y + dimensions.height / 2
          }}
          recycle={false}
          tweenDuration={750}
          gravity={1}
          initialVelocityX={10}
          numberOfPieces={100}
        />
      )}
      
      <div className="grid grid-cols-3 bg-transparent relative w-96 h-96" ref={divRef}>
        {puzzle.map((piece, index) => (
          <div
            key={index}
            className={`relative ${piece === gridSize * gridSize - 1 ? "bg-transparent" : "bg-gray-500"} 
                   ${win ? "" : "cursor-pointer"} transition-transform duration-300 ease-in-out`}
            onClick={() => handlePieceClick(index)}
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${gridSize * 100}%`,
              backgroundPosition: getPiecePosition(piece),
              visibility: piece === gridSize * gridSize - 1 ? "hidden" : "visible",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function getPiecePosition(index) {
  const row = Math.floor(index / gridSize);
  const col = index % gridSize;
  return `${(col * 100) / (gridSize - 1)}% ${(row * 100) / (gridSize - 1)}%`;
}

export default SlidingGame;