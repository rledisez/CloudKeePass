sc_require('library/kdb-sc');

CloudKeePass.databaseController = SC.Controller.create({
    url: '',
    status: '',

    binary: null,
    passphrase: '',
    keyFile: null,
    isWritable: NO,
    isDirty: NO,

    xmlDocument: null,
});
