import React, { useState, useEffect, useRef} from "react";
import "../App.css"; // Add your image URL here, or in a global stylesheet
import Confetti from 'react-confetti'

const gridSize = 3; // 4x4 grid

function SlidingGame(imageUrl) {
  const [puzzle, setPuzzle] = useState([]);
  const [win, setWin] = useState(false);
  // const [transition, setTransition] = useState([0, 0]);
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

    // Traverse up the DOM tree to calculate absolute position
    x += (element.offsetLeft + element.clientLeft);
    y += (element.offsetTop + element.clientTop);
    element = element.offsetParent;
    

    return {
      x,
      y,
      width,
      height
    };
  };

  useEffect(() => {
    // whack infrastructure needed cuz the confetti package did not consider proper centering for some reason and made it our problem
    const updateDimensions = () => {
      if (divRef.current) {
        const absolutePosition = getAbsolutePosition(divRef.current);
        setDimensions(absolutePosition);
      }
    };

    // Initial measurement
    updateDimensions();

    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    // Update on scroll of any parent
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
    createInitialGrid();
  }, [])

  function createInitialGrid() {
    const arr = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    setPuzzle(shuffle(arr));
  }

  function indexToCoords(index) {
    return [Math.floor(index / gridSize), index % gridSize];
  }

  function coordsToIndex(coords) {
    const [row, col] = coords
    return gridSize * row + col; 
  }

  function getValidMoves(grid) {
    const [row, col] = indexToCoords(grid.indexOf(gridSize * gridSize - 1));
    const cross = [[1, 0], [0, 1], [-1, 0], [0, -1]]
    return cross.map(([rows, cols]) => [rows + row, cols + col]).filter(([rows, cols]) => rows >= 0 && rows < gridSize && cols >= 0 && cols < gridSize).map(
      (coords) => coordsToIndex(coords)
    );
    
  }

  function shuffle(grid) {
    // shuffles by performing a fixed number of valid moves backwards
    const randomMoves = 10;
    console.log(getValidMoves(grid));
    var lastMove = -1;
    for(let i = 0; i < randomMoves; i++){
      var empty = grid.indexOf(gridSize * gridSize - 1);
      var moves = getValidMoves(grid).filter(m => m !== lastMove);
      var chosenMove = moves[Math.floor(Math.random() * moves.length)];
      // console.log(`Randomizing step: empty index ${empty}, moves ${moves}, chosenMove ${chosenMove}`)
      grid[empty] = grid[chosenMove];
      grid[chosenMove] = gridSize * gridSize - 1
      lastMove = empty;
      console.log(lastMove)
    }
    /*
    grid[8] = 7
    grid[7] = 8
    */
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
      // setTransition([index, emptyIndex])
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
 /*
  function getPieceTransform(index) {
    let from, to;
    [from, to] = transition;
    if(index !== from) {
      // only define transform for clicked cell
      return ``;
    }
    const fromRow = Math.floor(index / gridSize);
    const fromCol = index % gridSize;
    const toRow = Math.floor(to / gridSize);
    const toCol = to % gridSize;
    
    return `translate(${(toCol - fromCol) * 100}%, ${(toRow - fromRow) * 100}%)`
  }
*/
  function isWin(puzz) {
    // if puzzle array is sorted, the game is over
    return [...Array(puzz.length - 1).keys()].map(x => puzz[x] < puzz[x + 1]).reduce((x , y) => x && y)
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="p-6"> 
      {
        win ? 
        <h2 className={`text-1xl sm:text-2xl font-bold text-center`}> Sehr gut!</h2>
        : 
        <h2 className={`text-1xl sm:text-2xl font-bold text-center`}> Kannst du das Puzzle lösen?</h2>
      }
      </div>     
       {win && <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        initialVelocityY={25}
        confettiSource={{
          x: dimensions.x + dimensions.width / 2,  // Center X relative to document
          y: dimensions.y + dimensions.height / 2  // Center Y relative to document
        }}
        recycle={false}
        tweenDuration={750}
        gravity={1}
        initialVelocityX={10}
        numberOfPieces={100}
        style={{
          
        }}
      />}
      <div className="grid grid-cols-3 bg-transparent relative w-96 h-96" ref={divRef}>
        {puzzle.map((piece, index) => (
          <div
            key={index}
            className={`relative ${piece === gridSize * gridSize - 1 ? "bg-transparent" : "bg-gray-500"} 
                   ${win ? `` : `cursor-pointer`} transition-transform duration-300 ease-in-out`}
            onClick={() => handlePieceClick(index)}
            style={{
              backgroundImage: `url(${imageUrl.imageUrl.data})`,
              backgroundSize: `${gridSize * 100}%`,
              backgroundPosition: getPiecePosition(piece),
              visibility: piece === gridSize * gridSize - 1 ? "hidden" : "visible",
            }}
          >
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