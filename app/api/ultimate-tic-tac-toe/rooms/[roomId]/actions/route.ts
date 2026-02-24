import { NextRequest, NextResponse } from 'next/server'
import { getRoomStore } from '@/lib/game/room-store'
import { makeMove } from '@/lib/game/ultimate-tic-tac-toe'

// 获取 RoomStore 实例
const roomStore = getRoomStore()

type MakeMoveBody = {
  action: 'makeMove'
  playerId: string
  move: {
    position: { x: number; y: number }
    subBoard: { x: number; y: number }
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  let body: MakeMoveBody
  
  try {
    body = await req.json() as MakeMoveBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'makeMove') {
    const { playerId, move } = body
    
    if (!playerId || !move) {
      return NextResponse.json({ error: 'playerId and move are required' }, { status: 400 })
    }

    const room = roomStore.getRoom(roomId)
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'in-progress') {
      return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 })
    }

    // 检查是否是当前玩家的回合
    const currentPlayer = room.players[room.currentTurnIndex]
    if (currentPlayer.id !== playerId) {
      return NextResponse.json({ error: 'It is not your turn' }, { status: 400 })
    }

    // 执行移动
    if (room.ultimateTicTacToeState) {
      const newState = makeMove(room.ultimateTicTacToeState, move)
      
      if (newState) {
        room.ultimateTicTacToeState = newState
        
        // 检查游戏是否结束
        if (newState.winner) {
          room.status = 'finished'
        } else {
          // 切换回合
          room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length
        }
        
        room.updatedAt = Date.now()
        roomStore.setRoom(roomId, room)
        
        return NextResponse.json(room)
      } else {
        return NextResponse.json({ error: 'Invalid move' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Game state not initialized' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
