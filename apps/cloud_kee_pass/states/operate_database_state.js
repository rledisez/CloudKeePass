CloudKeePass.OperateDatabaseState = SC.State.design({
    initialSubstate: 'browsePasswordsState',

    enterState: function() {
        CloudKeePass.getPath('operateDatabasePage.mainPane.viewer.entryContent')
            .set('nowShowing', 'CloudKeePass.operateDatabasePage.mainPane.viewer.entryContent_noSelection');
        CloudKeePass.getPath('operateDatabasePage.mainPane').append();
    },

    exitState: function() {
        // Only remove the pane when the OpenDatabasePage animation is done (1s should be enought)
        CloudKeePass.getPath('operateDatabasePage.mainPane').invokeLater(function() { this.remove(); }, 1000)
    },

    lock: function() {
        // TODO: clear data
        this.gotoState('openDatabaseState');
    },

    save: function() {
    },

    editDatabase: function() {
    },

    browsePasswordsState: SC.State.design({
        initialSubstate: 'browseDatabaseState',

        _entrySelectionDidChange: function() {
            var selection = CloudKeePass.databaseController.get('entries').get('selection');

            var viewName = 'entryContent_noSelection';
            if( selection && selection.get('length') == 1 ) {
                viewName = 'entryContent_selection';

                // Reset the history navigation to the last version
                while( selection.get('firstObject').get('canForwardVersions') ) {
                    selection.get('firstObject').forwardVersions();
                }
            }

            CloudKeePass.getPath('operateDatabasePage.mainPane.viewer.entryContent')
                .set('nowShowing', 'CloudKeePass.operateDatabasePage.mainPane.viewer.%{0}'.fmt([viewName]));
        }.stateObserves('CloudKeePass.databaseController*entries.selection'),

        browseDatabaseState: SC.State.design({
            _entriesSetsSelectionBackup: null,

            enterState: function() {
                CloudKeePass.searchEntriesController.set('filter', '');

                if( CloudKeePass.entriesSetsController.get('selection').get('length') == 0 ) {
                    CloudKeePass.entriesSetsController.selectObject(this._entriesSetsSelectionBackup);
                }
                CloudKeePass.databaseController.get('entries').get('contentBindingSelection').connect();
            },

            exitState: function() {
                this._entriesSetsSelectionBackup = CloudKeePass.entriesSetsController.get('selection').get('firstObject');
                CloudKeePass.databaseController.get('entries').get('contentBindingSelection').disconnect();
            },

            _searchFilterDidChange: function() {
                if( CloudKeePass.searchEntriesController.get('filter').length > 0 ) {
                    this.gotoState('browseSearchResultsState');
                }
            }.stateObserves('CloudKeePass.searchEntriesController.filter'),
        }),

        browseSearchResultsState: SC.State.design({
            enterState: function() {
                CloudKeePass.entriesSetsController.selectObject(null);
                CloudKeePass.databaseController.get('entries').get('contentBindingSearchResults').connect();
            },

            exitState: function() {
                CloudKeePass.databaseController.get('entries').get('contentBindingSearchResults').disconnect();
            },

            _searchFilterDidChange: function() {
                if( CloudKeePass.searchEntriesController.get('filter').length == 0 ) {
                    this.gotoState('browseDatabaseState');
                }
            }.stateObserves('CloudKeePass.searchEntriesController.filter'),

            _entriesSetsSelectionDidChange: function() {
                this.gotoState('browseDatabaseState');
            }.stateObserves('CloudKeePass.entriesSetsController.selection'),
        }),
    }),
});
