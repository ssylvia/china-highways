module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
		advSettings: grunt.file.readYAML('data/advancedSettings.yml'),

		jshint: {
			files: ['source/app/javascript/**/*.js'],
			options: {jshintrc: '.jshintrc'}
		},

		clean: {

			tempData: ['source/resources/buildTools/data/tempData.json'],
			build: ['build/app/javascript/*'],
			jsLib: ['build/lib']

		},

		concat: {
			options: {
				separator: ';'
			},
			libAll: {
				src: ['source/lib/all/**/*.js'],
				dest: 'build/lib/temp-lib.min.js'
			},
			libIE: {
				src: ['source/lib/oldIE/**/*.js'],
				dest: 'build/app/javascript/oldIE.min.js'
			},
			libCSS: {
				src: ['source/lib/all/**/*.css','build/app/stylesheets/app.css'],
				dest: 'build/app/stylesheets/app.css'
			},
			main: {
				src: ['build/lib/temp-lib.min.js','build/app/javascript/<%= advSettings.appIdentifier %>.min.js'],
				dest: 'build/app/javascript/<%= advSettings.appIdentifier %>.min.js'
			}
		},

		cssmin: {
			app: {
				src: ['build/app/stylesheets/app.css'],
				dest: 'build/app/stylesheets/app.css'
			}
		},

		requirejs: {
			viewer: {
				options: {
					baseUrl: "source",
					paths: {
						'dojo': 'empty:',
						'esri': 'empty:',
						'dijit': 'empty:',
						'dojox': 'empty:',
						'storymaps': 'app/javascript'
					},
					name: 'resources/buildTools/config/ConfigViewer',
					out: 'build/app/javascript/<%= advSettings.appIdentifier %>.min.js'
				}
			}
		},

		copy: {
			map: {
				files: [
					{
						expand: true,
						flatten: true,
						cwd: '',
						src: ['source/lib/**/*.map'],
						dest: 'build/app/javascript/'
					}
				]
			},
		},

		exec: {
			googleData: {
				cmd: 'node source/resources/buildTools/data/googleDataToModule.js'
			}
		},

		gss_pull: {
			pullChinaData: {
				files: {
					'source/resources/buildTools/data/tempData.json': ['0AuzbB0k65O2YdEJ1TkZ4QXJxcldRUEF2ZDl2eWY3ZEE']
				}
			}
		}

	});

	// Load plugins.
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-gss-pull');

	// Default task(s).
	grunt.registerTask('default', [

		'jshint',
		'clean:build',

		// Update Data
		'gss_pull',
		'exec',
		'clean:tempData',

		//Concat external libraries
		'concat:libAll',
		'concat:libIE',
		'concat:libCSS',

		// Minify CSS
		'cssmin',

		/*
		* Minify project JS using require.js
		* - require.js output a .js for with only the viewer and a .js with viewer and builder
		* - concat those .js with lib's JS
		* - perform production mode replacement in JS files
		*/
		'requirejs',
		'concat:main',
		'clean:jsLib',
		'copy'

	]);

	grunt.registerTask('updateData', [

		'gss_pull',
		'exec',
		'clean:tempData'
		
	]);

};