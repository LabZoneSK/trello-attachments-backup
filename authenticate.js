const fs = require('fs');
const readline = require('readline');
const {
    google
} = require('googleapis');
const mime = require('mime');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';

let oAuth2Client = null;

const signup = () => {
    //console.log('Signup application to Google API.')

    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
            // Authorize a client with credentials, then call the Google Drive API.
            authorize(JSON.parse(content)).then((auth) => resolve(auth));
        });
    });

}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
    //console.log('Authorize to Google API.')

    return new Promise((resolve, reject) => {
        const {
            client_secret,
            client_id,
            redirect_uris
        } = credentials.installed;
        oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client)
        });
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

const getDrive = async () => {
    const auth = await signup();
    return drive = google.drive({
        version: 'v3',
        auth
    });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
const listFiles = async () => {
    const drive = await getDrive();
    await drive.files.list({
        pageSize: 100,
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }
    })
}

const searchFiles = async (filename) => {
    const drive = await getDrive();
    return new Promise((resolve, reject) => {
        drive.files.list({
            fields: 'nextPageToken, files(id, name)',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if (files.length) {

                const match = files.filter((file) => {
                    if (file.name === filename) {
                        return file
                    }
                });

                resolve(match)
            } else {
                console.log('No files found.');
                resolve(new Array())
            }
        })
    });
}

const simpleUpload = async (filename, path, parent) => {
    const drive = await getDrive();

    var fileMetadata = {
        'name': filename,
    };
    console.log(parent);
    const parentFolder = await searchFiles(parent);
    if (parentFolder.length > 0) {
        fileMetadata.parents = [parentFolder.pop().id]
    }

    const fileMimeType = mime.getType(path)
    console.log(fileMimeType)

    const media = {
        mimeType: fileMimeType,
        body: fs.createReadStream(path)
    };

    var fileMetadata = {
        'name': 'test.jpg',
    };

    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('File Id: ', file.id);
        }
    });
}

const upload = async (fileName, parent = 'Trello') => {
    const drive = await getDrive();
    const fileSize = fs.statSync(fileName).size;
    const fileMimeType = mime.getType(fileName)

    const res = await drive.files.create({
        /*resource: {
            name: `test.jpg`,
            mimeType: fileMimeType,
          },*/
        media: {
            body: fs.createReadStream(fileName),
            mimeType: 'application/octet-stream',
        },
    }, {
        // Use the `onUploadProgress` event from Axios to track the
        // number of bytes uploaded to this point.
        onUploadProgress: evt => {
            const progress = (evt.bytesRead / fileSize) * 100;
            readline.clearLine();
            readline.cursorTo(0);
            process.stdout.write(`${Math.round(progress)}% complete`);
        },
    });
    console.log(res.data);
    return res.data;
}

const createdFolderMemory = [];
const createFolder = async (folder, parent = '') => {
    if (createdFolderMemory.indexOf(folder) > -1) {
        console.log(`${folder} already created. Skipping.`)
        return
    }

    const drive = await getDrive();

    const searchFolder = await searchFiles(folder);
    if (searchFolder.length > 0) {
        return;
    }

    var fileMetadata = {
        'name': folder,
        'mimeType': 'application/vnd.google-apps.folder'
    };

    const parentFolder = await searchFiles(parent);
    if (parentFolder.length > 0) {
        fileMetadata.parents = [parentFolder.pop().id]
    }

    createdFolderMemory.push(folder);
    drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    }, function (err, file) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log(`${folder} has been created.`)
        }
    });
}

module.exports = {
    createFolder,
    listFiles,
    searchFiles,
    simpleUpload,
    upload
}