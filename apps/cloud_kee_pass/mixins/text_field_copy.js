sc_require('library/vendors/ZeroClipboard');

CloudKeePass.TextFieldCopy = {
    didAppendToDocument: function() {
        var id = this.get('layerId');
        var element = document.getElementById(id);
        element._textField = this;

        var clip = new ZeroClipboard(element, {
            moviePath: sc_static('ZeroClipboard.swf'),
            forceHandCursor: YES,
        });

        clip.on('dataRequested', function(client, args) {
            client.setText( this._textField.get('value') );
        });

        return sc_super();
    },
};
