sc_require('controllers/database');
sc_require('library/kdb-sc');

CloudKeePass.entriesSetsController = SC.TreeController.create({
    treeItemIsGrouped: YES,
    allowsMultipleSelection: NO,
    allowsEmptySelection: YES,

    entriesBinding: '*selection.firstObject.entries',
    content: null,

    xmlDocumentDidChange: function() {
        var xmlDocument = CloudKeePass.databaseController.get('xmlDocument'),
            newContent = null;
        if( xmlDocument ) {
            newContent = SC.Object.create({
                treeItemIsExpanded: YES,
                treeItemChildren: [
                    CloudKeePass.KDBX.EntriesSet.create({
                        name: "All".loc(),
                        entriesCountBinding: '*entries.length',
                        icon: 'entries-sets-all',
                        element: xmlDocument,
                        entriesXPath: '//Group/Entry',
                    }),
                    CloudKeePass.KDBX.Group.create({
                        name: "Groups".loc(),
                        element: xmlDocument,
                        groupXPath: '/KeePassFile/Root/Group',
                    }),
                    CloudKeePass.KDBX.Tags.create({
                        name: "Tags".loc(),
                        element: xmlDocument,
                    }),
                ],
            });
        }
        this.set('content', newContent);
    }.observes('CloudKeePass.databaseController*xmlDocument'),
});
