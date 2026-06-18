const MS_IN = {
  w: 604_800_000, wk: 604_800_000, wks: 604_800_000, week: 604_800_000, weeks: 604_800_000,
  d: 86_400_000, dy: 86_400_000, day: 86_400_000, days: 86_400_000,
  h: 3_600_000, hr: 3_600_000, hrs: 3_600_000, hour: 3_600_000, hours: 3_600_000,
  m: 60_000, mn: 60_000, min: 60_000, mins: 60_000, minute: 60_000, minutes: 60_000,
  s: 1_000, sec: 1_000, secs: 1_000, second: 1_000, seconds: 1_000,
  ms: 1, msec: 1, msecs: 1, millisec: 1, millisecond: 1, milliseconds: 1,
}

const UNIT_ALIAS = {
  w: "week", wk: "week", wks: "week", week: "week", weeks: "week",
  d: "day", dy: "day", day: "day", days: "day",
  h: "hour", hr: "hour", hrs: "hour", hour: "hour", hours: "hour",
  m: "minute", mn: "minute", min: "minute", mins: "minute", minute: "minute", minutes: "minute",
  s: "second", sec: "second", secs: "second", second: "second", seconds: "second",
  ms: "ms", msec: "ms", msecs: "ms", millisec: "ms", millisecond: "ms", milliseconds: "ms",
}

const msRegex = /(-?)([\d\s\-_,.]+)\s*([a-zA-Z]*)/g
const sanitizeRegex = /[\s\-_,]/g
const resultCache = {}

function isValid(input) {
  return (
    (typeof input === "string" && input.length > 0) ||
    (typeof input === "number" && input > -Infinity && input < Infinity && !isNaN(input))
  )
}

/**
 * Parse a time expression into a number, optionally converting to a different unit.
 *
 * @param {string|number} msString - The value to parse. A string holds one or more value-unit pairs such as "1h 30m 15s" (case insensitive, supports all common unit aliases). A number is treated as a count of milliseconds. Invalid input falls back to the default value.
 * @param {string|number|{unit?: string, round?: boolean}} [defaultOrOptions] - Either a fallback value used when msString is invalid, or the options object. As a fallback it accepts a number of milliseconds or a time string like "5m" (default `0`). If an options object is passed here, it is used as the options and the default becomes `0`.
 * @param {{unit?: string, round?: boolean}} [options] - Parsing options.
 * @param {string} [options.unit] - The unit to express the result in, using any supported unit alias such as "ms", "s", "m", "h", "d", or "w" (default `"ms"`). An unrecognized unit yields `0`.
 * @param {boolean} [options.round] - Whether to round the result to the nearest integer (default `true`). Set to `false` to keep fractional values.
 * @returns {number} The parsed duration expressed in the requested unit.
 */
function ms(msString, defaultOrOptions = {}, options = {}) {
  if (defaultOrOptions && typeof defaultOrOptions === "object") {
    options = defaultOrOptions
    defaultOrOptions = 0
  }

  let defaultMsString = isValid(defaultOrOptions) ? defaultOrOptions : 0
  const { unit = "ms", round = true } = options

  const cacheKey = `${msString}${defaultMsString}${unit}${round}`
  if (cacheKey in resultCache) return resultCache[cacheKey]

  if (typeof defaultMsString === "string") {
    defaultMsString = ms(defaultMsString, 0)
  }

  let parsed = parseMs(msString, defaultMsString)
  parsed = convertToUnit(parsed, unit)
  parsed = applyRounding(parsed, round)

  resultCache[cacheKey] = parsed
  return parsed
}

function parseMs(msString, defaultMsString) {
  const val = isValid(msString) ? msString : defaultMsString
  const re = new RegExp(msRegex)

  if (typeof val === "string") {
    let totalMs = 0
    if (val.length > 0) {
      let matches
      let anyMatches = false
      while ((matches = re.exec(val))) {
        anyMatches = true
        let value = parseFloat(matches[2].replace(sanitizeRegex, ""))
        if (matches[1]) value = -value
        if (!isNaN(value)) {
          const unitKey = UNIT_ALIAS[matches[3].toLowerCase()] || "ms"
          totalMs += value * MS_IN[unitKey]
        }
      }
      if (!anyMatches) return defaultMsString ?? 0
    }
    return totalMs
  }

  return val
}

function convertToUnit(val, unit) {
  if (unit in MS_IN) return val / MS_IN[unit]
  return 0
}

function applyRounding(val, round) {
  if (val !== 0 && round) {
    val = Math.round(val)
    if (val === 0) return Math.abs(val)
  }
  return val
}

export default ms
