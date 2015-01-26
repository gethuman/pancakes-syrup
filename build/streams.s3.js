/**
 * Author: Jeff Whelpley
 * Date: 1/25/15
 *
 * Functions to assist with s3 streaming
 */
var rename      = require('gulp-rename');
var s3          = require('gulp-awspublish');

/**
 * Upload to s3 from a given stream
 * @param stream
 * @param targetDir
 * @param opts
 */
function uploadFromStream(stream, targetDir, opts) {
    var publisher = s3.create(opts);

    return stream.pipe(rename(function (path) {
        path.dirname = targetDir;
    }))
        .pipe(s3.gzip({}))
        .pipe(publisher.publish({}))
        .pipe(s3.reporter({}));
}

/**
 * Upload specific files
 * @param gulp
 * @param filePaths
 * @param targetDir
 * @param opts
 * @returns {*}
 */
function uploadFiles(gulp, filePaths, targetDir, opts) {
    return uploadFromStream(gulp.src(filePaths), targetDir, opts);
}

// expose functions
module.exports = {
    uploadFiles: uploadFiles,
    uploadFromStream: uploadFromStream
};
