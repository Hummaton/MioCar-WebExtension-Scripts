function testActualDurationCalc() {

    // Original: 
    // Math.ceil(Math.abs(new Date(items[i].tripDropOffDatetime) - new Date(items[i].tripPickUpDatetime)) / (1000 * 60 * 60) * 4) / 4;
    function actual_duration_calc(date1, date2) {
        /* * * * * * * * * * * * * * * * * * * * * * * * *
        * Below code sets seconds to 0 so it does not affect calculations
        * 
        * I believe this is fine because when calculating "actual duration",
        * hours and minutes only matter. Manual calculations seem to ignore
        * seconds, so we can do the same. It does result in correct 
        * calculations and resolves the "bug" Alberto found. I think.
        * * * * * * * * * * * * * * * * * * * * * * * * */

        var start_date = new Date(date1);
        var end_date = new Date(date2);

        start_date.setSeconds(0);
        end_date.setSeconds(0);

        // converts milliseconds to hours then ceil() calculation w/ div for rounding to highest quarter
        return Math.ceil(Math.abs(end_date - start_date) / (1000 * 60 * 60) * 4) / 4; 
    }

    let testCases = [
            { start: "2025-02-10T05:33:58-0800", end: "2025-02-10T20:44:27-0800", expected: 15.25 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:15:00-0800", expected: 10.25 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:45:00-0800", expected: 10.75 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:11:00-0800", expected: 10.25 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:36:00-0800", expected: 10.75 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:53:00-0800", expected: 11.00 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:00:00-0800", expected: 10.00 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:30:00-0800", expected: 10.50 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:00:15-0800", expected: 10.00 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-10T20:30:15-0800", expected: 10.50 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-11T10:00:00-0800", expected: 24.00 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-11T10:00:39-0800", expected: 24.00 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-11T20:00:00-0800", expected: 34.00 },
            { start: "2025-02-10T10:00:00-0800", end: "2025-02-11T20:00:57-0800", expected: 34.00 },
            { start: "2023-11-01T15:45:00-0800", end: "2023-11-01T18:45:00-0800", expected: 3.00 },
            { start: "2023-11-01T16:30:00-0800", end: "2023-11-01T20:15:00-0800", expected: 3.75 },
            { start: "2023-11-01T17:30:00-0800", end: "2023-11-02T17:30:00-0800", expected: 24.00 },
            { start: "2023-11-01T18:30:00-0800", end: "2023-11-02T18:30:00-0800", expected: 24.00 },
            { start: "2023-11-01T18:45:00-0800", end: "2023-11-01T20:15:00-0800", expected: 1.50 },
            { start: "2023-11-01T22:00:00-0800", end: "2023-11-02T01:00:00-0800", expected: 3.00 },
            { start: "2023-11-02T06:15:00-0800", end: "2023-11-02T08:30:00-0800", expected: 2.25 },
            { start: "2023-11-02T07:30:00-0800", end: "2023-11-03T07:30:00-0800", expected: 24.00 },
            { start: "2023-11-02T07:45:00-0800", end: "2023-11-02T23:00:00-0800", expected: 15.25 },
            { start: "2023-11-02T09:00:00-0800", end: "2023-11-03T09:00:00-0800", expected: 24.00 },

            // Real Miocar data 
            { start: "2025-02-27T20:08:21-0800", end: "2025-02-28T18:23:14-0800", expected: 22.25 },
            { start: "2025-02-23T19:38:41-0800", end: "2025-02-24T16:26:54-0800", expected: 21.00 },
            { start: "2025-02-20T16:16:58-0800", end: "2025-02-20T23:44:25-0800", expected: 7.50 },
            { start: "2025-02-28T18:02:41-0800", end: "2025-02-28T22:19:54-0800", expected: 4.50 },
            { start: "2025-02-26T15:13:18-0800", end: "2025-02-26T20:57:14-0800", expected: 5.75 },
            { start: "2025-02-23T12:02:35-0800", end: "2025-02-23T23:29:43-0800", expected: 11.50 },
            { start: "2025-02-22T17:23:15-0800", end: "2025-02-22T23:34:41-0800", expected: 6.25 },
            { start: "2025-02-19T14:09:21-0800", end: "2025-02-19T23:28:20-0800", expected: 9.50 },
            { start: "2025-02-06T19:31:46-0800", end: "2025-02-06T23:44:15-0800", expected: 4.25 },
            { start: "2025-02-03T17:33:49-0800", end: "2025-02-03T21:01:07-0800", expected: 3.50 },
            { start: "2025-02-02T14:01:32-0800", end: "2025-02-02T23:50:46-0800", expected: 10.00 },
            { start: "2025-02-01T14:00:34-0800", end: "2025-02-02T00:04:11-0800", expected: 10.25 },
            { start: "2025-02-02T09:17:13-0800", end: "2025-02-02T21:36:34-0800", expected: 12.50 },
            { start: "2025-02-01T09:21:26-0800", end: "2025-02-01T14:44:17-0800", expected: 5.50 },
            { start: "2025-02-08T07:59:27-0800", end: "2025-02-09T10:37:35-0800", expected: 26.75 },
            { start: "2025-02-28T21:03:02-0800", end: "2025-02-28T22:49:01-0800", expected: 2.00 },
            { start: "2025-02-26T18:36:32-0800", end: "2025-02-26T20:20:21-0800", expected: 1.75 },
            { start: "2025-02-24T17:39:38-0800", end: "2025-02-24T19:52:47-0800", expected: 2.25 },
            { start: "2025-02-20T20:20:33-0800", end: "2025-02-20T22:21:27-0800", expected: 2.25 },
            { start: "2025-02-18T15:19:00-0800", end: "2025-02-18T16:45:08-0800", expected: 1.50 },
            { start: "2025-02-17T20:43:43-0800", end: "2025-02-17T21:52:13-0800", expected: 1.25 },
            { start: "2025-02-15T15:51:27-0800", end: "2025-02-15T21:32:04-0800", expected: 5.75 },
            { start: "2025-02-13T17:33:22-0800", end: "2025-02-13T19:27:46-0800", expected: 2.00 },
            { start: "2025-02-12T19:59:35-0800", end: "2025-02-12T20:50:24-0800", expected: 1.00 },
            
            // Multi-day durations
            { start: "2025-02-27T20:08:21-0800", end: "2025-02-28T18:23:14-0800", expected: 22.25 },
            { start: "2025-02-23T19:38:41-0800", end: "2025-02-24T16:26:54-0800", expected: 21.00 },
            { start: "2025-02-08T07:59:27-0800", end: "2025-02-09T10:37:35-0800", expected: 26.75 },

            // Same-day durations with quarter-hour rounding
            { start: "2025-02-20T16:16:58-0800", end: "2025-02-20T23:44:25-0800", expected: 7.50 },
            { start: "2025-02-28T18:02:41-0800", end: "2025-02-28T22:19:54-0800", expected: 4.50 },
            { start: "2025-02-26T15:13:18-0800", end: "2025-02-26T20:57:14-0800", expected: 5.75 },

            // Short durations under 2 hours
            { start: "2025-02-26T18:36:32-0800", end: "2025-02-26T20:20:21-0800", expected: 1.75 },
            { start: "2025-02-24T17:39:38-0800", end: "2025-02-24T19:52:47-0800", expected: 2.25 },
            { start: "2025-02-20T20:20:33-0800", end: "2025-02-20T22:21:27-0800", expected: 2.25 },

            // Edge case: Exactly on quarter-hour intervals (should NOT round up)
            { start: "2025-02-12T19:59:35-0800", end: "2025-02-12T20:50:24-0800", expected: 1.00 },
            { start: "2025-02-13T17:33:22-0800", end: "2025-02-13T19:27:46-0800", expected: 2.00 },
            { start: "2025-02-01T14:00:34-0800", end: "2025-02-02T00:04:11-0800", expected: 10.25 },

            // Edge case: Crossing midnight
            { start: "2025-02-01T09:21:26-0800", end: "2025-02-01T14:44:17-0800", expected: 5.50 },
            { start: "2025-02-06T19:31:46-0800", end: "2025-02-06T23:44:15-0800", expected: 4.25 },
            { start: "2025-02-03T17:33:49-0800", end: "2025-02-03T21:01:07-0800", expected: 3.50 },

            // Rounding up to nearest quarter-hour
            { start: "2025-02-17T20:43:43-0800", end: "2025-02-17T21:52:13-0800", expected: 1.25 }, // Rounded up from 1.14
            { start: "2025-02-18T15:19:00-0800", end: "2025-02-18T16:45:08-0800", expected: 1.50 }, // Rounded up from 1.43
            { start: "2025-02-15T15:51:27-0800", end: "2025-02-15T21:32:04-0800", expected: 5.75 }, // Rounded up from 5.68

            // Rounding down to nearest quarter-hour
            { start: "2025-02-28T21:03:02-0800", end: "2025-02-28T22:49:01-0800", expected: 2.00 }, // Rounded up from 1.77
            { start: "2025-02-26T18:36:32-0800", end: "2025-02-26T20:20:21-0800", expected: 1.75 }, // Rounded up from 1.74

            // Edge case: Shortest duration (should still be at least 1 hour if applicable)
            { start: "2025-02-12T19:59:35-0800", end: "2025-02-12T20:04:24-0800", expected: 0.25 }, // Less than 15 min, but should be 0.25
            { start: "2025-02-12T19:45:00-0800", end: "2025-02-12T20:00:00-0800", expected: 0.25 }, // Exactly 15 min, should be 0.25

               // Exact multi-day durations (whole days)
            { start: "2025-02-01T12:00:00-0800", end: "2025-02-02T12:00:00-0800", expected: 24.00 }, // Exactly 24 hours
            { start: "2025-02-01T08:30:00-0800", end: "2025-02-03T08:30:00-0800", expected: 48.00 }, // Exactly 2 days
            { start: "2025-02-01T00:00:00-0800", end: "2025-02-08T00:00:00-0800", expected: 168.00 }, // Exactly 1 week

            // Crossing a weekend
            { start: "2025-02-07T15:45:00-0800", end: "2025-02-10T09:20:00-0800", expected: 65.75 }, // Rounded up from 65.58
            { start: "2025-02-08T18:10:00-0800", end: "2025-02-11T07:55:00-0800", expected: 61.75 }, // Rounded up from 61.75 (stays)

            // Crossing different months
            { start: "2025-02-27T10:05:00-0800", end: "2025-03-03T10:05:00-0800", expected: 96.00 }, // 4 days, exactly 96 hrs
            { start: "2025-01-30T23:45:00-0800", end: "2025-02-04T06:15:00-0800", expected: 102.50 }, // Rounded up from 102.42

            // Week-long durations
            { start: "2025-02-10T14:00:00-0800", end: "2025-02-17T14:00:00-0800", expected: 168.00 }, // Exactly 1 week

            { start: "2025-02-15T09:30:00-0800", end: "2025-02-22T07:45:00-0800", expected: 166.25 }, // Rounded up from 165.91

            // Leap year scenario (2024 has Feb 29)
            { start: "2024-02-27T11:15:00-0800", end: "2024-03-01T14:45:00-0800", expected: 75.50 }, // Stays at 75.50

            // Random long bookings
            { start: "2025-03-01T05:00:00-0800", end: "2025-03-08T17:30:00-0800", expected: 180.50 }, // Rounded up from 186.46
            { start: "2025-01-15T06:45:00-0800", end: "2025-01-25T22:20:00-0800", expected: 255.75 }, // Rounded up from 255.58

            // Edge case: 1 minute before a full day (round up)
            { start: "2025-02-01T14:00:00-0800", end: "2025-02-02T13:59:00-0800", expected: 24.00 }, // Rounded up from 23.98

            // Edge case: 1 minute over a full day (should round up)
            { start: "2025-02-01T14:00:00-0800", end: "2025-02-02T14:01:00-0800", expected: 24.25 }, // Already at 24.01, should round up

            // Small fractional values rounded up
            { start: "2025-02-14T10:05:00-0800", end: "2025-02-14T11:18:00-0800", expected: 1.25 }, // Rounded up from 1.22
            { start: "2025-02-14T20:50:00-0800", end: "2025-02-14T22:07:00-0800", expected: 1.50 }, // Rounded up from 1.28



    ];

    let allPassed = true;
    testCases.forEach((test, index) => {
        let diff = actual_duration_calc(test.start, test.end);
        if (diff !== test.expected) {
            console.log(`Test ${index + 1} Failed: Expected ${test.expected}, Got ${diff}`);
            console.log(`Start: ${test.start}, End: ${test.end}`);  

            // Convert to Date objects
            let start_dt = new Date(test.start);
            let end_dt = new Date(test.end);

            // Calculate difference in hours
            let time_difference_hours = (end_dt - start_dt) / (1000 * 60 * 60);

            console.log("Actual difference: ", time_difference_hours);
            console.log("\n");
            allPassed = false;
        }
    });
    
    if (allPassed) {console.log("All tests passed!");}


}

testActualDurationCalc();



console.log("TESTING COMPLETE");


