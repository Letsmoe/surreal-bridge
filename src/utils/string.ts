import { SurrealExpression } from "../SurrealExpression";

export namespace SurrealStringUtils {
	export function lowercase(value: string) {
		return `string::lowercase(${value})`;
	}

	export function time() {
		return {
			// Extracts the day as a number from a datetime
			day: () => new SurrealExpression("time::day()"),
			// Rounds a datetime down by a specific duration
			floor: () => new SurrealExpression("time::floor()"),
			// Outputs a datetime according to a specific format
			format: () => new SurrealExpression("time::format()"),
			// Groups a datetime by a particular time interval
			group: () => new SurrealExpression("time::group()"),
			// Extracts the hour as a number from a datetime
			hour: () => new SurrealExpression("time::hour()"),
			// Finds the most recent datetime in an array
			max: () => new SurrealExpression("time::max()"),
			// Extracts the microseconds as a number from a datatime
			micros: () => new SurrealExpression("time::micros()"),
			// Extracts the milliseconds as a number from a datatime
			millis: () => new SurrealExpression("time::millis()"),
			// Finds the least recent datetime in an array
			min: () => new SurrealExpression("time::min()"),
			// Extracts the minutes as a number from a datetime
			minute: () => new SurrealExpression("time::minute()"),
			// Extracts the month as a number from a datetime
			month: () => new SurrealExpression("time::month()"),
			// Returns the number of nanoseconds since the UNIX epoch
			nano: () => new SurrealExpression("time::nano()"),
			// Returns the current datetime
			now: () => new SurrealExpression("time::now()"),
			// Rounds a datetime to the nearest multiple of a specific duration
			round: () => new SurrealExpression("time::round()"),
			// Extracts the second as a number from a datetime
			second: () => new SurrealExpression("time::second()"),
			// Returns the current local timezone offset in hours
			timezone: () => new SurrealExpression("time::timezone()"),
			// Returns the number of seconds since the UNIX epoch
			unix: () => new SurrealExpression("time::unix()"),
			// Extracts the week day as a number from a datetime
			wday: () => new SurrealExpression("time::wday()"),
			// Extracts the week as a number from a datetime
			week: () => new SurrealExpression("time::week()"),
			// Extracts the yday as a number from a datetime
			yday: () => new SurrealExpression("time::yday()"),
			// Extracts the year as a number from a datetime
			year: () => new SurrealExpression("time::year()"),
			// Calculates a datetime based on the microseconds since January 1, 1970 0:00:00 UTC.
			frommicros: () => new SurrealExpression("time::from::micros()"),
			// Calculates a datetime based on the milliseconds since January 1, 1970 0:00:00 UTC.
			frommillis: () => new SurrealExpression("time::from::millis()"),
			// Calculates a datetime based on the nanoseconds since January 1, 1970 0:00:00 UTC.
			fromnanos: () => new SurrealExpression("time::from::nanos()"),
			// Calculates a datetime based on the seconds since January 1, 1970 0:00:00 UTC.
			fromsecs: () => new SurrealExpression("time::from::secs()"),
			// Calculates a datetime based on the seconds since January 1, 1970 0:00:00 UTC.
			fromunix: () => new SurrealExpression("time::from::unix()"),
		};
	}
}
