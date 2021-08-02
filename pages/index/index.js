// index.js
import shuffle from "../../utils/shuffle";
let app = getApp()

class Point {
  constructor(x, y, p = null) {
    this.x = x;
    this.y = y;
    this.p = p
  }

  setParent(p) {
    this.p = p
  }

  calcHGF(start, end) {
    let g = Math.abs(this.x - start.x) + Math.abs(this.y - start.y);
    let h = Math.abs(this.x - end.x) + Math.abs(this.y - end.y);
    let f = g + h;
    this.g = g;
    this.h = h;
    this.f = f;
  }
}

Page({
  data: {
    grid: [],
    mouse: {
      x: 2,
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

    //设置点击音乐
    const movingAudio =  wx.createInnerAudioContext()

    movingAudio.src = "/assets/audio/move.mp3"
    this.setData({
      movingAudio, pass
    })
  },
  onShow() {
    this.setData({
      progress_start: true
    })
    // 设置时间
    let { timeLimit } = this.data
    let timeTaken = 0
    let interval = setInterval(() => {
      timeTaken += 1
      if (timeTaken > timeLimit) {
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
  },
  // 生成地图
  generateArray(pass = 1) {
    let passNumber
    let percentageOccupancy   // 占用率
    switch (true) {
      case pass < 3:
        percentageOccupancy = 35
        passNumber = 7
        break;
      case 3 <= pass && pass < 6:
        percentageOccupancy = 30
        passNumber = 8
        break;
      case 9 > pass && pass >= 6:
        percentageOccupancy = 25
        passNumber = 9
        break;
      case 12 > pass && pass >= 9:
        percentageOccupancy = 20
        passNumber = 10
        break;
      case 15 > pass && pass >= 12:
        percentageOccupancy = 15
        passNumber = 11
        break;
      default:
        percentageOccupancy = 15
        passNumber = 11
    }
    // 生成固定占位率的乱序二维数组
    let oneDimensional = new Array(passNumber)
    let twoDimensional = new Array(passNumber)
    let cn = Math.round(passNumber * (percentageOccupancy / 100))
    for(let i = 0; i < oneDimensional.length; i++) {
      for(let j = 0; j < twoDimensional.length; j++) {
        j < cn ? twoDimensional[j] = 1 : twoDimensional[j] = 0
      }
      oneDimensional[i] = shuffle(twoDimensional)
    }
    this.setData({
      grid: oneDimensional
    })
  },

  // 设置坐标
  setMouseCoordinate() {
    const { grid, pass } = this.data
    const y = this.randomNumber(3, grid.length - 4)
    const x = this.randomNumber(3, grid[0].length - 4)
    const mouse = {x, y}
    const path = this.getAvailablePoints(x,y).length
    if (grid[y][x] || path < 2) {
      this.generateArray(pass)
      this.setMouseCoordinate()
      return
    }
    this.setData({mouse})
  },

  randomNumber(min, max) {
   return Math.floor(Math.random() * (max - min) + min)
  },

  handleClick(e) {
    let {grid, mouse, step} = this.data
    const {x: tap_x, y: tap_y} = e.currentTarget.dataset
    if (grid[tap_y][tap_x] || (tap_x === mouse.x && tap_y === mouse.y)) return;
    this.data.movingAudio.stop()
    this.data.movingAudio.play()

    this.setData({
      [`grid[${tap_y}][${tap_x}]`]: 1,
      step: step + 1
    })
    this.mouseRun()
  },

  mouseRun() {
    let {mouse, grid, interval} = this.data
    let paths = this.findAvailablePaths();

    // 选择路径最短的出口
    let min_point_path;
    for (const path of paths) {
      if (!min_point_path) {
        min_point_path = path;
        continue;
      }
      if (path.length < min_point_path.length) {
        min_point_path = path;
      }
    }

    if (min_point_path) {
      this.buildPath(min_point_path);
      // 选取下一个点
      let nextPoint = min_point_path.find(item => item.p && item.p.x === mouse.x && item.p.y === mouse.y);
      if (nextPoint) {
        // ok
        this.setData({
          mouse: {x: nextPoint.x, y: nextPoint.y}
        })
        if (grid.length - 1 === nextPoint.y || grid[0].length -1 === nextPoint.x || nextPoint.x === 0 || nextPoint.y === 0) {
          clearInterval(interval)
          const totalScore = this.getTotalScore()
          this.setData({
            showModal: -1,
            totalScore
          })
        }
        return;
      }
    }

    console.warn("无可用路径，随机跑")
    this.getNewPath()
    let { feasible_path } = this.data;
    if (!feasible_path.length) {
      let { pass, step, timeTaken } = this.data
      let role = (100 - step - timeTaken + (pass / 10)) / 15
      let score = parseFloat(role.toFixed(2))
      const totalScore = this.getTotalScore(score)
      clearInterval(interval)
      this.setData({
        score,
        totalScore,
        showModal: 1
      })
    } else {
      let random_point = feasible_path[Math.floor(Math.random() * feasible_path.length)]
      this.setData({
        mouse: random_point
      })
    }
  },

  // 获取可用路径
  getAvailablePoints(x, y) {
    let { grid } = this.data
    let available_cell = [];
    if (x > 0) available_cell.push({x: x - 1, y: y})
    if (x < grid[0].length - 1) available_cell.push({x: x + 1, y: y})
    if (y % 2 === 1) {
      // 偶数行
      // left top
      y > 0 && available_cell.push({x: x, y: y - 1});
      // right top
      y > 0 && x < grid[0].length - 1 && available_cell.push({x: x + 1, y: y - 1});
      // left bottom
      y < grid.length - 1 && available_cell.push({x: x, y: y + 1});
      // right bottom
      y < grid.length - 1 && x < grid[0].length - 1 && available_cell.push({x: x + 1, y: y + 1});
    } else {
      // left top
      x > 0 && y > 0 && available_cell.push({x: x - 1, y: y - 1})
      // right top
      y > 0 && available_cell.push({x: x, y: y - 1})
      // left bottom
      x > 0 && y < grid.length - 1 && available_cell.push({x: x - 1, y: y + 1})
      // right bottom
      y < grid.length - 1 && available_cell.push({x: x, y: y + 1})
    }
    let feasible_path = [];
    for (const cell of available_cell) {
      let {x, y} = cell
      if (!grid[y][x]){
        let p = new Point(cell.x, cell.y);
        feasible_path.push(p)
      }
    }
    return feasible_path;
  },
  getNewPath() {
    this.setData({feasible_path: this.getAvailablePoints(this.data.mouse.x, this.data.mouse.y)})
  },

  // 下一关
  nextPass(e) {
    let level = e.currentTarget.dataset.pass
    if (!e.currentTarget.dataset.pass) {
      app.globalData.totalScore = 0
      level = 1
    }
    wx.redirectTo({
      url: `./index?pass=${level}`
    })
  },

  findExitPoint() {
    let points = [];
    let {grid} = this.data
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if ((i === 0 || i === grid.length - 1 || j === 0 || j === grid[i].length - 1) && grid[i][j] === 0) {
          points.push({
            x: j, y: i
          })
        }
      }
    }
   return points
  },

  findAvailablePaths() {
    let ends = this.findExitPoint();   // 寻找出口
    let paths = [];
    for (const end of ends) {
      let path = this.a_star_path(new Point(this.data.mouse.x, this.data.mouse.y), end);
      if (path) paths.push(path)
    }
    return [...paths];
  },

  a_star_path(start, end) {
    const {grid} = this.data
    let close_list = [];

    // init close list
    for (let j = 0; j < grid.length; j++) {
      for (let k = 0; k < grid[j].length; k++) {
        if (grid[j][k] === 1) {
          if (close_list.findIndex(item => item.x === k && item.y === j) !== -1) continue;
          close_list.push(new Point(k, j))
        }
      }
    }

    let open_list = [];
    start.calcHGF(start, end);
    open_list.push(start);

    let i = 0

    while (open_list.length && i < 50) {
      let temp_start_point = this.getMinHFromOpenList(open_list);

      if (temp_start_point.x === end.x && temp_start_point.y === end.y) {
        return this.buildPath(temp_start_point, start);
      }

      this.removePointFromOpenList(temp_start_point, open_list);
      close_list.push(temp_start_point);
      let around_points = this.getAvailablePoints(temp_start_point.x, temp_start_point.y);
      for (const point of around_points) {
        if (close_list.findIndex(item => item.x === point.x && item.y === point.y) !== -1) continue;

        point.calcHGF(start, end);

        if (open_list.findIndex(item => item.x === point.x && item.y === point.y) === -1) { // 不在open list
          point.setParent(temp_start_point);
          open_list.push(point)
        } else {
          if (point.f < temp_start_point.f) {
            point.setParent(temp_start_point);
          }
        }
      }
      i++
    }
  },

  buildPath(end) {
    let path = [];
    while (end.p) {
      path.unshift(end);
      end = end.p;
    }
    return path;
  },

  getMinHFromOpenList(open_list) {
    let point;
    for (let i = 0; i < open_list.length; i++) {
      let cp = open_list[i];

      if (!point) {
        point = cp;
        continue;
      }

      if ( cp.f <= point.f) {
        point = cp;
      }
    }
    return point;
  },

  removePointFromOpenList(point, open_list) {
    const index = open_list.findIndex(item => item.x === point.x && item.y === point.y);
    if (index !== -1) {
      open_list.splice(index, 1);
    }
  },

  getTotalScore(score = 0) {
    app.globalData.totalScore += score
    let totalScore = app.globalData.totalScore
    totalScore >= 0 ? totalScore : 0
    return parseFloat(totalScore.toFixed(2)) || 0
  }
})
