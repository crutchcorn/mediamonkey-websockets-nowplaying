var fs = app.filesystem;
var sett = window.settings.get("System");

// Add B64 lib
var b64script = document.createElement('script');
b64script.setAttribute('src','https://cdn.jsdelivr.net/npm/js-base64@3.7.2/base64.min.js');
document.head.appendChild(b64script);

// Add socketio lib
var b64script = document.createElement('script');
b64script.setAttribute('src','https://cdn.socket.io/4.3.2/socket.io.min.js');
document.head.appendChild(b64script);

function setNowPlaying(song) {
    if (!window.musicsocket) {
        try {
            window.musicsocket = io("http://localhost:3080");
        } catch (e) {
            // console.log(e);
        }
    };
    window.musicsocket.emit("SET_NOW_PLAYING", song || "");
}

async function getNowPlaying() {
    var currentTrack = player.getCurrentTrack();
    if (!currentTrack) {
        setNowPlaying(null);
        return null;
    }
    const coverB64 = await getCover() || "";

    return {
        song: currentTrack.title,
        artist: currentTrack.artist,
        albumArt: coverB64
    }
}

async function _onPlaybackState(state) {
    try {
        switch (state) {
            case "trackChanged":
            case "unpause":
            case "play":
                setNowPlaying(await getNowPlaying());
                break;
            case "stop":
            case "pause":
                setNowPlaying(undefined);
                break;
            default:
                break;
        }
    } catch (e) {
        // console.error(e);
    }
}

app.listen(app.player, "playbackState", _onPlaybackState);

var promisify = (fn) => {
    return (...args) => {
        return new Promise(resolve => {
            fn(...args, function (...data) { resolve(...data) })
        })
    }
}

function getCover() {
    var coverList = player.getCurrentTrack().loadCoverListAsync();

    return new Promise((resolve) => {
        // Wait for the coverList to asynchronously load
        coverList.whenLoaded().then(function () {
            // Enter a read lock
            coverList.locked(async function () {
                try {
                    // Now you can get the cover object
                    const cover = coverList.getValue(0);
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
