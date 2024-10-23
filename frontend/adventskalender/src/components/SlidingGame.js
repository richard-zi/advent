import React, { useState, useEffect } from "react";
import "../App.css"; // Add your image URL here, or in a global stylesheet

const gridSize = 3; // 4x4 grid

function SlidingGameOld2(imageUrl){
      // Manage the position of the box
  const [isMoved, setIsMoved] = useState(false);
  const [amount, setAmount] = useState(300);


  // Toggle the box position
  const toggleMove = () => {
    setIsMoved(!isMoved);
    setAmount(500);
  }

  return (
    <div className="flex justify-center items-center h-screen">
      {/* Box to slide */}
      <div
        className={`
          w-20 h-20 bg-blue-500 
          transition-transform duration-500 ease-in-out 
          transform ${isMoved ? `translate-x-[${amount}%]` : "translate-x-0"}
        `}
        onClick={toggleMove}
      ></div>

      {/* Button to trigger movement */}
      <button
        onClick={toggleMove}
        className="ml-8 px-4 py-2 bg-gray-800 text-white rounded"
      >
        Slide Box
      </button>
    </div>
  );
};



function SlidingGame(imageUrl) {
  const [puzzle, setPuzzle] = useState([]);
  const [win, setWin] = useState(false);
  const [postions, setPositions] = useState(puzzle);

  useEffect(() => {
    createInitialGrid();
  }, [])

  function createInitialGrid() {
    const arr = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    setPuzzle(shuffle(arr));
  }

  function shuffle(grid) {
    // Basic shuffle function
    // return grid.sort(() => Math.random() - 0.5);
    grid[8] = 7
    grid[7] = 8
    return grid
  }

  function handlePieceClick(index) {
    if(win){
      // allow no more operations when the game is finished 
      return; 
    }
    const emptyIndex = puzzle.indexOf(gridSize * gridSize - 1); // Find the empty space
    let newPuzzle;
    if (isAdjacent(index, emptyIndex)) {
       newPuzzle = [...puzzle];
      [newPuzzle[index], newPuzzle[emptyIndex]] = [newPuzzle[emptyIndex], newPuzzle[index]];
      setPuzzle(newPuzzle);

    }
    if (newPuzzle && isWin(newPuzzle)) {
      setWin(true);
    }
  }

  function isAdjacent(index1, index2) {
    const row1 = Math.floor(index1 / gridSize);
    const col1 = index1 % gridSize;
    const row2 = Math.floor(index2 / gridSize);
    const col2 = index2 % gridSize;

    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) || // Vertical move
      (Math.abs(col1 - col2) === 1 && row1 === row2) // Horizontal move
    );
  }

  function getPieceTransform(index) {
    /*
    let from, to;
    [from, to] = transition;
    if(index !== from) {
      // only define transform for clicked cell
      return ``;
    }
    console.log(transition)
    const fromRow = Math.floor(index / gridSize);
    const fromCol = index % gridSize;
    const toRow = Math.floor(to / gridSize);
    const toCol = to % gridSize;
    console.log(`from: ${fromRow},  ${fromCol} =>  ${toRow},  ${toCol}`)
    console.log(`translate(${(toCol - fromCol) * 100}%, ${(toRow - fromRow) * 100}%)`)
    
    return `translate(${toCol* 100}%, ${toRow * 100}%)`;
    */
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return "translate(0, 0)"
    return `translate(${col* 100}%, ${row * 100}%) shadow-md`;

  }

  function isWin(puzz) {
    // if puzzle array is sorted,  the game is over
    return [...Array(puzz.length - 1).keys()].map(x => puzz[x] < puzz[x + 1]).reduce((x , y) => x && y)
  }

  return (
    <div className="flex justify-center items-center h-screen">   
      {
        win && <h2> It's so over </h2>
      }<div className="grid grid-cols-3 bg-transparent relative w-64 h-64">
        {puzzle.map((piece, index) => (
          <div
            key={index}
            className={`relative ${piece === gridSize * gridSize - 1 ? "bg-transparent" : "bg-gray-500"} 
                   ${win ? ``: `cursor-pointer` } transition-transform duration-300 ease-in-out`}
            onClick={() => handlePieceClick(index)}
            style={{
              backgroundImage: `url(${imageUrl.imageUrl.data})`,
              backgroundSize: `${gridSize * 100}%`,
              backgroundPosition: getPiecePosition(piece),
              visibility: piece === gridSize * gridSize - 1 ? "hidden" : "visible", // Hide the empty space<  Q
              transform : getPieceTransform(index)
            }}
          >
            {/* Optionally add piece numbers for debugging */}
            {/* <span className="absolute text-black text-xl">{piece + 1}</span> */}
          </div>
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