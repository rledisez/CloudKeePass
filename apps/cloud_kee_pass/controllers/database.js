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

    searchText: '',
    searchResults: CloudKeePass.KDBX.EntriesSet.create({
        name: "Search results".loc(),
        entriesCountBinding: '*entries.length',
        icon: 'entries-sets-search',
        elementBinding: 'CloudKeePass.databaseController.xmlDocument',
        entriesXPathBinding: SC.Binding.transform( function(searchText) {
            return '//Group/Entry[                                                          \
                String[                                                                     \
                    (Key="Title" and contains(translate(Value, "%{0}", "%{1}"),"%{1}"))     \
                    or                                                                      \
                    (Key="UserName" and contains(translate(Value, "%{0}", "%{1}"),"%{1}"))  \
                    or                                                                      \
                    (Key="URL" and contains(translate(Value, "%{0}", "%{1}"),"%{1}"))       \
                    or                                                                      \
                    (Key="Notes" and contains(translate(Value, "%{0}", "%{1}"),"%{1}"))     \
                ]                                                                           \
            ]'.fmt([searchText.toUpperCase(), searchText.toLowerCase()]);
        }).from('CloudKeePass.databaseController.searchText'),
    }),

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
