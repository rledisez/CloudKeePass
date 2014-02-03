CloudKeePass.main = function main() {
    // Logging level
    if( CloudKeePass.logging_level < 4 ) console.debug = function() {};
    if( CloudKeePass.logging_level < 3 ) console.info = console.log = function() {};
    if( CloudKeePass.logging_level < 2 ) console.warn = function() {};
    if( CloudKeePass.logging_level < 1 ) console.error = function() {};

    // Initialize statechart
    var statechart = CloudKeePass.statechart;
    SC.RootResponder.responder.set('defaultResponder', statechart);
    statechart.initStatechart();
};

function main() { CloudKeePass.main(); }
