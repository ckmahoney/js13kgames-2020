



const ROUNDING = 60 * 60 * 1000;
const TIMEZONE = "+05:30";
const ENABLEDDAYS = [0,1,2,3,4,5,6] 

const allDays = filterDays();
const skipSatSun = filterDays([5,6]);
const skipFriSun = filterDays([4,6]);
const date = moment().utc();

const settings = 
  { "fromTime": "05:31:00"
  , "toTime": "12:50:00"
  , "duration": 60
  , "interval": 0
  , "size": 11
  }


function printDate(date, format = 'YYYY-MM-DD') {
  console.log(date.format(format))
}


/** Get days of the week with selected dates removed */
function filterDays(...removals) {
  const allDays = [0,1,2,3,4,5,6];  
  return allDays.filter( (selection,i) => !removals.includes(selection))
}


/** courtesy: https://stackoverflow.com/questions/17691202/round-up-round-down-a-momentjs-moment-to-nearest-minute */
function roundUp(m) {
  return m.minute() || m.second() || m.millisecond() ? m.add(1, 'hour').startOf('hour') : m.startOf('hour');
}


/** Create a moment object for the start and endpoints  */
function getEndpoints(time, duration, toTime, final = false) {
  const start = moment(time);
  let end = moment(time)
  end.minutes(end.minutes() + duration)

  //We need to adjust last slot timings to match toTime, duration value is overwritten. 
  if (final) {
    // sorry can't help you here, good luck :)
    end = moment(time);
  }

  
  return {
    start,
    end
  }
}


/** Use a settings object to create a factory for your timezones and selected dates. */
function create(settings) {
  let { fromTime, toTime, duration, interval, size } = settings;

  function factory(timezone, selections) {
    const now = moment(date + 'T' + fromTime + '.000Z').utcOffset(timezone);
      window.now=now
    const time = roundUp(now);

    const slots = selections.map((el, index) => {  
      const list = []
      for (var i = 0; i < size; i++) {
        let isFinal = (i +1) === size;
        let newDate = getEndpoints( time, duration, toTime, isFinal )
        
        list.push( newDate )
        if (interval) {
          time.minutes(time.minutes() + interval);
        }
      }

      date.date(date.date() + 1);
      return list;
    })

    return slots;
  }

  return factory;
}


const DateFactory = create(settings)
const targetAllDays = DateFactory(TIMEZONE, ENABLEDDAYS)

console.log(targetAllDays)
console.log(DateFactory(TIMEZONE, skipFriSun))
console.log(DateFactory(TIMEZONE, skipSatSun))