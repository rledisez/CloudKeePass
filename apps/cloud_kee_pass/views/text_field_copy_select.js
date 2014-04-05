CloudKeePass.TextFieldCopySelectView = SC.TextFieldView.extend({
    classNames: ['textfield'],
    classNameBindings: ['isMouseOver:hover'],
    autoResizePadding: 45,
    isMouseOver: NO,

    _rightAccessoryViewDidChange: function() {
        // Resize the view if rightAccessoryView is resized (because the copyButton is
        // hidden if flash is not available)
        this.set('autoResizePadding', this._rightAccessoryView.get('layout').width);
        this.displayDidChange(); // Force the refresh of the view b/c it does not happen
    },

    init: function() {
        sc_super();

        // Add an observer in init() because the rightAccessoryView is actually stored in
        // _rightAccessoryView which is not KVO capable
        this._rightAccessoryView.addObserver('layout', this, this._rightAccessoryViewDidChange);
    },

    _isMouseOver: function(cursorX, cursorY) {
        var element = document.getElementById( this.get('layerId') );
        var rect = element.getBoundingClientRect();

        return !( cursorX <= rect.left || cursorX >= (rect.left + rect.width)
               || cursorY <= rect.top  || cursorY >= (rect.top + rect.height) );
    },

    _onMouseMoveListener: function(event) {
        if( !this._isMouseOver(event.clientX, event.clientY)  ) {
            this.mouseExited(event);
        }
    },

    // There are glitches when the mouse cursor moves from/to the invisible flash object
    // of ZeroClipboard. To avoid that, mouseOver is handled by checking the cursor
    // position
    mouseEntered: function() {
        SC.Event.add(document, 'mousemove', this, this.get('_onMouseMoveListener'));
        this.set('isMouseOver', YES);
    },

    mouseExited: function(event) {
        if( !this._isMouseOver(event.clientX, event.clientY)  ) {
            this.set('isMouseOver', NO);
            SC.Event.remove(document, 'mousemove', this, this.get('_onMouseMoveListener'));

            // FIXME: it should be handled by SproutCore
            if( this.get('type') == 'password' ) {
                var element = document.getElementById( this.get('layerId') );
                var inputs = $(element).find('input');
                if( inputs.length > 0 ) {
                    inputs[0].type = 'password';
                }
            }
        }
    },


    rightAccessoryView: SC.View.extend({
        layout: { top: 0, bottom: 0, right: 0 },

        childViews: ['copyButton','selectButton'],
        childViewLayout: SC.View.HORIZONTAL_STACK,
        childViewLayoutOptions: {
            paddingBefore: 5,
            paddingAfter: 0,
            spacing: 0,
        },

        copyButton: SC.ImageButtonView.design({
            layout: { top: 0, bottom: 0, width: 20 },
            classNames: ['copy-button'],
            imageBinding: '.parentView.parentView.copyImage',
            isMouseOver: NO,

            tooltipPane: null,

            init: function() {
                var tooltipPane = SC.PickerPane.create({
                    layout: { width: 1, height: 22 },
                    classNames: ['textfieldCopySelectTooltip'],
                    preferType: SC.PICKER_POINTER,
                    preferMatrix: [3, 3, 3, 3, 3], // only bottom
                    isModal: NO, // Do not prevent access to others UI elements
                    acceptsKeyPane: NO, // Do not take keyboard focus when displayed

                    _measuredSizeDidChange: function() {
                        var measuredSize = this.get('contentView').get('measuredSize');
                        this.adjust('width', measuredSize.width + 10); // 5px padding
                    }.observes('contentView.measuredSize'),

                    contentView: SC.LabelView.extend(SC.AutoResize, {
                        layout: { top: 0, bottom: 0, left: 5 },
                    }),
                });
                this.set('tooltipPane', tooltipPane);

                return sc_super();
            },

            mouseEntered: function() {
                this.get('tooltipPane').get('contentView').set('value', "Copy to clipboard".loc());
                this.get('tooltipPane').popup(this);
            },

            mouseExited: function() {
                this.get('tooltipPane').remove();
            },

            didAppendToDocument: function() {
                ZeroClipboard.config({
                    moviePath: sc_static('ZeroClipboard.swf'),
                    forceHandCursor: NO,
                    cacheBust: NO,
                    title: null,
                });

                var element = document.getElementById( this.get('layerId') );
                var zeroClipboard = new ZeroClipboard(element);

                zeroClipboard.__textfieldCopySelectView = this.get('parentView').get('parentView');
                zeroClipboard.__copyButtonView = this;

                zeroClipboard.on('noFlash', function(zeroClipboard, args) {
                    SC.run(function() { zeroClipboard.__copyButtonView.set('isVisible', NO); });
                });

                zeroClipboard.on('dataRequested', function(zeroClipboard, args) {
                    zeroClipboard.setText( zeroClipboard.__textfieldCopySelectView.get('value') );
                });

                zeroClipboard.on('complete', function(zeroClipboard, args) {
                    SC.run(function() { zeroClipboard.__copyButtonView.get('tooltipPane').get('contentView').set('value', "Copied".loc()); });
                });

                zeroClipboard.on('mouseover', function(zeroClipboard, args) {
                    SC.run(function() {
                        zeroClipboard.__textfieldCopySelectView.mouseEntered();
                        zeroClipboard.__copyButtonView.mouseEntered();
                    });
                });

                zeroClipboard.on('mouseout', function(zeroClipboard, args) {
                    SC.run(function() { zeroClipboard.__copyButtonView.mouseExited(); });
                });

                zeroClipboard.on('mousedown', function(zeroClipboard, args) {
                    SC.run(function() { zeroClipboard.__copyButtonView.set('isActive', YES); });
                });

                zeroClipboard.on('mouseup', function(zeroClipboard, args) {
                    SC.run(function() { zeroClipboard.__copyButtonView.set('isActive', NO); });
                });

                return sc_super();
            },
        }),

        selectButton: SC.ImageButtonView.design({
            layout: { top: 0, bottom: 0, width: 20 },
            classNames: ['select-button'],
            imageBinding: '.parentView.parentView.selectImage',

            tooltipPane: null,

            init: function() {
                var textfieldView = this.get('parentView').get('parentView');
                var tooltipValue = ( textfieldView.get('type') == 'password' )
                    ? "Reveal and select".loc()
                    : "Select".loc();

                var tooltipPane = SC.PickerPane.create({
                    layout: { width: 1, height: 22 },
                    classNames: ['textfieldCopySelectTooltip'],
                    preferType: SC.PICKER_POINTER,
                    preferMatrix: [3, 3, 3, 3, 3], // only bottom
                    isModal: NO, // Do not prevent access to others UI elements
                    acceptsKeyPane: NO, // Do not take keyboard focus when displayed
                    contentView: SC.LabelView.extend(SC.AutoResize, {
                        layout: { top: 0, bottom: 0, left: 5 },
                        value: tooltipValue,
                    }),

                    _measuredSizeDidChange: function() {
                        var measuredSize = this.get('contentView').get('measuredSize');
                        this.adjust('width', measuredSize.width + 10); // 5px padding
                    }.observes('contentView.measuredSize'),
                });
                this.set('tooltipPane', tooltipPane);

                return sc_super();
            },

            mouseEntered: function() {
                this.get('tooltipPane').popup(this);
            },

            mouseExited: function() {
                this.get('tooltipPane').remove();
            },

            action: function() {
                var textfieldView = this.get('parentView').get('parentView');
                if( textfieldView.get('type') == 'password' ) {
                    var element = document.getElementById( textfieldView.get('layerId') );
                    var inputs = $(element).find('input');
                    if( inputs.length > 0 ) {
                        inputs[0].type = 'text';
                    }
                }

                var value = textfieldView.get('value');
                var selection = SC.TextSelection.create({
                    start: 0,
                    end: value.length,
                });
                textfieldView.set('selection', selection);
                textfieldView.becomeFirstResponder(); // set('focused', YES) does not work on Firefox
            },
        }),
    }),
});
