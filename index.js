require('dotenv').config()
const path = require('path')

const trelloBackup = require('./trello/backup')
const googleDrive = require('./authenticate')

const fileHelper = require('./helpers/file')

const run = async () => {
    try {
        //Store attachments locally
        //const result = await trelloBackup.storeAttachmentsLocaly()

        //Upload attachments to storage
        //await googleDrive.createFolder('Trello')
        //const file = await googleDrive.searchFiles('Trello')
        //await googleDrive.simpleUpload('sample.txt', 'sample.txt')
        /*
        await googleDrive.createFolder('archive', 'Trello')

        var generator = fileHelper.walk('archive')
        setTimeout(function () {
            const file = generator.next().value;
            const pathParts = file.split(path.sep)

            googleDrive.createFolder(pathParts[1], 'archive')
                .then(() => {
                    googleDrive.createFolder(pathParts[2], pathParts[1])
                        .then(() => {
                            googleDrive.simpleUpload(pathParts[3], file, pathParts[2]).then(() => console.log('File uploaded'))
                        })
                })
        }, 5000)*/

        return new Promise((resolve, reject) => {
            const result = googleDrive.upload('archive/december/10/CTCNSCMSW08B_1.jpg')
            result.then(() => {
                resolve();
            })
        });
        

    } catch (err) {
        console.log(err)
    }
}

run()
    .then(() => console.log('Application finished successfuly.'))
    .catch(err => console.error('There is error with app. ', err))