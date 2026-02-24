// 九井棋游戏核心逻辑

export type PlayerSymbol = 'X' | 'O'
export type CellState = PlayerSymbol | null
export type BoardState = CellState[][] 
export type BigBoardState = BoardState[][] 
export type Position = { x: number; y: number }
export type Move = { position: Position; subBoard: Position }

export interface UltimateTicTacToeState {
  bigBoard: BigBoardState
  nextPlayer: PlayerSymbol
  nextSubBoard: Position | null
  winner: PlayerSymbol | null
  winningLine: Position[] | null
  moveHistory: Move[]
}

// 初始化九井棋游戏状态
export function initializeGame(): UltimateTicTacToeState {
  // 创建空的大棋盘（3x3个小棋盘）
  const bigBoard: BigBoardState = []
  for (let y = 0; y < 3; y++) {
    const row: BoardState[] = []
    for (let x = 0; x < 3; x++) {
      const subBoard: CellState[][] = []
      for (let boardY = 0; boardY < 3; boardY++) {
        const subRow: CellState[] = []
        for (let boardX = 0; boardX < 3; boardX++) {
          subRow.push(null)
        }
        subBoard.push(subRow)
      }
      row.push(subBoard)
    }
    bigBoard.push(row)
  }

  return {
    bigBoard,
    nextPlayer: 'X',
    nextSubBoard: null, // 第一手可以下在任意位置
    winner: null,
    winningLine: null,
    moveHistory: []
  }
}

// 检查小棋盘是否有获胜者
export function checkSubBoardWinner(board: BoardState): PlayerSymbol | null {
  // 添加空值检查
  if (!board) {
    return null
  }

  // 检查行
  for (let i = 0; i < 3; i++) {
    // 添加行的空值检查
    if (board[i] && board[i][0] && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
      return board[i][0]
    }
  }

  // 检查列
  for (let i = 0; i < 3; i++) {
    // 添加列的空值检查
    if (board[0] && board[1] && board[2] && 
        board[0][i] && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
      return board[0][i]
    }
  }

  // 检查对角线
  if (board[0] && board[1] && board[2] && 
      board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
    return board[0][0]
  }

  if (board[0] && board[1] && board[2] && 
      board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
    return board[0][2]
  }

  // 检查是否平局
  const isFull = board.every(row => row && row.every(cell => cell !== null))
  if (isFull) {
    return 'draw' as PlayerSymbol // 使用'draw'表示平局
  }

  return null
}

// 检查大棋盘是否有获胜者
export function checkBigBoardWinner(bigBoard: BigBoardState): { winner: PlayerSymbol | null; line: Position[] | null } {
  // 创建大棋盘的简化表示（只记录每个小棋盘的获胜者）
  const bigBoardResult: (PlayerSymbol | null)[][] = Array(3).fill(null).map((_, i) => 
    Array(3).fill(null).map((_, j) => {
      return checkSubBoardWinner(bigBoard[i][j])
    })
  )

  // 检查行
  for (let i = 0; i < 3; i++) {
    if (bigBoardResult[i][0] && bigBoardResult[i][0] !== 'draw' && 
        bigBoardResult[i][0] === bigBoardResult[i][1] && 
        bigBoardResult[i][0] === bigBoardResult[i][2]) {
      return {
        winner: bigBoardResult[i][0],
        line: [
          { x: 0, y: i },
          { x: 1, y: i },
          { x: 2, y: i }
        ]
      }
    }
  }

  // 检查列
  for (let i = 0; i < 3; i++) {
    if (bigBoardResult[0][i] && bigBoardResult[0][i] !== 'draw' && 
        bigBoardResult[0][i] === bigBoardResult[1][i] && 
        bigBoardResult[0][i] === bigBoardResult[2][i]) {
      return {
        winner: bigBoardResult[0][i],
        line: [
          { x: i, y: 0 },
          { x: i, y: 1 },
          { x: i, y: 2 }
        ]
      }
    }
  }

  // 检查对角线
  if (bigBoardResult[0][0] && bigBoardResult[0][0] !== 'draw' && 
      bigBoardResult[0][0] === bigBoardResult[1][1] && 
      bigBoardResult[0][0] === bigBoardResult[2][2]) {
    return {
      winner: bigBoardResult[0][0],
      line: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ]
    }
  }

  if (bigBoardResult[0][2] && bigBoardResult[0][2] !== 'draw' && 
      bigBoardResult[0][2] === bigBoardResult[1][1] && 
      bigBoardResult[0][2] === bigBoardResult[2][0]) {
    return {
      winner: bigBoardResult[0][2],
      line: [
        { x: 2, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 2 }
      ]
    }
  }

  // 检查是否所有小棋盘都已结束
  const allBoardsCompleted = bigBoardResult.every(row => 
    row.every(cell => cell !== null)
  )

  if (allBoardsCompleted) {
    return { winner: 'draw' as PlayerSymbol, line: null }
  }

  return { winner: null, line: null }
}

// 检查移动是否有效
export function isValidMove(
  state: UltimateTicTacToeState,
  move: Move
): boolean {
  const { bigBoard, nextSubBoard, winner } = state
  const { position, subBoard } = move

  // 如果游戏已结束，不能移动
  if (winner) {
    return false
  }

  // 添加大棋盘空值检查
  if (!bigBoard) {
    return false
  }

  // 检查子棋盘坐标是否有效
  if (subBoard.x < 0 || subBoard.x >= 3 || subBoard.y < 0 || subBoard.y >= 3) {
    return false
  }

  // 检查位置坐标是否有效
  if (position.x < 0 || position.x >= 3 || position.y < 0 || position.y >= 3) {
    return false
  }

  // 检查子棋盘是否存在
  if (!bigBoard[subBoard.y] || !bigBoard[subBoard.y][subBoard.x]) {
    return false
  }

  // 检查是否必须在下一个指定的子棋盘中移动
  if (nextSubBoard) {
    if (subBoard.x !== nextSubBoard.x || subBoard.y !== nextSubBoard.y) {
      // 检查指定的子棋盘是否已满或已获胜
      if (bigBoard[nextSubBoard.y] && bigBoard[nextSubBoard.y][nextSubBoard.x]) {
        const targetSubBoard = bigBoard[nextSubBoard.y][nextSubBoard.x]
        const subBoardWinner = checkSubBoardWinner(targetSubBoard)
        if (!subBoardWinner) {
          return false
        }
      } else {
        return false
      }
    }
  }

  // 检查目标位置是否为空
  if (bigBoard[subBoard.y][subBoard.x][position.y] && bigBoard[subBoard.y][subBoard.x][position.y][position.x] !== null) {
    return false
  }

  // 检查子棋盘是否已结束
  const subBoardWinner = checkSubBoardWinner(bigBoard[subBoard.y][subBoard.x])
  if (subBoardWinner) {
    return false
  }

  return true
}

// 执行移动
export function makeMove(
  state: UltimateTicTacToeState,
  move: Move
): UltimateTicTacToeState | null {
  if (!isValidMove(state, move)) {
    return null
  }

  const { bigBoard, nextPlayer, moveHistory } = state
  const { position, subBoard } = move

  // 创建新的大棋盘状态（深拷贝）
  const newBigBoard = JSON.parse(JSON.stringify(bigBoard))
  
  // 更新指定位置的棋子
  if (newBigBoard[subBoard.y] && 
      newBigBoard[subBoard.y][subBoard.x] && 
      newBigBoard[subBoard.y][subBoard.x][position.y]) {
    newBigBoard[subBoard.y][subBoard.x][position.y][position.x] = nextPlayer
  }

  // 计算下一个子棋盘（由当前移动的位置决定）
  const nextSubBoard = {
    x: position.x,
    y: position.y
  }

  // 检查下一个子棋盘是否已结束
  const nextSubBoardState = newBigBoard[nextSubBoard.y][nextSubBoard.x]
  const nextSubBoardWinner = checkSubBoardWinner(nextSubBoardState)
  const actualNextSubBoard = nextSubBoardWinner ? null : nextSubBoard

  // 检查大棋盘是否有获胜者
  const { winner, line } = checkBigBoardWinner(newBigBoard)

  // 切换玩家
  const newNextPlayer = nextPlayer === 'X' ? 'O' : 'X'

  return {
    bigBoard: newBigBoard,
    nextPlayer: newNextPlayer,
    nextSubBoard: actualNextSubBoard,
    winner,
    winningLine: line,
    moveHistory: [...moveHistory, move]
  }
}

// 获取可移动的子棋盘
export function getAvailableSubBoards(state: UltimateTicTacToeState): Position[] {
  const { nextSubBoard, bigBoard } = state

  // 添加大棋盘空值检查
  if (!bigBoard) {
    return []
  }

  // 如果有指定的下一个子棋盘且未结束，则只能在该子棋盘中移动
  if (nextSubBoard && bigBoard[nextSubBoard.y] && bigBoard[nextSubBoard.y][nextSubBoard.x]) {
    const subBoardWinner = checkSubBoardWinner(bigBoard[nextSubBoard.y][nextSubBoard.x])
    if (!subBoardWinner) {
      return [nextSubBoard]
    }
  }

  // 否则可以在任何未结束的子棋盘中移动
  const available: Position[] = []
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (bigBoard[y] && bigBoard[y][x]) {
        const subBoardWinner = checkSubBoardWinner(bigBoard[y][x])
        if (!subBoardWinner) {
          available.push({ x, y })
        }
      }
    }
  }

  return available
}

// 获取子棋盘中可移动的位置
export function getAvailablePositions(
  state: UltimateTicTacToeState,
  subBoard: Position
): Position[] {
  const { bigBoard } = state
  const available: Position[] = []

  // 添加大棋盘和子棋盘的空值检查
  if (!bigBoard || !bigBoard[subBoard.y] || !bigBoard[subBoard.y][subBoard.x]) {
    return available
  }

  const board = bigBoard[subBoard.y][subBoard.x]
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (board[y] && board[y][x] === null) {
        available.push({ x, y })
      }
    }
  }

  return available
}

// 悔棋函数
export function undoMove(state: UltimateTicTacToeState): UltimateTicTacToeState | null {
  // 检查是否有移动历史
  if (!state.moveHistory || state.moveHistory.length === 0) {
    return null
  }

  // 创建新的游戏状态
  const newState = JSON.parse(JSON.stringify(state))
  
  // 移除最后一次移动
  const lastMove = newState.moveHistory.pop()
  
  if (!lastMove) {
    return null
  }

  // 恢复到上一个状态
  // 由于我们使用深拷贝，直接移除最后一步并重新计算状态
  
  // 清空当前棋盘
  const resetBigBoard: BigBoardState = []
  for (let y = 0; y < 3; y++) {
    const row: BoardState[] = []
    for (let x = 0; x < 3; x++) {
      const subBoard: CellState[][] = []
      for (let boardY = 0; boardY < 3; boardY++) {
        const subRow: CellState[] = []
        for (let boardX = 0; boardX < 3; boardX++) {
          subRow.push(null)
        }
        subBoard.push(subRow)
      }
      row.push(subBoard)
    }
    resetBigBoard.push(row)
  }

  // 重新应用所有移动，除了最后一个
  let currentState: UltimateTicTacToeState = {
    bigBoard: resetBigBoard,
    nextPlayer: 'X',
    nextSubBoard: null,
    winner: null,
    winningLine: null,
    moveHistory: []
  }

  for (const move of newState.moveHistory) {
    const result = makeMove(currentState, move)
    if (result) {
      currentState = result
    }
  }

  return currentState
}