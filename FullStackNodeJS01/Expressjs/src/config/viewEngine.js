const path = require('path');
const express = require('express');

const configViewEngine = (app) => {
    // Định vị chính xác thư mục views bằng đường dẫn tuyệt đối __dirname
    // Vì file này nằm trong src/config, cần đi ra 1 cấp (..) rồi đi vào views
    app.set('views', path.join(__dirname, '..', 'views'));
    app.set('view engine', 'ejs');

    // Cấu hình các file tĩnh bằng đường dẫn tuyệt đối (đi ra 1 cấp rồi vào public)
    app.use(express.static(path.join(__dirname, '..', 'public')));
}

module.exports = configViewEngine;