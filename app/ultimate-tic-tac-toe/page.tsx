"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
}

interface User {
  id: string
  username: string
  password: string
  createdAt: string
}

export default function UltimateTicTacToe() {
  const [locale, setLocale] = useState<Locale>('zh')
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local')
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomName, setRoomName] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [joiningRoom, setJoiningRoom] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const t = translations[locale]

  // 从本地存储加载用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('ultimate-tic-tac-toe-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // 加载房间列表
  const loadRooms = async () => {
    try {
      const response = await fetch('/api/ultimate-tic-tac-toe/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Failed to load rooms:', error)
    }
  }

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.user)
        localStorage.setItem('ultimate-tic-tac-toe-user', JSON.stringify(data.user))
      } else {
        setLoginError(data.error || '登录失败')
      }
    } catch (error) {
      setLoginError('登录失败，请重试')
    }
  }

  // 登出
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('ultimate-tic-tac-toe-user')
  }

  // 创建房间
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !roomName) return

    setCreatingRoom(true)
    try {
      const response = await fetch('/api/ultimate-tic-tac-toe/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          roomName,
          hostId: user.id,
          hostName: user.username
        })
      })

      if (response.ok) {
        const newRoom = await response.json()
        setRooms([...rooms, newRoom])
        setRoomName('')
        // 跳转到房间页面
        window.location.href = `/ultimate-tic-tac-toe/room/${newRoom.id}`
      }
    } catch (error) {
      console.error('Failed to create room:', error)
    } finally {
      setCreatingRoom(false)
    }
  }

  // 加入房间
  const handleJoinRoom = async (room: Room) => {
    if (!user) return

    setJoiningRoom(true)
    try {
      const response = await fetch(`/api/ultimate-tic-tac-toe/rooms/${room.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: user.id,
          playerName: user.username
        })
      })

      if (response.ok) {
        // 跳转到房间页面
        window.location.href = `/ultimate-tic-tac-toe/room/${room.id}`
      }
    } catch (error) {
      console.error('Failed to join room:', error)
    } finally {
      setJoiningRoom(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <Card className="w-full max-w-4xl p-6 shadow-md bg-gray-900 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 font-serif">
              Ultimate Tic Tac Toe
            </h1>
            <p className="text-gray-400 font-serif">Ultimate Tic Tac Toe</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="secondary"
              onClick={() => window.location.href = '/'}
            >
              {t === translations.zh ? '返回主菜单' : 'Back to Main Menu'}
            </Button>
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

        <Tabs defaultValue="local" value={gameMode} onValueChange={(value) => setGameMode(value as 'local' | 'online')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="local">{t === translations.zh ? '本地对战' : 'Local Game'}</TabsTrigger>
            <TabsTrigger value="online">{t === translations.zh ? '在线对战' : 'Online Game'}</TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="mt-0">
            <Card className="p-6 bg-gray-800">
              <h3 className="text-xl font-semibold mb-4">{t === translations.zh ? '本地对战' : 'Local Game'}</h3>
              <p className="mb-6 text-gray-300">{t === translations.zh ? '在本地与朋友一起玩九井棋' : 'Play Ultimate Tic Tac Toe locally with a friend'}</p>
              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => window.location.href = '/ultimate-tic-tac-toe/local'}
                >
                  {t === translations.zh ? '开始游戏' : 'Start Game'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="online" className="mt-0">
            {!user ? (
              <Card className="p-6 bg-gray-800">
                <h3 className="text-xl font-semibold mb-4">{t === translations.zh ? '用户登录' : 'User Login'}</h3>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t === translations.zh ? '用户名' : 'Username'}</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t === translations.zh ? '请输入用户名' : 'Enter username'}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t === translations.zh ? '密码' : 'Password'}</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t === translations.zh ? '请输入密码' : 'Enter password'}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  {loginError && (
                    <div className="text-red-500 text-sm">{loginError}</div>
                  )}
                  <Button type="submit" variant="primary" className="w-full">
                    {t === translations.zh ? '登录' : 'Login'}
                  </Button>
                </form>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* 用户信息 */}
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src="" />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{user.username}</h4>
                      <p className="text-sm text-gray-400">{t === translations.zh ? '已登录' : 'Logged in'}</p>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={handleLogout}>
                    {t === translations.zh ? '登出' : 'Logout'}
                  </Button>
                </div>

                {/* 创建房间 */}
                <Card className="p-6 bg-gray-800">
                  <h3 className="text-xl font-semibold mb-4">{t === translations.zh ? '创建房间' : 'Create Room'}</h3>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomName">{t === translations.zh ? '房间名称' : 'Room Name'}</Label>
                      <Input 
                        id="roomName" 
                        value={roomName} 
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder={t === translations.zh ? '请输入房间名称' : 'Enter room name'}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-full"
                      disabled={!roomName || creatingRoom}
                    >
                      {creatingRoom ? (
                        <>{t === translations.zh ? '创建中...' : 'Creating...'}</>
                      ) : (
                        <>{t === translations.zh ? '创建房间' : 'Create Room'}</>
                      )}
                    </Button>
                  </form>
                </Card>

                {/* 房间列表 */}
                <Card className="p-6 bg-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{t === translations.zh ? '可用房间' : 'Available Rooms'}</h3>
                    <Button variant="secondary" onClick={loadRooms}>
                      {t === translations.zh ? '刷新' : 'Refresh'}
                    </Button>
                  </div>
                  <ScrollArea className="h-80">
                    {rooms.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        {t === translations.zh ? '暂无可用房间' : 'No available rooms'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rooms.map(room => (
                          <div key={room.id} className="p-4 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{room.name}</h4>
                              <Badge variant="outline">
                                {room.players.length}/{room.maxPlayers}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">
                              {t === translations.zh ? '房主: ' : 'Host: '}{room.players.find(p => p.id === room.hostId)?.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              {room.players.map(player => (
                                <Avatar key={player.id} className="w-6 h-6">
                                  <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <Button 
                              variant="primary" 
                              className="mt-3 w-full"
                              onClick={() => handleJoinRoom(room)}
                              disabled={joiningRoom || room.players.length >= room.maxPlayers}
                            >
                              {joiningRoom ? (
                                <>{t === translations.zh ? '加入中...' : 'Joining...'}</>
                              ) : (
                                <>{t === translations.zh ? '加入房间' : 'Join Room'}</>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
