sc_require('controllers/database');
sc_require('library/kdb-sc');

CloudKeePass.searchEntriesController = SC.Controller.create({
    filter: '',

    entriesBinding: '.resultsSet*entries',

    resultsSet: CloudKeePass.KDBX.EntriesSet.create({
        name: "Search results".loc(),
        entriesCountBinding: '*entries.length',
        icon: 'entries-sets-search',
        elementBinding: 'CloudKeePass.databaseController.xmlDocument',
        entriesXPathBinding: SC.Binding.transform( function(filter) {
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
            ]'.fmt([filter.toUpperCase(), filter.toLowerCase()]);
        }).from('CloudKeePass.searchEntriesController.filter'),
    }),
});
