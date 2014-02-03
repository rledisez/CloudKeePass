// sc_resource('kdb-worker.js')
// sc_require('library/vendors/jdataview')
// sc_require('library/vendors/jparser')
// sc_require('library/vendors/cryptojs/core')
// sc_require('library/vendors/cryptojs/cipher-core')
// sc_require('library/vendors/cryptojs/enc-base64')
// sc_require('library/vendors/cryptojs/lib-typedarrays')
// sc_require('library/vendors/cryptojs/mode-ecb')
// sc_require('library/vendors/cryptojs/pad-nopadding')
// sc_require('library/vendors/cryptojs/aes')
// sc_require('library/vendors/cryptojs/sha256')
// sc_require('library/vendors/salsa20')
// sc_require('library/vendors/gunzip-min')

function KDB(binary, passphrase, keyFile) {
	if (!(this instanceof arguments.callee)) {
		throw new Error('Constructor may not be called as a function');
	}

    this._binary = binary;
    this._passphrase = passphrase;
    this._keyFile = keyFile;

    var headerParser = new jParser(binary, this._jparser_headerStructure);

    var sig1 = headerParser.parse('uint32');
    var sig2 = headerParser.parse('uint32');

    if( sig1 != 0x9AA2D903 ) {
        throw new Error('The file is not a KeePass database');
    } else if( sig2 == 0xB54BFB65 ) {
        throw new Error('KeePass 1.x files are not supported');
    } else if( sig2 == 0xB54BFB66 ) {
        throw new Error('KeePass 2.x pre-release files are not supported');
    } else if( sig2 != 0xB54BFB67 ) {
        throw new Error('Unsupported KeePass version');
    }

    var versionCritical = headerParser.parse('uint16');
    var versionInformational = headerParser.parse('uint16');

    this._headerFields = headerParser.parse('fields');
    this._encryptedDataOffset = headerParser.tell();
}

/**********************************
 * Constants
 */

KDB.prototype.FieldsName = [
    'EndOfHeaders',
    'Comment',
    'CipherID',
    'CompressionFlags',
    'MasterSeed',
    'TransformSeed',
    'TransformRounds',
    'EncryptionIV',
    'ProtectedStreamKey',
    'StreamStartBytes',
    'InnerRandomStreamID',
];

KDB.prototype.CompressionAlgorithm = {
    None: 0,
    GZip: 1,
};

/**********************************
 * Parsers structures
 */

KDB.prototype._jparser_headerStructure = {
    fields: function() {
        var fields = {};
        var field = this.parse('field');
        while( field.id != 0 ) {
            fields[ KDB.prototype.FieldsName[field.id] ] = field;
            field = this.parse('field');
        }
        return fields;
    },
    field: function() {
        var field = {};
        field.id = this.parse('uint8');
        field.size = this.parse('uint16');
        switch(KDB.prototype.FieldsName[field.id]) {
            case 'CompressionFlags':
                field.data = this.parse('uint32');
                break;
            case 'TransformRounds':
                field.data = this.parse('uint64');
                break;
            default:
                field.data = this.parse(['word_array', field.size]);
                break;
        }
        return field;
    },
    word_array: function(bytesCount) {
        return CryptoJS.lib.WordArray.create( new Uint8Array(this.parse(['array', 'uint8', bytesCount])) );
    }
};

KDB.prototype._jparser_bodyStructure = {
    blocks: function() {
        var blocks = [];
        var blockId = 0;
        var block = this.parse('block', blockId);
        while( block.size > 0 ) {
            blocks.push(block);
            blockId++;
            block = this.parse('block', blockId);
        }
        return blocks;
    },
    block: function(expectedBlockId) {
        var block = {};
        block.id = this.parse('uint32');
        if( block.id != expectedBlockId ) {
            throw 'File is corrupted (Unexpected block id)';
        }

        block.hash = this.parse(['word_array', 32]); //sha256
        block.size = this.parse('uint32');
        if( block.size == 0 ) {
            block.data = null;

            // hash must be filled with 0
            for(var i=0; i<block.hash.length; i++) {
                if( block.hash[i] != 0x00 ) {
                    throw 'File is corrupted (Last hash block must be filled with 0x00)';
                }
            }
        } else {
            size = block.size;
            block.data = this.parse(['word_array', block.size]);

            // hash must match
            computedHash = CryptoJS.SHA256(block.data);
            if( !KDB.prototype._areEqualsArray(block.hash.words, computedHash.words) ) {
                throw 'File is corrupted (block hash does not match)';
            }
        }
        return block;
    },
    word_array: function(bytesCount) {
        return CryptoJS.lib.WordArray.create( new Uint8Array(this.parse(['array', 'uint8', bytesCount])) );
    }
};

/**********************************
 * Some helpers
 */

KDB.prototype._areEqualsArray = function(arr1, arr2) {
    if( !arr1 || !arr2 ) {
        return false;
    } else if( arr1 == arr2 ){
        return true;
    } else if( arr1.length != arr2.length ) {
        return false;
    }

    for(var i=0; i<arr1.length; i++) {
        if( arr1[i] != arr2[i] ) {
            return false;
        }
    }
    return true;
};

KDB.prototype.wordArrayToUint8Array = function(wordArray) {
    var uint8Array = new Uint8Array(wordArray.sigBytes);
    for(var i=0; i < wordArray.sigBytes; i++) {
        uint8Array[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return uint8Array;
};

KDB.prototype.arrayXOR = function(dataArray, keyArray) {
    var result = '';
    for(var i = 0; i < dataArray.length; ++i) {
        result += String.fromCharCode( keyArray[i] ^ dataArray[i] );
    }
    return result;
};

/**********************************
 * Decryption
 */

KDB.prototype.xmlDocument = function() {
    var xmlContent = this._xmlContent();
    if( typeof(DOMParser) === 'function' ) {
        var xmlDocument = (new DOMParser()).parseFromString(xmlContent, "text/xml" );
        return this._unprotectDocument(xmlDocument);
    } else {
        return this._unprotectXmlContent(xmlContent);
    }
};

KDB.prototype._xmlContent = function() {
    var blocksData = CryptoJS.lib.WordArray.create();
    this._blocks().forEach(function(block) {
        blocksData.concat(block.data);
    });

    // Handle compression
    switch( this._headerFields.CompressionFlags.data ) {
        case KDB.prototype.CompressionAlgorithm.None:
            return blocksData.toString(CryptoJS.enc.Latin1);
            break;
        case KDB.prototype.CompressionAlgorithm.GZip:
            var gunzip = new Zlib.Gunzip(KDB.prototype.wordArrayToUint8Array(blocksData));
            var uncompressedData = gunzip.decompress();
            var str = "";
            var split = Math.pow(2,15); // Safari have a limit of 2^16
            for(var i=0; i<uncompressedData.length; i += split) {
                str = str.concat( String.fromCharCode.apply(null, uncompressedData.subarray(i, i + split)) );
            }
            return str;
            break;
        default:
            throw new Error('Unsupported compression algorithm');
    }
};

KDB.prototype._blocks = function() {
    var encryptedData = CryptoJS.lib.WordArray.create(this._binary.slice(this._encryptedDataOffset));
    var masterKey = this._masterKey();
    var iv = this._headerFields.EncryptionIV.data;

    var cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: encryptedData });
    var decryptedData = CryptoJS.AES.decrypt(cipherParams, masterKey, { mode: CryptoJS.mode.CBC, iv: iv, padding: CryptoJS.pad.Pkcs7 });

    var decryptedDataParser = new jParser(KDB.prototype.wordArrayToUint8Array(decryptedData), KDB.prototype._jparser_bodyStructure);

    var headerStartBytes = this._headerFields.StreamStartBytes.data;
    var streamStartBytes = decryptedDataParser.parse(['word_array', 32]);
    if( !KDB.prototype._areEqualsArray(headerStartBytes.words, streamStartBytes.words) ) {
        throw new Error('File is corrupted (StreamStartBytes does not match)');
    }

    return decryptedDataParser.parse('blocks');
};

/*
 * The XML document is crypted in AES with the masterKey
 */
KDB.prototype._masterKey = function() {
    var masterSeed = this._headerFields.MasterSeed.data;
    var transformedKey = this._transformedKey();

    var combinedKey = CryptoJS.lib.WordArray.create();
    combinedKey.concat( masterSeed );
    combinedKey.concat( transformedKey );

    return CryptoJS.SHA256(combinedKey);
};

KDB.prototype._transformedKey = function() { // aka key32
    var key = this._compositeKey();
    var seed = this._headerFields.TransformSeed.data;
    var iv = CryptoJS.lib.WordArray.create( new Uint8Array(16) )
    var rounds = this._headerFields.TransformRounds.data;

    for(var round = 0; round < rounds; round++) {
        key = CryptoJS.AES.encrypt(key, seed, { mode: CryptoJS.mode.ECB, iv: iv, padding: CryptoJS.pad.NoPadding }).ciphertext;
    }

    return CryptoJS.SHA256(key);
};

KDB.prototype._compositeKey = function() {
    if( (!this._passphrase || this._passphrase.length == 0)
        && (!this._keyFile || this._keyFile.length == 0)
    ) {
        throw new Error('No passphrase nor keyFile given');
    }

    var compositeWord = CryptoJS.lib.WordArray.create();

    if( this._passphrase && this._passphrase.length > 0 ) {
        compositeWord.concat( CryptoJS.SHA256(this._passphrase) );
    }
    if( this._keyFile && this._keyFile.length > 0 ) {
        // TODO: test me
        var key = this._keyFile.match(/<Data>(.*?)<\/Data>/)[1];
        compositeWord.concat( CryptoJS.enc.Base64.parse(key) );
    }

    return CryptoJS.SHA256(compositeWord);
};

/*
 * Protected values are crypted with Salsa20, then encoded in base64
 */
KDB.prototype._unprotectDocument = function(protectedXmlDocument) {
    // Clone the original XML document because it's bad to work on argument
    // reference (http://stackoverflow.com/a/9711186)
    var unprotectedXmlDocument = protectedXmlDocument.implementation.createDocument(
        protectedXmlDocument.namespaceURI, null, null);
    var newNode = unprotectedXmlDocument.importNode(protectedXmlDocument.documentElement, true);
    unprotectedXmlDocument.appendChild(newNode);

    // XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
    //  - ORDERED: The protected values need to be decrypted in insertion
    //    order because of the Salsa algorithm
    //  - SNAPSHOT: Because we modify the document while iterating it
    var protectedValuesIterator = unprotectedXmlDocument.evaluate('//Value[@Protected="True"]',
        unprotectedXmlDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    var salsa = this._salsa();
    for(var idx=0; idx < protectedValuesIterator.snapshotLength; idx++) {
        var protectedValue = protectedValuesIterator.snapshotItem(idx);
        var protectedContent = CryptoJS.enc.Base64.parse(protectedValue.textContent);
        var salsaKey = salsa.getBytes(protectedContent.sigBytes);

        protectedValue.textContent = KDB.prototype.arrayXOR(KDB.prototype.wordArrayToUint8Array(protectedContent), salsaKey);
    }

    return unprotectedXmlDocument;
};

/*
 * Protected values are crypted with Salsa20, then encoded in base64.
 * In Web Worker DOM API is not available, so work on string (yeah, it's dirty).
 */
KDB.prototype._unprotectXmlContent = function(protectedXmlContent) {
    var unprotectedXmlContent = protectedXmlContent;
    var salsa = this._salsa();

    var protectedValueRe  = /<([^> ]+) [^>]*Protected=["']True["'][^>]*>([^<]*)<\/\1>/ig;
    var match;
    while( match=protectedValueRe.exec(protectedXmlContent) ) {
        var protectedValue = match[2];

        var protectedContent = CryptoJS.enc.Base64.parse(protectedValue);
        var salsaKey = salsa.getBytes(protectedContent.sigBytes);

        var unprotectedValue = KDB.prototype.arrayXOR(KDB.prototype.wordArrayToUint8Array(protectedContent), salsaKey);
        unprotectedXmlContent = unprotectedXmlContent.replace(protectedValue, unprotectedValue);
    }

    return unprotectedXmlContent;
};

KDB.prototype._salsa = function() {
    var key = this._salsaKey();
    var iv = this._salsaIV();

    return new Salsa20(KDB.prototype.wordArrayToUint8Array(key), KDB.prototype.wordArrayToUint8Array(iv));
};

KDB.prototype._salsaKey = function() {
    var protectedStreamKey = this._headerFields.ProtectedStreamKey.data;

    return CryptoJS.SHA256(protectedStreamKey);
};

KDB.prototype._salsaIV = function() {
    // Should not change in future version
    var iv = [0xE8, 0x30, 0x09, 0x4B, 0x97, 0x20, 0x5D, 0x2A];

    return CryptoJS.lib.WordArray.create( new Uint8Array(iv) );
};
