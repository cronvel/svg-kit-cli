/*
	SVG Kit CLI

	Copyright (c) 2017 - 2023 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const svgKit = require( 'svg-kit' ) ;
const fs = require( 'fs' ) ;
const path = require( 'path' ) ;
const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;



function cli() {
	var args = require( 'minimist' )( process.argv.slice( 2 ) ) ;

	if ( args.version ) {
		cli.version() ;
		process.exit() ;
	}
	else if ( args._.length < 1 ) {
		cli.usage() ;
		process.exit( 1 ) ;
	}

	var command = args._[ 0 ] ;
	var inputPaths = args._.slice( 1 ) ;
	delete args._ ;

	if ( args.o ) { args.output = args.o ; }

	if ( ! cli.commands[ command ] ) {
		cli.usage() ;
		process.exit( 1 ) ;
	}

	cli.commands[ command ]( inputPaths , args ) ;
}

module.exports = cli ;
cli.commands = {} ;



cli.version = function() {
	var version = require( '../package.json' ).version ;
	term.bold.magenta( 'SVG Kit' ).dim( ' v%s by Cédric Ronvel\n\n' , version ) ;
} ;



cli.usage = function() {
	cli.version() ;
	term( 'Usage is: ^c%s <command> <input-file1> [<input-file2>] [...] [<option1>] [...]^:\n\n' , path.basename( process.argv[ 1 ] ) ) ;

	term( '^bAvailable commands:^:\n' ) ;
	term( 'patch : patch the SVG\n' ) ;

	term( '^bCommon options:^:\n' ) ;
	term( '--version                : display the version\n' ) ;
	term( '--help                   : display the command help\n' ) ;
	term( '--output , -o            : output file (only when there is only one input file)\n' ) ;
	term( '--self                   : output in the input file (replace it)\n' ) ;

	term( '\n' ) ;
} ;



// Example:
cli.commands.patch = function( inputPaths , args ) {
	var inputStr ;

	if ( ! inputPaths.length || args.help ) {
		cli.version() ;
		term( 'Usage is: ^c%s patch <input-file1> [<input-file2>] [...] [<option1>] [...]^:\n\n' , path.basename( process.argv[ 1 ] ) ) ;

		term( '^bAvailable options:^:\n' ) ;
		term( '--output , -o            : output file (only when there is only one input file)\n' ) ;
		term( '--self                   : output in the input file (replace it)\n' ) ;
		term( '--removeIds              : remove all ^/id^ attributes\n' ) ;
		term( '--prefixIds <prefix>     : prefix all ^/id^ and patch url #ref\n' ) ;
		term( '--removeSize             : remove the width and height attribute ^+AND^ style from the <svg> tag\n' ) ;
		term( '--removeSvgStyle         : remove the top-level style attribute of the <svg> tag\n' ) ;
		term( '--removeDefaultStyles    : remove meaningless style pollution (style set with default values)\n' ) ;
		term( '--colorClass             : move all ^/stroke^ and ^/fill^ color ^/inline styles^ to their own attribute,\n' ) ;
		term( '                           add the ^/primary^ class to class-less shape-elements\n' ) ;
		term( '--removeComments         : remove all comment nodes\n' ) ;
		term( '--removeWhiteSpaces      : remove all white-space\n' ) ;
		term( '--removeWhiteLines       : remove all empty lines\n' ) ;
		term( '--removeExoticNamespaces : remove all tag and attributes that have a namespace different than svg,\n' ) ;
		term( '                           the svg namespace is stripped\n' ) ;
		term( '--spellcast-icon         : patch for creating spellcast icons, it turns on --removeIds --removeDefaultStyles\n' ) ;
		term( '                           --colorClass --removeComments --removeExoticNamespaces and --removeWhiteLines\n' ) ;
		term( '--spellcast-ui           : patch for creating spellcast UIs, it turns on --removeDefaultStyles\n' ) ;
		term( '                           --removeComments --removeExoticNamespaces and --removeWhiteLines\n' ) ;

		term( '\n' ) ;
		return ;
	}

	if ( args['spellcast-icon'] ) {
		args.removeIds =
			args.removeDefaultStyles =
			args.colorClass =
			args.removeComments =
			args.removeExoticNamespaces =
			args.removeWhiteLines =
			true ;
	}

	if ( args['spellcast-ui'] ) {
		args.removeDefaultStyles =
			args.removeComments =
			args.removeExoticNamespaces =
			args.removeWhiteLines =
			true ;
	}

	inputPaths.forEach( inputPath => {
		try {
			inputStr = fs.readFileSync( inputPath , 'utf8' ) ;
		}
		catch ( error ) {
			if ( inputPaths.length === 1 ) {
				term( "^rCan't load file ^/%s^:^r: %s\n" , inputPath , error ) ;
			}

			return ;
		}

		var $doc = svgKit.domKit.fromXml( inputStr ) ;

		svgKit.patchDocument( $doc , args ) ;

		var outputStr = svgKit.domKit.toXml( $doc ) ;

		if ( args.self ) { fs.writeFileSync( inputPath , outputStr ) ; }
		else if ( inputPaths.length === 1 && args.output ) { fs.writeFileSync( args.output , outputStr ) ; }
		else { process.stdout.write( outputStr + '\n' ) ; }
	} ) ;
} ;

