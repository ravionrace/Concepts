// ===============================
// SCRIPT 1: Quick Inactive Reports List
// ===============================

(function quickInactiveReports() {
    var MONTHS_INACTIVE = 6;
    var CUTOFF_DATE = new GlideDateTime();
    CUTOFF_DATE.addMonthsUTC(-MONTHS_INACTIVE);
    
    gs.info('=== INACTIVE REPORTS (Last ' + MONTHS_INACTIVE + ' months) ===');
    gs.info('SysID,Report Name,Table,Last Run,Total Runs,Created By');
    
    var reportGR = new GlideRecord('sys_report');
    reportGR.query();
    
    while (reportGR.next()) {
        var isInactive = true;
        var lastRun = 'Never';
        var totalRuns = 0;
        
        var statsGR = new GlideRecord('report_stats');
        statsGR.addQuery('report', reportGR.getUniqueValue());
        statsGR.query();
        
        if (statsGR.next()) {
            lastRun = statsGR.getValue('last_run');
            totalRuns = parseInt(statsGR.getValue('total_times_run')) || 0;
            
            if (lastRun) {
                var lastRunDate = new GlideDateTime(lastRun);
                isInactive = lastRunDate.before(CUTOFF_DATE);
            }
        }
        
        if (isInactive) {
            var csvLine = [
                reportGR.getUniqueValue(),
                '"' + reportGR.getDisplayValue('title') + '"',
                reportGR.getDisplayValue('table'),
                lastRun,
                totalRuns,
                reportGR.getDisplayValue('sys_created_by')
            ].join(',');
            gs.info(csvLine);
        }
    }
})();

// ===============================
// SCRIPT 2: Reports with Custom Scripts
// ===============================

(function reportsWithCustomScripts() {
    gs.info('=== REPORTS WITH CUSTOM SCRIPTS ===');
    gs.info('SysID,Report Name,Table,Script Type,Created By');
    
    var reportGR = new GlideRecord('sys_report');
    reportGR.query();
    
    while (reportGR.next()) {
        var customScripts = [];
        
        // Check definition for scripts
        var definition = reportGR.getValue('definition');
        if (definition) {
            if (definition.indexOf('script:') > -1) customScripts.push('Definition Script');
            if (definition.indexOf('javascript:') > -1) customScripts.push('JavaScript');
            if (definition.indexOf('function(') > -1) customScripts.push('Function');
        }
        
        // Check field list for formatters
        var fieldList = reportGR.getValue('field_list');
        if (fieldList && fieldList.indexOf('FORMATTER:') > -1) {
            customScripts.push('Custom Formatter');
        }
        
        // Check filter for JavaScript
        var filter = reportGR.getValue('filter');
        if (filter && (filter.indexOf('JAVASCRIPT:') > -1 || filter.indexOf('script:') > -1)) {
            customScripts.push('Filter Script');
        }
        
        if (customScripts.length > 0) {
            var csvLine = [
                reportGR.getUniqueValue(),
                '"' + reportGR.getDisplayValue('title') + '"',
                reportGR.getDisplayValue('table'),
                '"' + customScripts.join('; ') + '"',
                reportGR.getDisplayValue('sys_created_by')
            ].join(',');
            gs.info(csvLine);
        }
    }
})();

// ===============================
// SCRIPT 3: Dashboards with Content Blocks
// ===============================

(function dashboardsWithContentBlocks() {
    gs.info('=== DASHBOARDS WITH CONTENT BLOCKS ===');
    gs.info('SysID,Dashboard Name,Content Block Types,Created By');
    
    var dashboardGR = new GlideRecord('pa_dashboards');
    dashboardGR.query();
    
    while (dashboardGR.next()) {
        var contentTypes = [];
        var definition = dashboardGR.getValue('definition');
        
        if (definition) {
            if (definition.indexOf('content_block') > -1) contentTypes.push('Content Block');
            if (definition.indexOf('iframe') > -1) contentTypes.push('iFrame');
            if (definition.indexOf('html_block') > -1) contentTypes.push('HTML Block');
            if (definition.indexOf('<script') > -1) contentTypes.push('Custom Script');
            if (definition.indexOf('javascript:') > -1) contentTypes.push('JavaScript');
        }
        
        if (contentTypes.length > 0) {
            var csvLine = [
                dashboardGR.getUniqueValue(),
                '"' + dashboardGR.getDisplayValue('name') + '"',
                '"' + contentTypes.join('; ') + '"',
                dashboardGR.getDisplayValue('sys_created_by')
            ].join(',');
            gs.info(csvLine);
        }
    }
})();

// ===============================
// SCRIPT 4: Interactive Filters with Custom Code
// ===============================

(function interactiveFiltersWithCode() {
    gs.info('=== INTERACTIVE FILTERS WITH CUSTOM CODE ===');
    gs.info('SysID,Filter Name,Dashboard,Script Length,Created By');
    
    var filterGR = new GlideRecord('pa_interactive_filters');
    filterGR.query();
    
    while (filterGR.next()) {
        var script = filterGR.getValue('script');
        if (script && script.trim().length > 0) {
            var csvLine = [
                filterGR.getUniqueValue(),
                '"' + filterGR.getDisplayValue('name') + '"',
                '"' + filterGR.getDisplayValue('dashboard') + '"',
                script.length,
                filterGR.getDisplayValue('sys_created_by')
            ].join(',');
            gs.info(csvLine);
        }
    }
})();

// ===============================
// SCRIPT 5: Combined Risk Assessment
// ===============================

(function combinedRiskAssessment() {
    var MONTHS_INACTIVE = 6;
    var CUTOFF_DATE = new GlideDateTime();
    CUTOFF_DATE.addMonthsUTC(-MONTHS_INACTIVE);
    
    gs.info('=== COMBINED RISK ASSESSMENT ===');
    gs.info('Type,SysID,Name,Inactive,CustomCode,MigrationRisk,Action Required');
    
    // Analyze Reports
    var reportGR = new GlideRecord('sys_report');
    reportGR.query();
    
    while (reportGR.next()) {
        var isInactive = true;
        var hasCustomCode = false;
        var migrationRisk = 'LOW';
        var actionRequired = 'Monitor';
        
        // Check if inactive
        var statsGR = new GlideRecord('report_stats');
        statsGR.addQuery('report', reportGR.getUniqueValue());
        statsGR.query();
        
        if (statsGR.next() && statsGR.getValue('last_run')) {
            var lastRunDate = new GlideDateTime(statsGR.getValue('last_run'));
            isInactive = lastRunDate.before(CUTOFF_DATE);
        }
        
        // Check for custom code
        var definition = reportGR.getValue('definition') || '';
        var fieldList = reportGR.getValue('field_list') || '';
        var filter = reportGR.getValue('filter') || '';
        
        if (definition.indexOf('script:') > -1 || 
            definition.indexOf('javascript:') > -1 ||
            fieldList.indexOf('FORMATTER:') > -1 ||
            filter.indexOf('JAVASCRIPT:') > -1) {
            hasCustomCode = true;
            migrationRisk = 'HIGH';
            actionRequired = 'Recreate in Platform Analytics';
        }
        
        // Only show if inactive AND has issues
        if (isInactive && (hasCustomCode || migrationRisk !== 'LOW')) {
            var csvLine = [
                'Report',
                reportGR.getUniqueValue(),
                '"' + reportGR.getDisplayValue('title') + '"',
                isInactive,
                hasCustomCode,
                migrationRisk,
                '"' + actionRequired + '"'
            ].join(',');
            gs.info(csvLine);
        }
    }
    
    // Analyze Dashboards
    var dashboardGR = new GlideRecord('pa_dashboards');
    dashboardGR.query();
    
    while (dashboardGR.next()) {
        var hasCustomCode = false;
        var migrationRisk = 'LOW';
        var actionRequired = 'Standard Migration';
        
        var definition = dashboardGR.getValue('definition') || '';
        
        if (definition.indexOf('<script') > -1 || 
            definition.indexOf('javascript:') > -1 ||
            definition.indexOf('content_block') > -1 ||
            definition.indexOf('iframe') > -1) {
            hasCustomCode = true;
            migrationRisk = 'HIGH';
            actionRequired = 'Review and Recreate Components';
        }
        
        // Check widgets
        var widgetGR = new GlideRecord('pa_widgets');
        widgetGR.addQuery('dashboard', dashboardGR.getUniqueValue());
        widgetGR.query();
        
        while (widgetGR.next()) {
            var widgetDef = widgetGR.getValue('definition') || '';
            if (widgetDef.indexOf('<script') > -1 || widgetDef.indexOf('client_script') > -1) {
                hasCustomCode = true;
                migrationRisk = 'HIGH';
                actionRequired = 'Recreate Widgets in Platform Analytics';
                break;
            }
        }
        
        if (hasCustomCode) {
            var csvLine = [
                'Dashboard',
                dashboardGR.getUniqueValue(),
                '"' + dashboardGR.getDisplayValue('name') + '"',
                'Unknown', // Dashboard usage harder to determine
                hasCustomCode,
                migrationRisk,
                '"' + actionRequired + '"'
            ].join(',');
            gs.info(csvLine);
        }
    }
})();
