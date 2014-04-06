sc_require('controllers/entriesSets');
sc_require('controllers/searchEntries');

CloudKeePass.entriesController = SC.ArrayController.create({
    content: [],
    orderBy: 'title ASC',

    displaySearchEntries: NO,

    _updateContent: function() {
        var content = ( this.get('displaySearchEntries') )
            ? CloudKeePass.searchEntriesController.get('entries')
            : CloudKeePass.entriesSetsController.get('entries');

        this.set('content', content);
    }.observes('CloudKeePass.entriesSetsController.entries','CloudKeePass.searchEntriesController.entries'),

    _contentDidChange: function() {
        // Always select the first element
        this.selectObject( this.get('firstSelectableObject') );
    }.observes('content'),


    selectedEntryBinding: '*selection.firstObject',
});
