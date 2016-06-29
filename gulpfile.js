// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var addStream     = require('add-stream');
var concat        = require('gulp-concat');
var concatCss     = require('gulp-concat-css');
var fs            = require('fs');
var header        = require('gulp-header');
var pkg           = require('./package.json');
var rename        = require('gulp-rename');
var sourceMaps    = require('gulp-sourcemaps');
var templateCache = require('gulp-angular-templatecache');
var ts            = require('gulp-typescript');
var tslint        = require('gulp-tslint');
var uglify        = require('gulp-uglify');
var typedoc       = require("gulp-typedoc");

// Lint Task
gulp.task('lint', function() {
    return gulp.src('source/**/*.ts')
        .pipe(tslint())
        .pipe(tslint.report('default'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('source/components/**/*.ts')
        .pipe(addStream.obj(prepareTemplates()))
        .pipe(sourceMaps.init())
        .pipe(ts({
            noImplicitAny: true,
            target : 'ES5',
            suppressImplicitAnyIndexErrors: true,
            out: 'searches.js'
        }))
        .pipe(header(fs.readFileSync('source/header_js.txt', 'utf8'), { pkg : pkg } ))
        .pipe(gulp.dest('dist'))
        .pipe(rename('searches.min.js'))
        .pipe(uglify())
        .pipe(header(fs.readFileSync('source/header_js.txt', 'utf8'), { pkg : pkg } ))
        .pipe(sourceMaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('cesiumScripts', function() {
    return gulp.src('source/implementations/cesium/**/*.ts')
        .pipe(addStream.obj(prepareTemplates()))
        .pipe(sourceMaps.init())
        .pipe(ts({
            noImplicitAny: true,
            target : 'ES5',
            suppressImplicitAnyIndexErrors: true,
            out: 'searches-cesium.js'
        }))
        .pipe(header(fs.readFileSync('source/header_js.txt', 'utf8'), { pkg : pkg } ))
        .pipe(gulp.dest('dist'))
        .pipe(rename('searches-cesium.min.js'))
        .pipe(uglify())
        .pipe(header(fs.readFileSync('source/header_js.txt', 'utf8'), { pkg : pkg } ))
        .pipe(sourceMaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('leafletScripts', function() {
    return gulp.src('source/implementations/leaflet/**/*.ts')
        .pipe(addStream.obj(prepareTemplates()))
        .pipe(sourceMaps.init())
        .pipe(ts({
            noImplicitAny: true,
            target : 'ES5',
            suppressImplicitAnyIndexErrors: true,
            out: 'searches-leaflet.js'
        }))
        .pipe(header(fs.readFileSync('source/header_js.txt', 'utf8'), { pkg : pkg } ))
        .pipe(gulp.dest('dist'))
        .pipe(rename('searches-leaflet.min.js'))
        .pipe(uglify())
        .pipe(header(fs.readFileSync('source/header_js.txt', 'utf8'), { pkg : pkg } ))
        .pipe(sourceMaps.write('.'))
        .pipe(gulp.dest('dist'));
});


// Watch Files For Changes
gulp.task('watch', function() {
    // We watch both JS and HTML files.
    gulp.watch('source/components/**/*.ts', ['scripts', 'lint', 'typedoc']);
    gulp.watch('source/components/**/*.html', ['scripts']);
    gulp.watch('source/components/**/*.css', ['concatCss']);
    gulp.watch('source/implementations/cesium/**/*.ts', ['cesiumScripts']);
    gulp.watch('source/implementations/leaflet/**/*.ts', ['leafletScripts']);
    gulp.watch('dist/*.js', ['copyToWells']);
    //gulp.watch('scss/*.scss', ['sass']);
});

gulp.task('copyToWells', function() {
// On Larry's machine he has it relative to a working project served by nodejs and can do updates on the fly.
// This task can be set up to do running integration testing.
//    gulp.src(['dist/searches.js', 'dist/searches-leaflet.js'])
//        .pipe(gulp.dest('../explorer-wells-surveys/src/main/webapp/bower_components/explorer-search-components/dist'))
//    gulp.src(['dist/searches.js', 'dist/searches-cesium.js'])
//        .pipe(gulp.dest('../explorer-rock-properties/src/main/webapp/rock-properties/bower_components/explorer-search-components/dist'))
});

gulp.task('concatCss', function () {
  return gulp.src('source/components/**/*.css')
    .pipe(concatCss("searches.css"))
    .pipe(gulp.dest('dist'));
});

gulp.task("typedoc", function() {
    return gulp
        .src(["source/components/**/*.ts"])
        .pipe(typedoc({
            module: "commonjs",
            target: "es5",
            out: "docs/",
            name: "Explorer Searches"
        }))
    ;
});

// Build Task
gulp.task('build', ['lint', 'scripts', 'cesiumScripts', 'leafletScripts', 'concatCss']);

// Default Task
gulp.task('default', ['build', 'watch']);

function prepareTemplates() {
    return gulp.src('source/components/**/*.html')
        .pipe(templateCache('templates.ts', {root:"searches", module:"exp.search.templates", standalone : true,
        templateHeader:'angular.module("<%= module %>"<%= standalone %>).run(["$templateCache", function($templateCache:any) {'}));
}
