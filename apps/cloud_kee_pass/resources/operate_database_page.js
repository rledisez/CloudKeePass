CloudKeePass.operateDatabasePage = SC.Page.design({
    mainPane: SC.MainPane.design({
        childViews: ['toolbar','viewer'],

        toolbar: SC.ToolbarView.design({
            layout: { top: 0, left: 0, right: 0, height: 40 },
            childViews: ['buttonsView','searchField'],

            buttonsView: SC.View.design(SC.FlowedLayout, {
                layout: { top: 0, left: 0, height: 40, width: 120 },
                childViews: ['lockButton','saveButton','editDatabaseButton'],

                layoutDirection: SC.LAYOUT_HORIZONTAL,
                defaultFlowSpacing: { top: 4, bottom: 0, left: 5, right: 0 },

                lockButton: SC.ImageButtonView.design({
                    layout: { height: 32, width: 32 },
                    image: 'toolbar-lock-button',
                    action: 'lock',
                }),

                saveButton: SC.ImageButtonView.design({
                    layout: { height: 32, width: 32 },
                    image: 'toolbar-save-button',
                    action: 'save',
                    isVisibleBinding: 'CloudKeePass.databaseController.isWritable',
                }),

                editDatabaseButton: SC.ImageButtonView.design({
                    layout: { height: 32, width: 32 },
                    image: 'toolbar-database-button',
                    action: 'editDatabase',
                }),
            }),

            searchField: SC.TextFieldView.design({
                layout: { centerY: 0, right: 10, height: 20, width: 250 },
                hint: "Search".loc(),
                type: 'search',
                valueBinding: 'CloudKeePass.searchEntriesController.filter',
            }),
        }),

        viewer: SC.SplitView.design({
            layout: { top: 41, left: 0, right: 0, bottom: 0 },
            childViews: ['entriesSets', 'entriesList','entryContent'],

            entriesSets: SC.ScrollView.design(SC.SplitChild, {
                classNames: ['entriesSets'],

                // SplitChild
                size: 250,

                // ScrollView
                hasHorizontalScroller: NO,
                verticalScrollerView: SC.ScrollerView.design({
                    hasButtons: NO,
                    buttonLength: 14,
                }),

                contentView: SC.SourceListView.design({
                    rowHeight: 20,

                    contentBinding: 'CloudKeePass.entriesSetsController.arrangedObjects',
                    selectionBinding: 'CloudKeePass.entriesSetsController.selection',

                    groupExampleView: SC.ListItemView.design({
                        contentValueKey: 'name',
                    }),
                    exampleView: SC.ListItemView.design({
                        contentValueKey: 'name',
                        contentUnreadCountKey: 'entriesCount',
                        hasContentIcon: YES,
                        contentIconKey: 'icon',
                    }),
                }),
            }),

            entriesList: SC.ScrollView.design(SC.SplitChild, {
                classNames: ['entriesList'],

                // SplitChild
                size: 380,

                // ScrollView
                hasHorizontalScroller: NO,
                verticalScrollerView: SC.ScrollerView.design({
                    hasButtons: NO,
                    buttonLength: 14,
                }),

                contentView: SC.SourceListView.design({
                    contentBinding: 'CloudKeePass.entriesController.arrangedObjects',
                    selectionBinding: 'CloudKeePass.entriesController.selection',

                    rowHeight: 48,

                    exampleView: SC.ListItemView.design({
                        contentValueKey: 'listTitle',
                        escapeHTML: NO,
                        //iconBinding:  SC.Binding.transform(function (value) { return 'icon-%{0}-32'.fmt([value]); }).from('.content.iconId'),
                        hasContentIcon: YES,
                        contentIconKey:  'icon32',
                    }),
                }),
            }),

            entryContent: SC.ContainerView.design(SC.SplitChild, {
                classNames: ['entryContent'],

                // SplitChild
                autoResizeStyle: SC.RESIZE_AUTOMATIC,

                nowShowingBinding: SC.Binding.transform(function (value) {
                    return (value)
                        ? 'CloudKeePass.operateDatabasePage.mainPane.viewer.entryContent_selection'
                        : 'CloudKeePass.operateDatabasePage.mainPane.viewer.entryContent_noSelection';
                }).from('CloudKeePass.entriesController*selectedEntry'),
            }),

            entryContent_noSelection: SC.View.design({
                childViews: ['label'],

                label: SC.LabelView.design({
                    layout: { centerY: 0, centerX: 0, height: 24, width: 150 },
                    value: 'CloudKeePass',
                }),
            }),

            entryContent_selection: SC.View.design(SC.FlowedLayout, {
                layoutDirection: SC.LAYOUT_VERTICAL,
                defaultFlowSpacing: { top: 0, bottom: 10, left: 10, right: 10 },
                autoResize: NO, // FIXME: If set to YES (default), the minWidth is 20px
                                // FIXME: too much, so the history buttons are out of view

                childViews: ['head','username','password','notes','tags','files','historyRibbon','historyNavigator'],

                head: SC.View.design({
                    layout: { height: 64 },
                    flowSpacing: { top: 35, bottom: 35, left: 10, right: 10 },
                    childViews: ['icon','title','url'],

                    icon: SC.ImageView.design({
                        layout: { top: 0, left: 86, height: 64, width: 64 },
                        // FIXME: each time value change, a new class is added to the attribute class
                        valueBinding: SC.Binding.transform(function (value) {
                            return 'icon-%{0}-64'.fmt([value]);
                        }).from('CloudKeePass.entriesController*selectedEntry.iconId'),
                    }),

                    title: SC.TextFieldView.design(SC.AutoResize, {
                        layout: { top: 5, left: 160, height: 28 },
                        autoResizePadding: 0,
                        classNames: ['entryTitle','entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.title',
                        isEditable: NO,
                    }),

                    url: CloudKeePass.TextFieldCopySelectView.design(SC.AutoResize, {
                        layout: { top: 37, left: 160, height: 16 },
                        classNames: ['entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.url',
                        isEditable: NO,

                        copyImage: 'copy-button',
                        selectImage: 'select-button',
                    }),
                }),

                username: SC.View.design({
                    layout: { height: 22 },
                    childViews: ['label','field'],
                    isVisibleBinding: SC.Binding.oneWay('.field.value').bool(),

                    label: SC.LabelView.design({
                        layout: { left: 0, height: 22, width: 150 },
                        classNames: ['text-align-right','entryLabel'],
                        value: "Username".loc(),
                    }),
                    field: CloudKeePass.TextFieldCopySelectView.design(SC.AutoResize, {
                        layout: { left: 160, height: 20 }, // 20px height instead of 22px because of the 1px border
                        classNames: ['entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.username',
                        isEditable: NO,

                        copyImage: 'copy-button',
                        selectImage: 'select-button',
                    }),
                }),

                password: SC.View.design({
                    layout: { height: 22 },
                    childViews: ['label','field'],
                    isVisibleBinding: SC.Binding.oneWay('.field.value').bool(),

                    label: SC.LabelView.design({
                        layout: { left: 0, height: 22, width: 150 },
                        classNames: ['text-align-right','entryLabel'],
                        value: "Password".loc(),
                    }),
                    field: CloudKeePass.TextFieldCopySelectView.design(SC.AutoResize, {
                        layout: { left: 160, height: 20 },
                        classNames: ['entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.password',
                        type: 'password',
                        isEditable: NO,

                        copyImage: 'copy-button',
                        selectImage: 'select-button',
                    }),
                }),

                notes: SC.View.design({
                    layout: { height: 132 },
                    childViews: ['label','field'],
                    isVisibleBinding: SC.Binding.oneWay('.field.value').bool(),

                    label: SC.LabelView.design({
                        layout: { left: 0, height: 22, width: 150 },
                        classNames: ['text-align-right','entryLabel'],
                        value: "Notes".loc(),
                    }),
                    field: SC.TextFieldView.design({
                        layout: { top: 0, bottom: 0, left: 160, width: 320 },
                        classNames: ['entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.notes',
                        isTextArea: YES,
                        isEditable: NO,
                    }),
                }),

                tags: SC.View.design({
                    layout: { height: 22 },
                    childViews: ['label','field'],
                    isVisibleBinding: SC.Binding.oneWay('.field.value').bool(),

                    label: SC.LabelView.design({
                        layout: { left: 0, height: 22, width: 150 },
                        classNames: ['text-align-right','entryLabel'],
                        value: "Tags".loc(),
                    }),
                    field: SC.TextFieldView.design(SC.AutoResize, {
                        layout: { left: 160, height: 22 },
                        autoResizePadding: 0,
                        classNames: ['entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.tags',
                        isEditable: NO,
                    }),
                }),

                files: SC.View.design({
                    layout: { height: 22 },
                    childViews: ['label','field'],
                    isVisibleBinding: SC.Binding.oneWay('.field.value').bool(),

                    label: SC.LabelView.design({
                        layout: { left: 0, height: 22, width: 150 },
                        classNames: ['text-align-right','entryLabel'],
                        value: "Files".loc(),
                    }),
                    field: SC.TextFieldView.design(SC.AutoResize, {
                        layout: { left: 160, height: 22 },
                        autoResizePadding: 0,
                        classNames: ['entryField'],
                        valueBinding: 'CloudKeePass.entriesController*selectedEntry.files',
                        isEditable: NO,
                    }),
                }),

                historyRibbon: SC.LabelView.design({
                    layout: { top: 32, right: -48, height: 50, width: 210 },
                    useAbsoluteLayout: YES,
                    classNames: ['text-align-center','historyRibbon'],
                    value: "Archived".loc(),
                    isVisibleBinding: 'CloudKeePass.entriesController*selectedEntry.canForwardVersions',
                }),

                historyNavigator: SC.View.design({
                    layout: { bottom: 10, right: 10, height: 24, width: 240 },
                    useAbsoluteLayout: YES,
                    childViews: ['dateLabel','previousButton','nextButton'],
                    classNames: ['historyNavigator'],
                    isVisibleBinding: 'CloudKeePass.entriesController*selectedEntry.hasHistory',

                    dateLabel: SC.LabelView.design({
                        layout: { top: 0, bottom: 0, left: 0, right: 0 },
                        classNames: ['text-align-center','history-date-label'],
                        valueBinding: SC.Binding.dateTime( "%B %D, %Y %H:%M".loc() )
                            .from('CloudKeePass.entriesController*selectedEntry.lastModificationDateTime'),
                    }),

                    previousButton: SC.ImageButtonView.design({
                        layout: { top: 0, left: 0, height: 24, width: 24 },
                        classNames: ['history-navigation-button'],
                        image: 'history-previous-button',
                        isEnabledBinding: 'CloudKeePass.entriesController*selectedEntry.canRewindVersions',
                        targetBinding: 'CloudKeePass.entriesController*selectedEntry',
                        action: 'rewindVersions',
                    }),

                    nextButton: SC.ImageButtonView.design({
                        layout: { top: 0, right: 0, height: 24, width: 24 },
                        classNames: ['history-navigation-button'],
                        action: 'submit',
                        image: 'history-next-button',
                        isEnabledBinding: 'CloudKeePass.entriesController*selectedEntry.canForwardVersions',
                        targetBinding: 'CloudKeePass.entriesController*selectedEntry',
                        action: 'forwardVersions',
                    }),
                }),
            }),
        }),
    }),
});
