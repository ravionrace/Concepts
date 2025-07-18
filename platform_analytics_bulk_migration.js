/**
 * Bulk Migration Exclusion Script
 * Automatically marks problematic reports and dashboards as "Do not migrate in bulk"
 * Based on the criteria: inactive + custom code/filters
 */

(function bulkExclusionUpdate() {
    
    var MONTHS_INACTIVE = 6;
    var CUTOFF_DATE = new GlideDateTime();
    CUTOFF_DATE.addMonthsUTC(-MONTHS_INACTIVE);
    
    var counters = {
        reportsExcluded: 0,
        dashboardsExcluded: 0,
        reportErrors: 0,
        dashboardErrors: 0
    };
    
    gs.info('=== BULK MIGRATION EXCLUSION PROCESS ===');
    gs.info('Marking inactive content with custom code as "Do not migrate in bulk"');
    gs.info('Cutoff date: ' + CUTOFF_DATE.getDisplayValue());
    
    // ===============================
    // EXCLUDE PROBLEMATIC REPORTS
    // ===============================
    
    function excludeReports() {
        gs.info('--- Processing Reports ---');
        
        var reportGR = new GlideRecord('sys_report');
        reportGR.query();
        
        while (reportGR.next()) {
            try {
                var shouldExclude = false;
                var reasons = [];
                
                // Check if inactive
                var isInactive = true;
                var statsGR = new GlideRecord('report_stats');
                statsGR.addQuery('report', reportGR.getUniqueValue());
                statsGR.query();
                
                if (statsGR.next() && statsGR.getValue('last_run')) {
                    var lastRunDate = new GlideDateTime(statsGR.getValue('last_run'));
                    isInactive = lastRunDate.before(CUTOFF_DATE);
                }
                
                if (!isInactive) continue; // Skip active reports
                
                // Check for custom code/scripts
                var definition = reportGR.getValue('definition') || '';
                var fieldList = reportGR.getValue('field_list') || '';
                var filter = reportGR.getValue('filter') || '';
                
                if (definition.indexOf('script:') > -1 || definition.indexOf('javascript:') > -1) {
                    shouldExclude = true;
                    reasons.push('Custom scripts in definition');
                }
                
                if (fieldList.indexOf('FORMATTER:') > -1) {
                    shouldExclude = true;
                    reasons.push('Custom formatters');
                }
                
                if (filter.indexOf('JAVASCRIPT:') > -1 || filter.indexOf('script:') > -1) {
                    shouldExclude = true;
                    reasons.push('Custom filter scripts');
                }
                
                // Check for problematic report types
                var reportType = reportGR.getValue('type');
                var problematicTypes = ['advanced_chart', 'custom_chart', 'calendar', 'gauge', 'funnel'];
                if (problematicTypes.indexOf(reportType) > -1) {
                    shouldExclude = true;
                    reasons.push('Problematic report type: ' + reportType);
                }
                
                if (shouldExclude) {
                    // Check if the field exists
                    if (reportGR.isValidField('u_do_not_migrate_in_bulk')) {
                        reportGR.setValue('u_do_not_migrate_in_bulk', true);
                        reportGR.update();
                        counters.reportsExcluded++;
                        
                        gs.info('EXCLUDED Report: ' + reportGR.getDisplayValue('title') + 
                                ' (' + reportGR.getUniqueValue() + ')');
                        gs.info('  Reasons: ' + reasons.join('; '));
                    } else {
                        // If field doesn't exist, add comment to work notes or create update set instruction
                        gs.info('MARKED FOR EXCLUSION: ' + reportGR.getDisplayValue('title') + 
                                ' (' + reportGR.getUniqueValue() + ')');
                        gs.info('  Reasons: ' + reasons.join('; '));
                        gs.info('  Note: Manual exclusion required - field not found');
                        counters.reportsExcluded++;
                    }
                }
                
            } catch (error) {
                counters.reportErrors++;
                gs.error('Error processing report ' + reportGR.getUniqueValue() + ': ' + error.toString());
            }
        }
    }
    
    // ===============================
    // EXCLUDE PROBLEMATIC DASHBOARDS
    // ===============================
    
    function excludeDashboards() {
        gs.info('--- Processing Performance Analytics Dashboards ---');
        
        var dashboardGR = new GlideRecord('pa_dashboards');
        dashboardGR.query();
        
        while (dashboardGR.next()) {
            try {
                var shouldExclude = false;
                var reasons = [];
                
                // Check for custom code in definition
                var definition = dashboardGR.getValue('definition') || '';
                
                if (definition.indexOf('<script') > -1 || definition.indexOf('javascript:') > -1) {
                    shouldExclude = true;
                    reasons.push('Custom JavaScript in dashboard');
                }
                
                if (definition.indexOf('content_block') > -1) {
                    shouldExclude = true;
                    reasons.push('Content blocks (may go to compatibility mode)');
                }
                
                if (definition.indexOf('iframe') > -1) {
                    shouldExclude = true;
                    reasons.push('iFrame content');
                }
                
                if (definition.indexOf('html_block') > -1) {
                    shouldExclude = true;
                    reasons.push('HTML blocks');
                }
                
                // Check widgets for custom scripts
                var widgetGR = new GlideRecord('pa_widgets');
                widgetGR.addQuery('dashboard', dashboardGR.getUniqueValue());
                widgetGR.query();
                
                while (widgetGR.next()) {
                    var widgetDef = widgetGR.getValue('definition') || '';
                    if (widgetDef.indexOf('<script') > -1 || widgetDef.indexOf('client_script') > -1) {
                        shouldExclude = true;
                        reasons.push('Custom scripts in widget: ' + widgetGR.getDisplayValue('name'));
                        break;
                    }
                }
                
                // Check for interactive filters with scripts
                var filterGR = new GlideRecord('pa_interactive_filters');
                filterGR.addQuery('dashboard', dashboardGR.getUniqueValue());
                filterGR.query();
                
                while (filterGR.next()) {
                    var script = filterGR.getValue('script');
                    if (script && script.trim().length > 0) {
                        shouldExclude = true;
                        reasons.push('Custom interactive filter: ' + filterGR.getDisplayValue('name'));
                        break;
                    }
                }
                
                if (shouldExclude) {
                    if (dashboardGR.isValidField('u_do_not_migrate_in_bulk')) {
                        dashboardGR.setValue('u_do_not_migrate_in_bulk', true);
                        dashboardGR.update();
                        counters.dashboardsExcluded++;
                        
                        gs.info('EXCLUDED Dashboard: ' + dashboardGR.getDisplayValue('name') + 
                                ' (' + dashboardGR.getUniqueValue() + ')');
                        gs.info('  Reasons: ' + reasons.join('; '));
                    } else {
                        gs.info('MARKED FOR EXCLUSION: ' + dashboardGR.getDisplayValue('name') + 
                                ' (' + dashboardGR.getUniqueValue() + ')');
                        gs.info('  Reasons: ' + reasons.join('; '));
                        gs.info('  Note: Manual exclusion required - field not found');
                        counters.dashboardsExcluded++;
                    }
                }
                
            } catch (error) {
                counters.dashboardErrors++;
                gs.error('Error processing dashboard ' + dashboardGR.getUniqueValue() + ': ' + error.toString());
            }
        }
    }
    
    // ===============================
    // EXCLUDE RESPONSIVE DASHBOARDS
    // ===============================
    
    function excludeResponsiveDashboards() {
        gs.info('--- Processing Responsive Dashboards ---');
        
        var responsiveGR = new GlideRecord('pa_dashboards_do');
        responsiveGR.query();
        
        while (responsiveGR.next()) {
            try {
                var shouldExclude = false;
                var reasons = [];
                
                // Check for custom interactive filters
                var filterGR = new GlideRecord('pa_interactive_filters');
                filterGR.addQuery('dashboard', responsiveGR.getUniqueValue());
                filterGR.query();
                
                while (filterGR.next()) {
                    var script = filterGR.getValue('script');
                    if (script && script.trim().length > 0) {
                        shouldExclude = true;
                        reasons.push('Custom interactive filter: ' + filterGR.getDisplayValue('name'));
                    }
                }
                
                // Conservative approach - mark all responsive dashboards for review
                shouldExclude = true;
                reasons.push('Responsive dashboard - requires manual review');
                
                if (shouldExclude) {
                    if (responsiveGR.isValidField('u_do_not_migrate_in_bulk')) {
                        responsiveGR.setValue('u_do_not_migrate_in_bulk', true);
                        responsiveGR.update();
                        counters.dashboardsExcluded++;
                        
                        gs.info('EXCLUDED Responsive Dashboard: ' + responsiveGR.getDisplayValue('name') + 
                                ' (' + responsiveGR.getUniqueValue() + ')');
                        gs.info('  Reasons: ' + reasons.join('; '));
                    } else {
                        gs.info('MARKED FOR EXCLUSION: ' + responsiveGR.getDisplayValue('name') + 
                                ' (' + responsiveGR.getUniqueValue() + ')');
                        gs.info('  Reasons: ' + reasons.join('; '));
                        counters.dashboardsExcluded++;
                    }
                }
                
            } catch (error) {
                counters.dashboardErrors++;
                gs.error('Error processing responsive dashboard ' + responsiveGR.getUniqueValue() + ': ' + error.toString());
            }
        }
    }
    
    // ===============================
    // GENERATE EXCLUSION SUMMARY
    // ===============================
    
    function generateSummary() {
        gs.info('\n=== BULK EXCLUSION SUMMARY ===');
        gs.info('Reports excluded: ' + counters.reportsExcluded);
        gs.info('Dashboards excluded: ' + counters.dashboardsExcluded);
        gs.info('Report processing errors: ' + counters.reportErrors);
        gs.info('Dashboard processing errors: ' + counters.dashboardErrors);
        
        var totalExcluded = counters.reportsExcluded + counters.dashboardsExcluded;
        gs.info('Total items excluded: ' + totalExcluded);
        
        if (totalExcluded > 0) {
            gs.info('\nNext Steps:');
            gs.info('1. Review excluded items in your Core UI tables');
            gs.info('2. Plan recreation of critical excluded content in Platform Analytics');
            gs.info('3. Run migration for remaining content');
            gs.info('4. Test migrated content thoroughly');
        }
    }
    
    // ===============================
    // EXECUTE EXCLUSION PROCESS
    // ===============================
    
    try {
        // WARNING: This script modifies data
        // Comment out the following lines if you want to run in analysis mode only
        
        excludeReports();
        excludeDashboards();
        excludeResponsiveDashboards();
        generateSummary();
        
        gs.info('\n=== EXCLUSION PROCESS COMPLETE ===');
        
    } catch (error) {
        gs.error('Error during exclusion process: ' + error.toString());
    }
    
})();

// ===============================
// DRY RUN VERSION (Analysis Only)
// ===============================

/*
 * Uncomment this function and comment out the main function above
 * if you want to run in analysis mode without making changes
 */

/*
(function dryRunAnalysis() {
    // Same logic as above but without the .update() calls
    // Just logs what WOULD be excluded
})();
*/
