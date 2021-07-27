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
    this.p = p;
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
    grid: [
      [1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 0],
      [1, 1, 0, 0, 0, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1],
    ],
    mouse: {
      x: 2,
      y: 3
    },
    available_cell: [],
    feasible_path: [],
    interval: '', // 定时器
    timeLimit: 6000,  // 限时
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
    // this.generateArray(pass)

    // 设置坐标
    // this.setMouseCoordinate()

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
    let path = this.getAvailablePoints(x,y).length
    if (grid[y][x] || path < 2) {
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
      let { pass, step, timeTaken } = this.data
      let role = (100 - step - timeTaken + (pass / 10)) / 15
      let score = parseFloat(role.toFixed(2))
      app.globalData.totalScore += score
      let totalScore = parseFloat(app.globalData.totalScore.toFixed(2)) || 0
      clearInterval(this.data.interval)
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
    let paths = this.findAvailablePaths();
    console.log('paths', paths)

    // 有出口, 选择路径最短的出口
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
      console.log('min point path', min_point_path)
      // 选取下一个点
      let nextPoint = min_point_path.find(item => item.p && item.p.x === this.data.mouse.x && item.p.y === this.data.mouse.y);
      console.log('next point', nextPoint);
      if (nextPoint) {
        // ok
        this.setData({
          mouse: {x: nextPoint.x, y: nextPoint.y}
        })
        return;
      }
    }
    return;


    let { feasible_path, grid } = this.data;
    let new_path = feasible_path[Math.floor(Math.random()*feasible_path.length)]
    let {x , y} = new_path
    this.setData({
      mouse: new_path
    })
    if (grid.length - 1 === y || grid[0].length -1 === x || x === 0 || y === 0) {
      clearInterval(this.data.interval)
      this.setData({
        showModal: -1
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
    console.log(feasible_path);
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
      if (path) {
        paths.push(path);
      }
    }
    return [...paths];
  },

  a_star_path(start, end) {
    start = new Point(this.data.mouse.x, this.data.mouse.y)
    let close_list = [];
    let open_list = [];
    start.calcHGF(start, end);
    open_list.push(start);

    let i = 0

    // setInterval(() => {
      while (open_list.length && i < 50) {
        let temp_start_point = this.getMinHFromOpenList(open_list);

        // this.setData({
        //   mouse: {...temp_start_point}
        // })

        if (temp_start_point.x === end.x && temp_start_point.y === end.y) {
          let path = [];
          open_list.map(item => {
            if (item.p && path.indexOf(item.p) === -1) {
              path.push(item.p);
            }
          })
          path.push(temp_start_point)
          return path;
        }

        this.removePointFromOpenList(temp_start_point, open_list);
        close_list.push(temp_start_point);
        let around_points = this.getAvailablePoints(temp_start_point.x, temp_start_point.y);
        for (const point of around_points) {
          if (close_list.findIndex(item => item.x === point.x && item.y === point.y) !== -1) continue;

          point.calcHGF(new Point(this.data.mouse.x, this.data.mouse.y), end);

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
    // }, 1000)

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
    let index = open_list.findIndex(item => item.x === point.x && item.y === point.y);
    if (index !== -1) {
      open_list.splice(index, 1);
    }
  }
})
