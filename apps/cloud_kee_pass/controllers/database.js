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

    entries: SC.ArrayController.create({
        contentBindingSelection: SC.Binding.to('CloudKeePass.entriesSetsController*selection.firstObject.entries')
                                           .from('CloudKeePass.databaseController.entries.content'),
        contentBindingSearchResults: SC.Binding.to('CloudKeePass.databaseController*searchResults.entries')
                                               .from('CloudKeePass.databaseController.entries.content'),

        orderBy: 'title ASC',

        _contentDidChange: function() {
            // Always select the first element
            this.selectObject( this.get('firstSelectableObject') );
        }.observes('content'),
    }),
});
