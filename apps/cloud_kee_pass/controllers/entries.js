sc_require('controllers/entriesSets');
sc_require('controllers/searchEntries');

CloudKeePass.entriesController = SC.ArrayController.create({
    content: [],
    orderBy: 'title ASC',

    displaySearchEntries: NO,

    _updateContent: function() {
        var content = [];

        if( this.get('displaySearchEntries') ) {
            content = CloudKeePass.searchEntriesController.get('entries');
        } else if( CloudKeePass.entriesSetsController.get('hasSelection') ) {
            content = CloudKeePass.entriesSetsController.get('selection').get('firstObject').get('entries');
        }

        this.set('content', content);
    }.observes('CloudKeePass.entriesSetsController*selection.firstObject.entries','CloudKeePass.searchEntriesController.entries'),

    _contentDidChange: function() {
        // Always select the first element
        this.selectObject( this.get('firstSelectableObject') );
    }.observes('content'),
});
