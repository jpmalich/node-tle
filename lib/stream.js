var inherit = require( 'bloodline' )
var Stream = require( 'stream' )
var TLE = require( './tle' )

/**
 * TLE Parser Stream
 * @constructor
 * @param {Object} [options]
 * @return {Parser}
 */
function Parser( options ) {

  if( !(this instanceof Parser) )
    return new Parser( options )

  Stream.Transform.call( this, options )

  this._readableState.objectMode = true
  this._buffer = ''

}

/**
 * TLE multiline matching pattern
 * @type {RegExp}
 */
Parser.pattern = /(^|\r?\n)(?:([^12][^\r\n]{1,}?)\r?\n)?(1[^\r\n]{68,})\r?\n(2[^\r\n]{68,})/

/**
 * Strip empty lines
 * @param  {String} str
 * @return {String}
 */
Parser.strip = function( str ) {
  return str.replace( /^[\s\uFEFF\xA0]*$/gm, '' )
}

/**
 * Parser prototype
 * @type {Object}
 */
Parser.prototype = {

  constructor: Parser,

  _transform: function( chunk, _, next ) {

    var buffer = Parser.strip( this._buffer + chunk )
    var match = null
    var tle = null

    while( match = Parser.pattern.exec( buffer ) ) {
      buffer = buffer.slice( match[0].length )
      try { tle = TLE.parse( match[0] ) }
      catch( error ) { return this.emit( 'error', error ) }

      // Add the source TLE to the object.
      var tleLines = match[0].trim().split("\r\n");
      if ((tleLines.length > 0) && (tleLines.length <= 3)) {
        if (tleLines.length === 3){
          tle.line0 = tleLines[0];
        }
        tle.line1 = tleLines[1];
        tle.line2 = tleLines[2];
        this.push(tle);
      }
    }

    this._buffer = buffer

    next()

  }

}

inherit( Parser, Stream.Transform )
module.exports = Parser
