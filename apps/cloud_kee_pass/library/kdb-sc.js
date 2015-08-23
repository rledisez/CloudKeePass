CloudKeePass.KDBX = {}

CloudKeePass.KDBX.DomElement = {
    element: null,

    document: function() {
        if( this.get('element') == null ) {
            return null;
        } else if( this.get('element') instanceof Document ) {
            return this.get('element');
        } else if( this.get('element') && this.get('element').ownerDocument ) {
            return this.get('element').ownerDocument;
        } else {
            throw new Error('Invalid element');
        }
    }.property('element').cacheable(),
};

CloudKeePass.KDBX.EntriesSet = SC.Object.extend(CloudKeePass.KDBX.DomElement, {
    entriesXPath: 'Entry',

    entries: function() {
        var entries = [];

        if( this.get('document') && this.get('element') && this.get('entriesXPath') ) {
            var entryElementsIterator = this.get('document')
                .evaluate(this.get('entriesXPath'), this.get('element'), null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

            for(var entryElement; entryElement = entryElementsIterator.iterateNext(); ) {
                var entry = CloudKeePass.KDBX.Entry.create({
                    element: entryElement,
                });
                entries.pushObject(entry);
            }
        }

        return entries;
    }.property('document','element','entriesXPath').cacheable(),
});

CloudKeePass.KDBX.Group = CloudKeePass.KDBX.EntriesSet.extend(SC.TreeItemContent, {
    icon: 'entries-sets-group',

    treeItemIsExpanded: NO,

    groupXPath: null,

    groupElement: function() {
        if( this.get('document') && this.get('element') && this.get('groupXPath') ) {
            return this.get('document')
                .evaluate(this.get('groupXPath'), this.get('element'), null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                .singleNodeValue;
        } else {
            return null;
        }
    }.property('document','element','groupXPath').cacheable(),

    name: function() {
        if( this.get('document') && this.get('element') ) {
            return this.get('document')
                .evaluate('Name', this.get('element'), null, XPathResult.STRING_TYPE, null)
                .stringValue;
        } else {
            return null;
        }
    }.property('document','element').cacheable(),

    treeItemChildren: function() {
        var groups = [];

        if( this.get('document') && this.get('groupElement') ) {
            var groupElementsIterator = this.get('document')
                .evaluate('Group', this.get('groupElement'), null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

            for(var groupElement; groupElement = groupElementsIterator.iterateNext(); ) {
                var group = CloudKeePass.KDBX.Group.create({
                    element: groupElement,
                    groupXPath: '.',
                });
                groups.pushObject(group);
            }
        }

        return ( groups.get('length') > 0 )
            ? groups
            : null; // Return null to avoid that TreeController draw an empty group
    }.property('document','groupElement').cacheable(),
});

CloudKeePass.KDBX.Tags = SC.Object.extend(SC.TreeItemContent, CloudKeePass.KDBX.DomElement, {
    treeItemIsExpanded: NO,

    treeItemChildren: function() {
        var tags = [];
        var tagsEntriesSets = [];

        if( this.get('document') ) {
            var tagElementsIterator = this.get('document')
                .evaluate('//Group/Entry/Tags', this.get('document'), null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

            for(var tagElement; tagElement = tagElementsIterator.iterateNext(); ) {
                var self = this;
                tagElement.textContent.trim().split(/ *; */).forEach(function(tag) {
                    if( tag.length == 0 ) { return; }
                    if( tags.indexOf(tag) >= 0 ) { return; }
                    tags.pushObject(tag);

                    tagsEntriesSet = CloudKeePass.KDBX.EntriesSet.create({
                        name: tag,
                        icon: 'entries-set-tag',
                        element: self.get('document'),
                        // There is no regexp in XPath, so checks all the possible case.
                        // The last one is the XPath 1.0 equivalent of ends-with() which in XPath 2.0 only
                        entriesXPath: '//Group/Entry[./Tags[.="%{0}" or starts-with(.,"%{0};") or contains(.,";%{0};") or substring(., string-length(.) - string-length(";%{0}") + 1)=";%{0}"]]'.fmt([tag]),
                    });
                    tagsEntriesSets.pushObject(tagsEntriesSet);
                });
            }
        }

        return ( tagsEntriesSets.get('length') > 0 )
            ? tagsEntriesSets
            : null; // Return null to avoid that TreeController draw an empty group
    }.property('document').cacheable(),
});

CloudKeePass.KDBX.Entry = SC.Object.extend(CloudKeePass.KDBX.DomElement, {

    /**
     * Handle history
     */
    _elementVersionIdx: 0,

    _elementVersions: function() {
        var elementVersions = [];

        if( this.get('document') && this.get('element') ) {
            elementVersions.pushObject(this.get('element'));

            var historyElementsIterator = this.get('document')
                .evaluate('History/Entry', this.get('element'), null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

            var historyElements = [];
            for(var historyElement; historyElement = historyElementsIterator.iterateNext(); ) {
                historyElements.pushObject(historyElement);
            }
            historyElements.sort(function(a, b) {
                var aDateTimeStr = a.ownerDocument
                    .evaluate('Times/LastModificationTime', a, null, XPathResult.STRING_TYPE, null)
                    .stringValue;
                var bDateTimeStr = b.ownerDocument
                    .evaluate('Times/LastModificationTime', b, null, XPathResult.STRING_TYPE, null)
                    .stringValue;

                if( aDateTimeStr < bDateTimeStr ) { return 1; }
                if( aDateTimeStr > bDateTimeStr ) { return -1; }
                return 0;
            });
            elementVersions.pushObjects(historyElements);
        }

        return elementVersions;
    }.property('document','element').cacheable(),

    elementVersion: function() {
        return this.get('_elementVersions')[this.get('_elementVersionIdx')];
    }.property('_elementVersionIdx','_elementVersions').cacheable(),

    hasHistory: function() {
        return ( this.get('_elementVersions').get('length') > 1 );
    }.property('_elementVersions').cacheable(),

    canRewindVersions: function() {
        return ( this.get('_elementVersionIdx') + 1 < this.get('_elementVersions').get('length') );
    }.property('_elementVersionIdx','_elementVersions').cacheable(),

    canForwardVersions: function() {
        return ( this.get('_elementVersionIdx') > 0 );
    }.property('_elementVersionIdx','_elementVersions').cacheable(),

    rewindVersions: function() {
        if( this.get('canRewindVersions') ) {
            this.set('_elementVersionIdx', this.get('_elementVersionIdx') + 1);
        }
    },

    forwardVersions: function() {
        if( this.get('canForwardVersions') ) {
            this.set('_elementVersionIdx', this.get('_elementVersionIdx') - 1);
        }
    },


    /**
     * Handle attributes
     */
    iconId: function() {
        if( this.get('document') && this.get('elementVersion') ) {
            return this.get('document')
                .evaluate('IconID', this.get('elementVersion'), null, XPathResult.NUMBER_TYPE, null)
                .numberValue;
        } else {
            return null;
        }
    }.property('document','elementVersion').cacheable(),
    // FIXME: that's a hack because iconBinding on ListItemView does not work fine
    icon32Binding: SC.Binding.transform(function (value) { return 'icon-%{0}-32'.fmt([value]); }).from('.iconId'),

    listTitle: function() {
        var title = this.get('title');
        var subtitle = this.get('username');
        if( subtitle.length == 0 ) {
            subtitle = this.get('url');
        }

        return '<div class="title">%{0}</div><div class="subtitle">%{1}</div>'.fmt([title, subtitle]);
    }.property('title','username').cacheable(),

    lastModificationDateTime: function() {
        if( this.get('document') && this.get('elementVersion') ) {
            var dateTimeStr = this.get('document')
                .evaluate('Times/LastModificationTime', this.get('elementVersion'), null, XPathResult.STRING_TYPE, null)
                .stringValue;
            return SC.DateTime.parse(dateTimeStr);
        }
    }.property('document','elementVersion').cacheable(),

    _stringValue: function(key, value) {
        if( this.get('document') && this.get('elementVersion') ) {
            var node = this.get('document')
                .evaluate('String[Key="%{0}"]/Value'.fmt([key]), this.get('elementVersion'), null, XPathResult.ANY_UNORDERED_NODE_TYPE, null)
                .singleNodeValue
            if( node ) {
                return node.textContent;
            } else {
                return '';
            }
        } else {
            return null;
        }
    },

    title: function() {
        return this._stringValue('Title');
    }.property('document','elementVersion').cacheable(),

    username: function() {
        return this._stringValue('UserName');
    }.property('document','elementVersion').cacheable(),

    password: function() {
        return this._stringValue('Password');
    }.property('document','elementVersion').cacheable(),

    url: function() {
        return this._stringValue('URL');
    }.property('document','elementVersion').cacheable(),

    notes: function() {
        return this._stringValue('Notes');
    }.property('document','elementVersion').cacheable(),

    tags: function() {
        var tags = [];

        if( this.get('document') && this.get('elementVersion') ) {
            var tagsStr = this.get('document')
                .evaluate('Tags', this.get('elementVersion'), null, XPathResult.STRING_TYPE, null)
                .stringValue;
            if( tagsStr.match(/[^ ;]/) ) {
                tags.pushObjects( tagsStr.trim().split(/ *; */) );
            }
        }

        return tags;
    }.property('document','elementVersion').cacheable(),

    files: function() {
        var binaries = [];

        if( this.get('document') && this.get('elementVersion') ) {
            var binaryElementsIterator = this.get('document')
                .evaluate('Binary', this.get('elementVersion'), null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

            for(var binaryElement; binaryElement = binaryElementsIterator.iterateNext(); ) {
                var key = this.get('document')
                    .evaluate('Key', binaryElement, null, XPathResult.STRING_TYPE, null)
                    .stringValue;
                var ref = this.get('document')
                    .evaluate('Value/@Ref', binaryElement, null, XPathResult.STRING_TYPE, null)
                    .stringValue;

                binaries.pushObject( { name: key, ref: ref } );
            }
        }

        return binaries;
    }.property('document','elementVersion').cacheable(),
});
