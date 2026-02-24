"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  UltimateTicTacToeState, 
  getAvailableSubBoards, 
  getAvailablePositions,
  checkSubBoardWinner
} from '@/lib/game/ultimate-tic-tac-toe'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Locale, translations } from '@/lib/i18n'

interface Room {
  id: string
  name: string
  gameType: string
  status: string
  hostId: string
  maxPlayers: number
  players: Array<{
    id: string
    name: string
    joinedAt: number
  }>
  createdAt: number
  updatedAt: number
  currentTurnIndex: number
  ultimateTicTacToeState?: UltimateTicTacToeState
}

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

export default function UltimateTicTacToeRoom() {
  const params = useParams()
  const roomId = params.roomId as string
  
  const [locale, setLocale] = useState<Locale>('zh')
  const [room, setRoom] = useState<Room | null>(null)
  const [selectedSubBoard, setSelectedSubBoard] = useState<{ x: number; y: number } | null>(null)
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const t = translations[locale]

  // 从本地存储加载用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('ultimate-tic-tac-toe-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // 加载房间信息
  const loadRoom = async () => {
    if (!roomId) return

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/rooms/${roomId}`)
      if (response.ok) {
        const data = await response.json()
        setRoom(data)
        if (data.ultimateTicTacToeState?.winner) {
          setShowWinnerDialog(true)
        }
      } else {
        setError('房间不存在或已被删除')
      }
    } catch (error) {
      setError('加载房间失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和定期刷新
  useEffect(() => {
    loadRoom()
    const interval = setInterval(loadRoom, 3000) // 每3秒刷新一次
    return () => clearInterval(interval)
  }, [roomId])

  // 使用useMemo缓存计算结果
  const availableSubBoards = useMemo(() => {
    if (!room?.ultimateTicTacToeState) return []
    return getAvailableSubBoards(room.ultimateTicTacToeState)
  }, [room?.ultimateTicTacToeState])

  const availablePositions = useMemo(() => {
    if (!selectedSubBoard || !room?.ultimateTicTacToeState) return []
    return getAvailablePositions(room.ultimateTicTacToeState, selectedSubBoard)
  }, [room?.ultimateTicTacToeState, selectedSubBoard])

  // 更新可用的子棋盘和位置
  useEffect(() => {
    if (availableSubBoards.length === 1) {
      setSelectedSubBoard(availableSubBoards[0])
    }
  }, [availableSubBoards])

  // 处理子棋盘点击
  const handleSubBoardClick = (subBoard: { x: number; y: number }) => {
    if (!room?.ultimateTicTacToeState || room.ultimateTicTacToeState.winner) return
    
    const isAvailable = availableSubBoards.some(s => s.x === subBoard.x && s.y === subBoard.y)
    
    if (isAvailable) {
      setSelectedSubBoard(subBoard)
    }
  }

  // 处理位置点击
  const handlePositionClick = async (subBoard: { x: number; y: number }, position: { x: number; y: number }) => {
    if (!room || !user || !room.ultimateTicTacToeState || room.ultimateTicTacToeState.winner) return
    
    // 检查是否是当前玩家的回合
    const currentPlayer = room.players[room.currentTurnIndex]
    if (currentPlayer.id !== user.id) return

    try {
      const response = await fetch(`/api/ultimate-tic-tac-toe/rooms/${roomId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'makeMove',
          playerId: user.id,
          move: {
            position,
            subBoard
          }
        })
      })

      if (response.ok) {
        // 房间信息会通过定时刷新更新
      }
    } catch (error) {
      console.error('Failed to make move:', error)
    }
  }

  // 退出房间
  const handleLeaveRoom = () => {
    window.location.href = '/ultimate-tic-tac-toe'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Card className="p-6 bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">{t === translations.zh ? '加载中...' : 'Loading...'}</h2>
            <p>{t === translations.zh ? '正在加载房间信息，请稍候' : 'Loading room information, please wait'}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Card className="p-6 bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-red-500">{t === translations.zh ? '错误' : 'Error'}</h2>
            <p className="mb-6">{error || (t === translations.zh ? '房间不存在' : 'Room not found')}</p>
            <Button onClick={() => window.location.href = '/ultimate-tic-tac-toe'}>
              {t === translations.zh ? '返回菜单' : 'Back to Menu'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <Card className="w-full max-w-4xl p-6 shadow-md bg-gray-900 text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 font-serif">
              Ultimate Tic Tac Toe
            </h1>
            <h2 className="text-xl font-semibold">{room.name}</h2>
          </div>
          <div className="flex items-center space-x-4">
            {/* 玩家信息 */}
            {user && (
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{user.username}</span>
              </div>
            )}
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

        {/* 房间状态和玩家列表 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Badge variant={room.status === 'waiting' ? 'secondary' : room.status === 'in-progress' ? 'primary' : 'destructive'}>
              {room.status === 'waiting' ? (t === translations.zh ? '等待中' : 'Waiting') : 
               room.status === 'in-progress' ? (t === translations.zh ? '游戏中' : 'In Progress') : 
               (t === translations.zh ? '已结束' : 'Finished')}
            </Badge>
            {room.status === 'in-progress' && room.ultimateTicTacToeState && (
              <div className="mt-2 text-sm">
                {t === translations.zh ? '轮到 ' : 'Turn: '}
                <span className={room.ultimateTicTacToeState.nextPlayer === 'X' ? 'text-red-500' : 'text-blue-500'}>
                  {room.ultimateTicTacToeState.nextPlayer}
                </span>
                ({room.players[room.currentTurnIndex]?.name})
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {room.players.map(player => (
              <div key={player.id} className="flex flex-col items-center">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs mt-1">{player.name}</span>
                {player.id === room.hostId && (
                  <Badge variant="outline" className="text-xs mt-1">{t === translations.zh ? '房主' : 'Host'}</Badge>
                )}
              </div>
            ))}
            {room.players.length < room.maxPlayers && (
              <div className="flex flex-col items-center">
                <Avatar className="w-8 h-8 opacity-50">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <span className="text-xs mt-1 text-gray-400">{t === translations.zh ? '等待中' : 'Waiting'}</span>
              </div>
            )}
          </div>
        </div>

        {/* 大棋盘 */}
        {room.ultimateTicTacToeState && (
          <div className="grid grid-cols-3 gap-4 mb-6 border-4 border-gray-700 p-4 bg-gray-900">
            {[0, 1, 2].map(y => {
              return [0, 1, 2].map(x => {
                return (
                  <SubBoard
                    key={`${x}-${y}`}
                    subBoard={{ x, y }}
                    gameState={room.ultimateTicTacToeState!}
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
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="secondary"
            className="transition-all hover:scale-105"
            onClick={handleLeaveRoom}
          >
            {t === translations.zh ? '退出房间' : 'Leave Room'}
          </Button>
        </div>
      </Card>

      {/* 游戏结束弹出对话框 */}
      {room.ultimateTicTacToeState && room.ultimateTicTacToeState.winner && (
        <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {room.ultimateTicTacToeState.winner === 'draw' ? (
                  <span className="text-gray-400">{t.dialogTitleDraw}</span>
                ) : (
                  <span className={room.ultimateTicTacToeState.winner === 'X' ? 'text-red-500' : 'text-blue-500'}>
                    {t.dialogTitleWinner.replace('{}', room.ultimateTicTacToeState.winner)}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center my-4 text-gray-300">
              {room.ultimateTicTacToeState.winner === 'draw' ? (
                t.dialogMessageDraw
              ) : (
                t.dialogMessageWinner.replace('{}', room.ultimateTicTacToeState.winner)
              )}
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={handleLeaveRoom} variant="primary" className="w-full">
                {t === translations.zh ? '返回菜单' : 'Back to Menu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
