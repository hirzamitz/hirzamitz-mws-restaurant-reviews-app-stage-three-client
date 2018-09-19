/*eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var pngquant = require('gulp-imagemin');

gulp.task('default', ['copy-manifest','copy-favicon','copy-html','copy-images','styles', 'lint','scripts-dist'], function(){
	gulp.watch('sass/**/*.scss',['styles']);
	gulp.watch('js/**/*.js',['lint']);
	gulp.watch('js/**/*.js',['scripts-dist']);
	gulp.watch('/serviceworker.js',['scripts-dist']);
	gulp.watch('/*.html',['copy-html']);
	gulp.watch('/manifest.json',['copy-manifest']);
	gulp.watch('/favicon.ico',['copy-favicon']);
	gulp.watch('img/**/*.jpg',['copy-images']);
	//gulp.watch('./dist/**/*.*').on('change',browserSync.reload);
	
	//browserSync.init({
	//	server: './dist'
	//});
	//browserSync.stream();
});

gulp.task('dist',[
	'copy-html',
	'copy-images',
	'styles',
	'lint',
	'scripts-dist'
]);

gulp.task('scripts', function(){
	gulp.src('js/**/*.js')
		.pipe(gulp.dest('dist/js'));
	gulp.src('./serviceworker.js')
		.pipe(gulp.dest('./dist'));
});

gulp.task('scripts-dist', function() {
	gulp.src(['js/dbhelper.js','js/serviceworkerController.js'])
	//gulp.src(['js/dbhelper.js','js/idb.js'])
		//.pipe(sourcemaps.init())
		.pipe(uglify())
		//.pipe(babel())
		.pipe(concat('helper.js'))
		//.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
	gulp.src(['js/main.js', 'js/restaurant_info.js', 'js/idb.js'])
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
	gulp.src('./serviceworker.js')
		.pipe(uglify())
		.pipe(gulp.dest('./dist'));
});

gulp.task('styles', function(){
	gulp.src('sass/**/*.scss')
		.pipe(sass({outputStyle: 'compressed'}).on('error',sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('./css'));
	gulp.src('css/**/*.css')
		.pipe(gulp.dest('./dist/css'));
});

gulp.task('copy-manifest', function(){
	gulp.src('./manifest.json')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-favicon', function(){
	gulp.src('./favicon.ico')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-html', function(){
	gulp.src('./*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function(){
	gulp.src('img/*.jpg')
		/*.pipe(pngquant({
			progressive: true,
			use: [pngquant()]
		}))*/
		.pipe(gulp.dest('dist/img'));
	gulp.src('img/icons/*.*')
		.pipe(gulp.dest('dist/img/icons'));
});

gulp.task('lint', function(){
	//return gulp.src(['js/**/*.js'])
	//	.pipe(eslint())
	//	.pipe(eslint.format())
	//	.pipe(eslint.failOnError());
});
