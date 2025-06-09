// System Definition > Scheduled Script Execution
// Run every 5 minutes to monitor API performance

var ApiMonitor = {
    
    checkRecentApiCalls: function() {
        var gr = new GlideRecord('ecc_queue');
        gr.addQuery('topic', 'LIKE', '%REST%');
        gr.addQuery('state', 'processed');
        gr.addQuery('sys_created_on', '>', gs.minutesAgoStart(5)); // Last 5 minutes
        gr.query();
        
        var totalCalls = 0;
        var totalDuration = 0;
        var slowCalls = 0;
        var errorCalls = 0;
        
        while (gr.next()) {
            totalCalls++;
            
            var created = new GlideDateTime(gr.sys_created_on);
            var processed = new GlideDateTime(gr.processed);
            var duration = processed.getNumericValue() - created.getNumericValue();
            
            totalDuration += duration;
            
            if (duration > 30000) { // > 30 seconds
                slowCalls++;
                this.logSlowCall(gr);
            }
            
            if (gr.state == 'error') {
                errorCalls++;
            }
        }
        
        var avgDuration = totalCalls > 0 ? (totalDuration / totalCalls) : 0;
        
        // Log summary metrics
        gs.log("API_SUMMARY: Calls=" + totalCalls + 
               ", AvgDuration=" + avgDuration + "ms" +
               ", SlowCalls=" + slowCalls + 
               ", Errors=" + errorCalls);
        
        // Create alerts if needed
        if (slowCalls > 5) {
            gs.eventQueue('api.performance.degraded', null, 
                         'Multiple slow API calls detected: ' + slowCalls);
        }
    },
    
    logSlowCall: function(eccRecord) {
        var details = {
            agent: eccRecord.agent.toString(),
            name: eccRecord.name.toString(),
            endpoint: this.extractEndpoint(eccRecord.payload.toString()),
            created: eccRecord.sys_created_on.toString(),
            processed: eccRecord.processed.toString()
        };
        
        gs.log("SLOW_API_CALL: " + JSON.stringify(details));
    },
    
    extractEndpoint: function(payload) {
        // Extract endpoint from payload (implementation depends on format)
        try {
            var payloadObj = JSON.parse(payload);
            return payloadObj.endpoint || payloadObj.url || 'unknown';
        } catch (e) {
            return 'unknown';
        }
    }
};

// Execute monitoring
ApiMonitor.checkRecentApiCalls();
