// 洗牌算法
function copyArray(source, array) {
    let index = -1//循环索引
    const length = source.length//source数组长度

    array || (array = new Array(length))//如果没有array参数，就新建一个和source长度一样的数组作为array
    while (++index < length) {//循环source，复制source的元素到array里
        array[index] = source[index]
    }
    return array//返回array
}
function shuffle(array) {
    const length = array == null ? 0 : array.length//数组长度
    if (!length) {//如果数组长度为0，返回空数组
        return []
    }
    let index = -1//循环索引
    const lastIndex = length - 1//数组的最后一个元素的索引
    const result = copyArray(array)//复制一份原始数组作为结果数组
    while (++index < length) {//循环数组长度次
        const rand = index + Math.floor(Math.random() * (lastIndex - index + 1))
        //生成随机索引，每一次的范围都比上一次少一个
        const value = result[rand]//结果数组中对应随机索引的值先存下来，然后和result[index]互换位置
        result[rand] = result[index]
        result[index] = value
    }
    return result//返回打乱顺序后的新数组
}

export default shuffle
