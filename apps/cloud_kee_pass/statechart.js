CloudKeePass.statechart = SC.Statechart.create({
    trace: NO,
    initialState: 'openDatabaseState',

    openDatabaseState: SC.State.plugin('CloudKeePass.OpenDatabaseState'),
    operateDatabaseState: SC.State.plugin('CloudKeePass.OperateDatabaseState'),
});
