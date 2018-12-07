const {
  google
} = require('googleapis');
const http = require('http');
const url = require('url');
const opn = require('opn');
const destroyer = require('server-destroy');
const fs = require('fs');
const readline = require('readline');
const mime = require('mime')
const path = require('path');

const keyfile = path.join(__dirname, 'credentials.json');
const keys = JSON.parse(fs.readFileSync(keyfile));



const scopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Open an http server to accept the oauth callback. In this
// simple example, the only request to our webserver is to
// /oauth2callback?code=<code>
function authenticate(credentials) {
  //console.log('Authorize to Google API.')

  return new Promise((resolve, reject) => {
    const oAuth2Client = new google.auth.OAuth2(
      keys.installed.client_id,
      keys.installed.client_secret,
      keys.installed.redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile('token.json', (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client)
    });
  });
}

async function upload(auth) {
  console.log("Uploading image")
  const fileName = 'test-2.jpeg'
  const fileSize = fs.statSync(fileName).size;
  console.log(`file size: ${fileSize}`)
  const fileMimeType = mime.getType(fileName)
  const service = google.drive({
    version: 'v3',
    auth
  });
  const response = await service.files.create({
    resource: {
      name: `test.jpg`,
      mimeType: fileMimeType,
    },
    media: {
      body: fs.createReadStream(fileName),
      mimeType: 'application/octet-stream',
    }
  }, {
    // Use the `onUploadProgress` event from Axios to track the
    // number of bytes uploaded to this point.
    onUploadProgress: evt => {
      const progress = (evt.bytesRead / fileSize) * 100;
      readline.clearLine();
      readline.cursorTo(0);
      process.stdout.write(`${Math.round(progress)}% complete`);
    },
  })
  // log the result
  console.log(response.data);
  console.log(`\nstatus: ${response.status}, text status: ${response.statusText}`);
}

async function main() {
  const client = await authenticate(scopes);
  await upload(client).catch(console.error);
}
main().catch(console.error);