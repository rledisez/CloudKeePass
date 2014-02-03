// sc_resource('kdb-worker.js')
// sc_require('library/kdb')

if( typeof(DOMParser) === 'undefined' ) {
    //@if(debug)
    // It means we're in dev mode with Sproutcore server
    importScripts(
        sc_static('library/vendors/jdataview.js'),
        sc_static('library/vendors/jparser.js'),

        sc_static('library/vendors/cryptojs/core.js'),
        sc_static('library/vendors/cryptojs/cipher-core.js'),
        sc_static('library/vendors/cryptojs/enc-base64.js'),
        sc_static('library/vendors/cryptojs/lib-typedarrays.js'),
        sc_static('library/vendors/cryptojs/mode-ecb.js'),
        sc_static('library/vendors/cryptojs/pad-nopadding.js'),
        sc_static('library/vendors/cryptojs/aes.js'),
        sc_static('library/vendors/cryptojs/sha256.js'),

        sc_static('library/vendors/salsa20.js'),

        sc_static('library/vendors/gunzip-min.js'),

        sc_static('library/kdb.js')
    );
    //@endif

    // Simulate simple console logging (no string format)
    console = {};
    console.debug = function(str) { console._post('debug', str); };
    console.log   = function(str) { console._post('log',   str); };
    console.warn  = function(str) { console._post('warn',  str); };
    console.error = function(str) { console._post('error', str); };
    console._post = function(level, str) {
        postMessage({
            type: 'logging',
            level: level,
            data: str,
        });
    };

    // main()
    onmessage = function(event) {
        parameters = event.data;
        if( parameters.action == 'decrypt' ) {
            try {
                var kdb = new KDB(parameters.binary, parameters.passphrase, parameters.keyFile);
                postMessage({
                    type: 'result',
                    xmlContent: kdb.xmlDocument(),
                });
            } catch(e) {
                postMessage({
                    type: 'error',
                    message: e.message,
                });
            }
        } else {
            postMessage({
                type: 'error',
                message: 'Unexpected action',
            });
        }
    };

}
