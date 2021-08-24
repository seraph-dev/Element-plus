import gulp from 'gulp'
import ts from 'gulp-typescript'
import path from 'path'
import through2 from 'through2'

const output = path.resolve(__dirname, '../dist/styles')

const tsProject = ts.createProject('tsconfig.json', {
  declaration: true,
  target: 'ESNEXT',
  skipLibCheck: true,
  module: 'commonjs',
})

const rewriter = () => {
  return through2.obj(function(file, _, cb) {
    const compIdentifier = '@element-plus/components'
    const compReplacer = '../../../components'
    const themeIdentifier = '@element-plus/theme-chalk'
    const themeReplacer = '../../../../theme-chalk'
    file.contents = Buffer.from(
      file.contents
        .toString()
        .replaceAll(compIdentifier, compReplacer)
        .replaceAll(themeIdentifier, themeReplacer),
    )
    cb(null, file)
  })
}

const inputs = '../packages/components/**/style/*.ts'

function compileEsm() {
  return gulp
    .src(inputs)
    .pipe(rewriter())
    .pipe(tsProject())
    .pipe(gulp.dest(path.resolve(output, 'lib')))
}

function compileCjs() {
  return gulp
    .src(inputs)
    .pipe(rewriter())
    .pipe(
      ts.createProject('tsconfig.json', {
        declaration: true,
        target: 'ESNEXT',
        skipLibCheck: true,
        module: 'ESNEXT',
      })(),
    )
    .pipe(gulp.dest(path.resolve(output, 'es')))
}

export const build = gulp.series(compileEsm, compileCjs)

export default build
