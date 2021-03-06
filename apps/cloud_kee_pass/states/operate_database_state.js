CloudKeePass.OperateDatabaseState = SC.State.design({
    initialSubstate: 'browsePasswordsState',

    enterState: function() {
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
            var selectedEntry = CloudKeePass.entriesController.get('selectedEntry');
            if( selectedEntry ) {
                // Reset the history navigation to the last version
                while( selectedEntry.get('canForwardVersions') ) {
                    selectedEntry.forwardVersions();
                }
            }
        }.stateObserves('CloudKeePass.entriesController*selectedEntry'),

        browseDatabaseState: SC.State.design({
            _searchFilterDidChange: function() {
                if( CloudKeePass.searchEntriesController.get('cleanedFilter').length > 0 ) {
                    this.gotoState('browseSearchResultsState');
                }
            }.stateObserves('CloudKeePass.searchEntriesController.cleanedFilter'),
        }),

        browseSearchResultsState: SC.State.design({
            _entriesSetsSelectionBackup: null,

            enterState: function() {
                this._entriesSetsSelectionBackup = CloudKeePass.entriesSetsController.get('selection');
                CloudKeePass.entriesSetsController.set('selection', null);
                CloudKeePass.entriesController.set('displaySearchEntries', YES);
            },

            exitState: function() {
                CloudKeePass.searchEntriesController.set('filter', '');
                CloudKeePass.entriesController.set('displaySearchEntries', NO);

                // Restore entriesSets selection only if there is not already a selection
                //  => only if not exiting because of _entriesSetsSelectionDidChange()
                if( !CloudKeePass.entriesSetsController.get('hasSelection') ) {
                    CloudKeePass.entriesSetsController.set('selection', this._entriesSetsSelectionBackup);
                }
                this._entriesSetsSelectionBackup = null;
            },

            _searchFilterDidChange: function() {
                if( CloudKeePass.searchEntriesController.get('cleanedFilter').length == 0 ) {
                    this.gotoState('browseDatabaseState');
                }
            }.stateObserves('CloudKeePass.searchEntriesController.cleanedFilter'),

            _entriesSetsSelectionDidChange: function() {
                this.gotoState('browseDatabaseState');
            }.stateObserves('CloudKeePass.entriesSetsController.selection'),
        }),
    }),
});
