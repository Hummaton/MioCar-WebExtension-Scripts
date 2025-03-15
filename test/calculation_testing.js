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
            
            
    ];

    let allPassed = true;
    testCases.forEach((test, index) => {
        let diff = actual_duration_calc(test.start, test.end);
        if (diff !== test.expected) {
            console.log(`Test ${index + 1} Failed: Expected ${test.expected}, Got ${diff}`);
            allPassed = false;
        }
    });
    
    if (allPassed) {console.log("All tests passed!");}


}

testActualDurationCalc();



console.log("TESTING COMPLETE");


