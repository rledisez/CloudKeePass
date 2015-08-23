CloudKeePass.openDatabasePage = SC.Page.design({
    mainPane: SC.MainPane.design({
        childViews: ['openDatabaseView','submitButton'],
        classNames: ['open-database-page'],

        // FIXME: animation breaks the keyboard navigation
        wantsAcceleratedLayer: true,
        transitionIn: null, // Will be set to SLIDE_IN after the first display, no animation for the initial display
        transitionInOptions: {
            direction: 'down',
            duration: 0.5,
            timing: 'ease-in'
        },
        transitionOut: null,
        transitionOutOptions: {
            direction: 'up',
            duration: 0.5,
            timing: 'ease-in'
        },

        openDatabaseView: SC.View.design({
            layout: { centerY: 0, centerX: 0, height: 138, width: 300 },
            childViews: ['urlField','passphraseField','statusLabel','halfRoundView'],

            urlField: SC.TextFieldView.design({
                layout: { centerY: -25, left: 0, right: 0, height: 40 },
                hint: "KDBX file: enter its address or drop it here",
                classNameBindings: ['dropTargetValid:drop-target-valid','dropTargetInvalid:drop-target-invalid'],
                valueBinding: 'CloudKeePass.databaseController.url',
                dropTargetValid: NO,
                dropTargetInvalid: NO,

                dataDragHovered: function(evt) {
                    if( evt && evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.contains('Files') ) {
                        this.set('dropTargetValid', YES);
                        evt.dataTransfer.dropEffect = 'copy';
                    } else {
                        this.set('dropTargetInvalid', YES);
                    }
                },

                dataDragDropped: function(evt) {
                    CloudKeePass.statechart.sendEvent('fileDropped', evt.dataTransfer.files[0]);
                },

                dataDragExited: function(evt) {
                    this.set('dropTargetValid', NO);
                    this.set('dropTargetInvalid', NO);
                },
            }),

            passphraseField: SC.TextFieldView.design({
                layout: { centerY: +25, left: 0, right: 0, height: 40 },
                type: 'password',
                hint: "The passphrase protecting your KDBX file",
                valueBinding: 'CloudKeePass.databaseController.passphrase',
            }),

            statusLabel: SC.LabelView.design({
                layout: { bottom: 0, left: 0, right: 0, height: 24 },
                classNames: ['text-align-right'],
                valueBinding: 'CloudKeePass.databaseController.status',
            }),

            // FIXME: must be done in CSS
            halfRoundView: SC.View.design({
                layout: { centerY: 0, right: -30, height: 60, width: 60 },
                classNames: ['half-round-view'],
            }),
        }),

        submitButton: SC.ImageButtonView.design({
            layout: { centerY: 0, centerX: +150, height: 36, width: 36 },
            isDefault: YES,
            action: 'submit',
            image: 'submit-button',
        }),
    }),
});
