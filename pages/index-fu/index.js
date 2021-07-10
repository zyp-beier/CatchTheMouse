// index.js

Page({
  data: {
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    mouse: {
      x: 5,
      y: 4
    },
    available_cell: []
  },
  onLoad() {

  },
  onShow() {
    setTimeout(this.mouseRun, 1000)
  },
  handleClick(e) {
    const {x: tap_x, y: tap_y} = e.currentTarget.dataset
    if (this.data.grid[tap_x][tap_y]) return;
    this.setData({
      [`grid[${tap_x}][${tap_y}]`]: 1
    })
    this.mouseRun()
  },
  mouseRun() {
    let tap_y = this.data.mouse.y
    let available_cell = [
      //left
      this.data.mouse.x > 0 && {x: this.data.mouse.x - 1, y: this.data.mouse.y},
      //right
      this.data.mouse.x < this.data.grid[0].length - 1 && {x: this.data.mouse.x + 1, y: this.data.mouse.y},
      // bottom-left
      this.data.mouse.y < this.data.grid.length - 1 && {x: this.data.mouse.x, y: this.data.mouse.y + 1},
      // bottom-right
      tap_y % 2 === 0
        ? this.data.mouse.y < this.data.grid.length - 1 && {x: this.data.mouse.x - 1, y: this.data.mouse.y + 1}
        : this.data.mouse.y < this.data.grid.length - 1 && {x: this.data.mouse.x + 1, y: this.data.mouse.y + 1},
      // top-left
      this.data.mouse.y > 0 && {x: this.data.mouse.x, y: this.data.mouse.y -1},
      // top-right
      this.data.mouse.y > 0 && (tap_y % 2 === 0 ? {x: this.data.mouse.x -1, y: this.data.mouse.y - 1}: {x: this.data.mouse.x + 1, y: this.data.mouse.y -1})
    ];
    this.setData({available_cell})

    for (const cell of available_cell) {
      console.log([`grid[${cell.x}][${cell.y}]`])
      this.setData({
        [`grid[${cell.y}][${cell.x}]`]: 0.5
      })
    }
  }
})
