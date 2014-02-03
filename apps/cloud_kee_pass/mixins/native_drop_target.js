CloudKeePass.NativeDropTarget = {
    nativeDropTargetActive: NO,
    dragEntered: function(event) {},
    dragExited: function(event) {},
    dragDropped: function(event) {},

    didAppendToDocument: function() {
        var id = this.get('layerId');
        var element = document.getElementById(id);
        element.__sc_view = this;

        element.ondragover = function(event) {
            event.preventDefault();
        }

        element.ondragenter = function(event) {
            event.preventDefault();
            SC.run(function() {
                this.set('nativeDropTargetActive', YES);

                if( this.dragEntered ) { this.dragEntered(event); }
            }, this.__sc_view);
        };

        element.ondragleave = function(event) {
            event.preventDefault();
            // Check if the cursor is really out of the element (and not on a child element)
            var rect = this.getBoundingClientRect();
            if( event.clientX <= rect.left
                || event.clientX >= (rect.left + rect.width)
                || event.clientY <= rect.top
                || event.clientY >= (rect.top + rect.height)
            ) {
                SC.run(function() {
                    this.set('nativeDropTargetActive', NO);

                    if( this.dragExited ) { this.dragExited(event); }
                }, this.__sc_view);
            }
        };

        element.ondrop = function(event) {
            event.preventDefault();
            SC.run(function() {
                this.set('nativeDropTargetActive', NO);

                if( this.dragDropped ) { this.dragDropped(event); }
            }, this.__sc_view);
        };

        return sc_super();
    },
};
