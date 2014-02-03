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
                CloudKeePass.databaseController.set('searchText', '');

                if( CloudKeePass.databaseController.get('entriesSets').get('selection').get('length') == 0 ) {
                    CloudKeePass.databaseController.get('entriesSets').selectObject(this._entriesSetsSelectionBackup);
                }
                CloudKeePass.databaseController.get('entries').get('contentBindingSelection').connect();
            },

            exitState: function() {
                this._entriesSetsSelectionBackup = CloudKeePass.databaseController.get('entriesSets').get('selection').get('firstObject');
                CloudKeePass.databaseController.get('entries').get('contentBindingSelection').disconnect();
            },

            _searchTextDidChange: function() {
                if( CloudKeePass.databaseController.get('searchText').length > 0 ) {
                    this.gotoState('browseSearchResultsState');
                }
            }.stateObserves('CloudKeePass.databaseController.searchText'),
        }),

        browseSearchResultsState: SC.State.design({
            enterState: function() {
                CloudKeePass.databaseController.get('entriesSets').selectObject(null);
                CloudKeePass.databaseController.get('entries').get('contentBindingSearchResults').connect();
            },

            exitState: function() {
                CloudKeePass.databaseController.get('entries').get('contentBindingSearchResults').disconnect();
            },

            _searchTextDidChange: function() {
                if( CloudKeePass.databaseController.get('searchText').length == 0 ) {
                    this.gotoState('browseDatabaseState');
                }
            }.stateObserves('CloudKeePass.databaseController.searchText'),

            _entriesSetsSelectionDidChange: function() {
                this.gotoState('browseDatabaseState');
            }.stateObserves('CloudKeePass.databaseController.entriesSets.selection'),
        }),
    }),
});
