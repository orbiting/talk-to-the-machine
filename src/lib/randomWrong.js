import { shuffle } from 'd3'

const randomWrong = right => {
  let wrong
  do {
    wrong = shuffle(right.slice())
  } while (JSON.stringify(wrong) === JSON.stringify(right))
  return wrong
}

export default randomWrong
