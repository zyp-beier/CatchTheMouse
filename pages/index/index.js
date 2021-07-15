// index.js
import shuffle from "../../utils/shuffle";
let app = getApp()
Page({
  data: {
    grid: [],
    mouse: {
      x: 3,
      y: 3
    },
    available_cell: [],
    feasible_path: [],
    interval: '', // 定时器
    timeLimit: 60,  // 限时
    timeTaken: 0,   // 所用时间
    step: 0,
    pass: 1,
    score: 0,
    totalScore: 0,
    showModal: 0,
    progress_start: false
  },
  onLoad(options) {
    // 地图
    let pass = parseInt(options.pass) || 1
    this.generateArray(pass)

    // 设置坐标
    this.setMouseCoordinate()

    //设置背景音乐
    const audioContext = wx.createInnerAudioContext();
    const movingAudio =  wx.createInnerAudioContext()
    audioContext.src = "/assets/audio/bg.mp3"
    audioContext.loop = true

    movingAudio.src = "/assets/audio/move.mp3"
    this.setData({
      audioContext, movingAudio, pass
    })
  },
  onShow() {
    this.setData({
      progress_start: true
    })
    // 设置时间
    let { timeLimit } = this.data
    let timeTaken = 0
    clearInterval(this.data.interval)
    let interval = setInterval(() => {
      timeTaken += 1
      if (timeTaken > timeLimit) {
        console.log('您已超时')
        this.setData({
          showModal: -2
        })
        clearInterval(interval)
      }
      this.setData({
        timeTaken
      })
    }, 1000)
    this.setData({
      interval
    })

    // 获取可用路径
    this.getNewPath()

    this.findExitPoint();

    //循环背景音乐
    // this.playBgAudio()

    // this.findAvailablePaths();

  },
  onHide() {
    this.data.audioContext.stop()
    clearInterval(this.data.interval)
  },
  // 生成地图
  generateArray(pass = 1) {
    let passNumber
    let percentageOccupancy   // 占用率
    switch (true) {
      case pass < 3:
        percentageOccupancy = 40
        passNumber = 7
        break;
      case 3 <= pass && pass < 6:
        percentageOccupancy = 40
        passNumber = 8
        break;
      case 9 > pass && pass >= 6:
        percentageOccupancy = 30
        passNumber = 9
        break;
      case 12 > pass && pass >= 9:
        percentageOccupancy = 20
        passNumber = 10
        break;
      case 15 > pass && pass >= 12:
        percentageOccupancy = 10
        passNumber = 11
        break;
      default:
        percentageOccupancy = 10
        passNumber = 12
    }
    // 生成固定占位率的乱序二维数组
    let oneDimensional = new Array(passNumber)
    let twoDimensional = new Array(passNumber)
    let cn = Math.round(passNumber * (percentageOccupancy / 100))
    for(let i = 0; i < oneDimensional.length; i++) {
      for(let j = 0; j < twoDimensional.length; j++) {
        j < cn ? twoDimensional[j] = 1 : twoDimensional[j] = 0
      }
      let _twoDimensional = shuffle(twoDimensional)
      oneDimensional[i] = _twoDimensional
    }
    this.setData({
      grid: oneDimensional
    })
  },

  // 设置坐标
  setMouseCoordinate() {
    let { grid } = this.data
    let y = this.randomNumber(2, grid.length-3)
    let x = this.randomNumber(2, grid[0].length-3)
    let mouse = {x, y}
    if (grid[y][x]) {
      this.setMouseCoordinate()
      return
    }
    this.setData({mouse})
  },

  randomNumber(min, max) {
   return Math.floor(Math.random() * (max - min) + min)
  },

  playBgAudio(){
    this.data.audioContext.play()
  },

  playMovingAudio() {
    this.data.movingAudio.play();
  },

  handleClick(e) {
    let {grid, mouse} = this.data
    const {x: tap_x, y: tap_y} = e.currentTarget.dataset
    if (grid[tap_y][tap_x] || (tap_x === mouse.x && tap_y === mouse.y)) return;
    this.playMovingAudio()
    this.setData({
      [`grid[${tap_y}][${tap_x}]`]: 1,
      step: this.data.step + 1
    })
    this.getNewPath()
    const {feasible_path} = this.data
    if (!feasible_path.length) {
      let _this = this
      let { pass, step, timeTaken } = _this.data
      let role = (100 - step - timeTaken + (pass / 10)) / 15
      let score = parseFloat(role.toFixed(2))
      app.globalData.totalScore += score
      let totalScore = app.globalData.totalScore || 0
      clearInterval(_this.data.interval)
      this.setData({
        score,
        totalScore,
        showModal: 1
      })
      return
    }
    this.mouseRun()
  },

  mouseRun() {
    let { feasible_path, grid } = this.data
    let new_path = feasible_path[Math.floor(Math.random()*feasible_path.length)]
    let {x , y} = new_path
    if (grid.length - 1 === y || grid[0].length -1 === x || x === 0 || y === 0) {
      this.setData({
        showModal: -1
      })
      return
    }
    this.setData({
      mouse: new_path
    })
  },

  // 获取可用路径
  getAvailablePoints(x, y) {
    let mouse_x = x
    let mouse_y = y
    let { grid } = this.data
    let available_cell = [
      //left
      mouse_x > 0 && {x: mouse_x - 1, y: mouse_y},
      //right
      mouse_x < grid[0].length - 1 && {x: mouse_x + 1, y: mouse_y},
      // bottom-left
      mouse_y < grid.length - 1 && {x: mouse_x, y: mouse_y + 1},
      // bottom-right
      mouse_y > 0 && (mouse_y % 2 === 0 ? {x: mouse_x - 1, y: mouse_y + 1} : {x: mouse_x + 1, y: mouse_y + 1}),
      // top-left
      mouse_y > 0 && {x: mouse_x, y: mouse_y - 1},
      // top-right
      mouse_y > 0 && (mouse_y % 2 === 0 ? {x: mouse_x - 1, y: mouse_y - 1}: {x: mouse_x + 1, y: mouse_y -1})
    ];
    let feasible_path = []
    for (const cell of available_cell) {
      let {x, y} = cell
      if (!grid[y][x]){
        feasible_path.push(cell)
      }
    }
    return feasible_path;
  },
  getNewPath() {
    this.setData({feasible_path: this.getAvailablePoints(this.data.mouse.x, this.data.mouse.y)})
  },

  // 下一关
  nextPass(e) {
    let pass = e.currentTarget.dataset.pass || 1
    wx.redirectTo({
      url: `./index?pass=${pass}`
    })
  },

  findExitPoint() {
    let points = [];
    for (let i = 0; i < this.data.grid[0].length; i++) {
      if (this.data.grid[0][i] === 0) {
        points.push({
          x: i, y: 0
        })
      }
      if (this.data.grid[this.data.grid.length - 1][[i]] === 0) {
        points.push({
          x: i, y: this.data.grid.length - 1
        })
      }
    }
    return points;
  },
//   findAvailablePaths() {
//     let availablePoints = this.getAvailablePoints(this.data.mouse.x, this.data.mouse.y);
//
//     let circlePoints = [];
//     for (const availablePoint of availablePoints) {
//       let p = this.getAvailablePoints(availablePoint.x, availablePoint.y);
//       console.group("--------------")
//       console.log(availablePoint)
//       console.log(p);
//       console.groupEnd();
//       circlePoints.push(...p);
//     }
//
//     // 去重
//   }
})
