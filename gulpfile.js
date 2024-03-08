const gulp = require('gulp');
const ts = require('gulp-typescript');
const JSON_FILES = ['src/*.json', 'src/**/*.json', 'src/**/*.pug', 'src/**/*.db'];
const swagger = ['src/swagger/swagger.json'];

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('swagger', () => {
  return gulp.src(swagger).pipe(gulp.dest('dist/swagger'));
});

gulp.task('watch', () => {
  return gulp.watch('src/**/*.ts', ['scripts']);
});

gulp.task('files', () => {
  return gulp.src(JSON_FILES).pipe(gulp.dest('dist'));
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
gulp.task('default',  gulp.series(['watch', 'files', 'swagger'], () => {}));
