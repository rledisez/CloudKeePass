CloudKeePass.OpenDatabaseState = SC.State.design({
    initialSubstate: 'readyState',

    enterState: function() {
        CloudKeePass.getPath('openDatabasePage.mainPane').append();
        //CloudKeePass.getPath('openDatabasePage.mainPane').set('transitionIn', SC.View.SLIDE_IN);
    },

    exitState: function() {
        CloudKeePass.getPath('openDatabasePage.mainPane').remove();
    },

    readyState: SC.State.design({
        fileDropped: function(file) {
            file.toString = function() {
                return this.name;
            };
            CloudKeePass.databaseController.set('url', file);
        },

        submit: function() {
            this.gotoState('openingDatabaseState');
        },
    }),

    openingDatabaseState: SC.State.design({
        initialSubstate: 'downloadDatabaseState',

        enterState: function() {
            CloudKeePass.getPath('openDatabasePage.mainPane.openDatabaseView.urlField').set('isEditable', NO);
            CloudKeePass.getPath('openDatabasePage.mainPane.openDatabaseView.passphraseField').set('isEditable', NO);
        },

        exitState: function() {
            CloudKeePass.getPath('openDatabasePage.mainPane.openDatabaseView.urlField').set('isEditable', YES);
            CloudKeePass.getPath('openDatabasePage.mainPane.openDatabaseView.passphraseField').set('isEditable', YES);
        },

        downloadDatabaseState: SC.State.design({
            enterState: function() {
                if( typeof(CloudKeePass.databaseController.get('url')) == 'string' || CloudKeePass.databaseController.get('url') instanceof String ) {
                    CloudKeePass.databaseController.set('status', "Downloading...".loc());
                    var req = SC.Request.getUrl( CloudKeePass.databaseController.get('url') )
                                .notify(200, CloudKeePass.statechart, function(response) { this.sendEvent('downloadDone', response); return YES; })
                                .notify(CloudKeePass.statechart, function(response) { this.sendEvent('downloadError', response); return YES; });
                    req.set('responseClass', CloudKeePass.XHRBinaryResponse);
                    req.send();
                } else if( CloudKeePass.databaseController.get('url') instanceof File ) {
                    var reader = new FileReader();
                    reader.onload = function(event) {
                        // Simulate a SC.Response
                        CloudKeePass.statechart.sendEvent('downloadDone', { rawRequest: { response: event.target.result } });
                    };
                    reader.onerror = function(event) {
                        // Simulate a SC.Response
                        CloudKeePass.statechart.sendEvent('downloadError', { errorObject: { message: event.message } });
                    };
                    reader.readAsArrayBuffer( CloudKeePass.databaseController.get('url') );
                }
            },

            exitState: function() {
                CloudKeePass.databaseController.set('status', '');
            },

            downloadDone: function(response) {
                CloudKeePass.databaseController.set('binary', response.rawRequest.response);
                this.gotoState('unlockDatabaseState');
            },

            downloadError: function(response) {
                SC.AlertPane.error({
                    message: "Download error".loc(),
                    description: response.errorObject.message.loc(),
                    buttons: [
                        {
                            title: "Close".loc(),
                        }
                    ]
                });
                this.gotoState('readyState');
            },
        }),

        unlockDatabaseState: SC.State.design({
            enterState: function() {
                CloudKeePass.databaseController.set('status', "Unlocking...".loc());

                var kdbWorker = new Worker( sc_static('kdb-worker.js') );
                kdbWorker.onmessage = function(event) { SC.run(function() {
                    if( event.data.type == 'logging' ) {
                        SC.Logger[event.data.level].apply(SC.Logger, ['[KDB worker] %{0}', [event.data.data.toString()]]);

                    } else if( event.data.type == 'result' ) {
                        // Because a Worker cannot use the DOM API, we get a string
                        // instead of a Document
                        var xmlDocument = (new DOMParser()).parseFromString( event.data.xmlContent , "text/xml" )
                        CloudKeePass.statechart.sendEvent('decryptionDone', xmlDocument);

                    } else if( event.data.type == 'error' ) {
                        CloudKeePass.statechart.sendEvent('decryptionError', event.data.message);
                    }
                }) };
                kdbWorker.onerror = function(error) { SC.run(function() {
                    CloudKeePass.statechart.sendEvent('decryptionError', error);
                }) };
                kdbWorker.postMessage({
                    action: 'decrypt',
                    binary: CloudKeePass.databaseController.get('binary'),
                    passphrase: CloudKeePass.databaseController.get('passphrase'),
                    keyFile: null,
                });
            },

            exitState: function() {
                CloudKeePass.databaseController.set('status', '');
            },

            decryptionDone: function(xmlDocument) {
                CloudKeePass.databaseController.set('xmlDocument', xmlDocument);
                this.gotoState('operateDatabaseState');
            },

            decryptionError: function(message) {
                SC.AlertPane.error({
                    message: "Decryption error".loc(),
                    description: message.loc(),
                    buttons: [
                        {
                            title: "Close".loc(),
                        }
                    ]
                });
                this.gotoState('readyState');
            },
        }),
    }),
});
