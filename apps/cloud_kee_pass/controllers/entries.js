sc_require('controllers/entriesSets');
sc_require('controllers/searchEntries');

CloudKeePass.entriesController = SC.ArrayController.create({
    contentBindingSelection: SC.Binding.to('CloudKeePass.entriesSetsController*selection.firstObject.entries')
                                       .from('CloudKeePass.entriesController.content'),
    contentBindingSearchResults: SC.Binding.to('CloudKeePass.searchEntriesController.entries')
                                           .from('CloudKeePass.entriesController.content'),

    orderBy: 'title ASC',

    _contentDidChange: function() {
        // Always select the first element
        this.selectObject( this.get('firstSelectableObject') );
    }.observes('content'),
});
