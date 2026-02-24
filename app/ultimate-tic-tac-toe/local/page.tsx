"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { 
  UltimateTicTacToeState, 
  initializeGame, 
  makeMove, 
  getAvailableSubBoards, 
  getAvailablePositions,
  checkSubBoardWinner,
  undoMove
} from '@/lib/game/ultimate-tic-tac-toe'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Locale, translations } from '@/lib/i18n'

// 单元格组件
const Cell = React.memo(({
  subBoard,
  position,
  cellValue,
  isClickable,
  onPositionClick
}: {
  subBoard: { x: number; y: number }
  position: { x: number; y: number }
  cellValue: 'X' | 'O' | null
  isClickable: boolean
  onPositionClick: (subBoard: { x: number; y: number }, position: { x: number; y: number }) => void
}) => (
  <button
    key={`${subBoard.x}-${subBoard.y}-${position.x}-${position.y}`}
    onClick={() => isClickable && onPositionClick(subBoard, position)}
    className={`w-10 h-10 flex items-center justify-center text-2xl font-bold 
      ${cellValue === 'X' ? 'text-red-500' : cellValue === 'O' ? 'text-blue-500' : 'text-gray-600'}
      ${isClickable ? 'hover:bg-gray-800 cursor-pointer transition-colors' : 'cursor-not-allowed'}
      border border-gray-700 bg-gray-900
      transform transition-transform hover:scale-105
    `}
  >
    {cellValue || ''}
  </button>
))

// 子棋盘组件
const SubBoard = React.memo(({
  subBoard,
  gameState,
  selectedSubBoard,
  availableSubBoards,
  availablePositions,
  onSubBoardClick,
  onPositionClick,
  t
}: {
  subBoard: { x: number; y: number }
  gameState: UltimateTicTacToeState
  selectedSubBoard: { x: number; y: number } | null
  availableSubBoards: { x: number; y: number }[]
  availablePositions: { x: number; y: number }[]
  onSubBoardClick: (subBoard: { x: number; y: number }) => void
  onPositionClick: (subBoard: { x: number; y: number }, position: { x: number; y: number }) => void
  t: typeof translations['zh']
}) => {
  // 添加空值检查，获取子棋盘数据
  const getSubBoardData = () => {
    if (!gameState.bigBoard) return null
    if (!gameState.bigBoard[subBoard.y]) return null
    return gameState.bigBoard[subBoard.y][subBoard.x]
  }

  const subBoardData = getSubBoardData()
  const status = subBoardData ? checkSubBoardWinner(subBoardData) : null
  const isClickable = !gameState.winner && availableSubBoards.some(s => s.x === subBoard.x && s.y === subBoard.y)
  const isSelected = selectedSubBoard && selectedSubBoard.x === subBoard.x && selectedSubBoard.y === subBoard.y
  
  const isPositionClickable = (position: { x: number; y: number }) => {
    if (gameState.winner) return false
    // 对于第一手，允许点击任何可用子棋盘中的位置
    if (!selectedSubBoard) {
      return availableSubBoards.some(s => s.x === subBoard.x && s.y === subBoard.y)
    }
    if (selectedSubBoard.x !== subBoard.x || selectedSubBoard.y !== subBoard.y) return false
    return availablePositions.some(p => p.x === position.x && p.y === position.y)
  }

  // 获取单元格值，添加空值检查
  const getCellValue = (row: number, col: number) => {
    if (!subBoardData) return null
    if (!subBoardData[row]) return null
    if (subBoardData[row][col] === undefined) return null
    return subBoardData[row][col]
  }

  return (
    <div
      key={`${subBoard.x}-${subBoard.y}`}
      onClick={() => isClickable && onSubBoardClick(subBoard)}
      className={`border-2 p-2 
        ${isSelected ? 'border-primary' : 'border-gray-700'}
        ${isClickable ? 'hover:border-primary hover:shadow-sm cursor-pointer transition-all' : 'cursor-not-allowed'}
        ${status === 'X' ? 'bg-red-900 bg-opacity-30' : status === 'O' ? 'bg-blue-900 bg-opacity-30' : status === 'draw' ? 'bg-gray-800' : 'bg-gray-900'}
        transition-all duration-300
      `}
    >
      <div className="grid grid-cols-3 gap-0.5">
        {[0, 1, 2].map(y => {
          return [0, 1, 2].map(x => {
            const position = { x, y }
            return (
              <Cell
                key={`${x}-${y}`}
                subBoard={subBoard}
                position={position}
                cellValue={getCellValue(y, x)}
                isClickable={isPositionClickable(position)}
                onPositionClick={(subBoard, position) => onPositionClick(subBoard, position)}
              />
            )
          })
        })}
      </div>
      {status && (
        <div className="mt-1 text-center text-xs">
          {status === 'X' && <Badge variant="destructive">X {t.subBoardWinner}</Badge>}
          {status === 'O' && <Badge variant="primary">O {t.subBoardWinner}</Badge>}
          {status === 'draw' && <Badge variant="secondary">{t.draw}</Badge>}
        </div>
      )}
    </div>
  )
})

export default function UltimateTicTacToeLocal() {
  const [gameState, setGameState] = useState<UltimateTicTacToeState>(() => {
    // 从本地存储加载游戏状态（仅在客户端环境）
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('ultimate-tic-tac-toe-state-local')
      return savedState ? JSON.parse(savedState) : initializeGame()
    }
    return initializeGame()
  })
  const [selectedSubBoard, setSelectedSubBoard] = useState<{ x: number; y: number } | null>(null)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [locale, setLocale] = useState<Locale>(() => {
    // 从本地存储加载语言设置（仅在客户端环境）
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('ultimate-tic-tac-toe-locale') as Locale
      return savedLocale || 'zh'
    }
    return 'zh'
  })

  // 保存语言设置到本地存储
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultimate-tic-tac-toe-locale', locale)
    }
  }, [locale])

  // 获取当前语言的翻译
  const t = translations[locale]

  // 使用useMemo缓存计算结果
  const availableSubBoards = useMemo(() => {
    return getAvailableSubBoards(gameState)
  }, [gameState])

  const availablePositions = useMemo(() => {
    if (!selectedSubBoard) return []
    return getAvailablePositions(gameState, selectedSubBoard)
  }, [gameState, selectedSubBoard])

  // 保存游戏状态到本地存储
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultimate-tic-tac-toe-state-local', JSON.stringify(gameState))
    }
  }, [gameState])

  // 更新可用的子棋盘和位置
  useEffect(() => {
    if (availableSubBoards.length === 1) {
      setSelectedSubBoard(availableSubBoards[0])
    }
  }, [availableSubBoards])

  // 监听游戏结束，显示获胜对话框
  useEffect(() => {
    if (gameState.winner) {
      setShowWinnerDialog(true)
    }
  }, [gameState.winner])

  // 处理子棋盘点击
  const handleSubBoardClick = (subBoard: { x: number; y: number }) => {
    if (gameState.winner) return
    
    const isAvailable = availableSubBoards.some(s => s.x === subBoard.x && s.y === subBoard.y)
    
    if (isAvailable) {
      setSelectedSubBoard(subBoard)
    }
  }

  // 处理位置点击
  const handlePositionClick = (subBoard: { x: number; y: number }, position: { x: number; y: number }) => {
    if (gameState.winner) return
    
    const move = {
      position,
      subBoard
    }
    
    const newState = makeMove(gameState, move)
    if (newState) {
      setGameState(newState)
      // 确保selectedSubBoard更新为下一个可用的子棋盘
      const nextAvailableSubBoards = getAvailableSubBoards(newState)
      if (nextAvailableSubBoards.length === 1) {
        setSelectedSubBoard(nextAvailableSubBoards[0])
      } else if (nextAvailableSubBoards.length > 1) {
        // 如果有多个可用子棋盘，保持当前选择
      }
    }
  }

  // 重置游戏
  const handleReset = () => {
    const newState = initializeGame()
    setGameState(newState)
    setSelectedSubBoard(null)
    setShowWinnerDialog(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ultimate-tic-tac-toe-state-local')
    }
  }

  // 悔棋
  const handleUndo = () => {
    const newState = undoMove(gameState)
    if (newState) {
      setGameState(newState)
      setShowWinnerDialog(false)
      // 更新selectedSubBoard
      const nextAvailableSubBoards = getAvailableSubBoards(newState)
      if (nextAvailableSubBoards.length === 1) {
        setSelectedSubBoard(nextAvailableSubBoards[0])
      } else {
        setSelectedSubBoard(null)
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('ultimate-tic-tac-toe-state-local', JSON.stringify(newState))
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <Card className="w-full max-w-2xl p-6 shadow-md bg-gray-900 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 font-serif">
              Ultimate Tic Tac Toe
            </h1>
            <p className="text-gray-400 font-serif">Ultimate Tic Tac Toe</p>
          </div>
          <div>
            <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 游戏状态 */}
        <div className="text-center mb-4">
          {gameState.winner ? (
            <div className="text-xl font-bold mb-2 animate-pulse">
              {gameState.winner === 'draw' ? t.draw : `${gameState.winner} ${t.winner}`}
            </div>
          ) : (
            <div className="text-xl font-bold mb-2">
              {t.turn} {gameState.nextPlayer === 'X' ? (
                <span className="text-red-500">X</span>
              ) : (
                <span className="text-blue-500">O</span>
              )}
            </div>
          )}
          {gameState.nextSubBoard && (
            <div className="text-sm text-gray-400">
              {t.nextBoard.replace('{}', (gameState.nextSubBoard.x + 1).toString()).replace('{}', (gameState.nextSubBoard.y + 1).toString())}
            </div>
          )}
        </div>

        {/* 大棋盘 */}
        <div className="grid grid-cols-3 gap-4 mb-6 border-4 border-gray-700 p-4 bg-gray-900">
          {[0, 1, 2].map(y => {
            return [0, 1, 2].map(x => {
              return (
                <SubBoard
                  key={`${x}-${y}`}
                  subBoard={{ x, y }}
                  gameState={gameState}
                  selectedSubBoard={selectedSubBoard}
                  availableSubBoards={availableSubBoards}
                  availablePositions={availablePositions}
                  onSubBoardClick={handleSubBoardClick}
                  onPositionClick={(subBoard, position) => handlePositionClick(subBoard, position)}
                  t={t}
                />
              )
            })
          })}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleUndo} 
            variant="secondary"
            className="transition-all hover:scale-105"
            disabled={gameState.moveHistory.length === 0}
          >
            {t.undo}
          </Button>
          <Button 
            onClick={handleReset} 
            variant="secondary"
            className="transition-all hover:scale-105"
          >
            {t.restart}
          </Button>
          <Button 
            variant="secondary"
            className="transition-all hover:scale-105"
            onClick={() => window.location.href = '/ultimate-tic-tac-toe'}
          >
            {t === translations.zh ? '返回菜单' : 'Back to Menu'}
          </Button>
        </div>
      </Card>

      {/* 游戏规则 */}
      <div className="mt-8 max-w-2xl">
        <Card className="p-4 shadow-sm bg-gray-900 text-white">
          <h2 className="text-lg font-semibold mb-2">{t.rulesTitle}</h2>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            <li>{t.rule1}</li>
            <li>{t.rule2}</li>
            <li>{t.rule3}</li>
            <li>{t.rule4}</li>
            <li>{t.rule5}</li>
            <li>{t.rule6}</li>
          </ul>
        </Card>
      </div>

      {/* 游戏结束弹出对话框 */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {gameState.winner === 'draw' ? (
                <span className="text-gray-400">{t.dialogTitleDraw}</span>
              ) : (
                <span className={gameState.winner === 'X' ? 'text-red-500' : 'text-blue-500'}>
                  {t.dialogTitleWinner.replace('{}', gameState.winner)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center my-4 text-gray-300">
            {gameState.winner === 'draw' ? (
              t.dialogMessageDraw
            ) : (
              t.dialogMessageWinner.replace('{}', gameState.winner)
            )}
          </div>
          <DialogFooter className="justify-center">
            <Button onClick={handleReset} variant="primary" className="w-full">
              {t.dialogButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
