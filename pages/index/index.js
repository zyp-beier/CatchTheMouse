// index.js

Page({
  data: {
    grid: [
      [1, 1, 1, 0, 1, 1, 1],
      [1, 0, 1, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 1],
    ],
    mouse: {
      x: 3,
      y: 3
    },
    available_cell: [],
    feasible_path: []
  },
  onLoad() {
    //设置坐标
    // this.setMouseCoordinate()

    this.generateArray()
    console.log('刷新')

    const audioContext = wx.createInnerAudioContext();
    const movingAudio =  wx.createInnerAudioContext()
    audioContext.src = "/assets/audio/bg.mp3"
    audioContext.loop = true

    movingAudio.src = "/assets/audio/move.mp3"
    this.setData({
      audioContext, movingAudio
    })
  },
  onShow() {
    this.getNewPath()

    this.findExitPoint();
    // this.playBgAudio()

    this.findAvailablePaths();

  },
  onHide() {
    this.audioContext.stop()
  },
  // 生成数组
  generateArray(pass = 12) {
    let passNumber
    switch (true) {
      case pass < 3:
        passNumber = 7
        break;
      case 3 <= pass && pass < 6:
        passNumber = 8
        break;
      case 9 > pass && pass >= 6:
        passNumber = 9
        break;
      case 12 > pass && pass >= 9:
        passNumber = 10
        break;
      case 15 > pass && pass >= 12:
        passNumber = 11
        break;
      default:
        passNumber = 12
    }
    let oneDimensional = new Array(passNumber)
    console.log(oneDimensional)
  },
  setMouseCoordinate() {
    let mouse = this.randomCoordinates()
    let { x, y } = mouse
    let { grid } = this.data
    if (grid[y][x]) {
      this.setMouseCoordinate()
      return
    }
    this.setData({mouse})
  },
  randomCoordinates() {
    let {grid} = this.data
    let x = Math.floor(Math.random() * (grid[0].length - 3) + 2)
    let y = Math.floor(Math.random() * (grid.length - 3) + 2)
    return {x, y}
  },
  playBgAudio(){
    this.data.audioContext.play()
  },
  playMovingAudio() {
    this.data.movingAudio.play();
  },
  handleClick(e) {
    const {x: tap_x, y: tap_y} = e.currentTarget.dataset
    if (this.data.grid[tap_y][tap_x]) return;
    this.playMovingAudio()
    this.setData({
      [`grid[${tap_y}][${tap_x}]`]: 1
    })
    this.getNewPath()
    const {feasible_path} = this.data
    console.log(feasible_path)
    if (!feasible_path.length) {
      let _this = this
      wx.showModal({
        title: 'you win',
        content: '恭喜您获得100分',
        showCancel: false,
        confirmText: '下一关',
        success() {
        }
      })
      console.log('you win')
      return
    }
    this.mouseRun()
  },
  mouseRun() {
    let { feasible_path, grid } = this.data
    let new_path = feasible_path[Math.floor(Math.random()*feasible_path.length)]
    let {x , y} = new_path
    if (grid.length - 1 === y || grid[0].length -1 === x || x === 0 || y === 0) {
      wx.showModal({
        content: '分数 6.01',
        showCancel: false,
        confirmText: '再来一次',
        success: () => {
          console.log('再来一次')

        }
      })
      return
    }
    this.setData({
      mouse: new_path
    })
  },
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
  findAvailablePaths() {
    let availablePoints = this.getAvailablePoints(this.data.mouse.x, this.data.mouse.y);

    let circlePoints = [];
    for (const availablePoint of availablePoints) {
      let p = this.getAvailablePoints(availablePoint.x, availablePoint.y);
      console.group("--------------")
      console.log(availablePoint)
      console.log(p);
      console.groupEnd();
      circlePoints.push(...p);
    }

    // 去重
  }
})
