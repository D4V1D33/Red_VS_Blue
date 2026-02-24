import { NextRequest, NextResponse } from 'next/server'
import { getRoomStore } from '@/lib/game/room-store'

// 获取 RoomStore 实例
const roomStore = getRoomStore()

type JoinRoomBody = {
  playerId: string
  playerName?: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  let body: JoinRoomBody
  
  try {
    body = await req.json() as JoinRoomBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { playerId, playerName } = body
  
  if (!playerId) {
    return NextResponse.json({ error: 'playerId is required' }, { status: 400 })
  }

  const room = roomStore.getRoom(roomId)
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  if (room.status !== 'waiting') {
    return NextResponse.json({ error: 'Cannot join a game that has already started or finished' }, { status: 400 })
  }

  if (room.players.length >= room.maxPlayers) {
    return NextResponse.json({ error: 'Room is full' }, { status: 400 })
  }

  const existing = room.players.find(p => p.id.trim() === playerId)
  
  if (!existing) {
    const player = {
      id: playerId,
      name: playerName || `Player ${playerId.slice(0, 8)}`,
      joinedAt: Date.now()
    }
    room.players.push(player)
  }

  // 如果房间已满，开始游戏
  if (room.players.length === room.maxPlayers) {
    room.status = 'in-progress'
    room.currentTurnIndex = 0
  }

  room.updatedAt = Date.now()
  roomStore.setRoom(roomId, room)
  
  return NextResponse.json(room)
}
