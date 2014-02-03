CloudKeePass.XHRBinaryResponse = SC.XHRResponse.extend({
    createRequest: function() {
        var rawRequest = sc_super();
        rawRequest.open = function() {
            this.constructor.prototype.open.apply(this,arguments);
            this.responseType = 'arraybuffer';
        };
        return rawRequest;
    },
});
