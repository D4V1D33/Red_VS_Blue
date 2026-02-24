export type Locale = 'zh' | 'en'

export interface Translation {
  // 游戏标题
  gameTitle: string
  gameSubtitle: string
  
  // 游戏状态
  turn: string
  winner: string
  draw: string
  nextBoard: string
  
  // 按钮
  restart: string
  undo: string
  
  // 游戏规则
  rulesTitle: string
  rule1: string
  rule2: string
  rule3: string
  rule4: string
  rule5: string
  rule6: string
  
  // 子棋盘状态
  subBoardWinner: string
  
  // 对话框
  dialogTitleWinner: string
  dialogTitleDraw: string
  dialogMessageWinner: string
  dialogMessageDraw: string
  dialogButton: string
  
  // 菜单项
  menuItem: string
  menuDescription: string
}

export const translations: Record<Locale, Translation> = {
  zh: {
    gameTitle: '九井棋',
    gameSubtitle: 'Ultimate Tic Tac Toe',
    turn: '轮到',
    winner: '获胜！',
    draw: '平局！',
    nextBoard: '必须在下一个子棋盘 ({}, {}) 中落子',
    restart: '重新开始',
    undo: '悔棋',
    rulesTitle: '游戏规则',
    rule1: '每次落子都应落在一个特定的小棋盘内',
    rule2: '这个小棋盘由对方上一手在小棋盘中落子的方格位置决定',
    rule3: '整局的第一手，可以下在任意位置',
    rule4: '目标小棋盘无法落子（已分出胜负或已被填满）时，可以下在大棋盘的任意空格',
    rule5: '一方在某小棋盘内先以纵横斜方向三格连线时，该玩家取得该小棋盘的胜利',
    rule6: '先在大棋盘中用胜利的小棋盘连成三格者获胜',
    subBoardWinner: '胜',
    dialogTitleWinner: '{} 获胜！',
    dialogTitleDraw: '平局！',
    dialogMessageWinner: '恭喜 {} 赢得了比赛！',
    dialogMessageDraw: '游戏结束，双方平局！',
    dialogButton: '重新开始',
    menuItem: '九井棋',
    menuDescription: 'Ultimate Tic Tac Toe 游戏'
  },
  en: {
    gameTitle: 'Ultimate Tic Tac Toe',
    gameSubtitle: 'Nine Wells Chess',
    turn: 'Turn for',
    winner: 'wins!',
    draw: 'Draw!',
    nextBoard: 'Must play in sub-board ({}, {})',
    restart: 'Restart',
    undo: 'Undo',
    rulesTitle: 'Game Rules',
    rule1: 'Each move must be placed in a specific sub-board',
    rule2: 'The sub-board is determined by the position of the opponent\'s last move',
    rule3: 'The first move of the game can be placed anywhere',
    rule4: 'If the target sub-board is full or already won, you can play in any empty space',
    rule5: 'A player wins a sub-board by getting three in a row (horizontally, vertically, or diagonally)',
    rule6: 'The first player to win three sub-boards in a row on the main board wins the game',
    subBoardWinner: 'Wins',
    dialogTitleWinner: '{} wins!',
    dialogTitleDraw: 'Draw!',
    dialogMessageWinner: 'Congratulations! {} won the game!',
    dialogMessageDraw: 'Game over, it\'s a draw!',
    dialogButton: 'Restart',
    menuItem: 'Ultimate Tic Tac Toe',
    menuDescription: 'Ultimate Tic Tac Toe game'
  }
}

export function useTranslation(locale: Locale) {
  return translations[locale]
}
