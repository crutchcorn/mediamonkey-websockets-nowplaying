var fs = app.filesystem;
var sett = window.settings.get("System");
var currentTrack = player.getCurrentTrack();

var b64script = document.createElement('script');

b64script.setAttribute('src','https://cdn.jsdelivr.net/npm/js-base64@3.7.2/base64.min.js');

document.head.appendChild(b64script);

function setNowPlaying(song) {}

function _onPlaybackState(state) {
    switch (state) {
        case "trackChanged":
        case "unpause":
        case "play":
            setNowPlaying(getNowPlaying());
            break;
        case "stop":
        case "pause":
            setNowPlaying(undefined);
            break;
        default:
            break;
    }
}

app.listen(app.player, "playbackState", _onPlaybackState);

const sett = window.settings.get('System');

var promisify = (fn) => {
    return (...args) => {
        return new Promise(resolve => {
            fn(...args, function (...data) { resolve(...data) })
        })
    }
}

promisify((one, cb) => cb(one))(1).then((one) => console.log(one))

function getCover(currentTrack) {
    var coverList = currentTrack.loadCoverListAsync();

    return new Promise((resolve) => {
        // Wait for the coverList to asynchronously load
        coverList.whenLoaded().then(function () {
            // Enter a read lock
            coverList.locked(async function () {
                try {
                    // Now you can get the cover object
                    const cover = coverList.getValue(0);
                    console.log({coverList})
                    // Get the thumbnail asynchronously
                    const getThumbPromise = promisify(cover.getThumbAsync.bind(cover));
                    let path = await getThumbPromise(100, 100);

                    path = path
                        .replace("file:///temp", sett.System.TempDir)
                        .replace(/\\/g, "/")
                        .replace(/\/\//g, "/");

                    // TODO: Add in https://www.npmjs.com/package/mime-db?
                    // TODO: Add in https://github.com/dankogai/js-base64#readme ? What is this?
                    //    I think MM will always generate a JPG thumb
                    const contents = await fs.getFileContentAsync(path)
                    const arrayBuffer = contents.getArrayBuffer()
                    const b64Str = "data:image/jpg;base64," + Base64.fromUint8Array(new Uint8Array(arrayBuffer));

                    resolve(b64Str)
                } catch (e) {
                    resolve(null)
                }
            });
        });
    });
}

function getNowPlaying() {}
