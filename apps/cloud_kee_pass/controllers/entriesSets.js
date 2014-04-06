sc_require('controllers/database');
sc_require('library/kdb-sc');

CloudKeePass.entriesSetsController = SC.TreeController.create({
    treeItemIsGrouped: YES,
    allowsMultipleSelection: NO,
    allowsEmptySelection: YES,

    entriesBinding: '*selection.firstObject.entries',

    content: SC.Object.create({
        treeItemIsExpanded: YES,
        treeItemChildren: [
            CloudKeePass.KDBX.EntriesSet.create({
                name: "All".loc(),
                entriesCountBinding: '*entries.length',
                icon: 'entries-sets-all',
                elementBinding: 'CloudKeePass.databaseController.xmlDocument',
                entriesXPath: '//Group/Entry',
            }),
            CloudKeePass.KDBX.Group.create({
                name: "Groups".loc(),
                elementBinding: 'CloudKeePass.databaseController.xmlDocument',
                groupXPath: '/KeePassFile/Root/Group',
            }),
            CloudKeePass.KDBX.Tags.create({
                name: "Tags".loc(),
                elementBinding: 'CloudKeePass.databaseController.xmlDocument',
            }),
        ],
    }),

    _contentDidChange: function() {
        this.notifyPropertyChange('content');
    }.observes('.content.treeItemChildren*@each.treeItemChildren'),
});
