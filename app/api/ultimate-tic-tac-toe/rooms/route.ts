import { NextRequest, NextResponse } from 'next/server'
import { getRoomStore, type Room } from '@/lib/game/room-store'
import { initializeGame } from '@/lib/game/ultimate-tic-tac-toe'

// 获取 RoomStore 实例
const roomStore = getRoomStore()

export async function GET(_req: NextRequest) {
  const rooms = Array.from(roomStore.getRooms().values())
    .filter(room => room.gameType === 'ultimate-tic-tac-toe')
    .filter(room => room.status === 'waiting')
  
  return NextResponse.json(rooms)
}

type CreateRoomBody = {
  action: 'create'
  roomName: string
  hostId: string
  hostName: string
}

export async function POST(req: NextRequest) {
  let body: CreateRoomBody
  
  try {
    body = await req.json() as CreateRoomBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'create') {
    const { roomName, hostId, hostName } = body
    
    if (!roomName || !hostId) {
      return NextResponse.json({ error: 'roomName and hostId are required' }, { status: 400 })
    }

    // 生成唯一房间ID
    const roomId = `utt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 创建新房间
    const room: Room = {
      id: roomId,
      name: roomName,
      gameType: 'ultimate-tic-tac-toe',
      status: 'waiting',
      hostId,
      maxPlayers: 2,
      players: [
        {
          id: hostId,
          name: hostName || `Player ${hostId.slice(0, 8)}`,
          joinedAt: Date.now()
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentTurnIndex: 0,
      battleState: null,
      ultimateTicTacToeState: initializeGame(),
      mapId: null
    }

    roomStore.setRoom(roomId, room)
    return NextResponse.json(room)
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
