require('dotenv').config();
// import các nguồn cần dùng
const express = require('express'); // commonjs
const ejs = require('ejs'); // Ép Vercel nhận diện bundle module ejs
const configViewEngine = require('./config/viewEngine');
const apiRoutes = require('./routes/api');
const connection = require('./config/database');
const { getHomepage } = require('./controllers/homeController');
const cors = require('cors');
const User = require('./models/user');
const bcrypt = require('bcrypt');
const { seedKeyboardsCollections } = require('./seeders/keyboardSeeder');
const { seedArticlesCollections } = require('./seeders/articleSeeder');

const app = express(); // cấu hình app là express

// cấu hình port, nếu tìm thấy port trong env, không thì trả về 8888
const port = process.env.PORT || 8888;

app.use(cors()); // config cors
app.use(express.json()) // config req.body cho json
app.use(express.urlencoded({ extended: true })) // for form data

// Ép cấu hình engine trực tiếp tại đây để tránh lỗi Serverless Bundling
app.engine('ejs', ejs.__express);
configViewEngine(app); // config template engine

// config route cho view ejs
const webAPI = express.Router();
webAPI.get("/", getHomepage);
app.use('/', webAPI);

// khai báo route cho API
app.use('/v1/api/', apiRoutes);

(async () => {
    try {
        // kết nối database using mongoose
        await connection();

        const adminEmail = process.env.ADMIN_EMAIL || 'admindoaibiet@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        const existedAdmin = await User.findOne({ email: adminEmail });
        if (!existedAdmin) {
            const hashPassword = await bcrypt.hash(adminPassword, 10);
            await User.create({
                name: 'Admin Keyboard Store',
                email: adminEmail,
                password: hashPassword,
                role: 'Admin',
                isVerified: true,
            });
            console.log('>>> Seeded default admin account');
        }

        await seedKeyboardsCollections();
        await seedArticlesCollections();

        if (!process.env.VERCEL) {
            // lắng nghe port trong env khi chạy local
            app.listen(port, () => {
                console.log(`Backend Nodejs App listening on port ${port}`)
            })
        }
    } catch (error) {
        console.log(">>> Error connect to DB: ", error)
    }
})()

module.exports = app;