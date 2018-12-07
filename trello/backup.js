const axios = require('axios')
const fs = require('fs')
const path = require('path')
const https = require('https')

const Trello = require('node-trello')

const t = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN)

const dateHelper = require('../helpers/date')

const dirname = 'archive' + path.sep + dateHelper.getCurrentMonth()
if (!fs.existsSync(dirname)) {
  fs.mkdirSync(dirname)
}

const getCardsArchiveFolder = card => {
  const cardArchiveFolder =
    'archive' +
    path.sep +
    dateHelper.getCurrentMonth() +
    path.sep +
    card.idShort
  if (!fs.existsSync(cardArchiveFolder)) {
    fs.mkdirSync(cardArchiveFolder)
  }
  return cardArchiveFolder
}
/** Boards */
const getBoards = () => {
  return new Promise((resolve, reject) => {
    t.get('/1/members/me/boards', function (err, data) {
      if (err) reject(err)
      if (data) {
        resolve(data)
      }
    })
  })
}

const getBoard = async name => {
  const boards = await getBoards()
  return boards.filter(board => {
    return board.name === name
  })
}

/** Lists */
const getLists = board => {
  return new Promise((resolve, reject) => {
    t.get(`/1/boards/${board.pop().id}/lists`, function (err, data) {
      if (err) reject(err)
      if (data) {
        resolve(data)
      }
    })
  })
}

const getListByName = async (board, name) => {
  const lists = await getLists(board)
  return lists.filter(list => {
    return list.name === name
  })
}

/** Cards */
const getCardsFromList = list => {
  return new Promise((resolve, reject) => {
    t.get(`/1/lists/${list.pop().id}/cards`, function (err, data) {
      if (err) reject(err)

      resolve(data)
    })
  })
}

/** Attachments */
const getCardAttachments = async card => {
  return new Promise((resolve, reject) => {
    t.get(`/1/cards/${card.id}/attachments`, function (err, data) {
      if (err) reject(err)

      resolve(data)
    })
  })
}

const getCardAttachment = async attachment => {
  return new Promise((resolve, reject) => {
    t.get(`/1/cards/${card.id}/attachments/${attachment.id}`, function (
      err,
      data
    ) {
      if (err) reject(err)
      if (data && typeof data.url === 'string') {
        resolve(data)
      }
    })
  })
}

const downloadAttachment = async (card, url, filename) => {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  })

  // pipe the result stream into a file on disc
  response.data.pipe(
    fs.createWriteStream(getCardsArchiveFolder(card) + path.sep + `${filename}`)
  )

  // return a promise and resolve when download finishes
  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      resolve()
    })

    response.data.on('error', () => {
      reject()
    })
  })
}

const storeAttachmentsLocaly = () => {
  return new Promise(async (resolve, reject) => {
    const board = await getBoard('ASBIS SK')
    const finishedTasksList = await getListByName(board, 'Hotové')
    const cards = await getCardsFromList(finishedTasksList)

    let count = 0
    const storeAttachmentPromises = cards.map(card => {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          const attachments = await getCardAttachments(card)
          attachments.map(async attachment => {
            await downloadAttachment(card, attachment.url, attachment.name)
            resolve(true)
          })
        }, count++ * 1000)
      });
    })

    Promise.all(storeAttachmentPromises)
      .then(() => resolve(true))
      .catch((error) => reject(error))
  });
}

module.exports = {
  storeAttachmentsLocaly
}